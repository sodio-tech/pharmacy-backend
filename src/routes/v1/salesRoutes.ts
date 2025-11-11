import { Router } from 'express';
import {verifyAccessToken} from "../../middleware/verifyAccessToken.js";
import { validator, newSaleSchema } from "../../middleware/validatorMiddleware.js";
// import { verifyRoleAccess } from "../../middleware/verifyRoleAccess.js";
// import { PermissionMap } from '../../config/constants.js';
import * as salesController from "../../controllers/salesController.js";
import multer from 'multer';

const upload = multer();

const router = Router();
// root = /sales
router.use(verifyAccessToken);

router.post(
  '/new-sale', 
  upload.fields([{name: 'prescription', maxCount: 1}]),  
  validator(newSaleSchema),
  salesController.makeSale
);

router.get("/payment-modes", salesController.getPaymentModes);

export default router;
