import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('customers', table => {
    table.increments('id').primary();
    table.string('name');
    table.string('phone_number');
    table.string('email');
    table.integer('age').unsigned();
    table.enum('gender', ['male', 'female', 'other']);
    table.timestamps(true, true);
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('customers');
}

