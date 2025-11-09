import knex from "../config/database.js";
import dotenv from 'dotenv'
dotenv.config();
import { ROLES } from "../config/constants.js";
import { NewBranch, Employee } from "../middleware/schemas/types.js";
import bcrypt from "bcryptjs"

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
