import controllerWrapper from "../middleware/controllerWrapper.js";
import * as ordersService from "../services/ordersService.js";
import { StatusCodes } from 'http-status-codes'

export const getOrderDetails = controllerWrapper(async (req, res, next) => {
  try {
    const result = await ordersService.getOrderDetailsService(req.user, req.query.order_id);
    return res.success("Product details fetched", result, 200);
  } catch (error: any) {
    return res.error("Failed to fetch product details", error.message, 500);
  }
});

export const markPurchaseCompleted = controllerWrapper(async (req, res, next) => {
  try {
    const pharmacy_id = req.user?.pharmacy_id;
    const result = await ordersService.markOrderFullfilledService(pharmacy_id, req.body);
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
    const {page = 1, limit = 5, search, product_category_id} = req.query;
    if (!pharmacy_id) {
      throw new Error("something went wrong, please login again");
    }
    const result = await ordersService.listPurchaseOrdersService(pharmacy_id, {page, limit, search, product_category_id});
    return res.success("Purchase orders listed", result, 200);
  } catch (error: any) {
    return res.error("Failed to list purchase orders", error.message, 500);
  }
});

export const makePurchaseOrder = controllerWrapper(async (req, res, next) => {
  try {
    const data = req.body;
    const pharmacy_id = req.user.pharmacy_id;
    const result = await ordersService.makePurchaseOrderService(data, pharmacy_id);
    return res.success("Purchase order added", result, 200);
  } catch (error: any) {
    return res.error("Failed to add purchase order", error.message, 500);
  }
});


