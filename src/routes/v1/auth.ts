import { Router } from 'express';
import * as authController from "../../controllers/authController.js";

const router = Router();

router.post("/signin", authController.addTwo);

export default router;

