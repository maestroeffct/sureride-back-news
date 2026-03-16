"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListEmployeeRolesController = adminListEmployeeRolesController;
exports.adminCreateEmployeeRoleController = adminCreateEmployeeRoleController;
exports.adminUpdateEmployeeRoleController = adminUpdateEmployeeRoleController;
exports.adminDeleteEmployeeRoleController = adminDeleteEmployeeRoleController;
exports.adminListEmployeesController = adminListEmployeesController;
exports.adminCreateEmployeeController = adminCreateEmployeeController;
exports.adminAssignEmployeeRoleController = adminAssignEmployeeRoleController;
exports.adminResetEmployeePasswordController = adminResetEmployeePasswordController;
exports.adminUpdateEmployeeStatusController = adminUpdateEmployeeStatusController;
const zod_1 = require("zod");
const admin_employees_validation_1 = require("./admin.employees.validation");
const admin_employees_service_1 = require("./admin.employees.service");
function normalizeObjectValues(input) {
    const output = {};
    for (const [key, value] of Object.entries(input)) {
        output[key] = Array.isArray(value) ? value[0] : value;
    }
    return output;
}
function validationError(res, err) {
    return res.status(400).json({
        message: "Validation failed",
        errors: err.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        })),
    });
}
async function adminListEmployeeRolesController(_req, res) {
    try {
        const roles = await (0, admin_employees_service_1.listEmployeeRoles)();
        return res.json(roles);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch employee roles" });
    }
}
async function adminCreateEmployeeRoleController(req, res) {
    try {
        const body = admin_employees_validation_1.createEmployeeRoleSchema.parse(req.body);
        const role = await (0, admin_employees_service_1.createEmployeeRole)(body);
        return res.status(201).json(role);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return validationError(res, error);
        if (error.code === "P2002") {
            return res.status(409).json({ message: "Role name already exists" });
        }
        console.error(error);
        return res.status(500).json({ message: "Failed to create employee role" });
    }
}
async function adminUpdateEmployeeRoleController(req, res) {
    try {
        const params = admin_employees_validation_1.employeeRoleParamSchema.parse(normalizeObjectValues(req.params));
        const body = admin_employees_validation_1.updateEmployeeRoleSchema.parse(req.body);
        const role = await (0, admin_employees_service_1.updateEmployeeRole)(params.roleId, body);
        return res.json(role);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return validationError(res, error);
        if (error.message === "ROLE_NOT_FOUND") {
            return res.status(404).json({ message: "Role not found" });
        }
        if (error.code === "P2002") {
            return res.status(409).json({ message: "Role name already exists" });
        }
        console.error(error);
        return res.status(500).json({ message: "Failed to update employee role" });
    }
}
async function adminDeleteEmployeeRoleController(req, res) {
    try {
        const params = admin_employees_validation_1.employeeRoleParamSchema.parse(normalizeObjectValues(req.params));
        await (0, admin_employees_service_1.deleteEmployeeRole)(params.roleId);
        return res.json({ message: "Role deleted" });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return validationError(res, error);
        if (error.message === "ROLE_NOT_FOUND") {
            return res.status(404).json({ message: "Role not found" });
        }
        if (error.message === "SYSTEM_ROLE_DELETE_FORBIDDEN") {
            return res.status(409).json({ message: "System roles cannot be deleted" });
        }
        if (error.message === "ROLE_ASSIGNED_DELETE_FORBIDDEN") {
            return res
                .status(409)
                .json({ message: "Cannot delete role with assigned employees" });
        }
        console.error(error);
        return res.status(500).json({ message: "Failed to delete employee role" });
    }
}
async function adminListEmployeesController(req, res) {
    try {
        const query = admin_employees_validation_1.listEmployeesQuerySchema.parse(normalizeObjectValues(req.query));
        const result = await (0, admin_employees_service_1.listEmployees)(query);
        return res.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return validationError(res, error);
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch employees" });
    }
}
async function adminCreateEmployeeController(req, res) {
    try {
        const body = admin_employees_validation_1.createEmployeeSchema.parse(req.body);
        const result = await (0, admin_employees_service_1.createEmployee)(body);
        return res.status(201).json({
            message: "Employee created",
            employee: result.employee,
            inviteEmailSent: result.inviteEmailSent,
            temporaryPasswordGenerated: result.temporaryPasswordGenerated,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return validationError(res, error);
        if (error.message === "EMPLOYEE_EMAIL_EXISTS") {
            return res.status(409).json({ message: "Employee email already exists" });
        }
        if (error.message === "ROLE_NOT_FOUND") {
            return res.status(404).json({ message: "Role not found" });
        }
        console.error(error);
        return res.status(500).json({ message: "Failed to create employee" });
    }
}
async function adminAssignEmployeeRoleController(req, res) {
    try {
        const params = admin_employees_validation_1.employeeParamSchema.parse(normalizeObjectValues(req.params));
        const body = admin_employees_validation_1.assignEmployeeRoleSchema.parse(req.body);
        await (0, admin_employees_service_1.assignEmployeeRole)(params.employeeId, body.roleId);
        return res.json({ message: "Role assigned" });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return validationError(res, error);
        if (error.message === "EMPLOYEE_NOT_FOUND") {
            return res.status(404).json({ message: "Employee not found" });
        }
        if (error.message === "ROLE_NOT_FOUND") {
            return res.status(404).json({ message: "Role not found" });
        }
        console.error(error);
        return res.status(500).json({ message: "Failed to assign role" });
    }
}
async function adminResetEmployeePasswordController(req, res) {
    try {
        const params = admin_employees_validation_1.employeeParamSchema.parse(normalizeObjectValues(req.params));
        const body = admin_employees_validation_1.resetEmployeePasswordSchema.parse(req.body ?? {});
        await (0, admin_employees_service_1.resetEmployeePassword)(params.employeeId, body.sendEmail);
        return res.json({ message: "Password reset initiated" });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return validationError(res, error);
        if (error.message === "EMPLOYEE_NOT_FOUND") {
            return res.status(404).json({ message: "Employee not found" });
        }
        console.error(error);
        return res.status(500).json({ message: "Failed to reset employee password" });
    }
}
async function adminUpdateEmployeeStatusController(req, res) {
    try {
        const params = admin_employees_validation_1.employeeParamSchema.parse(normalizeObjectValues(req.params));
        const body = admin_employees_validation_1.updateEmployeeStatusSchema.parse(req.body);
        await (0, admin_employees_service_1.updateEmployeeStatus)(params.employeeId, body.isActive);
        return res.json({ message: "Employee status updated" });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return validationError(res, error);
        if (error.message === "EMPLOYEE_NOT_FOUND") {
            return res.status(404).json({ message: "Employee not found" });
        }
        console.error(error);
        return res.status(500).json({ message: "Failed to update employee status" });
    }
}
