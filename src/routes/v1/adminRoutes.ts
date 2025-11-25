import { Router } from 'express';
import * as adminController from "../../controllers/adminController.js";
import {validator, contactRequestSchema} from "../../middleware/validatorMiddleware.js";
import { PermissionMap } from '../../config/constants.js';
import { verifyPlatformAdmin } from '../../middleware/verifyPlatformAdmin.js';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.js';

const router = Router();
// root = /admin

router.post('/contact-us', validator(contactRequestSchema), adminController.contactUs);


// ADMIN ONLY ROUTES
router.use(verifyAccessToken)
router.get('/contact-us/list', verifyPlatformAdmin, adminController.contactRequestList);

export default router;
