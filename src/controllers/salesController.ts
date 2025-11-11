import controllerWrapper from "../middleware/controllerWrapper.js";
import { StatusCodes } from 'http-status-codes'
import * as salesService from "../services/salesService.js";

export const makeSale = controllerWrapper(async (req, res, next) => {
  try {
    const user = req.user;
    const data = req.body;
    data.branch_id = req.user.pharmacy_branch_id || data.branch_id;
    const { action = "review" } = req.query;
    if (!['paid', 'draft', 'review'].includes(action)) {
      return res.error("Invalid action, provide: paid, draft, review", null, 400);
    }
    let prescription = req.files?.prescription?.[0];
    data.prescription = prescription;
    const result = await salesService.makeSaleService(user, data, action);
    if (result.error) {
      return res.error(result.error, [], 400);
    }
    return res.success("Branch created", result, 200);
  } catch (error: any) {
    return res.error("Failed to log sale", error.message, 500);
  }
});

export const getPaymentModes = controllerWrapper(async (req, res, next) => {
  try {
    const result = await salesService.getPaymentModesService();
    return res.success("Payment modes fetched", result, 200);
  } catch (error: any) {
    return res.error("Failed to fetch payment modes", error.message, 500);
  }
});
