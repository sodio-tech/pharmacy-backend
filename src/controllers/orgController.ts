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
    const result = await orgService.getBranchesService(user);
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

export const userManagementDetails = controllerWrapper(async (req, res, next) => {
  try {
    const user = req.user;
    const result = await orgService.userManagementDetailsService(user);
    return res.success("User management fetched", result, 200);
  } catch (error: any) {
    return res.error("Failed to fetch user management", error.message, 500);
  }
});

export const managementTools = controllerWrapper(async (req, res, next) => {
  try {
    const user = req.user;
    const filters = req.query;
    const result = await orgService.managementToolsService(user, filters);
    return res.success("Management tools fetched", result, 200);
  } catch (error: any) {
    return res.error("Failed to fetch management tools", error.message, 500);
  }
});

export const supportedCurrencies = controllerWrapper(async (req, res, next) => {
  try {
    const result = await orgService.getSupportedCurrenciesService();
    return res.success("Supported currencies fetched", result, 200);
  } catch (error: any) {
    return res.error("Failed to fetch supported currencies", error.message, 500);
  }
});

export const updateOrganizationProfile = controllerWrapper(async (req, res, next) => {
  try {
    const user = req.user;
    const data = req.body;
    const result = await orgService.updatePharmacyProfile(user, data);
    return res.success("Organization profile updated", result, 200);
  } catch (error: any) {
    return res.error("Failed to update organization profile", error.message, 500);
  }
});
