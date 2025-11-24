import { Router } from 'express';
import * as orgController from "../../../controllers/orgController.js";
import { verifyRoleAccess} from "../../../middleware/verifyRoleAccess.js";
import { PermissionMap} from '../../../config/constants.js';


const router = Router();
// root = /org/compliance

router.get("/general-report", verifyRoleAccess(PermissionMap.ORGANIZATION.VIEW), orgController.getComplianceReport);

export default router;
