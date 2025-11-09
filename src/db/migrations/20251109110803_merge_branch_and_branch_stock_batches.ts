import type { Knex } from "knex";
import {up as upMigration} from "./20251107072720_branch_stock_batches.js";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('batches', (table) => {
    table.integer('pharmacy_branch_id').notNullable().references('id').inTable('pharmacy_branches');
    table.integer('available_stock').notNullable().defaultTo(0);
    table.integer('reserved_stock').notNullable().defaultTo(0);
    table.integer('quantity_received').notNullable();
    table.decimal('unit_cost').notNullable();
  })

  await knex.schema.dropTable('branch_stock_batches');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('batches', (table) => {
    table.dropColumn('pharmacy_branch_id');
    table.dropColumn('available_stock');
    table.dropColumn('reserved_stock');
    table.dropColumn('quantity_received');
    table.dropColumn('unit_cost');
  })

  await upMigration(knex);
}
