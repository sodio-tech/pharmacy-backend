import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("purchase_orders", table => {
    table.dropColumn("product_category_id");
  });

  await knex.schema.createTable("order_product_categories", table => {
    table.increments("id").primary();
    table.integer("order_id").notNullable().references("id").inTable("purchase_orders");
    table.integer("product_category_id").notNullable().references("id").inTable("product_categories");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("order_product_categories");
  await knex.schema.alterTable("purchase_orders", table => {
    table.integer("product_category_id").notNullable().references("id").inTable("product_categories");
  });
}

