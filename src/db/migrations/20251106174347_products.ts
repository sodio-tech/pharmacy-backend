import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("products", (table) => {
    table.increments("id").primary();
    table.string("product_name").notNullable();
    table.integer("pharmacy_id").notNullable().references("id").inTable("pharmacies");
    table.integer("unit").notNullable().references("id").inTable("product_units");
    table.integer("product_category_id").notNullable().references("id").inTable("product_categories");
    table.string("generic_name");
    table.string("sku");
    table.string("brand_name");
    table.string("description");
    table.integer("pack_size");
    table.string("barcode").unique();
    table.string("qrcode").unique();
    table.string("image");
    table.boolean("requires_prescription").notNullable().defaultTo(false);
    table.string("manufacturer").notNullable();
    table.decimal("unit_price").notNullable();
    table.decimal("selling_price").notNullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.integer('min_stock').notNullable();
    table.integer('max_stock').notNullable();
    table.timestamps(true, true);

    table.index("product_category_id");
    table.index("unit_price");
    table.index("is_active");
    table.index("requires_prescription");
    table.index("min_stock");
    table.index("max_stock");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("products");
}

