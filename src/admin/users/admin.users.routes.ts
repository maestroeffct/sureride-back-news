import { Router } from "express";
import { requireAdminAuth } from "../../middleware/admin.middleware";

import {
  adminCreateUserController,
  adminListUsersController,
  adminGetUserController,
  adminUserStatusController,
  adminVerificationController,
  adminProfileStatusController,
  adminApproveKycController,
  adminRejectKycController,
} from "./admin.users.controller";

const router = Router();

router.post("/users", requireAdminAuth, adminCreateUserController);

router.get("/users", requireAdminAuth, adminListUsersController);

router.get("/users/:userId", requireAdminAuth, adminGetUserController);

router.patch(
  "/users/:userId/status",
  requireAdminAuth,
  adminUserStatusController,
);

router.patch(
  "/users/:userId/verification",
  requireAdminAuth,
  adminVerificationController,
);

router.patch(
  "/users/:userId/profile-status",
  requireAdminAuth,
  adminProfileStatusController,
);

router.patch(
  "/users/:userId/kyc/approve",
  requireAdminAuth,
  adminApproveKycController,
);

router.patch(
  "/users/:userId/kyc/reject",
  requireAdminAuth,
  adminRejectKycController,
);

export default router;
