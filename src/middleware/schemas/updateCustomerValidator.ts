import {newCustomerSchema} from "./customerValidator.js";
import z from "../../config/zodConfig.js";

export const updateCustomerSchema = newCustomerSchema.partial();
export type CustomerDetails = z.infer<typeof updateCustomerSchema>;
