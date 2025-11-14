// import knex from "../config/database.js";
// import dotenv from 'dotenv'
// dotenv.config();

export const normaliseSearchText = (search_text: string) => {
  return search_text?.toLowerCase().replace(/[^\w]/g, "")
};

export const buildNormalizedSearch = (column: string) => {
  return `LOWER(REGEXP_REPLACE(${column}, '[^a-zA-Z0-9_]', '', 'g')) LIKE ?`
};

export const percentChange = (current: number, prev: number) => {
  if (prev === 0) return current === 0 ? 0 : 100;
  return ((current - prev) / prev) * 100;
};

