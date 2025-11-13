import { Router } from 'express';
import {verifyAccessToken} from "../../middleware/verifyAccessToken.js";
import { validator, newCustomerSchema, updateCustomerSchema } from "../../middleware/validatorMiddleware.js";
// import { verifyRoleAccess } from "../../middleware/verifyRoleAccess.js";
// import { PermissionMap } from '../../config/constants.js';
import * as customerController from "../../controllers/customerController.js";

const router = Router();
// root = /customer
router.use(verifyAccessToken);

router.post("/new-customer", validator(newCustomerSchema), customerController.createNewCustomer);

router.get("/customer-list", customerController.getCustomers);

router.get("/details/:customer_id", customerController.getCustomerDetails);

router.get("/prescriptions", customerController.getPrescriptions);

router.put("/update-customer/:customer_id", validator(updateCustomerSchema), customerController.updateCustomer);

export default router;
