import { Router } from "express";
import { requireAdminAuth } from "../../middleware/admin.middleware";
import {
  adminCreatePaymentGatewayController,
  adminGetPaymentSettingsController,
  adminListPaymentGatewaysController,
  adminListPaymentTransactionsController,
  adminSetDefaultPaymentGatewayController,
  adminSetPaymentGatewayEnabledController,
  adminUpdatePaymentGatewayController,
  adminUpdatePaymentSettingsController,
} from "./admin.payments.controller";

const router = Router();

router.get("/payments/transactions", requireAdminAuth, adminListPaymentTransactionsController);

router.get("/payments/gateways", requireAdminAuth, adminListPaymentGatewaysController);
router.post("/payments/gateways", requireAdminAuth, adminCreatePaymentGatewayController);
router.patch(
  "/payments/gateways/:provider",
  requireAdminAuth,
  adminUpdatePaymentGatewayController,
);
router.patch(
  "/payments/gateways/:provider/enable",
  requireAdminAuth,
  adminSetPaymentGatewayEnabledController,
);
router.patch(
  "/payments/gateways/:provider/default",
  requireAdminAuth,
  adminSetDefaultPaymentGatewayController,
);

router.get("/payments/settings", requireAdminAuth, adminGetPaymentSettingsController);
router.patch("/payments/settings", requireAdminAuth, adminUpdatePaymentSettingsController);

export default router;
