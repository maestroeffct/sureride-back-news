"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEmployeeRoles = listEmployeeRoles;
exports.createEmployeeRole = createEmployeeRole;
exports.updateEmployeeRole = updateEmployeeRole;
exports.deleteEmployeeRole = deleteEmployeeRole;
exports.listEmployees = listEmployees;
exports.assignEmployeeRole = assignEmployeeRole;
exports.resetEmployeePassword = resetEmployeePassword;
exports.updateEmployeeStatus = updateEmployeeStatus;
exports.createEmployee = createEmployee;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const prisma_1 = require("../../prisma");
const mailer_1 = require("../../utils/mailer");
const admin_employees_constants_1 = require("./admin.employees.constants");
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
};
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
};
function toRoleResponse(role) {
    return {
        id: role.id,
        name: role.name,
        description: role.description ?? "",
        permissions: role.permissions.map(admin_employees_constants_1.mapDbPermissionToApi),
        isSystem: role.isSystem,
        userCount: role._count.admins,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
    };
}
function toEmployeeResponse(employee) {
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
function normalizeDescription(value) {
    if (!value)
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function generateTemporaryPassword() {
    return (0, crypto_1.randomBytes)(9).toString("base64url");
}
async function sendEmployeeCredentialEmailSafe(payload) {
    const loginUrl = process.env.ADMIN_LOGIN_URL || process.env.ADMIN_DASHBOARD_URL;
    try {
        await mailer_1.mailer.sendMail({
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
          ${loginUrl
                ? `<p><a href="${loginUrl}" target="_blank" rel="noopener noreferrer">Open SureRide dashboard</a></p>`
                : ""}
        </div>
      `,
        });
        return true;
    }
    catch (error) {
        console.error("[AdminEmployees] Failed to send credentials email", {
            email: payload.email,
            error,
        });
        return false;
    }
}
async function listEmployeeRoles() {
    const roles = await prisma_1.prisma.employeeRole.findMany({
        orderBy: { createdAt: "asc" },
        select: roleSelect,
    });
    return roles.map(toRoleResponse);
}
async function createEmployeeRole(input) {
    const role = await prisma_1.prisma.employeeRole.create({
        data: {
            name: input.name.trim(),
            description: normalizeDescription(input.description),
            permissions: input.permissions.map(admin_employees_constants_1.mapApiPermissionToDb),
        },
        select: roleSelect,
    });
    return toRoleResponse(role);
}
async function updateEmployeeRole(roleId, input) {
    const existing = await prisma_1.prisma.employeeRole.findUnique({
        where: { id: roleId },
        select: { id: true },
    });
    if (!existing)
        throw new Error("ROLE_NOT_FOUND");
    const role = await prisma_1.prisma.employeeRole.update({
        where: { id: roleId },
        data: {
            ...(input.name !== undefined ? { name: input.name.trim() } : {}),
            ...(input.description !== undefined
                ? { description: normalizeDescription(input.description) }
                : {}),
            ...(input.permissions !== undefined
                ? { permissions: input.permissions.map(admin_employees_constants_1.mapApiPermissionToDb) }
                : {}),
        },
        select: roleSelect,
    });
    return toRoleResponse(role);
}
async function deleteEmployeeRole(roleId) {
    const role = await prisma_1.prisma.employeeRole.findUnique({
        where: { id: roleId },
        select: {
            id: true,
            isSystem: true,
            _count: {
                select: { admins: true },
            },
        },
    });
    if (!role)
        throw new Error("ROLE_NOT_FOUND");
    if (role.isSystem)
        throw new Error("SYSTEM_ROLE_DELETE_FORBIDDEN");
    if (role._count.admins > 0)
        throw new Error("ROLE_ASSIGNED_DELETE_FORBIDDEN");
    await prisma_1.prisma.employeeRole.delete({
        where: { id: roleId },
    });
}
async function listEmployees(query) {
    const where = {};
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
        prisma_1.prisma.admin.findMany({
            where,
            skip,
            take: query.limit,
            orderBy: { createdAt: "desc" },
            select: employeeSelect,
        }),
        prisma_1.prisma.admin.count({ where }),
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
async function assignEmployeeRole(employeeId, roleId) {
    const [employee, role] = await Promise.all([
        prisma_1.prisma.admin.findUnique({
            where: { id: employeeId },
            select: { id: true },
        }),
        prisma_1.prisma.employeeRole.findUnique({
            where: { id: roleId },
            select: { id: true },
        }),
    ]);
    if (!employee)
        throw new Error("EMPLOYEE_NOT_FOUND");
    if (!role)
        throw new Error("ROLE_NOT_FOUND");
    await prisma_1.prisma.admin.update({
        where: { id: employeeId },
        data: { roleId },
    });
}
async function resetEmployeePassword(employeeId, sendEmail) {
    const employee = await prisma_1.prisma.admin.findUnique({
        where: { id: employeeId },
        select: {
            id: true,
            firstName: true,
            email: true,
        },
    });
    if (!employee)
        throw new Error("EMPLOYEE_NOT_FOUND");
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcryptjs_1.default.hash(temporaryPassword, 10);
    const ttlHours = Number(process.env.ADMIN_TEMP_PASSWORD_TTL_HOURS || 24);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    await prisma_1.prisma.admin.update({
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
async function updateEmployeeStatus(employeeId, isActive) {
    const employee = await prisma_1.prisma.admin.findUnique({
        where: { id: employeeId },
        select: { id: true },
    });
    if (!employee)
        throw new Error("EMPLOYEE_NOT_FOUND");
    await prisma_1.prisma.$transaction(async (tx) => {
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
async function createEmployee(input) {
    const existing = await prisma_1.prisma.admin.findUnique({
        where: { email: input.email },
        select: { id: true },
    });
    if (existing)
        throw new Error("EMPLOYEE_EMAIL_EXISTS");
    const role = await prisma_1.prisma.employeeRole.findUnique({
        where: { id: input.roleId },
        select: { id: true },
    });
    if (!role)
        throw new Error("ROLE_NOT_FOUND");
    const temporaryPasswordGenerated = !input.password;
    const plainPassword = input.password ?? generateTemporaryPassword();
    const passwordHash = await bcryptjs_1.default.hash(plainPassword, 10);
    const ttlHours = Number(process.env.ADMIN_TEMP_PASSWORD_TTL_HOURS || 24);
    const employee = await prisma_1.prisma.admin.create({
        data: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phoneCountry: input.phoneCountry,
            phoneNumber: input.phoneNumber,
            nationality: input.nationality,
            dateOfBirth: input.dateOfBirth,
            role: client_1.AdminRole.SUPPORT,
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
