import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sales', table => {
    table.integer('id').primary();
    table.integer('customer_id').notNullable().references('id').inTable('customers');
    table.integer('pharmacy_branch_id').notNullable().references('id').inTable('pharmacy_branches');
    table.integer('cashier_id').notNullable().references('id').inTable('users');
    table.integer('total_amount').notNullable();
    table.integer('payment_mode_id').notNullable().references('id').inTable('payment_modes');
    table.timestamps(true, true);
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('sales');
}

