import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("product_categories", (table) => {
    table.increments("id").primary();
    table.string("category_name").notNullable().unique();
    table.timestamps(true, true);
  });
  
  await knex("product_categories").insert([
    { category_name: "Pharmaceuticals" },
    { category_name: "Medical_Devices" },
    { category_name: "Supplements" },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("product_categories");
}

