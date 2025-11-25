import knex from "../config/database.js";
import {ContactRequest, DemoRequest} from "../middleware/schemas/types.js";
import {buildNormalizedSearch, normaliseSearchText} from "../utils/common_functions.js";

export const recordContactRequest = async (data: ContactRequest) => {
  const [res] = await knex("contact_requests").insert(data).returning("*");
  return res;
}

export const getContactRequests = async (params) => {
  let {page, limit, search} = params;
  search = normaliseSearchText(search);
  const contact_requests = knex("contact_requests")
    .modify((qb) => {
      if(search) {
        qb.andWhereRaw(buildNormalizedSearch('contact_requests.name'), [`%${search}%`])
          .orWhereRaw(buildNormalizedSearch('contact_requests.phone_number'), [`%${search}%`])
          .orWhereRaw(buildNormalizedSearch('contact_requests.email'), [`%${search}%`])
      }
    })
    .orderBy("created_at", "desc");

  const {total = 0}: any = await contact_requests.clone().clearOrder().count('id as total').first();

  const requests = await contact_requests
    .limit(limit)
    .offset(limit * (page - 1));

  return {
    contact_requests: requests,
    page, 
    limit, 
    total_pages: Math.ceil(total / limit),
    total
  }
}

export const bookDemoService = async (data: DemoRequest) => {
  const [res] = await knex("demo_requests").insert(data).returning("*");
  return res;
}

export const demoRequestListService = async (params) => {
  let {page, limit, search, start_date, end_date} = params;
  const offset = (page - 1) * limit;
  if (search) search = normaliseSearchText(search);
  if (start_date && end_date) {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    start_date.setHours(0, 0, 0, 0);
    end_date.setHours(23, 59, 59, 999);
  }

  const _requests = knex("demo_requests")
    .modify((qb) => {
      if(search) {
        qb.andWhereRaw(buildNormalizedSearch('demo_requests.name'), [`%${search}%`])
          .orWhereRaw(buildNormalizedSearch('demo_requests.phone_number'), [`%${search}%`])
      }
      if (start_date && end_date) { 
        qb.andWhere('demo_requests.created_at', '>=', start_date)
          .andWhere('demo_requests.created_at', '<=', end_date)
      }
    })
    .orderBy("created_at", "desc")

  const {total = 0}: any = await _requests.clone().clearOrder().count('id as total').first();

  const requests = await _requests
    .limit(limit)
    .offset(offset);

  return {
    page, 
    limit, 
    total_pages: Math.ceil(total / limit),
    total: Number(total ?? 0),
    requests
  }
}
