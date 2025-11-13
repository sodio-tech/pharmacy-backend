import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("products", (table) => {
    table.integer('unit').nullable().alter();
    table.integer('product_category_id').nullable().alter();
    table.string('manufacturer').nullable().alter();
    table.decimal('unit_price').nullable().alter();
    table.decimal('selling_price').nullable().alter();
    table.integer('min_stock').nullable().alter();
    table.integer('max_stock').nullable().alter();
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("products", (table) => {
    table.integer('unit').notNullable().alter();
    table.integer('product_category_id').notNullable().alter();
    table.string('manufacturer').notNullable().alter();
    table.decimal('unit_price').notNullable().alter();
    table.decimal('selling_price').notNullable().alter();
    table.integer('min_stock').notNullable().alter();
    table.integer('max_stock').notNullable().alter();
  })
}

