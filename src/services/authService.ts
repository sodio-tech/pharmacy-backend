import knex from "../config/database.js";
import dotenv from 'dotenv'
import crypto from "crypto"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { SignupForm, UserLogin } from "../middleware/schemas/types.js";
import { ROLES, EMAIL_TEMPLATE_IDS } from "../config/constants.js";
import { sendEmail } from "./sendEmail.js"

/**
 * Finds one user by a given query
 */
export const findOne = async (query) => {
  try {
    const user = await knex("users").where(query).first();
    return user || null;
  } catch (error) {
    console.error("Error in findOne:", error);
    throw new Error("Failed to find user.");
  }
};

export const createUserService = async(data: SignupForm) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const expiresIn: any = process.env.JWT_ACCESS_TOKEN_EXPIRES || '12h';
  const token = jwt.sign(
    { email: data.email, verified: false },
    process.env.JWT_ACCESS_SECRET_KEY as string, 
    {expiresIn}
  );

  return await knex.transaction(async (trx) => {
    const [result] = await trx("users")
      .insert({
        fullname: data.first_name + " " + data.last_name,
        pharmacy_name: data.pharmacy_name,
        email: data.email,
        password: hashedPassword,
        phone_number: data.phone_number,
        drug_license_number: data.drug_license_number,
        verification_token: token,
        role: ROLES.SUPER_ADMIN,
      })
      .returning("*")

    if (!result) {
      throw new Error("User_creation_failed")
    }

    const res = [
      'password', 
      'created_at', 'updated_at', 
      'two_factor_secret', 'two_factor_recovery_code'
    ].forEach(key => {
      delete result[key]
    })

    result.role = ROLES[result.role]

    if (false || result.verification_token) {
      const verification_link = `${process.env.FRONTEND_URL}/login?token=${result.verification_token}`;
      await sendEmail({
        from: undefined,
        html: undefined, 
        to: result.email,
        text: `Hi ${result.full_name} Your verification link is ${verification_link}`,
        subject: "Pharmy Email Verification",
        template: EMAIL_TEMPLATE_IDS.CONFIRM_EMAIL,
        dynamicTemplateData: {
          verification_link
        }
      });

    }

    return result;
  })
}

export const verifyAccountService = async (token: string) => {
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET_KEY!) as {email: string};
  const email = decoded.email;
  const user = await findOne({ email});
  const result: any = {};
  if (!user) result.error = 'user_not_found'
  
  if (user.email_verified) result.error = 'user_already_verified'

  await knex("users")
    .where({ email })
    .update({
      email_verified: true,
      verification_token: null,
    })

  return result;
};

export const resendVerificationEmailService = async (email: string) => {
  const user = await knex("users")
    .where({ email })
    .first();

  if (!user) {
    return {error: 'user_not_found'}
  }

  if (user.email_verified) {
    return {error: 'user_already_verified'};
  }

  await sendEmail({
    from: undefined,
    html: undefined,
    to: email,
    text: `Hi ${user.fullname} Your verification link is ${process.env.FRONTEND_URL}/login?token=${user.verification_token}`,
    subject: "Pharmy Email Verification",
    template: EMAIL_TEMPLATE_IDS.CONFIRM_EMAIL,
    dynamicTemplateData: {
      verification_link: `${process.env.FRONTEND_URL}/login?token=${user.verification_token}`
    }
  });

  return {success: true};
}   

export const signInUserService = async (loginData: UserLogin) => {
  try { 
    const { email, password } = loginData;

    const result: any = {};
    const user = await knex("users")
      .where({ email })
      .first();
    
    if (!user) {
      return { email_not_found: true};
    }
    if (user.email_verified === false) {
      return { email_verified: false};
    }

    result.id = user.id;
    result.email = user.email;
    result.two_fa_enabled = user.two_factor_recovery_code ? true : false;
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {password_mismatch: true};
    } 

    if (!result.two_fa_enabled) {
      // Create JWT token with user data
      const access_token = jwt.sign(
        { 
          id: user.id, email: user.email, verified: user.email_verified, 
          two_fa_enabled: result.two_fa_enabled 
        },
        process.env.JWT_ACCESS_SECRET_KEY!,
        { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES }  as any
      );
        
      const refresh_token = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET_KEY!,
        { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES } as any
      );

      result.access_token = access_token;
      result.refresh_token = refresh_token
    }

    return result;
  } catch (error) {
    console.error("Error logging in user:", error);
    throw new Error("User login failed.");
  }

};

export const refreshTokenService = async (user_id: string) => {
  const user = await findOne({ id: user_id});
  const result: any = {};
  if (!user) result.error = 'user_not_found'

  const access_token = jwt.sign(
    { 
      id: user.id, email: user.email, verified: user.email_verified, 
      two_fa_enabled: result.two_fa_enabled 
    },
    process.env.JWT_ACCESS_SECRET_KEY!,
    { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES } as any
  );

  result.access_token = access_token;
  return result
};

export const forgotPasswordService = async (email: string) => {
  const user = await findOne({ email});
  if (!user) {
    return {error: 'user_not_found'}
  }

  const token = jwt.sign(
    { email: user.email },
    process.env.JWT_ACCESS_SECRET_KEY!,
    { expiresIn: '12h'} as any
  );

  const reset_link = `${process.env.FRONTEND_URL}/change-password?token=${token}`;
  await sendEmail({
    from: undefined,
    html: undefined,
    to: user.email,
    text: `Hi ${user.fullname} Your password reset link is ${reset_link}`,
    subject: "Pharmy Password Reset",
    template: EMAIL_TEMPLATE_IDS.RESET_PASSWORD,
    dynamicTemplateData: {
      reset_password: reset_link
    }
  });

  return {success: true};
}

export const resetPasswordService = async (userId: string, newPassword: string) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const currentHashedPassword = await knex('users')
    .where({ id: userId })
    .select('password')
    .first();

  const isMatch = await bcrypt.compare(newPassword, currentHashedPassword.password);
  if (isMatch) {
    return { error: 'new_password_is_same_as_old' };
  }

  const res = await knex('users')
    .where({ id: userId })
    .update({ password: hashedPassword });

  return {success: true};
};

