import knex from "../config/database.js";
import {} from "../middleware/schemas/types.js";
import {normaliseSearchText, buildNormalizedSearch} from "../utils/common_functions.js";
import {getFileUrl} from './s3Service.js'

export const inventoryGeneralAnalyticsService = async (pharmacy_id: number, branch_id: number) => {
  const [ stats ] = await knex('batches')
    .leftJoin('branch_product_settings', 'branch_product_settings.product_id', 'batches.product_id')
    .leftJoin('products', 'products.id', 'batches.product_id')
    .where('batches.pharmacy_branch_id', branch_id)
    .select(
      knex.raw(`COUNT(DISTINCT CASE WHEN batches.is_active = true THEN products.id END)::integer as active_products`),
      knex.raw(`SUM(batches.available_stock)::integer as total_products`),
      knex.raw(`
        COUNT(
          CASE WHEN batches.available_stock <= COALESCE(branch_product_settings.min_stock, products.min_stock)
          AND batches.available_stock > 0
          THEN 1 END
        )::integer as low_stock_batches`
      ),
      knex.raw(`
        COUNT(
          CASE WHEN batches.available_stock <= 0 
          THEN 1 END
        )::integer as out_of_stock_batches`
      ),
      knex.raw(`
        COUNT(
          CASE WHEN batches.expiry_date <= CURRENT_DATE + INTERVAL '1 month'
          THEN 1 END
        )::integer as batches_expiring_within_30_days`
      )
    )

  const { sum }: any = await knex('batches')
    .leftJoin('products', 'products.id', 'batches.product_id')
    .where('batches.pharmacy_branch_id', branch_id)
    .andWhere('batches.is_active', true)
    .sum(knex.raw(`batches.available_stock * COALESCE(products.pack_size, 1) * products.selling_price`))
    .first()

  return {
    ...stats, 
    total_stock_value: Number(sum)
  };
}

export const getStockAlertsService = async (pharmacy_id: number, branch_id: number, params) => {
  let { page, limit, search, product_category_id } = params;
  search = normaliseSearchText(search)
  const offset = limit * (page - 1);
  const _alerts = knex('batches')
    .leftJoin('branch_product_settings', 'branch_product_settings.product_id', 'batches.product_id')
    .leftJoin('products', 'products.id', 'batches.product_id')
    .where('batches.pharmacy_branch_id', branch_id)
    .modify((qb) => {
      if(search) {
        qb.andWhere( builder => 
          builder.orWhereRaw(buildNormalizedSearch('products.product_name'), [`%${search}%`])
            .orWhereRaw(buildNormalizedSearch('products.generic_name'), [`%${search}%`])
            .orWhereRaw(buildNormalizedSearch('products.manufacturer'), [`%${search}%`])
        )
      }
      if(product_category_id) {
        qb.andWhere("product_categories.id", product_category_id)
      }
    })
    .select(
      'batches.product_id',
      'products.product_name',
      'products.generic_name',
      'products.image',
      knex.raw(`SUM(batches.available_stock)::integer as available_stock`),
      knex.raw(`MIN(COALESCE(branch_product_settings.min_stock, products.min_stock)) as min_stock`),
      knex.raw(`MIN(COALESCE(branch_product_settings.max_stock, products.max_stock)) as max_stock`),
    )
    .groupBy(
      'batches.product_id', 
      'products.product_name', 
      'products.generic_name', 
      'products.image'
    )
    .havingRaw(`
      SUM(batches.available_stock) 
      <= 
      MIN(COALESCE(branch_product_settings.min_stock, products.min_stock))
    `)
    .orderBy('batches.product_id', 'asc')

  const countResult = await _alerts.clone().clearSelect().clearOrder().clearGroup()
    .countDistinct('batches.product_id as total')
    .first();

  const total = Number(countResult?.total ?? 0);

  const alerts = await _alerts
    .limit(limit)
    .offset(offset);

  for (const alert of alerts) {
    alert.image = getFileUrl(alert.image);
  }

  return { 
    page,
    limit,
    total_pages: Math.ceil(total / limit),
    total,
    alerts
  };
}

export const getExpiringStockService = async (pharmacy_id: number, branch_id: number, params) => {
  let { page, limit, search, product_category_id } = params;
  search = normaliseSearchText(search)
  const offset = limit * (page - 1);
  const _expiringProducts = knex('batches')
    .leftJoin('branch_product_settings', 'branch_product_settings.product_id', 'batches.product_id')
    .leftJoin('products', 'products.id', 'batches.product_id')
    .where('batches.pharmacy_branch_id', branch_id)
    .modify((qb) => {
      if(search) {
        qb.andWhere( builder => 
          builder.orWhereRaw(buildNormalizedSearch('products.product_name'), [`%${search}%`])
            .orWhereRaw(buildNormalizedSearch('products.generic_name'), [`%${search}%`])
            .orWhereRaw(buildNormalizedSearch('products.manufacturer'), [`%${search}%`])
        )
      }
      if(product_category_id) {
        qb.andWhere("product_categories.id", product_category_id)
      }
    })
    .select(
      'batches.product_id',
      'products.product_name',
      'products.generic_name',
      'products.image',
      'batches.expiry_date',
    )
    .groupBy(
      'batches.product_id', 
      'products.product_name', 
      'products.generic_name', 
      'products.image',
      'batches.expiry_date'
    )
    .havingRaw(`
      MAX(batches.expiry_date)
      <= 
      CURRENT_DATE + INTERVAL '1 month'
      AND 
      MAX(batches.expiry_date) > CURRENT_DATE
    `)
    .orderBy('batches.expiry_date', 'desc')

  const countResult = await _expiringProducts.clone().clearSelect().clearOrder().clearGroup()
    .countDistinct('batches.product_id as total')
    .first();

  const total = Number(countResult?.total ?? 0);

  const expiringProducts = await _expiringProducts
    .limit(limit)
    .offset(offset);

  for (const product of expiringProducts) {
    product.image = getFileUrl(product.image);
  }

  return { 
    page,
    limit,
    total_pages: Math.ceil(total / limit),
    total,
    expiring_within_30_days: expiringProducts
  };
}

export const getBatchesService = async (pharmacy_id: number, branch_id: number, params) => {
  let { page, limit, search, product_category_id, expiry } = params;
  search = normaliseSearchText(search)
  const offset = limit * (page - 1);
  let expiryFilter = "true";
  switch (expiry) {
    case 'in_30_days':
      expiryFilter = `batches.expiry_date <= CURRENT_DATE + INTERVAL '1 month'`;
      break;
    case 'after_30_days':
      expiryFilter = `batches.expiry_date > CURRENT_DATE + INTERVAL '1 month'`;
      break;
    case 'expired':
      expiryFilter = `batches.expiry_date <= CURRENT_DATE`;
      break;
    default:
      expiryFilter = `true`;
  }

  const _batches = knex('batches')
    .leftJoin('branch_product_settings', 'branch_product_settings.product_id', 'batches.product_id')
    .leftJoin('products', 'products.id', 'batches.product_id')
    .where('batches.pharmacy_branch_id', branch_id)
    .whereRaw(expiryFilter)
    .modify((qb) => {
      if(search) {
        qb.andWhere( builder => 
          builder.orWhereRaw(buildNormalizedSearch('products.product_name'), [`%${search}%`])
            .orWhereRaw(buildNormalizedSearch('products.generic_name'), [`%${search}%`])
            .orWhereRaw(buildNormalizedSearch('products.manufacturer'), [`%${search}%`])
        )
      }
      if(product_category_id) {
        qb.andWhere("product_categories.id", product_category_id)
      }
    })
    .select(
      'batches.id',
      'batches.product_id',
      'batches.available_stock',
      'batches.expiry_date',
      'batches.manufacturer_name',
      'batches.manufacturer_code',
      'batches.notes',
      'batches.is_active',
      'batches.batch_number',
      'batches.batch_name',
      'products.product_name',
      'products.generic_name',
      'products.image',
    )
    .orderBy('batches.expiry_date', 'asc')

    const countResult = await _batches.clone().clearSelect().clearOrder().clearGroup()
    .countDistinct('batches.product_id as total')
    .first();

  const total = Number(countResult?.total ?? 0);

  const batches = await _batches
    .limit(limit)
    .offset(offset);

  for (const batch of batches) {
    batch.image = getFileUrl(batch.image);
  }

  return { 
    page,
    limit,
    total_pages: Math.ceil(total / limit),
    total,
    batches
  };

}

export const getBranchStockService = async (pharmacy_id: number, branch_id: number, params) => {
  let { page, limit, search, product_category_id } = params;
  search = normaliseSearchText(search)
  const offset = limit * (page - 1);

  const _branchStock = knex('batches')
    .leftJoin('branch_product_settings', 'branch_product_settings.product_id', 'batches.product_id')
    .leftJoin('products', 'products.id', 'batches.product_id')
    .where('batches.pharmacy_branch_id', branch_id)
    .modify((qb) => {
      if(search) {
        qb.andWhere( builder => 
          builder.orWhereRaw(buildNormalizedSearch('products.product_name'), [`%${search}%`])
            .orWhereRaw(buildNormalizedSearch('products.generic_name'), [`%${search}%`])
            .orWhereRaw(buildNormalizedSearch('products.manufacturer'), [`%${search}%`])
        )
      }
      if(product_category_id) {
        qb.andWhere("product_categories.id", product_category_id)
      }
    })
    .select(
      'batches.product_id',
      'products.product_name',
      'products.generic_name',
      'products.image',
      'products.gst_rate',
      'products.pack_size',
      knex.raw('COALESCE(products.selling_price, 0) as unit_price'),
      knex.raw(`
        SUM( 
          CASE WHEN batches.is_active = true
          THEN batches.available_stock END
        )::integer as available_stock
      `),
      knex.raw(`MIN(COALESCE(branch_product_settings.min_stock, products.min_stock)) as min_stock`),
      knex.raw(`MIN(COALESCE(branch_product_settings.max_stock, products.max_stock)) as max_stock`),
    )
    .groupBy(
      'batches.product_id', 
      'products.product_name', 
      'products.generic_name', 
      'products.image',
      'products.selling_price',
      'products.gst_rate',
      'products.pack_size'
    )
    .havingRaw(`
      SUM(
        CASE WHEN batches.is_active = true
        THEN batches.available_stock ELSE 0 END
      ) > 0
    `)
    .orderBy('batches.product_id', 'asc')

  const countResult = await _branchStock.clone().clearSelect().clearOrder().clearGroup()
    .countDistinct('batches.product_id as total')
    .first();

  const total = Number(countResult?.total ?? 0);

  const branchStock = await _branchStock
    .limit(limit)
    .offset(offset);

  for (const stock of branchStock) {
    stock.image = stock.image && getFileUrl(stock.image);
  }

  return { 
    page,
    limit,
    total_pages: Math.ceil(total / limit),
    total,
    branch_stock: branchStock
  };
}

