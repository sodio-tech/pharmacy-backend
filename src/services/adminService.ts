import knex from "../config/database.js";
import {ContactRequest} from "../middleware/schemas/types.js";
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
