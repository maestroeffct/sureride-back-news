import { Router } from "express";
import { requireAdminAuth } from "../../middleware/admin.middleware";
import { upload } from "../../middleware/upload";
import {
  adminCreatePaymentGatewayController,
  adminDeletePaymentGatewayController,
  adminGetPaymentSettingsController,
  adminListPaymentGatewaysController,
  adminListPaymentTransactionsController,
  adminReplacePaymentGatewayFieldsController,
  adminReplacePaymentGatewayValuesController,
  adminSetDefaultPaymentGatewayController,
  adminSetPaymentGatewayEnabledController,
  adminUpdatePaymentGatewayController,
  adminUpdatePaymentSettingsController,
  adminUploadPaymentGatewayLogoController,
} from "./admin.payments.controller";

const router = Router();

router.get(
  "/payments/transactions",
  requireAdminAuth,
  adminListPaymentTransactionsController,
);

router.get("/payments/gateways", requireAdminAuth, adminListPaymentGatewaysController);
router.post(
  "/payments/gateways",
  requireAdminAuth,
  adminCreatePaymentGatewayController,
);
router.patch(
  "/payments/gateways/:key",
  requireAdminAuth,
  adminUpdatePaymentGatewayController,
);
router.put(
  "/payments/gateways/:key/fields",
  requireAdminAuth,
  adminReplacePaymentGatewayFieldsController,
);
router.put(
  "/payments/gateways/:key/values",
  requireAdminAuth,
  adminReplacePaymentGatewayValuesController,
);
router.patch(
  "/payments/gateways/:key/enable",
  requireAdminAuth,
  adminSetPaymentGatewayEnabledController,
);
router.patch(
  "/payments/gateways/:key/default",
  requireAdminAuth,
  adminSetDefaultPaymentGatewayController,
);
router.delete(
  "/payments/gateways/:key",
  requireAdminAuth,
  adminDeletePaymentGatewayController,
);
router.post(
  "/payments/gateways/:key/logo",
  requireAdminAuth,
  upload.single("file"),
  adminUploadPaymentGatewayLogoController,
);

router.get("/payments/settings", requireAdminAuth, adminGetPaymentSettingsController);
router.patch(
  "/payments/settings",
  requireAdminAuth,
  adminUpdatePaymentSettingsController,
);

export default router;
