import knex from "../config/database.js";
import {} from "../middleware/schemas/types.js";
// import {normaliseSearchText, buildNormalizedSearch} from "../utils/common_functions.js";

export const getSalesTrendService = async (user, params: any, branch_id: number) => {
  const { timeframe } = params;
  const baseQuery = knex('sales')
    .where('pharmacy_branch_id', branch_id)
    .andWhere('status', 'paid')

  const trends = {
    'daily': async () => {
      const res = await baseQuery
        .andWhereRaw(`date_trunc('week', created_at) = date_trunc('week', CURRENT_DATE - INTERVAL '1 week')`)
        .select(
          knex.raw(`EXTRACT(DOW FROM created_at) as day_of_week`),
          knex.raw(`COUNT(*)::integer as total_sales`),
          knex.raw(`SUM(total_amount)::float as total_amount`),
        )
        .groupByRaw(`EXTRACT(DOW FROM created_at)`)
        .orderBy('day_of_week', 'asc')

      const data = Object.fromEntries(
        Array.from(Array(7).keys()).map(i => [i + 1, {total_sales: 0, total_amount: 0}])
      )
      for (const row of res) {
        data[row.day_of_week]!.total_sales = row.total_sales;
        data[row.day_of_week]!.total_amount = row.total_amount;
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
