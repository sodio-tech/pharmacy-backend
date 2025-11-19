import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.integer('current_branch').references('id').inTable('pharmacy_branches')
      .onDelete('SET NULL').onUpdate('CASCADE');
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('current_branch');
  })
}
