import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('pharmacies', (table) => {
    table.increments("id").primary();
    table.string("pharmacy_name");
    table.integer("super_admin").notNullable().unique();
    table.foreign("super_admin").references("users.id");
    table.enum("subscription_status", ["active", "suspended", "cancelled", "trial"]).notNullable().defaultTo("trial");
    table.timestamps(true, true);

    table.index('subscription_status');
    table.index('super_admin');
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("pharmacies");
}

