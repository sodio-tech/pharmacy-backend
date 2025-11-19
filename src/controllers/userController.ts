import controllerWrapper from "../middleware/controllerWrapper.js";
import { StatusCodes } from 'http-status-codes'
import * as userService from "../services/userService.js";

export const getProfile = controllerWrapper(async (req, res, next) => {
  try {
    const user = req.user
    const result = await userService.getProfileService(user);
    return res.success("user_created", result, 200);
  } catch (error: any) {
    return res.error("user_creation_failed", error.message, 500);
  }
});

export const updateProfile = controllerWrapper(async (req, res, next) => {
  try {
    const user = req.user
    const profile_photo = req.files?.profile_photo?.[0]
    req.body.profile_photo = profile_photo
    const result = await userService.updataProfileService(user, req.body);
    return res.success("user_updated", result, 200);
  } catch (error: any) {
    return res.error("user_update_failed", error.message, 500);
  }
});

export const switchBranch = controllerWrapper(async (req, res, next) => {
  try {
    const user = req.user;
    const branch_id = req.query.branch_id;
    if (!branch_id) return res.error("branch_id_missing", [], 400);
    const result = await userService.switchBranchService(user, branch_id);
    return res.success("user_switched", result, 200);
  } catch (error: any) {
    return res.error("user_switch_failed", error.message, 500);
  }
});
