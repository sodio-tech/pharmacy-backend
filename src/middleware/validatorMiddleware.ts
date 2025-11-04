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
          message: 'Validation failed',
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
