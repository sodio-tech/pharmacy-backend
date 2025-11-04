import knex from "../config/database.js";
import dotenv from 'dotenv'
dotenv.config();
import {Supplier} from "../middleware/schemas/types.js";

export const addSupplierService = async (newSupplier: Supplier) => {
  const supplier = await knex("suppliers").insert(newSupplier);
  return { supplier };
}

