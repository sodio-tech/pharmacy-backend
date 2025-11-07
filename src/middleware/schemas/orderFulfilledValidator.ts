import z from '../../config/zodConfig.js';

export const orderFulfillmentSchema = z.object({
  order_id: z.number(),
  fulfilled_on: z.coerce.date(),
  order_batch_data: z.array(z.object({
    notes: z.string().optional(),
    manufacturer_name: z.string()
      .min(1, {error: 'Manufacturer name is required'}),
    manufacturer_code: z.string().optional(),
    batch_number: z.string().min(1, {error: 'Batch number is required'}),
    batch_name: z.string().min(1, {error: 'Batch name is required'}),
    expiry_date: z.coerce.date(),
    product: z.object({
      product_id: z.number(),
      quantity: z.number().min(1, {error: 'Quantity is required'}),
      unit_price: z.number()
        .min(0.01, {error: 'Unit price should be greater than 0'}),
      min_stock: z.number().min(0, {error: 'Min stock is required'}),
      max_stock: z.number().min(0, {error: 'Max stock is required'}),
    })
  })),

});

export type OrderFulfillment = z.infer<typeof orderFulfillmentSchema>;
