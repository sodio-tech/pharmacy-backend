import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("purchase_orders", table => {
    table.dropColumn("is_delivered");
    table.dropColumn("delivered_on");
    table.enum("status", ["pending", "fulfilled", "cancelled"]).defaultTo("pending");
    table.timestamp("fulfilled_on");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("purchase_orders", table => {
    table.boolean("is_delivered").notNullable().defaultTo(false);
    table.timestamp("delivered_on");

    table.dropColumn("status");
    table.dropColumn("fulfilled_on");
  });
}
