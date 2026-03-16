import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  assignEmployeeRoleSchema,
  createEmployeeRoleSchema,
  createEmployeeSchema,
  employeeParamSchema,
  employeeRoleParamSchema,
  listEmployeesQuerySchema,
  resetEmployeePasswordSchema,
  updateEmployeeRoleSchema,
  updateEmployeeStatusSchema,
} from "./admin.employees.validation";
import {
  assignEmployeeRole,
  createEmployee,
  createEmployeeRole,
  deleteEmployeeRole,
  listEmployeeRoles,
  listEmployees,
  resetEmployeePassword,
  updateEmployeeRole,
  updateEmployeeStatus,
} from "./admin.employees.service";

function normalizeObjectValues(input: Record<string, unknown>) {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    output[key] = Array.isArray(value) ? value[0] : value;
  }
  return output;
}

function validationError(res: Response, err: ZodError) {
  return res.status(400).json({
    message: "Validation failed",
    errors: err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}

export async function adminListEmployeeRolesController(
  _req: Request,
  res: Response,
) {
  try {
    const roles = await listEmployeeRoles();
    return res.json(roles);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch employee roles" });
  }
}

export async function adminCreateEmployeeRoleController(
  req: Request,
  res: Response,
) {
  try {
    const body = createEmployeeRoleSchema.parse(req.body);
    const role = await createEmployeeRole(body);
    return res.status(201).json(role);
  } catch (error: any) {
    if (error instanceof ZodError) return validationError(res, error);
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Role name already exists" });
    }
    console.error(error);
    return res.status(500).json({ message: "Failed to create employee role" });
  }
}

export async function adminUpdateEmployeeRoleController(
  req: Request,
  res: Response,
) {
  try {
    const params = employeeRoleParamSchema.parse(
      normalizeObjectValues(req.params as Record<string, unknown>),
    );
    const body = updateEmployeeRoleSchema.parse(req.body);

    const role = await updateEmployeeRole(params.roleId, body);
    return res.json(role);
  } catch (error: any) {
    if (error instanceof ZodError) return validationError(res, error);
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

export async function adminDeleteEmployeeRoleController(
  req: Request,
  res: Response,
) {
  try {
    const params = employeeRoleParamSchema.parse(
      normalizeObjectValues(req.params as Record<string, unknown>),
    );
    await deleteEmployeeRole(params.roleId);
    return res.json({ message: "Role deleted" });
  } catch (error: any) {
    if (error instanceof ZodError) return validationError(res, error);
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

export async function adminListEmployeesController(req: Request, res: Response) {
  try {
    const query = listEmployeesQuerySchema.parse(
      normalizeObjectValues(req.query as Record<string, unknown>),
    );
    const result = await listEmployees(query);
    return res.json(result);
  } catch (error) {
    if (error instanceof ZodError) return validationError(res, error);
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch employees" });
  }
}

export async function adminCreateEmployeeController(req: Request, res: Response) {
  try {
    const body = createEmployeeSchema.parse(req.body);
    const result = await createEmployee(body);
    return res.status(201).json({
      message: "Employee created",
      employee: result.employee,
      inviteEmailSent: result.inviteEmailSent,
      temporaryPasswordGenerated: result.temporaryPasswordGenerated,
    });
  } catch (error: any) {
    if (error instanceof ZodError) return validationError(res, error);
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

export async function adminAssignEmployeeRoleController(
  req: Request,
  res: Response,
) {
  try {
    const params = employeeParamSchema.parse(
      normalizeObjectValues(req.params as Record<string, unknown>),
    );
    const body = assignEmployeeRoleSchema.parse(req.body);

    await assignEmployeeRole(params.employeeId, body.roleId);
    return res.json({ message: "Role assigned" });
  } catch (error: any) {
    if (error instanceof ZodError) return validationError(res, error);
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

export async function adminResetEmployeePasswordController(
  req: Request,
  res: Response,
) {
  try {
    const params = employeeParamSchema.parse(
      normalizeObjectValues(req.params as Record<string, unknown>),
    );
    const body = resetEmployeePasswordSchema.parse(req.body ?? {});

    await resetEmployeePassword(params.employeeId, body.sendEmail);
    return res.json({ message: "Password reset initiated" });
  } catch (error: any) {
    if (error instanceof ZodError) return validationError(res, error);
    if (error.message === "EMPLOYEE_NOT_FOUND") {
      return res.status(404).json({ message: "Employee not found" });
    }
    console.error(error);
    return res.status(500).json({ message: "Failed to reset employee password" });
  }
}

export async function adminUpdateEmployeeStatusController(
  req: Request,
  res: Response,
) {
  try {
    const params = employeeParamSchema.parse(
      normalizeObjectValues(req.params as Record<string, unknown>),
    );
    const body = updateEmployeeStatusSchema.parse(req.body);

    await updateEmployeeStatus(params.employeeId, body.isActive);
    return res.json({ message: "Employee status updated" });
  } catch (error: any) {
    if (error instanceof ZodError) return validationError(res, error);
    if (error.message === "EMPLOYEE_NOT_FOUND") {
      return res.status(404).json({ message: "Employee not found" });
    }
    console.error(error);
    return res.status(500).json({ message: "Failed to update employee status" });
  }
}
