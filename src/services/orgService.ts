import knex from "../config/database.js";
import dotenv from 'dotenv'
dotenv.config();
import { ROLES } from "../config/constants.js";
import { NewBranch, Employee } from "../middleware/schemas/types.js";
import bcrypt from "bcryptjs"

export const addBranchService = async (admin, data: NewBranch) => {
  const pharmacy = await knex("pharmacies")
    .select("id")
    .where({ id: data.pharmacy_id, super_admin: admin.id })
    .first();

  if (!pharmacy) {
    return {error: 'Invalid pharmacy id or pharmacy is not owned by user'}
  }

  const [ result ] = await knex("pharmacy_branches")
    .insert({
      pharmacy_id: data.pharmacy_id,
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

export const getBranchesService = async (admin, pharmacy_id) => {
  const pharmacy = await knex("pharmacies")
    .select("id")
    .where({ id: pharmacy_id, super_admin: admin.id })
    .first();

  if (!pharmacy) {
    return {error: 'Invalid pharmacy id or pharmacy is not owned by user'}
  }

  const branches = await knex("pharmacy_branches")
    .leftJoin('pharmacies', 'pharmacy_branches.pharmacy_id', 'pharmacies.id')
    .select(
      "pharmacy_branches.id", 
      "pharmacy_branches.branch_name", 
      "pharmacy_branches.branch_location", 
      "pharmacy_branches.drug_license_number", 
    )
    .where('pharmacies.id', pharmacy_id)
    .andWhere('pharmacies.super_admin', admin.id)
    .orderBy("pharmacy_branches.created_at", "asc");

  return { branches };
}

export const addEmployeeService = async (admin, employee: Employee) => {
  const branch = await knex('pharmacy_branches')
    .leftJoin('pharmacies', 'pharmacy_branches.pharmacy_id', 'pharmacies.id')
    .where('pharmacies.super_admin', admin.id)
    .andWhere('pharmacy_branches.pharmacy_id', employee.pharmacy_id)
    .andWhere('pharmacy_branches.id', employee.branch_id)
    .first();

  if (!branch) {
    return { error: 'Invalid branch id or branch is not owned by user' }
  }

  const hashedPassword = await bcrypt.hash(employee.password, 10);
  const [ user ] = await knex('users')
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

  const [result] = await knex('pharmacy_branch_employees')
    .insert({
      employee_id: user.id,
      pharmacy_branch_id: employee.branch_id,
      pharmacy_id: employee.pharmacy_id,
    })
    .returning(['employee_id', 'pharmacy_branch_id', 'pharmacy_id']);

  result.role = ROLES[user.role];
  result.two_fa_enabled = user.two_factor_recovery_code ? true : false;
  result.pharmacy_id = employee.pharmacy_id;
  result.fullname = user.fullname;
  result.email = user.email;
  result.phone_number = user.phone_number;

  return result;
}
