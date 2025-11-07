import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("suppliers", (table) => {
    table.increments("id").primary();
    table.string("name");
    table.string("address");
    table.string("phone_number");
    table.string("email");
    table.string("gstin");
    table.string("license_number");
    table.integer("pharmacy_id").notNullable().references("pharmacies.id");
    table.boolean('is_active').defaultTo(true).notNullable();
    table.timestamps(true, true);

    table.unique(['email', 'pharmacy_id']);
  });

}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("suppliers");
}

