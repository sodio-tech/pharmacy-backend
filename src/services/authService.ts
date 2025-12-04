import knex from "../config/database.js";
import dotenv from 'dotenv'
dotenv.config();
import crypto from "crypto"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { SignupForm, UserLogin } from "../middleware/schemas/types.js";
import { ROLES, EMAIL_TEMPLATE_IDS } from "../config/constants.js";
import * as userService from "./userService.js"
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

export const createSuperAdminService = async(data: SignupForm) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const expiresIn: any = process.env.JWT_ACCESS_TOKEN_EXPIRES || '12h';
  const token = jwt.sign(
    { email: data.email, verified: false, role: ROLES.SUPER_ADMIN },
    process.env.JWT_ACCESS_SECRET_KEY as string, 
    {expiresIn}
  );

  return await knex.transaction(async (trx) => {
    const [result] = await trx("users")
      .insert({
        fullname: data.first_name + " " + data.last_name,
        email: data.email,
        password: hashedPassword,
        phone_number: data.phone_number,
        verification_token: token,
        role: ROLES.SUPER_ADMIN,
      })
      .returning("*")

    if (!result) {
      throw new Error("User creation failed")
    }

    const [pharmacy] = await trx('pharmacies')
      .insert({
        pharmacy_name: data.pharmacy_name,
        super_admin: result.id,
      })
      .returning("*")

    if (!pharmacy) {
      throw new Error("Pharmacy creation failed")
    }

    result.pharmacy_id = pharmacy.id;
    result.pharmacy_name = pharmacy.pharmacy_name;
    result.subscription_status = pharmacy.subscription_status;

    console.log(result)
    await trx("pharmacy_branches")
      .insert({
        pharmacy_id: pharmacy.id,
        branch_name: data.branch_name || "Main Branch",
      })
      .returning("*")

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
  const { pharmacy_id } = await knex("pharmacies")
    .where({ super_admin: user.id })
    .select("id as pharmacy_id")
    .first();
  
  const result: any = {};
  if (!user) result.error = 'user_not_found'
  
  if (user.email_verified) result.error = 'user_already_verified'

  const updated = await knex("users")
    .where({ email })
    .update({
      email_verified: true,
      verification_token: null,
    })
    .returning("*")
  
  if (updated) {
    const expiresIn: any = process.env.JWT_ACCESS_TOKEN_EXPIRES || '12h';
    const jwttoken = jwt.sign(
      { email: user.email, verified: true, role: user.role, id: user.id, pharmacy_id},
      process.env.JWT_ACCESS_SECRET_KEY as string, 
      {expiresIn}
    );
    result.access_token = jwttoken;
  }

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

  const expiresIn: any = process.env.JWT_ACCESS_TOKEN_EXPIRES || '12h';
  const token = jwt.sign(
    { email: user.email, verified: false, role: user.role },
    process.env.JWT_ACCESS_SECRET_KEY as string, 
    {expiresIn}
  );

  await sendEmail({
    from: undefined,
    html: undefined,
    to: email,
    text: `Hi ${user.fullname} Your verification link is ${process.env.FRONTEND_URL}/login?token=${token}`,
    subject: "Pharmy Email Verification",
    template: EMAIL_TEMPLATE_IDS.CONFIRM_EMAIL,
    dynamicTemplateData: {
      verification_link: `${process.env.FRONTEND_URL}/login?token=${token}`
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

    let pharmacy_id: number | null = null;
    let pharmacy_branch_id: number | null = user.current_branch;
    if (user.role !== ROLES.PHARMY_ADMIN) { 
      if (!pharmacy_branch_id) {
        if (user.role === ROLES.SUPER_ADMIN) {
          const pharmacy = await knex("pharmacies")
            .leftJoin('pharmacy_branches', 'pharmacies.id', 'pharmacy_branches.pharmacy_id')
            .where('pharmacies.super_admin', user.id)
            .select("pharmacies.id as pharmacy_id", "pharmacy_branches.id as pharmacy_branch_id")
            .first();
          pharmacy_id = pharmacy?.pharmacy_id;
          pharmacy_branch_id = pharmacy?.pharmacy_branch_id;
        }
        else {
          const pharmacy = await knex("pharmacies")
            .leftJoin('pharmacy_branch_employees', 'pharmacy_branch_employees.pharmacy_id', 'pharmacies.id')
            .where('pharmacy_branch_employees.employee_id', user.id)
            .select("pharmacies.id as pharmacy_id", "pharmacy_branch_employees.pharmacy_branch_id as pharmacy_branch_id")
            .first();

          pharmacy_id = pharmacy?.pharmacy_id;
          pharmacy_branch_id = pharmacy?.pharmacy_branch_id;

          if (!pharmacy_branch_id) {
            const branch =  await knex('pharmacies')
              .leftJoin('pharmacy_branches', 'pharmacies.id', 'pharmacy_branches.pharmacy_id')
              .where('pharmacies.id', pharmacy_id)
              .select("pharmacy_branches.id as pharmacy_branch_id")
              .first()
            pharmacy_branch_id = branch.pharmacy_branch_id;
          }
        }

        await knex('users')
        .where('id', user.id)
        .update({current_branch: pharmacy_branch_id})
      }
      else {
        const pharmacy = await knex("pharmacies")
          .leftJoin('pharmacy_branches', 'pharmacies.id', 'pharmacy_branches.pharmacy_id')
          .where('pharmacy_branches.id', pharmacy_branch_id)
          .select("pharmacies.id as pharmacy_id")
          .first();
        pharmacy_id = pharmacy?.pharmacy_id;
      } 
    }

    result.id = user.id;
    result.email = user.email;
    result.two_fa_enabled = user.two_factor_recovery_code ? true : false;
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {password_mismatch: true};
    } 

    result.role= ROLES[user.role];
    if (!result.two_fa_enabled) {
      // Create JWT token with user data
      const access_token = jwt.sign(
        { 
          id: user.id, email: user.email, verified: user.email_verified, 
          two_fa_enabled: result.two_fa_enabled, role: user.role, 
          pharmacy_id, pharmacy_branch_id
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

    await knex('users')
      .where({ id: user.id })
      .update({ last_login: new Date() });

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

  const userProfile = await userService.getProfileService({id: Number(user_id), role: Number(user.role)});

  const access_token = jwt.sign(
    { 
      id: user.id, email: user.email, verified: user.email_verified, 
      two_fa_enabled: result.two_fa_enabled, role: user.role, 
      pharmacy_id: userProfile.pharmacy_id,
      pharmacy_branch_id: userProfile.pharmacy_branch_id,
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
    { id: user.id, email: user.email, role: ROLES.SUPER_ADMIN },
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

  await knex('users')
    .where({ id: userId })
    .update({ password: hashedPassword });

  return {success: true};
};

