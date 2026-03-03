import { Router } from "express";
import { requireAdminAuth } from "../../middleware/admin.middleware";
import {
  adminListProviderDocs,
  adminApproveDoc,
  adminRejectDoc,
} from "./admin.providerDocs.controller";

const router = Router();

router.get(
  "/providers/:providerId/documents",
  requireAdminAuth,
  adminListProviderDocs,
);
router.patch(
  "/provider-docs/:docId/approve",
  requireAdminAuth,
  adminApproveDoc,
);
router.patch("/provider-docs/:docId/reject", requireAdminAuth, adminRejectDoc);

export default router;
