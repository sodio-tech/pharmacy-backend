import { ROLES } from "@/config/constants.js";
import knex from "../config/database.js";
import {OrderFulfillment, PurchaseOrder} from "../middleware/schemas/types.js";
import {buildNormalizedSearch, normaliseSearchText} from "../utils/common_functions.js";

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

export const markOrderFullfilledService = async (pharmacy_id: number, fulfilledOrder: OrderFulfillment) => {
  const purchaseLog = await knex.transaction(async (trx) => {
    const [res] = await trx('purchase_orders')   
      .where("id", fulfilledOrder.order_id)
      .andWhere("pharmacy_id", pharmacy_id)
      .andWhere("status", "pending")
      .update({
        status: "fulfilled",
        fulfilled_on: fulfilledOrder.fulfilled_on
      })
      .returning("*");

    const batchInsertion = fulfilledOrder.order_batch_data.map(batch_data => ({
      product_id: batch_data.product.product_id,
      batch_name: batch_data.batch_name,
      batch_number: batch_data.batch_number,
      order_id: fulfilledOrder.order_id,
      expiry_date: batch_data.expiry_date,
      manufacturer_name: batch_data.manufacturer_name,
      manufacturer_code : batch_data.manufacturer_code ?? null,
      notes: batch_data.notes ?? null,
    }));

    let batches = await trx("batches")
      .insert(batchInsertion)
      .returning("id");

    batches = batches.map(batch => batch.id);
    let i = 0;
    let branchBatchContents: any[] = [];
    for (const batch_id of batches) {
      const product = fulfilledOrder.order_batch_data[i]?.product;
      branchBatchContents.push(
        {
          pharmacy_branch_id: res.pharmacy_branch_id,
          batch_id,
          quantity_received: product?.quantity,
          available_stock: product?.quantity,
          unit_price: product?.unit_price,
          min_stock: product?.min_stock,
          max_stock: product?.max_stock,
        })
      i++;
    }

    await trx("branch_stock_batches")
      .insert(branchBatchContents)

    return res
  })

  if (!purchaseLog) {
    return {error: "Purchase order not modified, order possibly already delivered"};
  }

  delete purchaseLog.created_at;
  delete purchaseLog.updated_at;

  return purchaseLog;
}

export const makePurchaseOrderService = async (newPurchaseOrder: PurchaseOrder, admin) => {
  const pharmacy_id = admin.pharmacy_id;
  const product_categories = Array.isArray(newPurchaseOrder.product_category_id) 
    ? newPurchaseOrder.product_category_id : [newPurchaseOrder.product_category_id];
  const insertion: any = {
    ...newPurchaseOrder,
    pharmacy_id
  }

  const branchOwned = await knex("pharmacy_branch_employees")
    .where({employee_id: admin.id, pharmacy_branch_id: newPurchaseOrder.pharmacy_branch_id, pharmacy_id})
    .first();

  if (!branchOwned && admin.role !== ROLES.SUPER_ADMIN) {
    return {error: "Unauthorized to make orders for this branch"};
  }

  delete insertion.product_category_id;
  const purchaseOrder = await knex.transaction(async (trx) => {
    const [res] = await trx("purchase_orders")
      .insert({
        pharmacy_id,
        pharmacy_branch_id: newPurchaseOrder.pharmacy_branch_id,
        supplier_id: newPurchaseOrder.supplier_id,
        purchase_date: newPurchaseOrder.purchase_date,
        purchase_amount: newPurchaseOrder.purchase_amount,
        expected_delivery_date: newPurchaseOrder.expected_delivery_date,
      })
      .returning("*");
  
    await trx("order_product_categories")
      .insert(product_categories.map(category_id => ({
        order_id: res.id,
        product_category_id: category_id
      })))

    await trx("purchase_order_items")
      .insert(newPurchaseOrder.products.map(prod => ({
        ...prod, 
        order_id: res.id
    })))

    res.product_categories = product_categories;
    return res;
  });

  if (!purchaseOrder) {
    throw new Error("Purchase order not added, something went wrong");
  }

  delete purchaseOrder.created_at;
  delete purchaseOrder.updated_at;

  return { purchaseOrder };
}

export const listPurchaseOrdersService = async (pharmacy_id: number, pagination) => {
  let {status, page, limit, search, product_category_id} = pagination;
  page = Number(page); 
  limit = Number(limit);
  const offset = limit * (page - 1);
  search = normaliseSearchText(search);

  let purchaseOrders = knex("purchase_orders")
    .leftJoin("suppliers", "purchase_orders.supplier_id", "suppliers.id")
    .leftJoin("order_product_categories", "purchase_orders.id", "order_product_categories.order_id")
    .leftJoin("product_categories", "order_product_categories.product_category_id", "product_categories.id")
    .where("suppliers.pharmacy_id", pharmacy_id)
    .modify((qb) => {
      if(search) {
        qb.andWhere( builder => 
          builder.orWhereRaw(buildNormalizedSearch('suppliers.name'), [`%${search}%`])
            .orWhereRaw(buildNormalizedSearch('suppliers.phone_number'), [`%${search}%`])
            .orWhereRaw(buildNormalizedSearch('suppliers.gstin'), [`%${search}%`])
        )
      }
      if(product_category_id) {
        qb.andWhere("product_categories.id", product_category_id)
      }
      if (status) {
        qb.andWhere("purchase_orders.status", status)
      }
    })
    .select(
      "purchase_orders.id",
      "purchase_orders.purchase_date",
      "purchase_orders.pharmacy_id",
      "purchase_orders.purchase_amount",
      "purchase_orders.expected_delivery_date",
      "purchase_orders.fulfilled_on",
      "purchase_orders.status",
      "suppliers.name as supplier_name", 
      "suppliers.phone_number",
      knex.raw(`
        JSON_AGG_STRICT(DISTINCT product_categories.category_name) as product_categories
      `),
      "suppliers.gstin",
    )
    .groupBy(
      "purchase_orders.id",
      "suppliers.name",
      "suppliers.phone_number",
      "suppliers.gstin",
    )
    .orderBy("purchase_date", "desc")
    

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
