import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("global_products", (table) => {
    table.increments("id").primary();
    table.text("name");
    table.boolean("is_active").defaultTo(true);
    table.timestamps(true, true);

    table.index("name");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("global_products");
}

