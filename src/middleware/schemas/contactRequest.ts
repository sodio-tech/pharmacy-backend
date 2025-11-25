import z from '../../config/zodConfig.js';

export const contactRequestSchema = z.object({
  name: z.string().min(3, 'Name should have a minimum length of 3'),
  phone_number: z.string().min(3, 'Phone number should have a minimum length of 3'),
  email: z.email().optional(),
  message: z.string().min(3, 'Message should have a minimum length of 3').optional(),
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

export type ContactRequest = z.infer<typeof contactRequestSchema>;

