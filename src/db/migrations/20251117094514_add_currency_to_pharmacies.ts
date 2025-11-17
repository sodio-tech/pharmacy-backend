import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('currencies', (table) => {
    table.string('code').unique().primary();
    table.string('symbol');
  });

  await knex.schema.alterTable('pharmacies', (table) => {
    table.string('currency_code').references('currencies.code').onDelete('SET NULL').onUpdate('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('pharmacies', (table) => {
    table.dropColumn('currency_code');
  });
  await knex.schema.dropTable('currencies');
}

