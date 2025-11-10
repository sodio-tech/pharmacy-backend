import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sale_items', table => {
    table.increments('id').primary();
    table.integer('sale_id').notNullable().references('id').inTable('sales');
    table.integer('product_id').notNullable().references('id').inTable('products');
    table.integer('quantity').notNullable();
    table.integer('price').notNullable();
    table.timestamps(true, true);
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('sale_items');
}

