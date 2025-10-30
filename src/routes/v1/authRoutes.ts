import { Router } from 'express';
import * as authController from "../../controllers/authController.js";
import { validator, signupForm, userLoginSchema, resetPasswordSchema } from "../../middleware/validatorMiddleware.js";
import { verifyRefreshToken } from "../../middleware/verifyRefreshToken.js";
import {verifyAccessToken} from "../../middleware/verifyAccessToken.js";

const router = Router();

router.post("/sign-up", validator(signupForm), authController.signup);

router.post("/verify-email", authController.verifyAccount);

router.post("/resend-verification-email", authController.resendVerificationEmail);

router.post("/sign-in", validator(userLoginSchema), authController.signInUser);

router.get("/refresh-token", verifyRefreshToken, authController.refreshToken);

router.post("/forgot-password", authController.forgotPassword);

router.post("/reset-password", verifyAccessToken, validator(resetPasswordSchema), authController.resetPassword);

export default router;

