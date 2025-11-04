import { Router } from 'express';
import {verifyAccessToken} from "../../middleware/verifyAccessToken.js";
import { validator} from "../../middleware/validatorMiddleware.js";
import { verifyRoleAccess} from "../../middleware/verifyRoleAccess.js";
import * as supplierController from "../../controllers/supplierController.js";

const router = Router();
// root = /supplier
router.use(verifyAccessToken);

router.get("/new-supplier", supplierController.addSupplier);

export default router;
