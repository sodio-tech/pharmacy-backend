import { Router } from 'express';
import {verifyAccessToken} from "../../middleware/verifyAccessToken.js";
import { validator, addPurchaseOrderValidator, orderFulfillmentSchema} from "../../middleware/validatorMiddleware.js";
import { verifyRoleAccess } from "../../middleware/verifyRoleAccess.js";
import {verifyBranchAccess} from "../../middleware/verifyBranchAccess.js";
import { PermissionMap } from '../../config/constants.js';
import * as ordersController from "../../controllers/orderController.js";

const router = Router();
// root = /orders
router.use(verifyAccessToken);

router.get("/details", ordersController.getOrderDetails);

router.post(
  "/make-order", 
  verifyBranchAccess(), 
  verifyRoleAccess(PermissionMap.ORDER.ADD_ORDER), 
  validator(addPurchaseOrderValidator), 
  ordersController.makePurchaseOrder
);

router.patch(
  "/order-completed/:order_id", 
  verifyRoleAccess(PermissionMap.ORDER.FULFILL_ORDER),
  validator(orderFulfillmentSchema),
  ordersController.markPurchaseCompleted
);

router.get("/list", ordersController.getPurchaseOrders)

export default router
