import type { Knex } from "knex";
import { PermissionMap } from "../../config/constants.js";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("permissions", (table) => {
    table.increments("id").primary();
    table.string("permission").notNullable().unique();
    table.timestamps(true, true);
  });

  const allPermissions: string[] = Object.values(PermissionMap)
    .flatMap((category) => Object.values(category));

  await knex("permissions").insert(
    allPermissions.map((perm) => ({ permission: perm }))
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("permissions");
}

