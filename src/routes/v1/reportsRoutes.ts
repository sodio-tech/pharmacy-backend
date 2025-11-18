import { Router } from 'express';
import {verifyAccessToken} from "../../middleware/verifyAccessToken.js";
import { validator} from "../../middleware/validatorMiddleware.js";
import { verifyRoleAccess } from "../../middleware/verifyRoleAccess.js";
import { PermissionMap } from '../../config/constants.js';
import * as reportsController from "../../controllers/reportsController.js";

const router = Router();

// root = /reports
router.use(verifyAccessToken);

router.get("/sales-trend", reportsController.getSalesTrend);

export default router;
