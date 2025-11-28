import z from '../../config/zodConfig.js';

export const updateBranchValidator = z.object({
  branch_name: z.string().min(3, 'Branch name should have a minimum length of 3').optional(),
  branch_location: z.string().min(3, 'Branch location should have a minimum length of 3').optional(),
  drug_license_number: z.string()
    .regex(/^[a-zA-Z0-9-]*$/, { message: 'Drug license number should only contain letters and numbers' })
    .refine(val => val.trim().length > 0, 'Drug license number cannot be empty')
    .optional(),
  trade_license_number: z.string()
    .regex(/^[a-zA-Z0-9-]*$/, { message: 'Trade license number should only contain letters and numbers' })
    .refine(val => val.trim().length > 0, 'Trade license number cannot be empty')
    .optional(),
  fire_certificate_number: z.string()
    .regex(/^[a-zA-Z0-9-]*$/, { message: 'Fire certificate number should only contain letters and numbers' })
    .refine(val => val.trim().length > 0, 'Fire certificate number cannot be empty')
    .optional(),

  drug_license_expiry: z.coerce.date().optional(),
  trade_license_expiry: z.coerce.date().optional(),
  fire_certificate_expiry: z.coerce.date().optional(),
})
  .refine(
    data => {
      return Object.values(data).some(value => 
        value !== undefined && value !== null && value !== ''
      );
    },
    {
      message: "At least one field must be provided for update",
      path: [],
    }
  )


// Type inference
export type BranchUpdates = z.infer<typeof updateBranchValidator>;

