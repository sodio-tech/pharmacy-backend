import { Router } from 'express';
import {verifyAccessToken} from "../../middleware/verifyAccessToken.js";
import { validator} from "../../middleware/validatorMiddleware.js";
import { verifyRoleAccess } from "../../middleware/verifyRoleAccess.js";
import { PermissionMap } from '../../config/constants.js';
import * as productController from "../../controllers/productController.js";

const router = Router();
// root = /products
router.use(verifyAccessToken);

router.get("/categories", productController.getCategories);

export default router;
