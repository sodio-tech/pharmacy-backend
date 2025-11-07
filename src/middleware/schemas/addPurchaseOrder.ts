import z from "../../config/zodConfig.js";

export const addPurchaseOrderValidator = z.object({
  supplier_id: z.number(),
  product_category_id: z.union([
    z.number(),
    z.array(z.number()).min(1, "Array cannot be empty"),
  ]),
  purchase_date: z.coerce.date(),
  purchase_amount: z.number(),
  products: z.array(z.object({
    product_id: z.number(),
    quantity: z.number().min(1, {error: 'Quantity should be greater than 0'}),
  }))
  .min(1, {error: 'At least one product is required'}),
  expected_delivery_date: z.coerce.date(),
  pharmacy_branch_id: z.number(),
});

export type PurchaseOrder = z.infer<typeof addPurchaseOrderValidator>;

