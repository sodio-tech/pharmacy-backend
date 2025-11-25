import { Router } from 'express';
import * as adminController from "../../controllers/adminController.js";
import {validator, contactRequestSchema, bookDemoValidator} from "../../middleware/validatorMiddleware.js";
import { verifyPlatformAdmin } from '../../middleware/verifyPlatformAdmin.js';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.js';

const router = Router();
// root = /admin

router.post('/contact-us', validator(contactRequestSchema), adminController.contactUs);

router.post('/book-demo', validator(bookDemoValidator), adminController.bookDemo);

// ADMIN ONLY ROUTES
router.use(verifyAccessToken)

router.get('/contact-us/list', verifyPlatformAdmin, adminController.contactRequestList);

router.get('/demo-requests/list', verifyPlatformAdmin, adminController.demoRequests);

export default router;
