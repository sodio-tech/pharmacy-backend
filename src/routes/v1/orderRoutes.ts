import { Router } from 'express';
import {verifyAccessToken} from "../../middleware/verifyAccessToken.js";
import { validator, addPurchaseOrderValidator} from "../../middleware/validatorMiddleware.js";
import { verifyRoleAccess } from "../../middleware/verifyRoleAccess.js";
import { PermissionMap } from '../../config/constants.js';
import * as ordersController from "../../controllers/orderController.js";

const router = Router();
// root = /orders
router.use(verifyAccessToken);

router.get("/details", ordersController.getOrderDetails);

router.post("/make-order", validator(addPurchaseOrderValidator), ordersController.makePurchaseOrder);

router.patch("/order-completed/:order_id", ordersController.markPurchaseCompleted);

router.get("/list", ordersController.getPurchaseOrders)

router.patch("/order-completed/:order_id", ordersController.markPurchaseCompleted);


export default router
