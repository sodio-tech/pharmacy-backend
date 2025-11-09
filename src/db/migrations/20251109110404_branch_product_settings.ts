import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('branch_product_settings', (table) => {
    table.increments('id').primary();
    table.integer('pharmacy_branch_id').notNullable().references('id').inTable('pharmacy_branches');
    table.integer('product_id').notNullable().references('id').inTable('products');
    table.integer('min_stock').notNullable();
    table.integer('max_stock').notNullable();
    table.timestamps(true, true);

    table.unique(['pharmacy_branch_id', 'product_id']);
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('branch_product_settings');
}

