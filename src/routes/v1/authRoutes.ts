import { Router } from 'express';
import * as authController from "../../controllers/authController.js";
import { validator, signupForm, userLoginSchema } from "../../middleware/validatorMiddleware.js";
import { verifyRefreshToken } from "../../middleware/verifyRefreshToken.js";

const router = Router();

router.post("/sign-up", validator(signupForm), authController.signup);

router.post("/verify-email", authController.verifyAccount);

router.post("/resend-verification-email", authController.resendVerificationEmail);

router.post("/sign-in", validator(userLoginSchema), authController.signInUser);

router.get("/refresh-token", verifyRefreshToken, authController.refreshToken);

export default router;

