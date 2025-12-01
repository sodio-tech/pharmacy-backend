import controllerWrapper from "../middleware/controllerWrapper.js";
import * as adminService from "../services/adminService.js";
import { StatusCodes } from 'http-status-codes'

export const contactUs = controllerWrapper(async (req, res, next) => {
  try {
    const data = req.body;
    const result = await adminService.recordContactRequest(data);
    return res.success("Contact request saved", result, 200);
  } catch (error: any) {
    return res.error("Failed to send contact request", error.message, 500);
  }
});

export const contactRequestList = controllerWrapper(async (req, res, next) => {
  try {
    const params = req.query;
    params.page = Number(params.page || 1);
    params.limit = Number(params.limit || 10);
    const result = await adminService.getContactRequests(params);
    return res.success("Contact request list", result, 200);
  } catch (error: any) {
    return res.error("Failed to get contact request list", error.message, 500);
  }
});

export const bookDemo = controllerWrapper(async (req, res, next) => {
  try {
    const data = req.body;
    const result = await adminService.bookDemoService(data);
    return res.success("Demo booked", result, 200);
  } catch (error: any) {
    return res.error("Failed to book demo", error.message, 500);
  }
});

export const demoRequests = controllerWrapper(async (req, res, next) => {
  try {
    const params = req.query;
    params.page = Number(params.page || 1);
    params.limit = Number(params.limit || 10);
    const result = await adminService.demoRequestListService(params);
    return res.success("Demo request list", result, 200);
  } catch (error: any) {
    return res.error("Failed to get demo request list", error.message, 500);
  }
});

export const signInAdmin = controllerWrapper(async (req, res, next) => {
  try {
    const requestParams = req.body;
    const userLogin = await adminService.signinAdminService(requestParams);
    if (userLogin.email_not_found === true) {
      return res.error("email_not_found",[], StatusCodes.FORBIDDEN);
    }
    if(userLogin.password_mismatch === true){
      return res.error("Wrong password",[],404);
    }
    if (userLogin.not_admin === true) {
      return res.error("not_admin",[],StatusCodes.FORBIDDEN);
    }

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.sodio.tech',
      path: '/',
    });

    res.cookie('refresh_token', userLogin.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: '.sodio.tech',
      path: '/',
    });

    delete userLogin.refresh_token;
    return res.success("user_login", userLogin, 200);
  }
  catch (error: any) {   
    return res.error("user_login_failed", error.message, 500);
  }

});

