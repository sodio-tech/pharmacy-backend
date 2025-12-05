import knex from "../config/database.js";
import {} from "../middleware/schemas/types.js";
import {normaliseSearchText, buildNormalizedSearch} from "../utils/common_functions.js";
import * as s3Service from './s3Service.js'

function getPreviousWeekDays() {
  const today = new Date();

  const day = today.getDay();           
  const thisWeekMonday = new Date(today);
  
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  thisWeekMonday.setDate(today.getDate() + diffToMonday);

  const prevWeekMonday = new Date(thisWeekMonday);
  prevWeekMonday.setDate(prevWeekMonday.getDate() - 7);

  const result: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(prevWeekMonday);
    d.setDate(prevWeekMonday.getDate() + i);
    result.push(d);
  }

  return result;
}


export const getSalesTrendService = async (user, params: any, branch_id: number) => {
  const { timeframe } = params;
  const baseQuery = knex('sales')
    .where('pharmacy_branch_id', branch_id)
    .andWhere('status', 'paid')

  const trends = {
    'daily': async () => {
      const res = await baseQuery
        .andWhereRaw(`date_trunc('week', created_at) = date_trunc('week', CURRENT_DATE - INTERVAL '7 days')`)
        .andWhereRaw(`date_trunc('week', created_at) != date_trunc('week', CURRENT_DATE)`)
        .select(
          knex.raw(`EXTRACT(DOW FROM created_at) as day_of_week`),
          knex.raw(`COUNT(*)::integer as total_sales`),
          knex.raw(`SUM(total_amount)::float as total_amount`),
        )
        .groupByRaw(`EXTRACT(DOW FROM created_at)`)
        .orderBy('day_of_week', 'asc')

      const previousWeekDays = getPreviousWeekDays();
      const data = Object.fromEntries(
        Array.from(Array(7).keys()).map(i => [i + 1, {total_sales: 0, total_amount: 0, date: previousWeekDays[i]}])
      )
      for (const row of res) {
        const index = row.day_of_week === 0 ? 7 : row.day_of_week;
        data[index]!.total_sales = row.total_sales;
        data[index]!.total_amount = row.total_amount;
      }
      return data;
    },
    'weekly': async () => {
      const res = await baseQuery
        .clone()
        .andWhereRaw(`created_at >= date_trunc('week', CURRENT_DATE) - INTERVAL '3 weeks'`)
        .select(
          knex.raw(`DATE_TRUNC('week', created_at) as week_start`),
          knex.raw(`COUNT(*)::integer as total_sales`),
          knex.raw(`SUM(total_amount)::float as total_amount`)
        )
        .groupByRaw(`DATE_TRUNC('week', created_at)`)
        .orderBy('week_start', 'asc')

      const data = Object.fromEntries(
        Array.from(Array(4).keys()).map(i => [i + 1, {total_sales: 0, total_amount: 0}])
      )

      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - (fourWeeksAgo.getDay() || 7) + 1); 
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 21);
      fourWeeksAgo.setHours(0, 0, 0, 0);

      res.forEach((row) => {
        const weekStart = new Date(row.week_start);
        const weekDiff = Math.floor((weekStart.getTime() - fourWeeksAgo.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const weekNumber = weekDiff + 1;

        if (weekNumber >= 1 && weekNumber <= 4) {
          data[weekNumber]!.total_sales = row.total_sales;
          data[weekNumber]!.total_amount = row.total_amount;
        }
      });

      return data;    
    },
    'monthly': async () => {
      const res = await baseQuery
        .andWhereRaw(`created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '6 months'`)
        .select(
          knex.raw(`DATE_TRUNC('month', created_at) as month_start`),
          knex.raw(`COUNT(*)::integer as total_sales`),
          knex.raw(`SUM(total_amount)::float as total_amount`)
        )
        .groupByRaw(`DATE_TRUNC('month', created_at)`)
        .orderBy('month_start', 'asc')

      const data = Object.fromEntries(
        Array.from(Array(6).keys()).map(i => [i + 1, {total_sales: 0, total_amount: 0}])
      )

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      res.forEach((row) => {
        const monthStart = new Date(row.month_start);
        const monthDiff = (monthStart.getFullYear() - sixMonthsAgo.getFullYear()) * 12 
          + (monthStart.getMonth() - sixMonthsAgo.getMonth());
        const monthNumber = monthDiff + 1; 

        if (monthNumber >= 1 && monthNumber <= 6) {
          data[monthNumber]!.total_sales = row.total_sales;
          data[monthNumber]!.total_amount = row.total_amount;
        }
      });

      return data;
    }

  }

  const trend = await trends[timeframe]();

  return {
    trend,
    timeframe,
  }
}

export const topSellingProductsService = async (user, params: any, branch_id: number) => {
  let {page, limit, search, start_date, end_date } = params;
  const offset = (page - 1) * limit;
  if (search) search = normaliseSearchText(search);

  if (start_date && end_date && start_date == end_date) {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    start_date.setHours(0, 0, 0, 0);
    end_date.setHours(23, 59, 59, 999);
  }

  const res = await knex('sales')
    .leftJoin('sale_items', 'sale_items.sale_id', 'sales.id')
    .leftJoin('products', 'products.id', 'sale_items.product_id')
    .where('sales.pharmacy_branch_id', branch_id)
    .andWhere('sales.status', 'paid')
    .modify((qb) => {
      if(search) {
        qb.andWhere( builder => 
          builder.orWhereRaw(buildNormalizedSearch('products.product_name'), [`%${search}%`])
            .orWhereRaw(buildNormalizedSearch('products.generic_name'), [`%${search}%`])
            .orWhereRaw(buildNormalizedSearch('products.manufacturer'), [`%${search}%`])
        )
      }
      if (start_date && end_date) { 
        qb.andWhere('sale_items.created_at', '>=', start_date)
          .andWhere('sale_items.created_at', '<=', end_date)
      }
    })
    .select(
      'sale_items.product_id',
      'products.product_name',
      knex.raw('MAX(products.generic_name) as generic_name'),
      knex.raw(`MAX(products.barcode) as barcode`),
      knex.raw(`MAX(products.qrcode) as qrcode`),
      knex.raw(`MAX(products.image) as image`),
      knex.raw(`MAX(products.manufacturer) as manufacturer`),
      knex.raw(`MAX(products.description) as description`),
      knex.raw(`SUM(sale_items.quantity) as units_sold`)
    )
    .groupBy(
      'sale_items.product_id', 
      'products.product_name'
    )
    .orderBy('units_sold', 'desc')
    .limit(limit)
    .offset(offset);
    

  for (const product of res) {
    product.image = s3Service.getFileUrl(product.image);
  }

  return {products: res};
}
