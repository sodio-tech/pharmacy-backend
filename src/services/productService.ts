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

export const addNewProductService = async (admin, req) => {
  const product: Product = req.body;
  let image = req.files?.image?.[0];
  const insertion: any = {
    ...product,
    pharmacy_id: admin.pharmacy_id
  }

  let attachmentFileName: null | string = null;
  if (image) {
    const slug = s3Service.slugify(product.product_name);
    attachmentFileName = `pharmacy_id_${admin.pharmacy_id}/public/products/${slug}`;
    insertion.image = attachmentFileName;

    const {url} = await s3Service.uploadFile(image.buffer, attachmentFileName, image.mimetype, true);
    image = url;
  }

  const result = await knex.transaction(async (trx) => {
    const [res] = await trx("products")
      .insert(insertion)
      .returning("*");

    return {
      ...res,
      image
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
    product.image = s3Service.getFileUrl(product.image);
  });

  return { 
    products: products,
    total: Number(total),
    page,
    limit,
    total_pages: Math.ceil(total / limit)
  };    
}

export const getProductDetailsService = async (user, product_id: string) => {
  const product_ids = product_id.split(",");
  const products = await knex("products")
    .leftJoin("product_categories", "products.product_category_id", "product_categories.id")
    .leftJoin("product_units", "products.unit", "product_units.id")
    .whereIn("products.id", product_ids)
    .andWhere("products.pharmacy_id", user.pharmacy_id)
  
  products.forEach((product) => {
    delete product.created_at;
    delete product.updated_at;
    delete product.product_category_id;
    delete product.pharmacy_id;
    product.image = s3Service.getFileUrl(product.image);
  });

  return { products };
}

export const getProductUnitsService = async () => {
  const product_units = await knex("product_units")
    .select("id", "unit")   

  return {product_units};
}

export const updateProductService = async (admin, product_id: number, updateParams: UpdateProduct & {image: any}) => {
  const product = await knex('products')
    .where('id', product_id)
    .andWhere("pharmacy_id", admin.pharmacy_id)
    .first();

  if (!product) {
    return {error: "Product not found"};
  }

  let image: string = s3Service.getFileUrl(product.image);
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

  const [ updated ] = await knex('products')
    .where('id', product_id)
    .andWhere("pharmacy_id", admin.pharmacy_id)
    .update(updateParams)
    .returning("*");

  return {
    ...updated,
    image
  };
}
