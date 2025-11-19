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
router.use(verifyAccessToken);
// root = /

router.get("/profile", userController.getProfile);

router.put(
  "/update-profile",
  upload.fields([{ name: "profile_photo", maxCount: 1 }]),
  validator(newProfileSchema),
  userController.updateProfile,
);

router.patch("/switch-branch", userController.switchBranch);

export default router;

