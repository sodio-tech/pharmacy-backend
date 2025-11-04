import z from '../../config/zodConfig.js';
import { ROLES } from '../../config/constants.js';
import knex from '../../config/database.js';

export const addEmployeeValidator = 
  z.object({
    first_name: z.string()
      .min(1, { message: 'First name is required' })
      .max(25, { message: 'First name should have a maximum length of 25' })
      .regex(/^[a-zA-Z]*$/, { message: 'First name should only contain letters' })
      .refine(val => val.trim().length > 0, { message: 'First name cannot be empty' }),

    last_name: z.string()
      .regex(/^[a-zA-Z]*$/, { message: 'Last name should only contain letters' }),

    pharmacy_id: z.number(),
    branch_id: z.number(),
    role: z.string().refine(val => ROLES[val], 'Invalid role'),
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
        /^[a-zA-Z0-9!@#$%^&*]{8,}$/,
        'Password must be at least 8 characters long and contain only letters, numbers, and special characters !@#$%^&*'
      ),
    phone_number: z.string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Contact number must be a valid phone number')
      .refine(val => val.trim().length > 0, 'Contact number cannot be empty'),
  })

export type Employee = z.infer<typeof addEmployeeValidator>;

