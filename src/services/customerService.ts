import knex from "../config/database.js";
import {Customer, CustomerDetails} from "../middleware/schemas/types.js";
import {buildNormalizedSearch, normaliseSearchText} from "../utils/common_functions.js";
import {getFileUrl} from './s3Service.js'

export const createNewCustomerService = async (data: Customer & {pharmacy_id: number}, user) => {
  data.pharmacy_id = user.pharmacy_id;
  const res = await knex("customers").insert(data).returning("*")
  return res[0] || null;
}

export const getCustomersService = async (params: Customer & {page?: number, limit?: number}, user) => {
  let {page = 1, limit = 10, name, phone_number, age, gender } = params;
  const offset = (page - 1) * limit;
  if (name) {
    name = normaliseSearchText(name);
  }
  if (phone_number) {
    phone_number = normaliseSearchText(phone_number);
  }

  const query = knex("customers")
    .where('pharmacy_id', user.pharmacy_id)
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

export const getCustomerDetailsService = async (customer_id: string, user) => {
  const customer = await knex("customers")
    .where("id", customer_id)
    .andWhere('pharmacy_id', user.pharmacy_id)
    .first();

  if (!customer) {
    return {error: "Customer not found"};
  }

  delete customer.created_at;
  delete customer.updated_at;   

  return customer;
}

export const getPrescriptionsService = async (params, user) => {
  let {page, limit, search, start_date, end_date} = params;
  if (start_date == end_date) {
    start_date.setHours(0, 0, 0, 0);
    end_date.setHours(23, 59, 59, 999);
  }
  const offset = limit * (page - 1);
  if (search) search = normaliseSearchText(search);
  
  const _prescriptions = knex("prescriptions")
    .leftJoin("customers", "customers.id", "prescriptions.customer_id")
    .where('customers.pharmacy_id', user.pharmacy_id)
    .modify((qb) => {
      if(search) {
        qb.andWhere( builder => 
          builder.orWhereRaw(buildNormalizedSearch('customers.name'), [`%${search}%`])
            .orWhereRaw(buildNormalizedSearch('prescriptions.doctor_name'), [`%${search}%`])
        )
      } 
      if (start_date && end_date) { 
        qb.andWhere('prescriptions.created_at', '>=', start_date)
          .andWhere('prescriptions.created_at', '<=', end_date)
      }
    })
    .select(
      "prescriptions.id as prescription_id",
      "customers.id as customer_id",
      "customers.name as customer_name",
      "prescriptions.doctor_name",
      "prescriptions.prescription_link",
      "prescriptions.notes as prescription_notes",
      "prescriptions.created_at"
    )
    .orderBy("prescriptions.created_at", "desc")

  const {total = 0}: any = await _prescriptions.clone().clearSelect().clearOrder()
    .count('prescriptions.id as total')
    .first();

  const prescriptions = await _prescriptions
    .limit(limit)
    .offset(offset);

  prescriptions.forEach((prescription) => {
    prescription.prescription_link = getFileUrl(prescription.prescription_link);
  });

  return { 
    prescriptions,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit)
  };
}

export const updateCustomerService = async (user, customer_id: number, data: CustomerDetails) => {
  const updates = {
    ...data.age && {age: data.age},
    ...data.gender && {gender: data.gender},
    ...data.name && {name: data.name},
    ...data.phone_number && {phone_number: data.phone_number},
    ...data.email && {email: data.email},
  };

  const [res] = await knex("customers")
    .where("id", customer_id)
    .andWhere('pharmacy_id', user.pharmacy_id)
    .update(updates)
    .returning("*");

  return res;
}
