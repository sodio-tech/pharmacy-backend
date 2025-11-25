import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('contact_requests', (table) => {
    table.increments('id').primary();
    table.string('name');
    table.string('email');
    table.string('phone_number');
    table.string('message');
    table.string('subject')
    table.timestamps(true, true);
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('contact_requests');
}

