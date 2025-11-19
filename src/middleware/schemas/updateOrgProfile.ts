import z from '../../config/zodConfig.js';

export const updateOrgProfile = z.object({
  email: z.email().optional(),
  phone_number: z.string().optional(),
  gstin: z.string().optional(),
  address: z.string().optional(),
  pan: z.string().optional(),
  license_number: z.string().optional(),
  pharmacy_name: z.string().optional(),
})
  .strict()
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


export type OrgProfile = z.infer<typeof updateOrgProfile>;

