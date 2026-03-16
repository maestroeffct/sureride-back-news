import { EmployeePermission } from "@prisma/client";

export const EMPLOYEE_PERMISSION_VALUES = [
  "employees.read",
  "employees.create",
  "employees.update",
  "employees.suspend",
  "roles.read",
  "roles.create",
  "roles.update",
  "roles.delete",
  "providers.manage",
  "cars.manage",
  "bookings.manage",
  "promotions.manage",
  "settings.manage",
] as const;

export type ApiEmployeePermission = (typeof EMPLOYEE_PERMISSION_VALUES)[number];

const API_TO_DB_PERMISSION: Record<ApiEmployeePermission, EmployeePermission> = {
  "employees.read": "EMPLOYEES_READ",
  "employees.create": "EMPLOYEES_CREATE",
  "employees.update": "EMPLOYEES_UPDATE",
  "employees.suspend": "EMPLOYEES_SUSPEND",
  "roles.read": "ROLES_READ",
  "roles.create": "ROLES_CREATE",
  "roles.update": "ROLES_UPDATE",
  "roles.delete": "ROLES_DELETE",
  "providers.manage": "PROVIDERS_MANAGE",
  "cars.manage": "CARS_MANAGE",
  "bookings.manage": "BOOKINGS_MANAGE",
  "promotions.manage": "PROMOTIONS_MANAGE",
  "settings.manage": "SETTINGS_MANAGE",
};

const DB_TO_API_PERMISSION: Record<EmployeePermission, ApiEmployeePermission> = {
  EMPLOYEES_READ: "employees.read",
  EMPLOYEES_CREATE: "employees.create",
  EMPLOYEES_UPDATE: "employees.update",
  EMPLOYEES_SUSPEND: "employees.suspend",
  ROLES_READ: "roles.read",
  ROLES_CREATE: "roles.create",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",
  PROVIDERS_MANAGE: "providers.manage",
  CARS_MANAGE: "cars.manage",
  BOOKINGS_MANAGE: "bookings.manage",
  PROMOTIONS_MANAGE: "promotions.manage",
  SETTINGS_MANAGE: "settings.manage",
};

export function mapApiPermissionToDb(
  permission: ApiEmployeePermission,
): EmployeePermission {
  return API_TO_DB_PERMISSION[permission];
}

export function mapDbPermissionToApi(
  permission: EmployeePermission,
): ApiEmployeePermission {
  return DB_TO_API_PERMISSION[permission];
}
