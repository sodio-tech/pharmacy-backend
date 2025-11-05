import { Router } from 'express';
import {verifyAccessToken} from "../../middleware/verifyAccessToken.js";
import { validator, addSupplierValidator, addPurchaseOrderValidator} from "../../middleware/validatorMiddleware.js";
import { verifyRoleAccess} from "../../middleware/verifyRoleAccess.js";
import * as supplierController from "../../controllers/supplierController.js";
import {PermissionMap} from '../../config/constants.js';

const router = Router();
// root = /supplier
router.use(verifyAccessToken);

router.post("/new-supplier", verifyRoleAccess(PermissionMap.SUPPLIER.ADD_SUPPLIER), 
  validator(addSupplierValidator), 
  supplierController.addSupplier
);

router.post("/make-order", validator(addPurchaseOrderValidator), supplierController.makePurchaseOrder);

router.patch("/order-completed/:order_id", supplierController.markPurchaseCompleted);

router.get("/list", supplierController.listSuppliers);

router.get("/orders", supplierController.getPurchaseOrders)

router.get("/general-analytics", supplierController.getGeneralSupplierAnalytics)

router.get("/performance-report", supplierController.getSupplierPerformanceReport)

export default router;
