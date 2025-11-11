import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('customers', table => {
    table.integer('pharmacy_id').references('id').inTable('pharmacies');
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('customers', table => {
    table.dropColumn('pharmacy_id');
  })
}

