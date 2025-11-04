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
