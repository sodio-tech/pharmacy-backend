import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("demo_requests", (table) => {
    table.string("country_code")
    table.string("country_name")
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("demo_requests", (table) => {
    table.dropColumn("country_code");
    table.dropColumn("country_name");
  });
}

