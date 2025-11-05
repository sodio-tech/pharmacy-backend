import z from '../../config/zodConfig.js';

export const addPurchaseOrderValidator =
  z.object({
    supplier_id: z.number(),
    product_category_id: z.number(),
    purchase_date: z.coerce.date(),
    purchase_amount: z.number(),
    expected_delivery_date: z.coerce.date(),
  })

export type PurchaseOrder = z.infer<typeof addPurchaseOrderValidator>;
