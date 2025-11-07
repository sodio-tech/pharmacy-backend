import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("purchase_orders", table => {
    table.increments("id");
    table.integer("supplier_id").notNullable().references("suppliers.id");
    table.integer("pharmacy_id").notNullable().references("pharmacies.id");
    table.integer("product_category_id").notNullable().references("product_categories.id");
    table.timestamp("purchase_date").defaultTo(knex.fn.now());
    table.integer("purchase_amount");
    table.timestamp("expected_delivery_date");
    table.timestamp("delivered_on");
    table.boolean("is_delivered").notNullable().defaultTo(false);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("purchase_orders");
}

