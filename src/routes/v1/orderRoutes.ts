import { Router } from 'express';
import {verifyAccessToken} from "../../middleware/verifyAccessToken.js";
import { validator} from "../../middleware/validatorMiddleware.js";
import { verifyRoleAccess } from "../../middleware/verifyRoleAccess.js";
import { PermissionMap } from '../../config/constants.js';
import * as orderController from "../../controllers/orderController.js";

const router = Router();
// root = /orders
router.use(verifyAccessToken);

router.get("/details", orderController.getOrderDetails);

export default router
