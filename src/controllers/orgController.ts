import controllerWrapper from "../middleware/controllerWrapper.js";
import { StatusCodes } from 'http-status-codes'
import * as orgService from "../services/orgService.js";

export const addBranch = controllerWrapper(async (req, res, next) => {
  try {
    const user = req.user
    const data = req.body;
    const result = await orgService.addBranchService(user, data);
    if (result.error) {
      return res.error(result.error, [], StatusCodes.BAD_REQUEST);
    }
    return res.success("Branch created", result, 200);
  } catch (error: any) {
    return res.error("Failed to add Branch", error.message, 500);
  }
});

export const deleteBranch = controllerWrapper(async (req, res, next) => {
  try {
    const user = req.user
    const branch_id = req.params?.branch_id;
    if (!branch_id) {
      return res.error("branch_id is required", [], StatusCodes.BAD_REQUEST);
    }
    const result = await orgService.deleteBranchService(user, branch_id);
    return res.success("Branch deleted", result, 200);
  } catch (error: any) {
    return res.error("Failed to delete Branch", error.message, 500);
  }
});

export const getBranches = controllerWrapper(async (req, res, next) => {
  try {
    const user = req.user
    const result = await orgService.getBranchesService(user, req.params.pharmacy_id);
    if (result.error) {
      return res.error(result.error, [], StatusCodes.BAD_REQUEST);
    }
    return res.success("Branch created", result, 200);
  } catch (error: any) {
    return res.error("Failed to add Branch", error.message, 500);
  }
});

export const addEmployee = controllerWrapper(async (req, res, next) => {
  try {
    const user = req.user
    const data = req.body;
    const result = await orgService.addEmployeeService(user, data);
    if (result.error) {
      return res.error(result.error, [], StatusCodes.BAD_REQUEST);
    }
    return res.success("Employee created", result, 200);
  } catch (error: any) {
    return res.error("Failed to add Employee", error.message, 500);
  }
});
