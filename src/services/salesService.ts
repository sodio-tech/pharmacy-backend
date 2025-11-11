import knex from "../config/database.js";
import {Sale} from "../middleware/schemas/types.js";
import * as s3Service from "./s3Service.js";

export const getPaymentModesService = async () => {
  const result = await knex('payment_modes').select('id', 'name', 'description');
  return result;
}

export const makeSaleService = async (user, data: Sale & {prescription: any}, action: "paid" | "draft" | "review") => {
  const prodIds = data.cart.map(item => item.product_id);
  let receiptProducts = Object.fromEntries(
    data.cart.map(({product_id, ...rest}) => [product_id, {...rest, price: 0, gst_rate: 0}])
  );

  const _products = await knex('batches')
    .leftJoin('products', 'products.id', 'batches.product_id')
    .where('batches.is_active', true)
    .andWhere('batches.pharmacy_branch_id', data.branch_id)
    .andWhere('batches.expiry_date', '>=', new Date())
    .whereIn('batches.product_id', prodIds)
    .select(
      'batches.product_id',
      'products.product_name',
      knex.raw('products.gst_rate::float as gst_rate'),
      knex.raw('products.unit_price::float'),
      knex.raw('SUM(batches.available_stock)::integer as available_stock'),
      knex.raw('COALESCE(products.pack_size, 1) as pack_size'),
      knex.raw(`
        json_agg_strict(
          jsonb_build_object(
            'id', batches.id,
            'available_stock', batches.available_stock
          )
        ) as batches
      `)
    )
    .groupBy(
      'batches.product_id', 
      'products.unit_price', 
      'products.pack_size',
      'products.gst_rate',
      'products.product_name',
      'batches.expiry_date'
    )
    .orderBy('batches.expiry_date', 'asc')

  if (_products.length === 0) {
    return {error: "No stock available"};
  }
  const products: Record<string, Record<string, any>> = Object.fromEntries(
    _products.map(({product_id, ...rest}) => [product_id, rest])
  );

  let total_before_tax = 0;
  const totalAmount = data.cart.reduce((acc, item) => { 
    let price = item.quantity 
      * (item.pack_size ?? products[item.product_id]?.pack_size) 
      * products[item.product_id]?.unit_price 
    
    total_before_tax += price;
    price = ( products[item.product_id]?.gst_rate/100 ) * price + price;
    receiptProducts[item.product_id]!.price = price;
    receiptProducts[item.product_id]!.gst_rate = products[item.product_id]?.gst_rate;

    return acc + price;
  }, 0);

  if (action !== 'review') {
    if (action === 'paid') {
      await knex.transaction(async (trx) => {
        let batchUpdates: any[] = [];
        Object.entries(receiptProducts).forEach(([product_id, product]) => {
          const batches = products[product_id]?.batches;
          let quantity = product.quantity;
          for (const batch of batches) {
            if (quantity === 0) break;
            const available_stock = batch.available_stock;
            batch.available_stock -= Math.min(available_stock, quantity);
            quantity -= Math.min(available_stock, quantity);
          }
          batchUpdates.push(batches);
        })
        batchUpdates = batchUpdates.flatMap(thing => thing);

        for (const update of batchUpdates) {
          await trx('batches')
            .where('id', update.id)
            .update({ available_stock: update.available_stock});
        }
          
        const saleInsertion = {
          ...data.customer_id && {customer_id: data.customer_id},
          pharmacy_branch_id: data.branch_id,
          payment_mode_id: data.payment_mode,
          status: action,
          cashier_id: user.id,
          total_amount: totalAmount,
        }

        const [sale] = await trx('sales').insert(saleInsertion).returning("*");

        await trx('sale_items')
          .insert(Object.entries(receiptProducts).map(([product_id, product]) => ({
            sale_id: sale.id,
            product_id,
            quantity: product.quantity,
            price: product.price,
            gst_rate: product.gst_rate,
          })))

        if (data.prescription && data.customer_id) {
          let file: string = s3Service.getFileUrl(data.prescription);
          const customer = await trx('customers').where('id', data.customer_id).first();
          const slug = s3Service.slugify(customer.name);
          file = `pharmacy_id_${user.pharmacy_id}/public/products/${slug}`;
          try {
            await s3Service.uploadFile(data.prescription.buffer, file, data.prescription.mimetype, true);
            await trx('prescriptions').insert({
              sale_id: sale.id,
              ... data.customer_id && { customer_id: data.customer_id },
              ... data.doctor_name && { doctor_name: data.doctor_name },
              ... data.doctor_contact && { doctor_contact: data.doctor_contact },
              ... data.prescription_notes && { notes: data.prescription_notes },
              prescription_link: file,
            });
          }
          catch (e) {}
        }
      })

    }
  }

  return {
    products: Object.entries(receiptProducts).map(([id, product]) => ({...product, id})),
    total_amt: totalAmount,
    total_before_tax,
    status: action,
  };
}

export const getSalesService = async (user, branch_id: number, params) => {
  let { page, limit } = params;
  page = Number(page);
  limit = Number(limit);
  const offset = limit * (page - 1);
  const _sales = knex('sales')
    .leftJoin('sale_items', 'sale_items.sale_id', 'sales.id')
    .leftJoin('customers', 'customers.id', 'sales.customer_id')
    .leftJoin('prescriptions', 'prescriptions.sale_id', 'sales.id')
    .leftJoin('payment_modes', 'payment_modes.id', 'sales.payment_mode_id')
    .where('sales.pharmacy_branch_id', branch_id)
    .select(
      'sales.id',
      'payment_modes.name as payment_mode',
      'sales.status',
      'sales.total_amount',
      'sales.created_at',
      knex.raw(`
        json_build_object(
          'doctor_name', prescriptions.doctor_name,
          'doctor_contact', prescriptions.doctor_contact,
          'notes', prescriptions.notes,
          'prescription_link', prescriptions.prescription_link
        ) as prescription
      `),
      knex.raw(`
        json_build_object(
          'id', customers.id,
          'name', customers.name,
          'phone_number', customers.phone_number,
          'email', customers.email
        ) as customer
      `),
      knex.raw(`
        json_agg_strict(
          jsonb_build_object(
            'product_id', sale_items.product_id,
            'quantity', sale_items.quantity,
            'price', sale_items.price,
            'gst_rate', sale_items.gst_rate
          )
        ) as sale_items
      `),
    )
    .orderBy('sales.created_at', 'desc')
    .groupBy(
      'sales.id',
      'payment_modes.name',
      'customers.id',
      'sales.status',
      'sales.total_amount',
      'sales.created_at',
      'prescriptions.doctor_name',
      'prescriptions.doctor_contact',
      'prescriptions.notes',
      'prescriptions.prescription_link'
    )

  const {total = 0}: any = await _sales.clone().clearSelect().clearOrder().clearGroup()
    .countDistinct('sales.id as total')
    .first();

  const sales = await _sales
    .limit(limit)
    .offset(offset);

  return {
    sales,
    total: Number(total),
    page,
    limit,
    total_pages: Math.ceil(total / limit)
  }
}

export const getSalesGeneralAnalyticsService = async (branch_id: number) => {
  const [ salesStats ] = await knex('sales')
    .where('pharmacy_branch_id', branch_id)
    .andWhere('status', 'paid')
    .select(
      knex.raw(`
        COUNT(
          CASE WHEN date_trunc('day', created_at) = date_trunc('day', CURRENT_DATE)
          THEN 1 END
        )::integer as today_transactions
      `),
      knex.raw(`
        COUNT(
          CASE WHEN date_trunc('day', created_at) = date_trunc('day', CURRENT_DATE - INTERVAL '1 day')
          THEN 1 END
        )::integer as yesterday_transactions
      `),
      knex.raw(`
        SUM(
          CASE WHEN date_trunc('day', created_at) = date_trunc('day', CURRENT_DATE)
          THEN total_amount END
        )::integer as today_earnings
      `),
      knex.raw(`
        SUM(
          CASE WHEN date_trunc('day', created_at) = date_trunc('day', CURRENT_DATE - INTERVAL '1 day')
          THEN total_amount END
        )::numeric as yesterday_earnings
      `),
      knex.raw(`
        AVG(
          CASE WHEN date_trunc('day', created_at) = date_trunc('day', CURRENT_DATE)
          THEN total_amount END
        )::integer as today_avg_earnings
      `),
      knex.raw(`
        AVG(
          CASE WHEN date_trunc('day', created_at) = date_trunc('day', CURRENT_DATE - INTERVAL '1 day')
          THEN total_amount END
        )::integer as yesterday_avg_earnings
      `),
      knex.raw(`
        SUM(
          CASE WHEN date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
          THEN total_amount END
        )::integer as this_month_earnings
      `),
      knex.raw(`
        SUM(
          CASE WHEN date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
          THEN total_amount END
        )::integer as last_month_earnings
      `),
    )

  const today_earnings = salesStats.today_earnings ?? 0;
  const yesterday_earnings = salesStats.yesterday_earnings ?? 0;
  const today_avg_earnings = salesStats.today_avg_earnings ?? 0;
  const yesterday_avg_earnings = salesStats.yesterday_avg_earnings ?? 0;
  const today_transactions = salesStats.today_transactions ?? 0;
  const yesterday_transactions = salesStats.yesterday_transactions ?? 0;
  const this_month_earnings = salesStats.this_month_earnings ?? 0;
  const last_month_earnings = salesStats.last_month_earnings ?? 0;

  const percentChange = (current: number, prev: number) => {
    if (prev === 0) return current === 0 ? 0 : 100;
    return ((current - prev) / prev) * 100;
  };

  return {
    today_earnings,
    earnings_change_percent: percentChange(today_earnings, yesterday_earnings),

    today_avg_earnings,
    avg_earnings_change_percent: percentChange(today_avg_earnings, yesterday_avg_earnings),

    today_transactions,
    transactions_change_percent: percentChange(today_transactions, yesterday_transactions),

    this_month_earnings,
    this_month_earnings_change_percent: percentChange(this_month_earnings, last_month_earnings),
  };
}
