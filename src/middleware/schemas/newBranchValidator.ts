import z from '../../config/zodConfig.js';

export const newBranchValidator = z.object({
  pharmacy_id: z.number().optional(),

  branch_name: z.string()
    .min(3, 'Company name should have a minimum length of 3')
    .refine(val => val.trim().length > 0, 'Company name cannot be empty'),

  branch_location: z.string()
    .min(3, 'Company name should have a minimum length of 3')
    .refine(val => val.trim().length > 0, 'Company name cannot be empty'),

  drug_license_number: z.string()
    .regex(/^[a-zA-Z0-9-]*$/, { message: 'Drug license number should only contain letters and numbers' })
    .refine(val => val.trim().length > 0, 'Drug license number cannot be empty')
});

export type NewBranch = z.infer<typeof newBranchValidator>;
