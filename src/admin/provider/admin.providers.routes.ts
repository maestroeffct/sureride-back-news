import { Router } from "express";
import { requireAdminAuth } from "../../middleware/admin.middleware";
import {
  adminApproveProvider,
  adminSuspendProvider,
  adminSetCommission,
} from "./admin.providers.controller";

const router = Router();

router.patch(
  "/providers/:providerId/approve",
  requireAdminAuth,
  adminApproveProvider,
);
router.patch(
  "/providers/:providerId/suspend",
  requireAdminAuth,
  adminSuspendProvider,
);
router.patch(
  "/providers/:providerId/commission",
  requireAdminAuth,
  adminSetCommission,
);

export default router;
