import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('product_images', table => {
    table.increments('id').primary();
    table.integer('product_id').notNullable().references('id').inTable('products');
    table.text('image').notNullable();
    table.timestamps(true, true);
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('product_images');
}

