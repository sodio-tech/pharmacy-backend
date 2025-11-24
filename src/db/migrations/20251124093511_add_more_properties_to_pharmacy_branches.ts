import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('pharmacy_branches', (table) => {
    table.timestamp('drug_license_expiry');
    table.string('trade_license_number');
    table.timestamp('trade_license_expiry');
    table.string('fire_certificate_number');
    table.timestamp('fire_certificate_expiry');
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('pharmacy_branches', (table) => {
    table.dropColumn('drug_license_expiry');
    table.dropColumn('trade_license_number');
    table.dropColumn('trade_license_expiry');
    table.dropColumn('fire_certificate_number');
    table.dropColumn('fire_certificate_expiry');
  })
}

