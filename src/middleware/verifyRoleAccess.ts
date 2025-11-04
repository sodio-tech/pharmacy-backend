import dotenv from "dotenv";
import { Permission, ROLES } from "../config/constants.js";
import knex from "../config/database.js";

dotenv.config();

export const verifyRoleAccess = (...permissions: Permission[]) => async (req, res, next) => {
  try {
    const role = req.user.role;
    let roleHasPermissions = role === ROLES.SUPER_ADMIN;
    if (!roleHasPermissions) {
      // or check if the role has permissions in the db 
      roleHasPermissions = await knex('role_permissions')
        .leftJoin('permissions', 'role_permissions.permission_id', 'permissions.id')
        .where('role_permissions.role_id', role)
        .whereIn('permissions.permission', permissions)
        .select('role_permissions.id')
        .first();
    }

    if (!roleHasPermissions) {
      return res.status(401).json({
        success: false,
        message: "Access denied. You're not authorized to perform this action.",
      });
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Something went wrong.",
    });
  }
};


