import controllerWrapper from "../middleware/controllerWrapper.js";
import * as supplierService from "../services/supplierService.js";
import { StatusCodes } from 'http-status-codes'

export const addSupplier = controllerWrapper(async (req, res, next) => {
  try {
    const data = req.body;
    const result = await supplierService.addSupplierService(data);
    return res.success("Supplier added", result, 200);
  } catch (error: any) {
    return res.error("Failed to add supplier", error.message, 500);
  }
});

export const listSuppliers = controllerWrapper(async (req, res, next) => {
  try {
    const pharmacyId = req.params.pharmacy_id;
    const {page = 1, limit = 5} = req.query;
    if (!pharmacyId) {
      return res.error("Failed to get purchase orders", 'Pharmacy id is required', 400);
    }
    const result = await supplierService.listSuppliersService(pharmacyId, {page, limit});
    return res.success("Suppliers listed", result, 200);
  } catch (error: any) {
    return res.error("Failed to list suppliers", error.message, 500);
  }
});

export const markPurchaseCompleted = controllerWrapper(async (req, res, next) => {
  try {
    const order_id = req.params.order_id;
    const pharmacy_id = req.query.pharmacy_id;
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
    const pharmacy_id = req.params.pharmacy_id;
    const {page = 1, limit = 5} = req.query;
    if (!pharmacy_id) {
      return res.error("Failed to get purchase orders", 'Pharmacy id is required', 400);
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
    const pharmacy_id = req.query.pharmacy_id;
    if (!pharmacy_id) {
      return res.error("Failed to make purchase order", 'Pharmacy id is required', 400);
    }
    const result = await supplierService.makePurchaseOrderService(data);
    return res.success("Purchase order added", result, 200);
  } catch (error: any) {
    return res.error("Failed to add purchase order", error.message, 500);
  }
});
