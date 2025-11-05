import knex from "../config/database.js";
import dotenv from 'dotenv'
dotenv.config();
import {Supplier, PurchaseOrder} from "../middleware/schemas/types.js";

export const addSupplierService = async (newSupplier: Supplier) => {
  const [ supplier  ] = await knex("suppliers").insert(newSupplier).returning("*");
  if (!supplier) {
    throw new Error("Supplier not added, something went wrong");
  }

  delete supplier.created_at;
  delete supplier.updated_at;

  return { supplier };
}

export const markPurchaseCompletedService = async (pharmacy_id: number, order_id: number, delivered_on) => {
  const [ purchaseLog  ] = await knex("purchase_orders")
    .where("id", order_id)
    .andWhere("pharmacy_id", pharmacy_id)
    .andWhere("is_delivered", false)
    .update({
      is_delivered: true,
      delivered_on
    })
    .returning("*");

  if (!purchaseLog) {
    return {error: "Purchase order not modified, order possibly already delivered"};
  }

  delete purchaseLog.created_at;
  delete purchaseLog.updated_at;

  return purchaseLog;
}

export const makePurchaseOrderService = async (newPurchaseOrder: PurchaseOrder) => {
  const [ purchaseOrder  ] = await knex("purchase_orders").insert(newPurchaseOrder).returning("*");
  if (!purchaseOrder) {
    throw new Error("Purchase order not added, something went wrong");
  }

  delete purchaseOrder.created_at;
  delete purchaseOrder.updated_at;

  return { purchaseOrder };
}

export const supplierPurchaseOrdersService = async (pharmacy_id: number, pagination) => {
  let {page, limit } = pagination;
  page = Number(page); 
  limit = Number(limit);
  const offset = limit * (page - 1);

  let purchaseOrders = knex("purchase_orders")
    .leftJoin("suppliers", "purchase_orders.supplier_id", "suppliers.id")
    .leftJoin("product_categories", "purchase_orders.product_category_id", "product_categories.id")
    .where("suppliers.pharmacy_id", pharmacy_id)
    .andWhere("purchase_orders.is_delivered", true)
    .select(
      "purchase_orders.id",
      "purchase_orders.purchase_date",
      "purchase_orders.pharmacy_id",
      "purchase_orders.purchase_amount",
      "purchase_orders.expected_delivery_date",
      "purchase_orders.delivered_on",
      "purchase_orders.is_delivered",
      "suppliers.name as supplier_name", 
      "suppliers.phone_number",
      "product_categories.category_name as product_category_name",
      "suppliers.gstin",
    )
    .orderBy("purchase_date", "desc");

  const countResult = await purchaseOrders.clone().clearSelect().clearOrder().count('suppliers.id as total').first();
  const total = Number(countResult?.total ?? 0);

  const orders = await purchaseOrders
    .limit(limit)
    .offset(offset);

  orders.forEach((purchaseOrder) => {
    delete purchaseOrder.created_at;
    delete purchaseOrder.updated_at;
  });

  return { 
    orders,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit)
  };
}

export const listSuppliersService = async (pharmacy_id: number, pagination) => {
  let {page, limit } = pagination;
  page = Number(page); 
  limit = Number(limit);
  const offset = limit * (page - 1);

  let suppliers = knex("suppliers")
    .leftJoin("purchase_orders", "suppliers.id", "purchase_orders.supplier_id")
    .leftJoin("product_categories", "purchase_orders.product_category_id", "product_categories.id")
    .where("suppliers.pharmacy_id", pharmacy_id)
    .select(
      "suppliers.id as supplier_id",
      "suppliers.name as supplier_name", 
      "suppliers.phone_number",
      "suppliers.gstin",
      knex.raw(`
        MAX(CASE WHEN purchase_orders.is_delivered = true 
            THEN purchase_orders.purchase_date 
            ELSE NULL 
        END) as last_purchase_date
      `),
      knex.raw(`
        COALESCE(
          SUM(CASE WHEN purchase_orders.is_delivered = true 
              THEN purchase_orders.purchase_amount 
              ELSE 0 
          END), 
          0
        ) as total_purchase_amount
      `),
      knex.raw(`
        JSON_AGG(
          DISTINCT product_categories.category_name
        ) as product_categories
      `),
    )
    .groupBy("suppliers.id", "suppliers.name", "suppliers.phone_number", "suppliers.gstin")
    .orderBy("last_purchase_date", "desc")
    .orderBy("suppliers.created_at", "desc");

  const countResult = await knex("suppliers")
    .where("pharmacy_id", pharmacy_id)
    .count('id as total')
    .first();  
  const total = Number(countResult?.total ?? 0);

  const orders = await suppliers
    .limit(limit)
    .offset(offset);
  
  orders.forEach((purchaseOrder) => {
    delete purchaseOrder.created_at;
    delete purchaseOrder.updated_at;
  });

  return { 
    suppliers: orders,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit)
  };

}
