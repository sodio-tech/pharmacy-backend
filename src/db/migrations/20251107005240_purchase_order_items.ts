import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("purchase_order_items", (table) => {
    table.increments("id").primary();
    table.integer("order_id").notNullable().references("id").inTable("purchase_orders");
    table.integer("product_id").notNullable().references("id").inTable("products");
    table.decimal("quantity").notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.alterTable("purchase_orders", (table) => {
    table.integer("pharmacy_branch_id").notNullable().references("id").inTable("pharmacy_branches");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("purchase_order_items");
  await knex.schema.alterTable("purchase_orders", (table) => {
    table.dropColumn("pharmacy_branch_id");
  });
}

