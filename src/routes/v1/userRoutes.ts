import { Router } from "express";
import * as userController from "../../controllers/userController.js";
import { verifyAccessToken } from "../../middleware/verifyAccessToken.js";
import {
  validator,
  newProfileSchema,
} from "../../middleware/validatorMiddleware.js";
import multer from "multer";

const upload = multer();
const router = Router();
// root = /

router.get("/profile", verifyAccessToken, userController.getProfile);

router.put(
  "/update-profile",
  verifyAccessToken,
  upload.fields([{ name: "profile_photo", maxCount: 1 }]),
  validator(newProfileSchema),
  userController.updateProfile,
);

router.patch("/switch-branch", verifyAccessToken, userController.switchBranch);

export default router;

