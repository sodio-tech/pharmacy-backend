import controllerWrapper from "../middleware/controllerWrapper.js";
import * as authService from "../services/authService.js";
import { StatusCodes } from 'http-status-codes'
import dotenv from "dotenv";
dotenv.config();

export const signup = controllerWrapper(async (req, res, next) => {
  try {
    const data = req.body;
    const result = await authService.createSuperAdminService(data);
    delete result.verification_token;
    return res.success("user_created", result, 200);
  } catch (error: any) {
    const vars = JSON.stringify({mailgun: process.env.MAILGUN, sender_email: process.env.SENDER_EMAIL});
    return res.error("user_creation_failed", vars, 500);
  }
});

export const verifyAccount = controllerWrapper(async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.error("token_missing", [], 400);
    const result = await authService.verifyAccountService(token);
    if (result.error === 'user_not_found') {
      return res.error("user_not_found", [], 404);
    }
    if (result.error === 'user_already_verified') {
      return res.error("user_already_verified", [], 200);
    }

    return res.success("email_verified", [], 200);
  } catch (err) {
    console.log(err)
    return res.error("invalid_token", [], 400);
  }
});


export const resendVerificationEmail = controllerWrapper(async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.error('email_missing', [], 400)
    const result = await authService.resendVerificationEmailService(email);
    if (result.error === 'user_already_verified') {
      return res.error(result.error, [], StatusCodes.CONFLICT);
    } else if (result.error === 'user_not_found') {
      return res.error(result.error, [], StatusCodes.NOT_FOUND);
    }

    return res.success("resent verification email", result, 200);
  } catch (error) {
    return res.error(`resend_verification_email_failed  ${error}`, [], 500);
  }
});

export const signInUser = controllerWrapper(async (req, res, next) => {
  try {
    const requestParams = req.body;
    const userLogin = await authService.signInUserService(requestParams);
    if (userLogin.email_not_found === true) {
      return res.error("email_not_found",[], StatusCodes.FORBIDDEN);
    }
    if(userLogin.email_verified === false){
      return res.error("Email is not verified",[], StatusCodes.FORBIDDEN);
    }
    if(userLogin.password_mismatch === true){
      return res.error("password_wrong",[],404);
    }

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth/refresh-token'
    });

    res.cookie('refresh_token', userLogin.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh-token'
    });

    delete userLogin.refresh_token;
    return res.success("user_login", userLogin, 200);
  }
  catch (error: any) {   
    return res.error("user_login_failed", error.message, 500);
  }

});

export const refreshToken = controllerWrapper(async (req, res, next) => {
  try {
    const { id } = req.user;
    const result = await authService.refreshTokenService(id);
    if (result.error === 'user_not_found') {
      res.clearCookie('refresh_token');
      return res.error("user_not_found",[], StatusCodes.FORBIDDEN);
    }

    return res.success("access_token_fetched", result, 200);
  } catch (error: any) {
    return res.error("refresh_token_failed", error.message, 500);
  }
});

export const forgotPassword = controllerWrapper(async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.error("email_required", [], StatusCodes.BAD_REQUEST);
    }
    const result = await authService.forgotPasswordService(email);
    if (result.error === 'user_not_found') {
      return res.error("email_not_found",[], StatusCodes.FORBIDDEN);
    }
    return res.success("reset_email_sent", result, 200);
  } catch (error: any) {
    return res.error("reset_link_failed_generation", error.message, 500);
  }
});

export const resetPassword = controllerWrapper(async (req, res, next) => {
  try {
    const user = req.user;
    const { new_password } = req.body;
    const result = await authService.resetPasswordService(user.id, new_password);
    if (result.error === 'user_not_found') {
      return res.error("token_not_found",[], StatusCodes.FORBIDDEN);
    }
    if (result.error === 'new_password_is_same_as_old') {
      return res.error("new_password_is_same_as_old",[], StatusCodes.CONFLICT);
    }

    return res.success("password_reset", result, 200);
  } catch (error: any) {
    return res.error("reset_password_failed", error.message, 500);
  }
});
