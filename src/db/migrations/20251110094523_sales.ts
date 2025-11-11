import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sales', table => {
    table.increments('id').primary();
    table.integer('customer_id').references('id').inTable('customers');
    table.integer('pharmacy_branch_id').notNullable().references('id').inTable('pharmacy_branches');
    table.integer('cashier_id').notNullable().references('id').inTable('users');
    table.integer('total_amount').notNullable();
    table.integer('payment_mode_id').notNullable().references('id').inTable('payment_modes');
    table.enum('status', ['paid', 'draft']).notNullable();
    table.timestamps(true, true);

    table.index('customer_id');
    table.index('pharmacy_branch_id');
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('sales');
}

