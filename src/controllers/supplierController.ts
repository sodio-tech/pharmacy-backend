import controllerWrapper from "../middleware/controllerWrapper.js";
import * as supplierService from "../services/supplierService.js";
import { StatusCodes } from 'http-status-codes'

export const addSupplier = controllerWrapper(async (req, res, next) => {
  try {
    const data = req.body;
    const pharmacy_id = req.user?.pharmacy_id;
    const result = await supplierService.addSupplierService(data, pharmacy_id);
    return res.success("Supplier added", result, 200);
  } catch (error: any) {
    return res.error("Failed to add supplier", error.message, 500);
  }
});

export const listSuppliers = controllerWrapper(async (req, res, next) => {
  try {
    const pharmacyId = req.user?.pharmacy_id;
    const {page = 1, limit = 5, search, product_category_id} = req.query;
    if (!pharmacyId) {
      throw new Error("something went wrong, please login again");
    }
    const result = await supplierService.listSuppliersService(pharmacyId, {page, limit, search, product_category_id});
    return res.success("Suppliers listed", result, 200);
  } catch (error: any) {
    return res.error("Failed to list suppliers", error.message, 500);
  }
});

export const getGeneralSupplierAnalytics = controllerWrapper(async (req, res, next) => {
  try {
    const pharmacy_id = req.user?.pharmacy_id;
    const result = await supplierService.getGeneralSupplierAnalyticsService(pharmacy_id);
    return res.success("General analytics fetched", result, 200);
  } catch (error: any) {
    return res.error("Failed to get general analytics", error.message, 500);
  }
});

export const getSupplierPerformanceReport = controllerWrapper(async (req, res, next) => {
  try {
    const pharmacy_id = req.user?.pharmacy_id;
    const result = await supplierService.getSupplierPerformanceReportService(pharmacy_id);
    return res.success("Performance report fetched", result, 200);
  } catch (error: any) {
    return res.error("Failed to get performance report", error.message, 500);
  }
});
