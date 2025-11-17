import knex from "../config/database.js";
import dotenv from 'dotenv'
dotenv.config();
import { ROLES } from "../config/constants.js";
import {NewProfile} from '../middleware/schemas/types.js'
import * as s3Service from './s3Service.js'

export const getProfileService = async (userData: {id: number, role: number}) => {
  const baseQuery = knex("users")
    if (userData.role === ROLES.SUPER_ADMIN) {
      baseQuery
        .leftJoin('pharmacies', 'users.id', 'pharmacies.super_admin')
        .leftJoin('pharmacy_branch_employees', 'pharmacy_branch_employees.employee_id', 'users.id')
    }
    else {
      baseQuery
        .leftJoin('pharmacy_branch_employees', 'users.id', 'pharmacy_branch_employees.employee_id')
        .leftJoin('pharmacies', 'pharmacies.id', 'pharmacy_branch_employees.pharmacy_id')
    }

    baseQuery
      .where('users.id', userData.id)
      .select(
        'users.id',
        'users.fullname',
        'users.email',
        'users.role',
        'users.phone_number',
        'users.profile_image',
        'users.last_login',
        'users.two_factor_recovery_code',
        'pharmacies.id as pharmacy_id',
        'pharmacies.currency_code as currency_code',
        'pharmacies.pharmacy_name',
        'pharmacies.subscription_status',
        'pharmacy_branch_employees.pharmacy_branch_id',
      )

    const [user] = await baseQuery;
    user.profile_image = user.profile_image && s3Service.getFileUrl(user.profile_image);
    if (userData.role !== ROLES.SUPER_ADMIN) {
      delete user.subscription_status;
    }

  user.role = ROLES[user.role]
  user.two_fa_enabled = user.two_factor_recovery_code ? true : false;
  delete user.two_factor_recovery_code;

  return user || null;
};

export const updataProfileService = async (user, data: NewProfile & {profile_photo: any}) => {
  const userUpdates: any = {
    ...data.new_name && {fullname: data.new_name},
    ...data.phone_number && {phone_number: data.phone_number},
  }

  const pharmacyUpdates = {
    ...data.pharmacy_name && user.role === ROLES.SUPER_ADMIN && {pharmacy_name: data.pharmacy_name},
    ...data.currency_code && user.role === ROLES.SUPER_ADMIN && {currency_code: data.currency_code},
  }

  await knex.transaction(async (trx) => {
    if (Object.keys(userUpdates).length > 0) {
      if (data.profile_photo) {
        const userData = await knex('users').where('id', user.id).first();
        const slug = s3Service.slugify(userData.fullname);
        let profile_image: string;
        if (!userData.profile_image) {
          profile_image = `pharmacy_id_${user.pharmacy_id}/public/profiles/${slug}`;
        } else {
          profile_image = userData.profile_image;
        }
        await s3Service.deleteFile(profile_image);
        await s3Service.uploadFile(data.profile_photo.buffer, profile_image, data.profile_photo.mimetype, true);
        userUpdates.profile_image = profile_image;
      }
      await trx("users")
        .where("id", user.id)
        .update(userUpdates)
    }
    if (Object.keys(pharmacyUpdates).length > 0) {
      await trx("pharmacies")
        .where("super_admin", user.id)
        .update(pharmacyUpdates)
    }
  })

  return true;
}



