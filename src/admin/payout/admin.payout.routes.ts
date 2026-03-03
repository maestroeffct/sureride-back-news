import { Router } from "express";
import { requireAdminAuth } from "../../middleware/admin.middleware";
import {
  adminUpsertPayoutAccount,
  adminCreatePayout,
  adminMarkPayoutPaid,
} from "./admin.payout.controller";

const router = Router();

router.put(
  "/providers/:providerId/payout-account",
  requireAdminAuth,
  adminUpsertPayoutAccount,
);
router.post(
  "/providers/:providerId/payouts",
  requireAdminAuth,
  adminCreatePayout,
);
router.patch("/payouts/:payoutId/paid", requireAdminAuth, adminMarkPayoutPaid);

export default router;
