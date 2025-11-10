import { Router } from 'express';
import {verifyAccessToken} from "../../middleware/verifyAccessToken.js";
import { validator } from "../../middleware/validatorMiddleware.js";
import { verifyRoleAccess } from "../../middleware/verifyRoleAccess.js";
import { PermissionMap } from '../../config/constants.js';
import * as productController from "../../controllers/productController.js";
import multer from 'multer';

const upload = multer();

const router = Router();
// root = /sales
router.use(verifyAccessToken);


export default router;
