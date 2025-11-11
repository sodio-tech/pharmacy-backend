import z from '../../config/zodConfig.js';

export const newSaleSchema = z.object({
  customer_id: z.coerce.number().optional(),
  branch_id: z.coerce.number().optional(),
  payment_mode: z.coerce.number().optional(),
  cart: z.string()
    .transform((str, ctx) => {
      try {
        return JSON.parse(str)
      } catch (e) {
        ctx.addIssue({ code: 'custom', message: 'Invalid JSON'})
        return z.NEVER
      }
    })
    .pipe(z.array(z.object({
      product_id: z.coerce.number(),
      quantity: z.coerce.number(),
      pack_size: z.coerce.number().optional(),
    })))
    
});

export type Sale = z.infer<typeof newSaleSchema>;
