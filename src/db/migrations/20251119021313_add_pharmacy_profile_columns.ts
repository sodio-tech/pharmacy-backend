import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('pharmacies', (table) => {
    table.string('address');
    table.string('phone_number');
    table.string('gstin');
    table.string('pan');
    table.string('email');
    table.string('license_number');
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('pharmacies', (table) => {
    table.dropColumn('address');
    table.dropColumn('contact');
    table.dropColumn('gstin');
    table.dropColumn('pan');
    table.dropColumn('email');
    table.dropColumn('license_number');
  })
}

