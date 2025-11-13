import controllerWrapper from "../middleware/controllerWrapper.js";
import * as customerService from "../services/customerService.js";
import { StatusCodes } from 'http-status-codes'

export const createNewCustomer = controllerWrapper(async (req, res, next) => {
  try {
    const user = req.user;
    const result = await customerService.createNewCustomerService(req.body, user);
    return res.success("user_created", result, 200);
  } catch (error: any) {
    return res.error("user_creation_failed", error.message, 500);
  }
});

export const getCustomers = controllerWrapper(async (req, res, next) => {
  try {
    const result = await customerService.getCustomersService(req.query, req.user);
    return res.success("customers_retrieved", result, 200);
  } catch (error: any) {
    return res.error("customer_retrieval_failed", error.message, 500);
  }
});

export const getCustomerDetails = controllerWrapper(async (req, res, next) => {
  try {
    const user = req.user;
    const result = await customerService.getCustomerDetailsService(req.params.customer_id, user);
    return res.success("customer_details_retrieved", result, 200);
  } catch (error: any) {
    return res.error("customer_details_retrieval_failed", error.message, 500);
  }
});

export const getPrescriptions = controllerWrapper(async (req, res, next) => {
  try {
    const params = req.query;
    params.page = Number(params.page || 1);
    params.limit = Number(params.limit || 10);
    const user = req.user;
    const result = await customerService.getPrescriptionsService(params, user);
    return res.success("prescriptions_retrieved", result, 200);
  } catch (error: any) {
    return res.error("prescriptions_retrieval_failed", error.message, 500);
  }
});

export const updateCustomer = controllerWrapper(async (req, res, next) => {
  try {
    const user = req.user;
    const customer_id = req.params.customer_id;
    if (!customer_id) {
      return res.error("customer_id_missing", "customer_id is missing", StatusCodes.BAD_REQUEST);
    }
    const result = await customerService.updateCustomerService(user, customer_id, req.body);
    return res.success("customer_updated", result, 200);
  } catch (error: any) {
    return res.error("customer_update_failed", error.message, 500);
  }
}); 
