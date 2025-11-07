import z from '../../config/zodConfig.js';
import knex from '../../config/database.js'

export const newProductSchema = z.object({
  product_name: z.string()
    .min(1, {error: 'Product name is required'}),

  generic_name: z.string()
    .min(1, {error: 'Generic name is required'}),

  brand_name: z.string().optional(),

  sku: z.string().optional(),

  manufacturer: z.string()
    .min(1, {error: 'Manufacturer is required'}),

  unit: z.coerce.number()
    .refine(async val => {
      const res = await knex('product_units')
        .select('id')
        .where({ id: val })
        .first();

      return res !== undefined;
    }, { message: 'Invalid unit' }),
  product_category_id: z.coerce.number()
    .refine(async val => {
      const res = await knex('product_categories')
        .select('id')
        .where({id: val})
        .first();

      return res !== undefined;
    }, { message: 'Invalid category' }),

  requires_prescription: z.coerce.boolean().optional(),
  description: z.string().optional(),
  barcode: z.string().optional(),
  qrcode: z.string().optional(),

  unit_price: z.coerce.number().min(0.01, {error: 'Unit price should be greater than 0'}),
  selling_price: z.coerce.number().min(0.01, {error: 'Selling price should be greater than 0'}),

  pack_size: z.coerce.number().optional(),

  min_stock: z.coerce.number().min(1, {error: 'Minimum stock should be greater than 0'}),
  max_stock: z.coerce.number().min(1, {error: 'Maximum stock should be greater than 0'}),

});

export type Product = z.infer<typeof newProductSchema>;
