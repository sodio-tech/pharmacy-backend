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

