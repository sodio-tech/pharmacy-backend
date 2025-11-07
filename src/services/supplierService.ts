import knex from "../config/database.js";
import dotenv from 'dotenv'
dotenv.config();
import {Supplier} from "../middleware/schemas/types.js";
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
