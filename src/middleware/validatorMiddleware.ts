import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { fromError } from 'zod-validation-error';

export const validator = (schema, property = "body") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req[property] = await schema.parseAsync(req[property]);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = fromError(error);
        return res.status(400).json({
          success: false,
          message: errors.message.replace(/^Validation error:\s*/, ''),
          errors: errors.details
        });
      }
      
      // Handle other errors
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

export { signupForm} from "./schemas/signupForm.js";
export {userLoginSchema } from "./schemas/userLoginValidator.js"
export {resetPasswordSchema } from "./schemas/resetPasswordValidator.js"
export {newBranchValidator } from "./schemas/newBranchValidator.js"
export {addEmployeeValidator } from "./schemas/addEmployeeValidator.js"
export {addSupplierValidator} from "./schemas/addSupplierValidator.js"
export {addPurchaseOrderValidator} from "./schemas/addPurchaseOrder.js"
export {newProductSchema} from './schemas/newProductValidator.js'
export {orderFulfillmentSchema} from './schemas/orderFulfilledValidator.js'
export {updateProductSchema} from './schemas/updateProductValidator.js'
export {newCustomerSchema} from './schemas/customerValidator.js'
export {newSaleSchema} from './schemas/newSaleValidator.js'
export {updateCustomerSchema} from './schemas/updateCustomerValidator.js'
export {newProfileSchema} from './schemas/updateProfileValidator.js'
export {updateOrgProfile} from './schemas/updateOrgProfile.js'
