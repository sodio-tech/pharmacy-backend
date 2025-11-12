import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('products', table => {
    table.dropUnique([ 'barcode' ]);
    table.dropUnique([ 'qrcode' ]);
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('products', table => {
    table.unique([ 'barcode' ]);
    table.unique([ 'qrcode' ]);
  })
}

