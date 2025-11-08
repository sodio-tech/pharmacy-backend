
export enum ROLES {
  SUPER_ADMIN = 1,
  ADMIN = 2,
  PHARMACIST = 3,
}

// Mailgun template ids 
export const EMAIL_TEMPLATE_IDS = {
  CONFIRM_EMAIL: 'email_verification',
  RESET_PASSWORD: 'reset_password',
  OTP_EMAIL : 'otp'
}

export const PermissionMap = {
  INVENTORY: {
    VIEW: "inventory:view",
    EDIT: "inventory:edit",
  },
  BILLING: {
    VIEW: "billing:view",
    MANAGE: "billing:manage",
  },
  ORGANIZATION: {
    VIEW: "organization:view",
    EDIT: "organization:edit",
    ADD_BRANCH: "organization:add_branch",
    DELETE_BRANCH: "organization:delete_branch",
    ADD_EMPLOYEE: "organization:add_employee",
    DELETE_EMPLOYEE: "organization:delete_employee",
  },
  SUPPLIER: {
    VIEW: "supplier:view",
    EDIT: "supplier:edit",
    ADD_SUPPLIER: "supplier:add_supplier",
  },
  ORDER: {
    VIEW: "order:view",
    EDIT: "order:edit",
    ADD_ORDER: "order:add_order",
    FULFILL_ORDER: "order:fulfill_order",
    DELETE_ORDER: "order:delete_order",
  },
} as const;

type ExtractValues<T> = {
  [K in keyof T]: T[K] extends Record<string, infer V> ? V : never
}[keyof T];

export type Permission = ExtractValues<typeof PermissionMap>

