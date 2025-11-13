import z from '../../config/zodConfig.js';

export const newProfileSchema = z.object({
  new_name: z.string().min(1, { message: 'Name cannot be an empty field' }).optional(),
  phone_number: z.string().min(1, { message: 'Phone number cannot be an empty field' }).optional(),
  pharmacy_name: z.string().min(1, { message: 'Pharmacy name cannot be an empty field' }).optional(),
});

// Type inference
export type NewProfile = z.infer<typeof newProfileSchema>;

