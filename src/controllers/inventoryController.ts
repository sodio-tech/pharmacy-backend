import controllerWrapper from "../middleware/controllerWrapper.js";
import * as inventoryService from "../services/inventoryService.js";
import { StatusCodes } from 'http-status-codes'

export const getInventory = controllerWrapper(async (req, res, next) => {
  try {
    const branch_id = req.user.pharmacy_branch_id || req.params.branch_id;
    if (!branch_id) return res.error("inventory_failed", "branch_id is required", 500);
    const result = await inventoryService.inventoryGeneralAnalyticsService(req.user.pharmacy_id, branch_id);
    return res.success("inventory", result, 200);
  } catch (error: any) {
    return res.error("inventory_failed", error.message, 500);
  }
});

export const getStockAlerts = controllerWrapper(async (req, res, next) => {
  try {
    const branch_id = req.user.pharmacy_branch_id || req.params.branch_id;
    const params = req.query;
    params.page = Number(params.page || 1);
    params.limit = Number(params.limit || 5);
    
    if (!branch_id) return res.error("inventory_failed", "branch_id is required", 500);
    const result = await inventoryService.getStockAlertsService(req.user.pharmacy_id, branch_id, params);
    return res.success("stock alerts", result, 200);
  } catch (error: any) {
    return res.error("inventory_failed", error.message, 500);
  }
});

export const getExpiringStock = controllerWrapper(async (req, res, next) => {
  try {
    const branch_id = req.user.pharmacy_branch_id || req.params.branch_id;
    const params = req.query;
    params.page = Number(params.page || 1);
    params.limit = Number(params.limit || 5);
    
    if (!branch_id) return res.error("inventory_failed", "branch_id is required", 500);
    const result = await inventoryService.getExpiringStockService(req.user.pharmacy_id, branch_id, params);
    return res.success("inventory", result, 200);
  } catch (error: any) {
    return res.error("inventory_failed", error.message, 500);
  }
});

export const getBatches = controllerWrapper(async (req, res, next) => {
  try {
    const branch_id = req.user.pharmacy_branch_id || req.params.branch_id;
    const params = req.query;
    params.page = Number(params.page || 1);
    params.limit = Number(params.limit || 5);
    
    if (!branch_id) return res.error("inventory_failed", "branch_id is required", 500);
    const result = await inventoryService.getBatchesService(req.user.pharmacy_id, branch_id, params);
    return res.success("inventory", result, 200);
  } catch (error: any) {
    return res.error("inventory_failed", error.message, 500);
  }
});

export const getBranchStock = controllerWrapper(async (req, res, next) => {
  try {
    const branch_id = req.user.pharmacy_branch_id || req.params.branch_id;
    const params = req.query;
    params.page = Number(params.page || 1);
    params.limit = Number(params.limit || 5);
    
    if (!branch_id) return res.error("inventory_failed", "branch_id is required", 500);
    const result = await inventoryService.getBranchStockService(req.user.pharmacy_id, branch_id, params);
    return res.success("inventory", result, 200);
  } catch (error: any) {
    return res.error("inventory_failed", error.message, 500);
  }
});
