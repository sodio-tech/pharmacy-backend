import controllerWrapper from "../middleware/controllerWrapper.js";
import { StatusCodes } from 'http-status-codes'
import * as userService from "../services/userService.js";

export const getProfile = controllerWrapper(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await userService.getProfileService(userId);
    return res.success("user_created", result, 200);
  } catch (error: any) {
    return res.error("user_creation_failed", error.message, 500);
  }
});

