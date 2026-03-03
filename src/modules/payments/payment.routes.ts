import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  createPaymentSheetController,
  getPaymentConfigController,
} from "./payment.controller";

const router = Router();

router.get("/config", getPaymentConfigController);
router.post("/payment-sheet", requireAuth, createPaymentSheetController);

export default router;
