import { Router } from 'express';
import * as userController from "../../controllers/userController.js";
import {verifyAccessToken} from "../../middleware/verifyAccessToken.js";
import { validator} from "../../middleware/validatorMiddleware.js";

const router = Router();

router.get("/profile", verifyAccessToken, userController.getProfile)

export default router;


