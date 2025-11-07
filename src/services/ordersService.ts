import knex from "../config/database.js";
import {} from "../middleware/schemas/types.js";

export const getOrderDetailsService = async(user, order_id: string) => {
  const order_ids = order_id.split(",");

  const orders = await knex("purchase_orders")
    .leftJoin('purchase_order_items', 'purchase_order_items.order_id', 'purchase_orders.id')
    .leftJoin('order_product_categories', 'order_product_categories.order_id', 'purchase_orders.id')
    .leftJoin('product_categories', 'product_categories.id', 'order_product_categories.product_category_id')
    .whereIn('purchase_orders.id', order_ids)
    .andWhere('purchase_orders.pharmacy_id', user.pharmacy_id)
    .select(
      'purchase_orders.*',
      knex.raw(`
        JSON_AGG_STRICT(DISTINCT product_categories.category_name) as product_categories
      `),
      knex.raw(`
        JSON_AGG_STRICT(DISTINCT purchase_order_items.product_id) as product_ids
      `),
    )
    .groupBy(
      "purchase_orders.id",
    )
    .orderBy("purchase_orders.id", "asc")

  orders.forEach((order) => {
    delete order.created_at;
    delete order.updated_at;
  });

  return { orders };
}
