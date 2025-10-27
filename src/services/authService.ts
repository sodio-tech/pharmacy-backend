import knex from "../config/database.js";

export const addFunc = async (a, b) => {
  let ss = "as";

  const [result] = await knex("roles")
  console.log(result);
  return a + b;
}
