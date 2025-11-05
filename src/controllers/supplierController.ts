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
    const {page = 1, limit = 5, search} = req.query;
    if (!pharmacyId) {
      throw new Error("something went wrong, please login again");
    }
    const result = await supplierService.listSuppliersService(pharmacyId, {page, limit, search});
    return res.success("Suppliers listed", result, 200);
  } catch (error: any) {
    return res.error("Failed to list suppliers", error.message, 500);
  }
});

export const markPurchaseCompleted = controllerWrapper(async (req, res, next) => {
  try {
    const order_id = req.params.order_id;
    const pharmacy_id = req.user?.pharmacy_id;
    const { delivered_on = new Date() } = req.query;
    if (!order_id || !pharmacy_id) {
      return res.error("Failed to mark purchase order as completed", 'Order id and pharmacy id are required', 400);
    }
    const result = await supplierService.markPurchaseCompletedService(pharmacy_id, order_id, delivered_on);
    if (result.error) {
      return res.error(result.error, [], 400);
    }
    return res.success("Purchase log added", result, 200);
  } catch (error: any) {
    return res.error("Failed to add purchase log", error.message, 500);
  }
});

export const getPurchaseOrders = controllerWrapper(async (req, res, next) => {
  try {
    const pharmacy_id = req.user?.pharmacy_id;
    const {page = 1, limit = 5} = req.query;
    if (!pharmacy_id) {
      throw new Error("something went wrong, please login again");
    }
    const result = await supplierService.supplierPurchaseOrdersService(pharmacy_id, {page, limit});
    return res.success("Purchase orders listed", result, 200);
  } catch (error: any) {
    return res.error("Failed to list purchase orders", error.message, 500);
  }
});

export const makePurchaseOrder = controllerWrapper(async (req, res, next) => {
  try {
    const data = req.body;
    const pharmacy_id = req.user.pharmacy_id;
    const result = await supplierService.makePurchaseOrderService(data, pharmacy_id);
    return res.success("Purchase order added", result, 200);
  } catch (error: any) {
    return res.error("Failed to add purchase order", error.message, 500);
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
