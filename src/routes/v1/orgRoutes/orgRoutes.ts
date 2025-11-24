import { Router } from 'express';
import * as orgController from "../../../controllers/orgController.js";
import {verifyAccessToken} from "../../../middleware/verifyAccessToken.js";
import { validator, newBranchValidator, addEmployeeValidator, updateOrgProfile, updateBranchValidator} from "../../../middleware/validatorMiddleware.js";
import { verifyRoleAccess} from "../../../middleware/verifyRoleAccess.js";
import { PermissionMap} from '../../../config/constants.js';
import orgComplianceRoutes from "./orgComplianceRoutes.js";

const router = Router();
// root = /org
router.use(verifyAccessToken);

router.use("/compliance", orgComplianceRoutes);

router.post("/new-branch", verifyRoleAccess(PermissionMap.ORGANIZATION.ADD_BRANCH), validator(newBranchValidator), orgController.addBranch);

router.delete("/branch/:branch_id", verifyRoleAccess(PermissionMap.ORGANIZATION.DELETE_BRANCH), orgController.deleteBranch);

router.put("/branch/details", verifyRoleAccess(PermissionMap.ORGANIZATION.EDIT), validator(updateBranchValidator), orgController.updateBranch);

router.get("/branches/:pharmacy_id", orgController.getBranches);

router.post("/add-employee", verifyRoleAccess(PermissionMap.ORGANIZATION.ADD_EMPLOYEE), validator(addEmployeeValidator), orgController.addEmployee);

router.get(
  "/user-management", 
  verifyRoleAccess(PermissionMap.ORGANIZATION.EDIT, PermissionMap.ORGANIZATION.VIEW), 
  orgController.userManagementDetails
);

router.get(
  "/management-tools",   
  verifyRoleAccess(PermissionMap.ORGANIZATION.EDIT, PermissionMap.ORGANIZATION.VIEW), 
  orgController.managementTools
);

router.get(
  "/currencies",   
  orgController.supportedCurrencies
);

router.put(
  "/profile", 
  verifyRoleAccess(PermissionMap.ORGANIZATION.EDIT), 
  validator(updateOrgProfile), 
  orgController.updateOrganizationProfile
);

router.get(
  "/profile", 
  verifyRoleAccess(PermissionMap.ORGANIZATION.VIEW), 
  orgController.getOrganizationProfile
);

export default router;
