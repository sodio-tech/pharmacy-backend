import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('prescriptions', table => {
    table.increments('id').primary();
    table.integer('sale_id').notNullable().references('id').inTable('sales');
    table.integer('customer_id').references('id').inTable('customers');
    table.string('prescription_link').notNullable();
    table.string('doctor_name');
    table.string('doctor_contact');
    table.string('notes');
    table.timestamps(true, true);
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('prescriptions');
}

