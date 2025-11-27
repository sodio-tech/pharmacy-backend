import { Router } from 'express';
import {verifyAccessToken} from "../../middleware/verifyAccessToken.js";
import { validator, newProductSchema, updateProductSchema} from "../../middleware/validatorMiddleware.js";
import { verifyRoleAccess } from "../../middleware/verifyRoleAccess.js";
import { PermissionMap } from '../../config/constants.js';
import * as productController from "../../controllers/productController.js";
import multer from 'multer';

const upload = multer();

const router = Router();
// root = /products


router.use(verifyAccessToken);

router.get("/categories", productController.getCategories);

router.post("/new-product", 
  verifyRoleAccess(PermissionMap.INVENTORY.EDIT), 
  upload.fields([{name: 'image', maxCount: 10}]),  
  validator(newProductSchema),
  productController.addNewProduct
)

router.get("/catalogue", productController.getProducts);

router.get("/details", productController.getProductDetails);

router.get("/units", productController.getProductUnits);

router.put("/update-product/:product_id", 
  verifyRoleAccess(PermissionMap.INVENTORY.EDIT), 
  upload.fields([{name: 'image', maxCount: 1}]),  
  validator(updateProductSchema),
  productController.updateProduct
)

router.patch("/make-inactive/:product_id",
  verifyRoleAccess(PermissionMap.INVENTORY.REMOVE), 
  productController.makeProductInactive
)

router.get("/global", productController.getGlobalProducts);

export default router;
