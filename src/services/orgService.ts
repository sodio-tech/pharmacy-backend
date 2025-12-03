import knex from "../config/database.js";
import dotenv from 'dotenv'
dotenv.config();
import { ROLES } from "../config/constants.js";
import { NewBranch, Employee, OrgProfile, BranchUpdates} from "../middleware/schemas/types.js";
import bcrypt from "bcryptjs"
import {buildNormalizedSearch, normaliseSearchText} from "../utils/common_functions.js";
import * as s3Service from "./s3Service.js";

export const addBranchService = async (admin, data: NewBranch) => {
  const [ result ] = await knex("pharmacy_branches")
    .insert({
      pharmacy_id: admin.pharmacy_id,
      branch_name: data.branch_name,
      branch_location: data.branch_location,
      drug_license_number: data.drug_license_number,
    })
    .returning(['id as branch_id', 'pharmacy_id', 'branch_name', 'branch_location', 'drug_license_number']);

  if (!result) {
    throw new Error("Failed to add Branch")
  }

  return result;
}

export const deleteBranchService = async (admin, branch_id: number) => {
  const result = await knex("pharmacy_branches")
    .where({ id: branch_id})
    .whereExists(function() {
      this.select(knex.raw('1'))
        .from('pharmacies')
        .whereRaw('pharmacies.id = pharmacy_branches.pharmacy_id')
        .andWhereRaw('pharmacies.super_admin = ?', admin.id)
    })
    .del();

  if (!result || result === 0) {
    throw new Error("Branch doesn't belong to user or invalid branch id")
  }

  return true;
}

export const getBranchesService = async (user) => {
  const branches = await knex("pharmacy_branches")
    .leftJoin('pharmacies', 'pharmacy_branches.pharmacy_id', 'pharmacies.id')
    .select(
      "pharmacy_branches.id", 
      "pharmacy_branches.branch_name", 
      "pharmacy_branches.branch_location", 
      "pharmacy_branches.drug_license_number", 
    )
    .where('pharmacies.id', user.pharmacy_id)
    .orderBy("pharmacy_branches.created_at", "asc");

  return { branches };
}

export const addEmployeeService = async (admin, employee: Employee) => {
  const hashedPassword = await bcrypt.hash(employee.password, 10);
  const {user, result} = await knex.transaction(async (trx) => {
    const [ user ] = await trx('users')
      .insert({
        fullname: employee.first_name + " " + employee.last_name,
        email: employee.email,
        password: hashedPassword,
        phone_number: employee.phone_number,
        role: ROLES[employee.role],
        email_verified: true,
      })
      .returning('*');

    if (!user) {
      throw new Error("User creation failed")
    }

    let insertion: any = {
      employee_id: user.id,
      pharmacy_id: admin.pharmacy_id,
    }
    if (user.role === ROLES.PHARMACIST) {
      insertion.pharmacy_branch_id = employee.branch_id;
    }
    const [result] = await trx('pharmacy_branch_employees')
      .insert(insertion)
      .returning(['employee_id', 'pharmacy_branch_id', 'pharmacy_id']);

    return { user, result };
  });

  result.role = ROLES[user.role];
  result.two_fa_enabled = user.two_factor_recovery_code ? true : false;
  result.pharmacy_id = admin.pharmacy_id;
  result.fullname = user.fullname;
  result.email = user.email;
  result.phone_number = user.phone_number;

  return result;
}

export const userManagementDetailsService = async (admin) => {
  const result = await knex("pharmacies")
    .leftJoin('pharmacy_branches', 'pharmacies.id', 'pharmacy_branches.pharmacy_id')
    .leftJoin('pharmacy_branch_employees', 'pharmacy_branches.pharmacy_id', 'pharmacy_branch_employees.pharmacy_id')
    .leftJoin('users', 'users.id', 'pharmacy_branch_employees.employee_id')
    .where('pharmacies.id', admin.pharmacy_id)
    .select(
      knex.raw(`COUNT(DISTINCT pharmacy_branch_employees.id)::integer as total_users`),
      knex.raw(`COUNT(DISTINCT pharmacy_branches.id)::integer as branch_count`),
      knex.raw(`
        COUNT(DISTINCT pharmacy_branch_employees.id) 
        FILTER (WHERE date_trunc('month', users.created_at) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month'))
        as previous_month_users
      `),
      knex.raw(`
        COUNT(DISTINCT pharmacy_branch_employees.id)
        FILTER (WHERE date_trunc('month', users.created_at) = date_trunc('month', CURRENT_DATE))
        as current_month_users
      `),
      knex.raw(`
        COUNT(DISTINCT users.id)
        FILTER (WHERE users.role = ?)::integer
        as admin_count
      `, [ROLES.ADMIN]),
      knex.raw(`
        COUNT(DISTINCT users.id)
        FILTER (WHERE users.role = ?)::integer
        as pharmacist_count
      `, [ROLES.PHARMACIST]),
    )
    .first();

  const stats = {
    total_users: result.total_users,
    branch_count: result.branch_count,
    admin_count: result.admin_count,
    pharmacist_count: result.pharmacist_count,
    active_users: result.total_users,
    newusers: result.current_month_users - result.previous_month_users,
  }
  return stats
}

export const managementToolsService = async (admin, params) => {
  let {role, search} = params;
  search = normaliseSearchText(search);
  const result = await knex("pharmacy_branch_employees")
  .leftJoin("users", "users.id", "pharmacy_branch_employees.employee_id")
  .leftJoin("pharmacy_branches", "pharmacy_branches.id", "pharmacy_branch_employees.pharmacy_branch_id")
  .where("pharmacy_branch_employees.pharmacy_id", admin.pharmacy_id)
  .modify((qb) => {
    if(search) {
      qb.andWhere( builder => 
        builder.orWhereRaw(buildNormalizedSearch('users.fullname'), [`%${search}%`])
          .orWhereRaw(buildNormalizedSearch('users.phone_number'), [`%${search}%`])
          .orWhereRaw(buildNormalizedSearch('users.email'), [`%${search}%`])
      )
    }
    if(role) {
      qb.andWhere("users.role", ROLES[role])
    }
  })
  .select(
    'pharmacy_branch_employees.employee_id',
    'pharmacy_branch_employees.pharmacy_branch_id',
    'pharmacy_branches.branch_name',
    'users.email',
    'users.fullname',
    'users.phone_number',
    'users.role',
    'users.profile_image',
    'users.last_login',
    knex.raw(`date_trunc('month', users.last_login) >= date_trunc('month', CURRENT_DATE - INTERVAL '5 month') as active`)
  )

  for (const employee of result) {
    employee.profile_image = employee.profile_image && s3Service.getFileUrl(employee.profile_image);
    employee.role = ROLES[employee.role];
  }

  return {employees: result };
}

export const getSupportedCurrenciesService = async () => {
  const currencies = await knex("currencies")
    .select("code")
    .orderBy("code", "asc");

  return { currencies };
}

export const updatePharmacyProfile = async (user, data: OrgProfile) => {
  const [res] =  await knex("pharmacies")
    .where("id", user.pharmacy_id)
    .update(data)
    .returning("*");

  return res;
}

export const getOrgProfileService = async (user) => {
  const result = await knex("pharmacies")
    .where("id", user.pharmacy_id)

  return result[0];
}

export const updateBranchService = async (admin, data: BranchUpdates, branch_id: number) => {
  const [res] =  await knex("pharmacy_branches")
    .where("id", branch_id)
    .andWhere("pharmacy_id", admin.pharmacy_id)
    .update(data)
    .returning("*");

  if (!res) {
    throw new Error("Failed to update Branch")
  }

  delete res.created_at;
  delete res.updated_at;
  return res;
}

export const getBranchDetailsService = async (user, branch_id: number) => {
  const [res] = await knex("pharmacy_branches")
    .where("id", branch_id)
    .andWhere("pharmacy_id", user.pharmacy_id)

  if (!res) {
    throw new Error("Failed to fetch Branch details")
  }

  delete res.created_at;
  delete res.updated_at;
  return res;
}

export const getComplianceReportService = async (user) => {
  const [ licenses ] = await knex("pharmacy_branches")
    .where("id", user.pharmacy_branch_id)
    .select(
      'drug_license_number',
      'trade_license_number',
      'fire_certificate_number',
      'drug_license_expiry',
      'trade_license_expiry',
      'fire_certificate_expiry',
    )

  return {licenses};
}
