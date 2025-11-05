import { Router } from 'express';
import {verifyAccessToken} from "../../middleware/verifyAccessToken.js";
import { validator, addSupplierValidator, addPurchaseOrderValidator} from "../../middleware/validatorMiddleware.js";
import { verifyRoleAccess} from "../../middleware/verifyRoleAccess.js";
import * as supplierController from "../../controllers/supplierController.js";

const router = Router();
// root = /supplier
router.use(verifyAccessToken);

router.post("/new-supplier", validator(addSupplierValidator), supplierController.addSupplier);

router.post("/make-order", validator(addPurchaseOrderValidator), supplierController.makePurchaseOrder);

router.patch("/order-completed/:order_id", supplierController.markPurchaseCompleted);

router.get("/list/:pharmacy_id", supplierController.listSuppliers);

router.get("/orders/:pharmacy_id", supplierController.getPurchaseOrders)

export default router;
