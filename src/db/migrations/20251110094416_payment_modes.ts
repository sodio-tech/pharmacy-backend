import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('payment_modes', table => {
    table.integer('id').primary().unique();
    table.string('name').notNullable().unique();
    table.string('description');
    table.timestamps(true, true);
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('payment_modes');
}
