import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { AdminRole, Prisma } from "@prisma/client";
import { prisma } from "../../prisma";
import { mailer } from "../../utils/mailer";
import {
  ApiEmployeePermission,
  mapApiPermissionToDb,
  mapDbPermissionToApi,
} from "./admin.employees.constants";

type CreateRoleInput = {
  name: string;
  description?: string;
  permissions: ApiEmployeePermission[];
};

type UpdateRoleInput = {
  name?: string;
  description?: string | null;
  permissions?: ApiEmployeePermission[];
};

type ListEmployeesQuery = {
  q?: string;
  isActive?: boolean;
  roleId?: string;
  page: number;
  limit: number;
};

type CreateEmployeeInput = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountry: string;
  phoneNumber: string;
  nationality: string;
  dateOfBirth: Date;
  password?: string;
  roleId: string;
  sendInvite: boolean;
};

const roleSelect = {
  id: true,
  name: true,
  description: true,
  permissions: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      admins: true,
    },
  },
} as const;

const employeeSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phoneCountry: true,
  phoneNumber: true,
  nationality: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  roleId: true,
  employeeRole: {
    select: {
      name: true,
    },
  },
} as const;

type RoleRecord = Prisma.EmployeeRoleGetPayload<{ select: typeof roleSelect }>;
type EmployeeRecord = Prisma.AdminGetPayload<{ select: typeof employeeSelect }>;

function toRoleResponse(role: RoleRecord) {
  return {
    id: role.id,
    name: role.name,
    description: role.description ?? "",
    permissions: role.permissions.map(mapDbPermissionToApi),
    isSystem: role.isSystem,
    userCount: role._count.admins,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

function toEmployeeResponse(employee: EmployeeRecord) {
  return {
    id: employee.id,
    firstName: employee.firstName ?? "",
    lastName: employee.lastName ?? "",
    email: employee.email,
    phoneCountry: employee.phoneCountry ?? "",
    phoneNumber: employee.phoneNumber ?? "",
    nationality: employee.nationality ?? "",
    isActive: employee.isActive,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
    lastLoginAt: employee.lastLoginAt,
    roleId: employee.roleId ?? "",
    roleName: employee.employeeRole?.name ?? "",
  };
}

function normalizeDescription(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function generateTemporaryPassword() {
  return randomBytes(9).toString("base64url");
}

async function sendEmployeeCredentialEmailSafe(payload: {
  firstName: string;
  email: string;
  password: string;
}) {
  const loginUrl = process.env.ADMIN_LOGIN_URL || process.env.ADMIN_DASHBOARD_URL;
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM,
      to: payload.email,
      subject: "Your SureRide employee account credentials",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Your SureRide employee account is ready</h2>
          <p>Hello ${payload.firstName},</p>
          <p><b>Email:</b> ${payload.email}</p>
          <p><b>Temporary password:</b> ${payload.password}</p>
          <p>Please sign in and change your password immediately.</p>
          ${
            loginUrl
              ? `<p><a href="${loginUrl}" target="_blank" rel="noopener noreferrer">Open SureRide dashboard</a></p>`
              : ""
          }
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("[AdminEmployees] Failed to send credentials email", {
      email: payload.email,
      error,
    });
    return false;
  }
}

export async function listEmployeeRoles() {
  const roles = await prisma.employeeRole.findMany({
    orderBy: { createdAt: "asc" },
    select: roleSelect,
  });
  return roles.map(toRoleResponse);
}

export async function createEmployeeRole(input: CreateRoleInput) {
  const role = await prisma.employeeRole.create({
    data: {
      name: input.name.trim(),
      description: normalizeDescription(input.description),
      permissions: input.permissions.map(mapApiPermissionToDb),
    },
    select: roleSelect,
  });
  return toRoleResponse(role);
}

export async function updateEmployeeRole(roleId: string, input: UpdateRoleInput) {
  const existing = await prisma.employeeRole.findUnique({
    where: { id: roleId },
    select: { id: true },
  });
  if (!existing) throw new Error("ROLE_NOT_FOUND");

  const role = await prisma.employeeRole.update({
    where: { id: roleId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: normalizeDescription(input.description) }
        : {}),
      ...(input.permissions !== undefined
        ? { permissions: input.permissions.map(mapApiPermissionToDb) }
        : {}),
    },
    select: roleSelect,
  });
  return toRoleResponse(role);
}

export async function deleteEmployeeRole(roleId: string) {
  const role = await prisma.employeeRole.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      isSystem: true,
      _count: {
        select: { admins: true },
      },
    },
  });

  if (!role) throw new Error("ROLE_NOT_FOUND");
  if (role.isSystem) throw new Error("SYSTEM_ROLE_DELETE_FORBIDDEN");
  if (role._count.admins > 0) throw new Error("ROLE_ASSIGNED_DELETE_FORBIDDEN");

  await prisma.employeeRole.delete({
    where: { id: roleId },
  });
}

export async function listEmployees(query: ListEmployeesQuery) {
  const where: Prisma.AdminWhereInput = {};

  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }
  if (query.roleId) {
    where.roleId = query.roleId;
  }
  if (query.q) {
    where.OR = [
      { email: { contains: query.q, mode: "insensitive" } },
      { firstName: { contains: query.q, mode: "insensitive" } },
      { lastName: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    prisma.admin.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      select: employeeSelect,
    }),
    prisma.admin.count({ where }),
  ]);

  return {
    items: items.map(toEmployeeResponse),
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function assignEmployeeRole(employeeId: string, roleId: string) {
  const [employee, role] = await Promise.all([
    prisma.admin.findUnique({
      where: { id: employeeId },
      select: { id: true },
    }),
    prisma.employeeRole.findUnique({
      where: { id: roleId },
      select: { id: true },
    }),
  ]);

  if (!employee) throw new Error("EMPLOYEE_NOT_FOUND");
  if (!role) throw new Error("ROLE_NOT_FOUND");

  await prisma.admin.update({
    where: { id: employeeId },
    data: { roleId },
  });
}

export async function resetEmployeePassword(
  employeeId: string,
  sendEmail: boolean,
) {
  const employee = await prisma.admin.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      firstName: true,
      email: true,
    },
  });

  if (!employee) throw new Error("EMPLOYEE_NOT_FOUND");

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  const ttlHours = Number(process.env.ADMIN_TEMP_PASSWORD_TTL_HOURS || 24);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  await prisma.admin.update({
    where: { id: employeeId },
    data: {
      password: passwordHash,
      mustChangePassword: true,
      tempPasswordExpiresAt: expiresAt,
    },
  });

  if (sendEmail) {
    await sendEmployeeCredentialEmailSafe({
      firstName: employee.firstName || "there",
      email: employee.email,
      password: temporaryPassword,
    });
  }
}

export async function updateEmployeeStatus(employeeId: string, isActive: boolean) {
  const employee = await prisma.admin.findUnique({
    where: { id: employeeId },
    select: { id: true },
  });

  if (!employee) throw new Error("EMPLOYEE_NOT_FOUND");

  await prisma.$transaction(async (tx) => {
    await tx.admin.update({
      where: { id: employeeId },
      data: { isActive },
    });

    if (!isActive) {
      await tx.adminSession.updateMany({
        where: {
          adminId: employeeId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }
  });
}

export async function createEmployee(input: CreateEmployeeInput) {
  const existing = await prisma.admin.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) throw new Error("EMPLOYEE_EMAIL_EXISTS");

  const role = await prisma.employeeRole.findUnique({
    where: { id: input.roleId },
    select: { id: true },
  });
  if (!role) throw new Error("ROLE_NOT_FOUND");

  const temporaryPasswordGenerated = !input.password;
  const plainPassword = input.password ?? generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const ttlHours = Number(process.env.ADMIN_TEMP_PASSWORD_TTL_HOURS || 24);

  const employee = await prisma.admin.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phoneCountry: input.phoneCountry,
      phoneNumber: input.phoneNumber,
      nationality: input.nationality,
      dateOfBirth: input.dateOfBirth,
      role: AdminRole.SUPPORT,
      roleId: input.roleId,
      password: passwordHash,
      isActive: true,
      mustChangePassword: temporaryPasswordGenerated,
      tempPasswordExpiresAt: temporaryPasswordGenerated
        ? new Date(Date.now() + ttlHours * 60 * 60 * 1000)
        : null,
    },
    select: employeeSelect,
  });

  let inviteEmailSent = false;
  if (input.sendInvite) {
    inviteEmailSent = await sendEmployeeCredentialEmailSafe({
      firstName: input.firstName,
      email: input.email,
      password: plainPassword,
    });
  }

  return {
    employee: toEmployeeResponse(employee),
    inviteEmailSent,
    temporaryPasswordGenerated,
  };
}
