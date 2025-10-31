import z from '../../config/zodConfig.js';
import knex from '../../config/database.js';

export const signupForm = z.object({
  first_name: z.string()
    .min(1, { message: 'First name is required' })
    .max(25, { message: 'First name should have a maximum length of 25' })
    .regex(/^[a-zA-Z]*$/, { message: 'First name should only contain letters' })
    .refine(val => val.trim().length > 0, { message: 'First name cannot be empty' }),

  last_name: z.string()
    .regex(/^[a-zA-Z]*$/, { message: 'Last name should only contain letters' }),

  pharmacy_name: z.string()
    .min(3, 'Company name should have a minimum length of 3')
    .refine(val => val.trim().length > 0, 'Company name cannot be empty'),

  email: z.email('Email must be a valid email')
    .refine(val => val.trim() === val, 'Email cannot contain leading or trailing spaces')
    .refine(async (email) => {
      const user = await knex("users")
        .select("id")
        .where({ email })
        .first();

      return !user;
    }, 'Email is already registered with us'),

  password: z.string()
    .regex(
      /^(?=.*[a-z])(?=.*[0-9!@#$%^&*\s])[a-zA-Z0-9!@#$%^&*\s]{8,}$/,
      'Password must be at least 8 characters long and contain only letters, numbers, and special characters !@#$%^&*'
    ),

  phone_number: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Contact number must be a valid phone number')
    .refine(val => val.trim().length > 0, 'Contact number cannot be empty'),

  drug_license_number: z.string()
    .regex(/^[a-zA-Z0-9-]*$/, { message: 'Drug license number should only contain letters and numbers' })
    .refine(val => val.trim().length > 0, 'Drug license number cannot be empty')
    .optional()
});

// Type inference
export type SignupForm = z.infer<typeof signupForm>;
