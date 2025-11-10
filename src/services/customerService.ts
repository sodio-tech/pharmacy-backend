import knex from "../config/database.js";
import {Customer} from "../middleware/schemas/types.js";
import {buildNormalizedSearch, normaliseSearchText} from "../utils/common_functions.js";

export const createNewCustomerService = async (data: Customer) => {
  return await knex("customers").insert(data).returning("*");
}

export const getCustomersService = async (params: Customer & {page?: number, limit?: number}) => {
  let {page = 1, limit = 10, name, phone_number, age, gender } = params;
  const offset = (page - 1) * limit;
  if (name) {
    name = normaliseSearchText(name);
  }
  if (phone_number) {
    phone_number = normaliseSearchText(phone_number);
  }

  const query = knex("customers")
    .modify((qb) => {
      if(params.name) {
        qb.andWhereRaw(buildNormalizedSearch('customers.name'), [`%${name}%`])
      }
      if(params.phone_number) {
        qb.andWhereRaw(buildNormalizedSearch('customers.phone_number'), [`%${phone_number}%`])
      }
      if(params.age) {
        qb.andWhere('customers.age', age)
      }
      if(params.gender) {
        qb.andWhere('customers.gender', gender)
      }
    })

  const { total = 0}: any = await query.clone().count('id as total').first();

  const customers = await query 
    .limit(limit)
    .offset(offset);

  customers.forEach((customer) => {
    delete customer.created_at;
    delete customer.updated_at;
  });

  return { 
    customers: customers,
    total: Number(total),
    page,
    limit,
    total_pages: Math.ceil(total / limit)
  };
}

export const getCustomerDetailsService = async (customer_id: string) => {
  const customer = await knex("customers")
    .where("id", customer_id)
    .first();

  if (!customer) {
    return {error: "Customer not found"};
  }

  delete customer.created_at;
  delete customer.updated_at;   

  return customer;
}

