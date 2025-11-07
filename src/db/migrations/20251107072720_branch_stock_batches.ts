import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('branch_stock_batches', (table) => {
    table.increments('id').primary();
    table.integer('pharmacy_branch_id').notNullable().references('id').inTable('pharmacy_branches');
    table.integer('batch_id').notNullable().references('id').inTable('batches');
    table.integer('available_stock').notNullable().defaultTo(0);
    table.integer('reserved_stock').notNullable().defaultTo(0);
    table.integer('quantity_received').notNullable();
    table.integer('min_stock').notNullable();
    table.integer('max_stock').notNullable();
    table.decimal('unit_price').notNullable();
    table.timestamps(true, true);

    table.unique(['pharmacy_branch_id', 'batch_id']);
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('branch_stock_batches');
}


