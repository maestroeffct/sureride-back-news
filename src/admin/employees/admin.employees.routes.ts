import { Router } from "express";
import { requireAdminAuth } from "../../middleware/admin.middleware";
import {
  adminAssignEmployeeRoleController,
  adminCreateEmployeeController,
  adminCreateEmployeeRoleController,
  adminDeleteEmployeeRoleController,
  adminListEmployeeRolesController,
  adminListEmployeesController,
  adminResetEmployeePasswordController,
  adminUpdateEmployeeRoleController,
  adminUpdateEmployeeStatusController,
} from "./admin.employees.controller";

const router = Router();

router.get("/employee-roles", requireAdminAuth, adminListEmployeeRolesController);
router.post("/employee-roles", requireAdminAuth, adminCreateEmployeeRoleController);
router.patch(
  "/employee-roles/:roleId",
  requireAdminAuth,
  adminUpdateEmployeeRoleController,
);
router.delete(
  "/employee-roles/:roleId",
  requireAdminAuth,
  adminDeleteEmployeeRoleController,
);

router.get("/employees", requireAdminAuth, adminListEmployeesController);
router.post("/employees", requireAdminAuth, adminCreateEmployeeController);
router.patch(
  "/employees/:employeeId/assign-role",
  requireAdminAuth,
  adminAssignEmployeeRoleController,
);
router.post(
  "/employees/:employeeId/reset-password",
  requireAdminAuth,
  adminResetEmployeePasswordController,
);
router.patch(
  "/employees/:employeeId/status",
  requireAdminAuth,
  adminUpdateEmployeeStatusController,
);

export default router;
