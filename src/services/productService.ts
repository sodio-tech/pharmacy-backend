import knex from "../config/database.js";
import dotenv from "dotenv";
dotenv.config();
import { Product, UpdateProduct } from "../middleware/schemas/types.js";
import * as s3Service from "./s3Service.js";
import {normaliseSearchText, buildNormalizedSearch} from "../utils/common_functions.js";

export const getCategoriesService = async (params) => {
  let {search} = params;
  search = normaliseSearchText(search);
  const categories = await knex("product_categories")
    .modify((qb) => {
      if(search) {
        qb.andWhereRaw(buildNormalizedSearch('product_categories.category_name'), [`%${search}%`])
      }
    })
    .select("id", "category_name")
    .orderBy("category_name", "asc");

  return { categories };
};

export const addNewProductService = async (admin, req, branch_id: number) => {
  const product: Product = req.body;
  product.min_stock = 10;
  delete product.branch_id;
  const stock = product.stock;
  delete product.stock;

  product.product_category_id = typeof product.product_category_id === 'number' 
    ? product.product_category_id 
    : product.product_category_id?.[0]!;
  let images = req.files?.image

  const insertion: any = {
    ...product,
    pharmacy_id: admin.pharmacy_id
  }

  let  main_image: string | null = null;
  let urls: any[] = [];
  if (images?.length > 0) {
    urls = await Promise.all(images.map(async (image) => {
      const slug = s3Service.slugify(product.product_name);
      const attachmentFileName = `pharmacy_id_${admin.pharmacy_id}/public/products/${slug}`;
      insertion.image = attachmentFileName;
      const {url} = await s3Service.uploadFile(image.buffer, attachmentFileName, image.mimetype, true);
      return {url, attachmentFileName};
    }));

    main_image = urls[0]?.url;
    insertion.image = urls[0]?.attachmentFileName;
  }

  const result = await knex.transaction(async (trx) => {
    const [res] = await trx("products")
      .insert(insertion)
      .returning("*");

    const remainingImages = urls.slice(1);
    if (remainingImages.length > 0) {
      await trx("product_images")
        .insert(remainingImages.map(({_url, attachmentFileName}) => ({
          product_id: res.id,
          image: attachmentFileName
        })))
    }

    await trx("branch_product_settings")
      .insert({
        pharmacy_branch_id: branch_id,
        product_id: res.id,
    })

    await trx('batches')
      .insert({
        product_id: res.id,
        pharmacy_branch_id: branch_id,
        unit_cost: product.unit_price ?? 0,
        ...stock && { available_stock: stock }
    });

    return {
      ...res,
      image: main_image
    };
  });

  delete result.created_at;
  delete result.updated_at;

  return result;
};

export const getProductsService = async (pharmacy_id: number, pagination) => {
  let {page, limit, search, product_category_id} = pagination;
  page = Number(page);
  limit = Number(limit);
  const offset = limit * (page - 1);
  search = normaliseSearchText(search);

  const query = knex("products")
    .leftJoin("product_categories", "products.product_category_id", "product_categories.id")
    .leftJoin("product_units", "products.unit", "product_units.id")
    .where("products.pharmacy_id", pharmacy_id)
    .modify((qb) => {
      if(search) {
        qb.andWhere( builder => 
          builder.orWhereRaw(buildNormalizedSearch('products.product_name'), [`%${search}%`])
            .orWhereRaw(buildNormalizedSearch('products.generic_name'), [`%${search}%`])
            .orWhereRaw(buildNormalizedSearch('products.manufacturer'), [`%${search}%`])
        )
      }
      if(product_category_id) {
        qb.andWhere("product_categories.id", product_category_id)
      }
    })
    .select(
      "products.*",
      "product_categories.category_name as product_category_name",
      "product_units.unit as unit",
    )
    .orderBy("products.product_name", "asc");

  const {total = 0}: any = await query.clone().clearSelect().clearOrder().count('products.id as total').first();

  const products = await query
    .limit(limit)
    .offset(offset);

  products.forEach((product) => {
    delete product.created_at;
    delete product.updated_at;
    delete product.product_category_id;
    delete product.pharmacy_id;
    product.image = product.image && s3Service.getFileUrl(product.image);
  });

  return { 
    products: products,
    total: Number(total),
    page,
    limit,
    total_pages: Math.ceil(total / limit)
  };    
}

export const getProductDetailsService = async (user, product_id: string, branch_id: number) => {
  const product_ids = product_id.split(",");
  const products = await knex("products")
    .leftJoin("product_categories", "products.product_category_id", "product_categories.id")
    .leftJoin("product_units", "products.unit", "product_units.id")
    .leftJoin("product_images", "product_images.product_id", "products.id")
    .whereIn("products.id", product_ids)
    .andWhere("products.pharmacy_id", user.pharmacy_id)
    .select(
      "products.*",
      "product_units.unit as unit",
      knex.raw(`
        json_agg_strict( 
          product_categories.category_name
        ) as product_categories
      `),
      knex.raw(`
        json_agg_strict(
          product_images.image 
        ) as additional_images
      `)
    )
    .groupBy(
      "products.id",
      "product_units.unit",
    )

  const product_stock = await knex('batches')
    .whereIn('product_id', product_ids)
    .andWhere('pharmacy_branch_id', branch_id)
    .select(
      'product_id',
      knex.raw(`
        SUM(available_stock) as available_stock
      `)
    )
    .groupBy('product_id')
  
  let i = 0;
  products.forEach((product) => {
    delete product.created_at;
    delete product.updated_at;
    delete product.product_category_id;
    delete product.pharmacy_id;
    product.image = product.image && s3Service.getFileUrl(product.image);
    product.additional_images = product.additional_images.map(s3Service.getFileUrl);
    product.stock = product_stock[i].available_stock
  });

  return { products };
}

export const getProductUnitsService = async () => {
  const product_units = await knex("product_units")
    .select("id", "unit")   

  return {product_units};
}

export const updateProductService = async (admin, product_id: number, updateParams: UpdateProduct & {image: any}) => {
  const stock = updateParams.stock;
  const branch_id = updateParams.branch_id;
  delete updateParams.stock;
  delete updateParams.branch_id;

  const product = await knex('products')
    .where('id', product_id)
    .andWhere("pharmacy_id", admin.pharmacy_id)
    .first();

  if (!product) {
    return {error: "Product not found"};
  }

  let image: string | null = product.image && s3Service.getFileUrl(product.image);
  if (updateParams.image) {
    const slug = s3Service.slugify(updateParams.product_name ?? product.product_name);
    image = `pharmacy_id_${admin.pharmacy_id}/public/products/${slug}`;

    const {url} = await s3Service.uploadFile(updateParams.image.buffer, image, updateParams.image.mimetype, true);
    if (!url) {
      throw new Error("Failed to upload image");
    }
    await s3Service.deleteFile(s3Service.getFileUrl(product.image));
    updateParams.image = image;
    image = url;
  }
  else {
    delete updateParams.image;
  }

  const updated = await knex.transaction(async (trx) => {
    let updated: any = {};
    if (Object.keys(updateParams).length > 0) {
      const [ updatedProduct ] = await trx('products')
        .where('id', product_id)
        .andWhere("pharmacy_id", admin.pharmacy_id)
        .update(updateParams)
        .returning("*");
      
      updated = updatedProduct;
    }

    if (stock) {
      const anyBatch = await trx('batches')
        .where({product_id, pharmacy_branch_id: branch_id})
        .first();

      if (anyBatch) {
        const [updatedStock] = await trx('batches')
          .where({product_id, pharmacy_branch_id: branch_id, id: anyBatch.id})
          .update({ available_stock: stock }).returning("*");

        updated.stock = updatedStock.available_stock;
      }
    }

    return updated;

  })

  return {
    ...updated,
    image
  };
}
