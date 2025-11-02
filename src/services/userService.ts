import knex from "../config/database.js";
import dotenv from 'dotenv'
dotenv.config();
import { ROLES } from "../config/constants.js";

export const getProfileService = async (userData: {id: number, role: number}) => {
  const [user] = await knex("users")
    .leftJoin('pharmacies', 'users.id', 'pharmacies.super_admin')
    .where('users.id', userData.id)
    .select(
      'users.id',
      'users.fullname',
      'users.email',
      'users.role',
      'users.phone_number',
      'users.profile_image',
      'users.last_login',
      'users.two_factor_recovery_code',
      'pharmacies.id as pharmacy_id',
      'pharmacies.pharmacy_name',
      'pharmacies.subscription_status'
    )

    if (userData.role !== ROLES.SUPER_ADMIN) {
      delete user.pharmacy_id;
      delete user.pharmacy_name;
      delete user.subscription_status;
    }

  user.role = ROLES[user.role]
  user.two_fa_enabled = user.two_factor_recovery_code ? true : false;
  delete user.two_factor_recovery_code;

  return user || null;
};


