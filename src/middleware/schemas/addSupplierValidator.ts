import z from '../../config/zodConfig.js';
import knex from '../../config/database.js'

export const addSupplierValidator =
  z.object({
    supplier_name: z.string()
      .min(1, { message: 'Supplier name is required' })
      .max(25, { message: 'Supplier name should have a maximum length of 25' })
      .regex(/^[a-zA-Z]*$/, { message: 'Supplier name should only contain letters' }),

    phone_number: z.string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Contact number must be a valid phone number')
      .refine(val => val.trim().length > 0, 'Contact number cannot be empty'),

    gstin: z.string()
      .regex(/^\d{9}$/, 'GSTIN must be a valid GSTIN number')
      .refine(val => val.trim().length > 0, 'GSTIN cannot be empty'),

    address: z.string()
      .min(1, { message: 'Address is required' })
      .max(25, { message: 'Address should have a maximum length of 25' })
      .regex(/^[a-zA-Z]*$/, { message: 'Address should only contain letters' }),

    email: z.email()
      .refine(async (email) => {
        const user = await knex("suppliers")
          .select("id")
          .where({ email })
          .first();

        return !user;
      }, 'supplier email is already registered with us'),

    license_number: z.string()
      .regex(/^\d{9}$/, 'License number must be a valid license number')
      .refine(val => val.trim().length > 0, 'License number cannot be empty'),
  })

export type Supplier = z.infer<typeof addSupplierValidator>;
