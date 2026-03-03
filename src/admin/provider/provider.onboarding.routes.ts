import { Router } from "express";
import {
  saveDraftProvider,
  finalizeProvider,
  getProviders,
} from "./provider.onboarding.controller";
import { requireAdminAuth } from "../../middleware/admin.middleware";

const router = Router();

router.get("/providers", requireAdminAuth, getProviders);
router.post("/providers/draft", requireAdminAuth, saveDraftProvider);
router.patch(
  "/providers/:providerId/submit",
  requireAdminAuth,
  finalizeProvider,
);

export default router;
