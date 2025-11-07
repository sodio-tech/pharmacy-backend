import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('batches', (table) => {
    table.increments('id').primary();
    table.string('batch_number').notNullable();
    table.string('batch_name').notNullable();
    table.integer('order_id').notNullable().references('id').inTable('purchase_orders');
    table.integer('product_id').notNullable().references('id').inTable('products');
    table.timestamp('expiry_date').nullable();
    table.string('manufacturer_name');
    table.string('manufacturer_code');
    table.string('notes');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('batches');
}

