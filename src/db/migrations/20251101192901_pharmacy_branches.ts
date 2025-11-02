import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("pharmacy_branches", (table) => {
    table.increments("id").primary();
    table.integer("pharmacy_id").notNullable();
    table.foreign("pharmacy_id").references("pharmacies.id");
    table.integer("super_admin").notNullable().unique();
    table.foreign("super_admin").references("users.id");
    table.string("branch_name");
    table.string("branch_location");
    table.string("drug_license_number");
    table.timestamps(true, true);

    table.index('pharmacy_id');
    table.index('super_admin');
    table.foreign(["pharmacy_id", "super_admin"]).references(["pharmacies.id", "pharmacies.super_admin"]);
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("pharmacy_branches");
}

