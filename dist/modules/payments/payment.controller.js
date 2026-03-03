"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentConfigController = getPaymentConfigController;
exports.createPaymentSheetController = createPaymentSheetController;
exports.stripeWebhookController = stripeWebhookController;
const payment_service_1 = require("./payment.service");
async function getPaymentConfigController(_req, res) {
    try {
        const config = (0, payment_service_1.getStripeConfig)();
        return res.json(config);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
}
async function createPaymentSheetController(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const bookingId = req.body?.bookingId;
        if (!bookingId) {
            return res.status(400).json({ message: "bookingId is required" });
        }
        const result = await (0, payment_service_1.createStripePaymentSheetSession)({
            bookingId,
            userId,
        });
        return res.json(result);
    }
    catch (error) {
        if (error.message === "BOOKING_NOT_FOUND") {
            return res.status(404).json({ message: "Booking not found" });
        }
        if (error.message === "BOOKING_NOT_PAYABLE" ||
            error.message === "BOOKING_ALREADY_PAID") {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: error.message || "Payment setup failed" });
    }
}
async function stripeWebhookController(req, res) {
    try {
        const signature = req.headers["stripe-signature"];
        if (!signature || Array.isArray(signature)) {
            return res.status(400).json({ message: "Missing stripe-signature" });
        }
        const payload = req.body;
        if (!Buffer.isBuffer(payload)) {
            return res.status(400).json({
                message: "Invalid webhook payload. Expected raw request body.",
            });
        }
        const result = await (0, payment_service_1.handleStripeWebhook)(payload, signature);
        return res.json({ received: true, ...result });
    }
    catch (error) {
        return res.status(400).json({ message: error.message || "Webhook failed" });
    }
}
