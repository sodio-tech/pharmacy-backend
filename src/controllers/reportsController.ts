import controllerWrapper from "../middleware/controllerWrapper.js";
import * as reportsService from "../services/reportsService.js";
import { StatusCodes } from "http-status-codes";

export const getSalesTrend = controllerWrapper(async (req, res, next) => {
  try {
    const params = req.query;
    const user = req.user;
    const { timeframe = "weekly" } = params;
    if (!["weekly", "monthly", "daily"].includes(timeframe)) {
      return res.error("Invalid timeframe", null, 400);
    }
    const branch_id = req.user.pharmacy_branch_id || req.query.branch_id;
    const result = await reportsService.getSalesTrendService(user, params, branch_id);

    return res.success("Categories fetched", result, 200);
  } catch (error: any) {
    return res.error("Failed to fetch categories", error.message, 500);
  }
});

