import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("product_units", (table) => {
    table.increments("id").primary();
    table.string("unit").notNullable().unique();
    table.string("description");
    table.timestamps(true, true);
  });

  await knex('product_units').insert([
    { unit: 'capsules', description: 'Capsule' },
    { unit: 'tablets', description: 'Tablet' },

    { unit: 'ml', description: 'Milliliter' },
    { unit: 'oz', description: 'Ounce' },

    { unit: 'mg', description: 'Milligram' },
    { unit: 'grams', description: 'Gram' },
    { unit: 'kg', description: 'Kilogram' },

    { unit: 'bottles', description: 'Bottle' },
    { unit: 'strips', description: 'Strip' },
    { unit: 'vials', description: 'Vial' },
    { unit: 'teaspoons', description: 'Teaspoon' },
    { unit: 'tablespoons', description: 'Tablespoon' },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("product_units");
}


