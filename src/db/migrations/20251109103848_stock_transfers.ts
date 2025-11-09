import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('stock_transfers', (table) => {
    table.integer('id').primary();
    table.integer('from_branch_id').notNullable().references('id').inTable('pharmacy_branches');
    table.integer('to_branch_id').notNullable().references('id').inTable('pharmacy_branches');
    table.integer('source_batch_id').notNullable().references('id').inTable('batches');
    table.integer('destination_batch_id').references('id').inTable('batches');
    table.integer('product_id').notNullable().references('id').inTable('products');
    table.integer('quantity_transferred').notNullable();
    table.timestamp('transfer_date').notNullable();
    table.integer('initiated_by_user_id').notNullable().references('id').inTable('users');
    table.integer('received_by_user_id').references('id').inTable('users');
    table.enum('status', ['pending', 'completed', 'in_transit', 'cancelled']).notNullable().defaultTo('pending');
    table.string('notes');
    table.string('reason');
    table.timestamps(true, true);

    table.index(['from_branch_id', 'transfer_date']);
    table.index(['to_branch_id', 'transfer_date']);
    table.index(['source_batch_id']);
    table.index(['destination_batch_id']);
    table.index(['product_id']);
    table.check(
      "source_batch_id != destination_batch_id",
      [],
      'source_batch_id_should_not_be_destination_batch_id'
    );

  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('stock_transfers');
}

