import knex from "../config/database.js";
import dotenv from 'dotenv'
dotenv.config();
import { ROLES } from "../config/constants.js";

export const getProfileService = async (userId: string) => {
  const user = await knex("users")
    .where({id: userId})
    .first();

  const res = [
    'password', 
    'created_at', 'updated_at', 
    'two_factor_secret', 'two_factor_recovery_code'
  ].forEach(key => {
    delete user[key]
  })

  user.role = ROLES[user.role]
  user.two_fa_enabled = user.two_factor_recovery_code ? true : false;
  delete user.verification_token;

  return user || null;
};


