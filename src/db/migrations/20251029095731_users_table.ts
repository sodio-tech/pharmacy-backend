import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("fullname");
    table.string("email").unique().notNullable();
    table.string("password");
    table.boolean("email_verified").notNullable().defaultTo(false);
    table.string("verification_token");
    table.integer("role").unsigned().notNullable();
    table.foreign("role").references("id").inTable("roles");
    table.string("profile_image");
    table.string("phone_number");
    table.string("two_factor_secret");
    table.string("two_factor_recovery_code");
    table.timestamp("last_login");
    table.timestamps(true, true);

    table.index(["email"]);
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("users");
}

