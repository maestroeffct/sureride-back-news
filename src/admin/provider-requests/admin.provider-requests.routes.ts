import { Router } from "express";
import { requireAdminAuth } from "../../middleware/admin.middleware";
import {
  adminListProviderRequests,
  adminApproveProviderRequest,
  adminRejectProviderRequest,
} from "./admin.provider-requests.controller";

const router = Router();

router.get("/provider-requests", requireAdminAuth, adminListProviderRequests);

router.patch(
  "/provider-requests/:id/approve",
  requireAdminAuth,
  adminApproveProviderRequest,
);

router.patch(
  "/provider-requests/:id/reject",
  requireAdminAuth,
  adminRejectProviderRequest,
);

export default router;
