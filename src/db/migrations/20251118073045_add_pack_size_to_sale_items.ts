import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sale_items', (table) => {
    table.integer('pack_size').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sale_items', (table) => {
    table.dropColumn('pack_size');
  });
}

