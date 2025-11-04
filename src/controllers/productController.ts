import controllerWrapper from "../middleware/controllerWrapper.js";
import * as productService from "../services/productService.js";
import { StatusCodes } from 'http-status-codes'

export const getCategories = controllerWrapper(async (req, res, next) => {
  try {
    const result = await productService.getCategoriesService();
    return res.success("Categories fetched", result, 200);
  } catch (error: any) {
    return res.error("Failed to fetch categories", error.message, 500);
  }
});
