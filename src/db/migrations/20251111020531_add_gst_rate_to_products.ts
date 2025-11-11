import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('products', table => {
    table.float('gst_rate').notNullable().defaultTo(0.0);
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('products', table => {
    table.dropColumn('gst_rate');
  })
}

