import z from '../../config/zodConfig.js';

export const newCustomerSchema = z.object({
  name: z.string().min(3, 'Name should have a minimum length of 3').optional(),

  phone_number: z.string().min(3, 'Phone number should have a minimum length of 3').optional(),

  age: z.number().min(1, 'Age should be at least 18').optional(),

  gender: z.enum(['male', 'female', 'other']).optional(),
})
  .refine(val => val.name || val.phone_number, {error: 'Either name or phone number is required'});

export type Customer = z.infer<typeof newCustomerSchema>;
