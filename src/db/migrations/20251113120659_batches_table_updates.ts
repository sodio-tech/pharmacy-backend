import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('batches', (table) => {
    table.integer('order_id').nullable().alter();
    table.string('batch_number').nullable().alter();
    table.string('batch_name').nullable().alter();
    table.timestamp('expiry_date').nullable().alter();
    table.integer('quantity_received').nullable().alter();
  });

  await knex.schema.alterTable('branch_product_settings', (table) => {
    table.integer('min_stock').defaultTo(10).alter();
    table.integer('max_stock').nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('batches', (table) => {
    table.integer('order_id').notNullable().alter();
    table.string('batch_number').notNullable().alter();
    table.string('batch_name').notNullable().alter();
    table.timestamp('expiry_date').notNullable().alter();
    table.integer('quantity_received').notNullable().alter();
  });

  await knex.schema.alterTable('branch_product_settings', (table) => {
    table.integer('min_stock').defaultTo(0).alter();
    table.integer('max_stock').notNullable().alter();
  });
}

