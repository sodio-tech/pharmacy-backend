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
