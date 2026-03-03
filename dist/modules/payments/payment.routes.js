"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const payment_controller_1 = require("./payment.controller");
const router = (0, express_1.Router)();
router.get("/config", payment_controller_1.getPaymentConfigController);
router.post("/payment-sheet", auth_middleware_1.requireAuth, payment_controller_1.createPaymentSheetController);
exports.default = router;
