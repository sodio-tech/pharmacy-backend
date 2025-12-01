import knex from "../config/database.js";
import {ContactRequest, DemoRequest, UserLogin} from "../middleware/schemas/types.js";
import {buildNormalizedSearch, normaliseSearchText} from "../utils/common_functions.js";
import { ROLES } from "../config/constants.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import * as s3Service from "./s3Service.js";


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

export const signinAdminService = async (loginData: UserLogin) => {
  try { 
    const { email, password } = loginData;

    const result: any = {};
    const user = await knex("users")
      .where({ email })
      .first();
    
    if (!user) {
      return { email_not_found: true};
    }
    if (user.role !== ROLES.PHARMY_ADMIN) {
      return { not_admin: true};
    }

    result.id = user.id;
    result.email = user.email;
    result.two_fa_enabled = user.two_factor_recovery_code ? true : false;
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {password_mismatch: true};
    } 

    result.role= ROLES[user.role];
    if (!result.two_fa_enabled) {
      // Create JWT token with user data
      const access_token = jwt.sign(
        { 
          id: user.id, email: user.email, verified: user.email_verified, 
          two_fa_enabled: result.two_fa_enabled, role: user.role, 
        },
        process.env.JWT_ACCESS_SECRET_KEY!,
        { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES }  as any
      );

      const refresh_token = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET_KEY!,
        { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES } as any
      );

      result.access_token = access_token;
      result.refresh_token = refresh_token
    }

    await knex('users')
      .where({ id: user.id })
      .update({ last_login: new Date() });

    return result;
  } catch (error) {
    console.error("Error logging in user:", error);
    throw new Error("User login failed.");
  }

};

export const getUsersService = async (params) => {
  let {page, limit, search, sort = 'desc', sort_by} = params;
  search = normaliseSearchText(search);
  if (!['asc', 'desc'].includes(sort)) {
    sort = 'desc';
  }
  if (!['fullname', 'email', 'created_at', 'pharmacy_name'].includes(sort_by)) {
    sort_by = 'created_at';
  }
  if (sort_by === 'pharmacy_name') {
    sort_by = 'pharmacies.pharmacy_name';
  }
  else {
    sort_by = `users.${sort_by}`;
  }

  const users = knex("users")
    .leftJoin('pharmacies', 'pharmacies.super_admin', 'users.id')
    .where('users.role', ROLES.SUPER_ADMIN)
    .modify((qb) => {
      if(search) {
        qb.andWhereRaw(buildNormalizedSearch('users.fullname'), [`%${search}%`])
          .orWhereRaw(buildNormalizedSearch('users.email'), [`%${search}%`])
          .orWhereRaw(buildNormalizedSearch('pharmacies.pharmacy_name'), [`%${search}%`])
      }
    })
    .select(
      'users.id',
      'pharmacies.id as pharmacy_id',
      'pharmacies.pharmacy_name',
      'users.fullname',
      'users.email',
      'users.role',
      'users.two_factor_recovery_code',
      'users.email_verified',
      'users.phone_number',
      'users.profile_image',
    )
    .groupBy('users.id', 'pharmacies.id')
    .orderByRaw(`${sort_by} ${sort} nulls last`)
    .orderBy("users.created_at", "desc")

  const {total = 0}: any = await users.clone()
    .clearSelect()
    .clearOrder()
    .clearGroup() 
    .countDistinct('users.id as total') 
    .first();

  const usersList = await users
    .limit(limit)
    .offset(limit * (page - 1));

  usersList.forEach((user) => {
    user.profile_image = user.profile_image ? s3Service.getFileUrl(user.profile_image) : null;
    user.two_fa_enabled = user.two_factor_recovery_code ? true : false;
    delete user.two_factor_recovery_code
  })

  return {
    page, 
    limit, 
    total_pages: Math.ceil(total / limit),
    total: Number(total ?? 0),
    users_list: usersList
  }
}
