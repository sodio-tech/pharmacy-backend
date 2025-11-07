import knex from "../config/database.js";
import dotenv from 'dotenv'
dotenv.config();
import {Supplier, PurchaseOrder, OrderFulfillment} from "../middleware/schemas/types.js";
import {buildNormalizedSearch, normaliseSearchText} from "../utils/common_functions.js";

export const addSupplierService = async (newSupplier: Supplier, pharmacy_id: number) => {
  const supplier_ = {
    ...newSupplier,
    pharmacy_id
  }
  const [ supplier  ] = await knex("suppliers").insert(supplier_).returning("*");
  if (!supplier) {
    throw new Error("Supplier not added, something went wrong");
  }

  delete supplier.created_at;
  delete supplier.updated_at;

  return { supplier };
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

export const makePurchaseOrderService = async (newPurchaseOrder: PurchaseOrder, pharmacy_id: number) => {
  const product_categories = Array.isArray(newPurchaseOrder.product_category_id) 
    ? newPurchaseOrder.product_category_id : [newPurchaseOrder.product_category_id];
  const insertion: any = {
    ...newPurchaseOrder,
    pharmacy_id
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
  let {page, limit, search, product_category_id} = pagination;
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

export const listSuppliersService = async (pharmacy_id: number, pagination) => {
  let {page, limit, search, product_category_id} = pagination;
  page = Number(page); 
  limit = Number(limit);
  const offset = limit * (page - 1);
  search = normaliseSearchText(search);

  let suppliers = knex("suppliers")
    .leftJoin("purchase_orders", "suppliers.id", "purchase_orders.supplier_id")
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
    })
    .select(
      "suppliers.id as supplier_id",
      "suppliers.name as supplier_name", 
      "suppliers.phone_number",
      "suppliers.gstin",
      knex.raw(`
        MAX(CASE WHEN purchase_orders.status = 'fulfilled'
            THEN purchase_orders.purchase_date 
            ELSE NULL 
        END) as last_purchase_date
      `),
      knex.raw(`
        COALESCE(
          SUM(CASE WHEN purchase_orders.status = 'fulfilled'
              THEN purchase_orders.purchase_amount 
              ELSE 0 
          END), 
          0
        ) as total_purchase_amount
      `),
      knex.raw(`
        JSON_AGG_STRICT(
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

export const getGeneralSupplierAnalyticsService = async (pharmacy_id: number) => {
  const _supplierStats = knex("suppliers")
    .where("pharmacy_id", pharmacy_id)
    .select(
      knex.raw("COUNT(CASE WHEN is_active = true THEN 1 END)::integer as active_suppliers"),
      knex.raw(`
        COUNT(
          CASE WHEN date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE) 
          THEN 1 END
        )::integer
        as new_this_month`
      )
    )
    .first();

  const _purchaseStats = knex("purchase_orders")
    .where("pharmacy_id", pharmacy_id)
    .select(
      knex.raw("COUNT(CASE WHEN status = 'pending' THEN 1 END)::integer as pending_purchases"),
      knex.raw(`
        SUM(CASE WHEN status = 'pending' THEN purchase_amount END)::integer
        as pending_purchase_amount`
      ),
      knex.raw(`
        SUM(
          CASE WHEN DATE_TRUNC('month', purchase_date) = DATE_TRUNC('month', CURRENT_DATE)
          THEN purchase_amount END
        )::integer 
        as spending_this_month`
      ),
      knex.raw(`
        SUM(
          CASE WHEN DATE_TRUNC('month', purchase_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
          THEN purchase_amount END
        )::integer 
        as spending_prev_month`
      ),
      knex.raw(`
        COUNT(
          CASE WHEN fulfilled_on <= expected_delivery_date AND status = 'fulfilled'
          THEN 1 END
        )::integer
        as on_time_deliveries`
      ),
      knex.raw(`
        COUNT(
          CASE WHEN status = 'fulfilled'
          THEN 1 END
        )::integer
        as completed_deliveries`
      ),
    )
    .first();
    
  const [supplierStats, purchaseStats] = await Promise.all([_supplierStats, _purchaseStats]);

  let percentageIncrease: number | null = null;
  const thisMonth = purchaseStats.spending_this_month ?? 0;
  const prevMonth = purchaseStats.spending_prev_month ?? 0;
  if (prevMonth > 0) {
    percentageIncrease = ((thisMonth - prevMonth) / prevMonth) * 100;
  }

  const onTimeDeliveryRate = (purchaseStats.on_time_deliveries / purchaseStats.completed_deliveries) * 100;
  return {
    supplier_actvity: supplierStats,
    purchase_stats: {
      pending_purchases: purchaseStats.pending_purchases,
      pending_purchase_amount: purchaseStats.pending_purchase_amount ?? 0,
    },
    spending_this_month: {
      total: thisMonth,
      percentage_increase_from_prev_month: percentageIncrease,
    },
    on_time_delivery_rate: onTimeDeliveryRate,
  }
}

export const getSupplierPerformanceReportService = async (pharmacy_id: number) => {
  const supplierPerformances = await knex("purchase_orders")
    .leftJoin("suppliers", "purchase_orders.supplier_id", "suppliers.id")
    .where("purchase_orders.pharmacy_id", pharmacy_id)
    .select(
      "suppliers.name as supplier_name",
      "purchase_orders.supplier_id as supplier_id",
      knex.raw(`
        COUNT(
          CASE WHEN fulfilled_on <= expected_delivery_date AND status = 'fulfilled'
          THEN 1 END
        )::integer
        as on_time_deliveries`
      ),
      knex.raw(`
        COUNT(
          CASE WHEN status = 'fulfilled'
          THEN 1 END
        )::integer
        as total_deliveries`
      )
    )
    .groupBy("purchase_orders.supplier_id", "suppliers.name")

  const rankedReport = supplierPerformances.map(supplier => {
    return {
      ...supplier,
      percentage: (supplier.on_time_deliveries / supplier.total_deliveries) * 100,
    }
  })
  .sort((a, b) => b.percentage - a.percentage);

  return { report: rankedReport };
}
