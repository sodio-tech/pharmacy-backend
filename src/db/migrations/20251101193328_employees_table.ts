import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("pharmacy_branch_employees", (table) => {
    table.increments("id").primary();
    table.integer("employee_id").notNullable();
    table.foreign("employee_id").references("users.id");
    table.integer("pharmacy_branch_id").notNullable();
    table.foreign("pharmacy_branch_id").references("pharmacy_branches.id");
    table.timestamps(true, true);

    table.unique(["employee_id", "pharmacy_branch_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("pharmacy_branch_employees");
}

