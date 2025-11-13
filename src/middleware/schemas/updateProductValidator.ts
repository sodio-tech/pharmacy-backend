import z from '../../config/zodConfig.js'
import {newProductSchema} from './newProductValidator.js'

export const updateProductSchema = newProductSchema.partial();

export type UpdateProduct = z.infer<typeof updateProductSchema>;
