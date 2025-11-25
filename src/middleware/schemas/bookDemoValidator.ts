import z from '../../config/zodConfig.js';

export const bookDemoValidator =
  z.object({
    name: z.string()
      .min(1, { message: 'Supplier name is required' })
      .max(25, { message: 'Supplier name should have a maximum length of 25' })
      .regex(/^[a-zA-Z\s]*$/, { message: 'Supplier name should only contain letters' }),

    phone_number: z.string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Contact number must be a valid phone number')
      .refine(val => val.trim().length > 0, 'Contact number cannot be empty'),
  })

export type DemoRequest = z.infer<typeof bookDemoValidator>;

