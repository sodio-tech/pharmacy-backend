import z from '../../config/zodConfig.js';
import knex from '../../config/database.js';

export const newProfileSchema = z.object({
  new_name: z.string().min(1, { message: 'Name cannot be an empty field' }).optional(),
  phone_number: z.string().min(1, { message: 'Phone number cannot be an empty field' }).optional(),
  pharmacy_name: z.string().min(1, { message: 'Pharmacy name cannot be an empty field' }).optional(),
  currency_code: z.string().min(3, { message: 'Currency code cannot be an empty field' })
    .optional()
    .refine(async val => {
      const res = await knex('currencies')
        .select('code')
        .where({ code: val })
        .first();

      return res !== undefined;
    }, { message: 'Invalid currency code' }),
});

// Type inference
export type NewProfile = z.infer<typeof newProfileSchema>;

