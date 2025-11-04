import knex from "../config/database.js";
import dotenv from 'dotenv'
dotenv.config();
import {} from "../middleware/schemas/types.js";

export const getCategoriesService = async () => {
  const categories = await knex("product_categories")
    .select("id", "category_name")
    .orderBy("category_name", "asc");

  return { categories };
}
