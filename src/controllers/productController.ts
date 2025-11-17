import controllerWrapper from "../middleware/controllerWrapper.js";
import * as productService from "../services/productService.js";
import { StatusCodes } from 'http-status-codes'

export const getCategories = controllerWrapper(async (req, res, next) => {
  try {
    const params = req.query;
    const result = await productService.getCategoriesService(params);
    return res.success("Categories fetched", result, 200);
  } catch (error: any) {
    return res.error("Failed to fetch categories", error.message, 500);
  }
});

export const addNewProduct = controllerWrapper(async (req, res, next) => {
  try {
    const admin = req.user;
    const branch_id = admin.pharmacy_branch_id || req.body.branch_id;
    if (!branch_id) {
      return res.error("Branch id is required", null, 400);
    }
    const result = await productService.addNewProductService(admin, req, branch_id);
    if (result.error) {
      return res.error(result.error, [], 500);
    }
    return res.success("product added to inventory", result, 200);
  } catch (error: any) {
    return res.error("Failed to add product", error.message, 500);
  }
});

export const getProducts = controllerWrapper(async (req, res, next) => {
  try {
    const queryParams = req.query;
    const pagination = {
      ...queryParams,
      page: Number(queryParams.page ?? 1),
      limit: Number(queryParams.limit ?? 10),
    }
    const result = await productService.getProductsService(req.user.pharmacy_id, pagination);
    return res.success("Products fetched", result, 200);
  } catch (error: any) {
    return res.error("Failed to fetch products", error.message, 500);
  }
});

export const getProductDetails = controllerWrapper(async (req, res, next) => {
  try {
    const branch_id = req.user.pharmacy_branch_id || req.query.branch_id;
    if (!branch_id) {
      return res.error("Branch id is required", null, 400);
    }
    const result = await productService.getProductDetailsService(req.user, req.query.product_id, branch_id);
    return res.success("Product details fetched", result, 200);
  } catch (error: any) {
    return res.error("Failed to fetch product details", error.message, 500);
  }
});

export const getProductUnits = controllerWrapper(async (req, res, next) => {
  try {
    const result = await productService.getProductUnitsService();
    return res.success("Product details fetched", result, 200);
  } catch (error: any) {
    return res.error("Failed to fetch product details", error.message, 500);
  }
});

export const updateProduct = controllerWrapper(async (req, res, next) => {
  try {
    const admin = req.user;
    const updateParams = req.body;
    updateParams.branch_id = admin.pharmacy_branch_id || req.body.branch_id;
    const product_id = req.params.product_id;
    const image = req.files?.image?.[0];
    updateParams.image = image;

    if (!product_id) {
      return res.error("Product id is required", null, 400);
    }
    const result = await productService.updateProductService(admin, product_id, updateParams);
    if (result.error) {
      return res.error(result.error, [], 500);
    }
    return res.success("product info updated", result, 200);
  } catch (error: any) {
    return res.error("Failed to add product", error.message, 500);
  }
});
