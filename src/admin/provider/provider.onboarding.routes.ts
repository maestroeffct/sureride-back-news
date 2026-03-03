import { Router } from "express";
import {
  saveDraftProvider,
  finalizeProvider,
  getProviders,
  getProvider,
} from "./provider.onboarding.controller";
import { requireAdminAuth } from "../../middleware/admin.middleware";

const router = Router();

router.get("/providers", requireAdminAuth, getProviders);
router.get("/providers/:providerId", requireAdminAuth, getProvider);
router.post("/providers", requireAdminAuth, saveDraftProvider);
router.post("/providers/draft", requireAdminAuth, saveDraftProvider);
router.patch(
  "/providers/:providerId/submit",
  requireAdminAuth,
  finalizeProvider,
);

export default router;
