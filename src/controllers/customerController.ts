import controllerWrapper from "../middleware/controllerWrapper.js";
import * as customerService from "../services/customerService.js";
import { StatusCodes } from 'http-status-codes'

export const createNewCustomer = controllerWrapper(async (req, res, next) => {
  try {
    const result = await customerService.createNewCustomerService(req.body);
    return res.success("user_created", result, 200);
  } catch (error: any) {
    return res.error("user_creation_failed", error.message, 500);
  }
});

export const getCustomers = controllerWrapper(async (req, res, next) => {
  try {
    const result = await customerService.getCustomersService(req.query);
    return res.success("customers_retrieved", result, 200);
  } catch (error: any) {
    return res.error("customer_retrieval_failed", error.message, 500);
  }
});

export const getCustomerDetails = controllerWrapper(async (req, res, next) => {
  try {
    const result = await customerService.getCustomerDetailsService(req.params.customer_id);
    return res.success("customer_details_retrieved", result, 200);
  } catch (error: any) {
    return res.error("customer_details_retrieval_failed", error.message, 500);
  }
});
