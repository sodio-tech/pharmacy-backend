import { Router } from 'express';
import {verifyAccessToken} from "../../middleware/verifyAccessToken.js";
import { validator} from "../../middleware/validatorMiddleware.js";
import { verifyRoleAccess } from "../../middleware/verifyRoleAccess.js";
import { PermissionMap } from '../../config/constants.js';
import { verifyBranchAccess } from "../../middleware/verifyBranchAccess.js";
import * as inventoryController from "../../controllers/inventoryController.js";

const router = Router();
// root = /inventory
router.use(verifyAccessToken);

router.get("/general-analytics/:branch_id", verifyBranchAccess(), inventoryController.getInventory);

router.get("/stock-alerts/:branch_id", verifyBranchAccess(), inventoryController.getStockAlerts);

router.get("/expiring-stock/:branch_id", verifyBranchAccess(), inventoryController.getExpiringStock);

router.get("/batches/:branch_id", verifyBranchAccess(), inventoryController.getBatches);

router.get("/branch-stock/:branch_id", verifyBranchAccess(), inventoryController.getBranchStock);

export default router;
