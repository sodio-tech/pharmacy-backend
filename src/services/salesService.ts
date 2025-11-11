import knex from "../config/database.js";
import {Sale} from "../middleware/schemas/types.js";

export const getPaymentModesService = async () => {
  const result = await knex('payment_modes').select('id', 'name', 'description');
  return result;
}

export const makeSaleService = async (user, data: Sale, action: "paid" | "draft" | "review") => {
  const prodIds = data.cart.map(item => item.product_id);
  let receiptProducts = Object.fromEntries(
    data.cart.map(({product_id, ...rest}) => [product_id, {...rest, price: 0, gst_rate: 0}])
  );

  const _products = await knex('batches')
    .leftJoin('products', 'products.id', 'batches.product_id')
    .where('batches.is_active', true)
    .andWhere('batches.pharmacy_branch_id', data.branch_id)
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
