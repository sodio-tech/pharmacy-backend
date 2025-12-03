import { Router } from 'express';
import * as adminController from "../../controllers/adminController.js";
import * as authController from "../../controllers/authController.js";
import {validator, contactRequestSchema, bookDemoValidator, userLoginSchema} from "../../middleware/validatorMiddleware.js";
import { verifyPlatformAdmin } from '../../middleware/verifyPlatformAdmin.js';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.js';
import { verifyAdminRefreshToken } from '../../middleware/verifyAdminRefreshToken.js';


const router = Router();
// root = /admin

router.post('/contact-us', validator(contactRequestSchema), adminController.contactUs);

router.post('/book-demo', validator(bookDemoValidator), adminController.bookDemo);

router.post('/signin', validator(userLoginSchema), adminController.signInAdmin);

router.get("/refresh-token", verifyAdminRefreshToken, authController.refreshToken);


// SIGNED-IN ADMIN ONLY ROUTES
router.use(verifyAccessToken)

router.get('/contact-us/list', verifyPlatformAdmin, adminController.contactRequestList);

router.get('/demo-requests/list', verifyPlatformAdmin, adminController.demoRequests);

router.get('/users-list', verifyPlatformAdmin, adminController.getUsers);

export default router;
