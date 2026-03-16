"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListPaymentGatewaysController = adminListPaymentGatewaysController;
exports.adminCreatePaymentGatewayController = adminCreatePaymentGatewayController;
exports.adminUpdatePaymentGatewayController = adminUpdatePaymentGatewayController;
exports.adminSetPaymentGatewayEnabledController = adminSetPaymentGatewayEnabledController;
exports.adminSetDefaultPaymentGatewayController = adminSetDefaultPaymentGatewayController;
exports.adminGetPaymentSettingsController = adminGetPaymentSettingsController;
exports.adminUpdatePaymentSettingsController = adminUpdatePaymentSettingsController;
exports.adminListPaymentTransactionsController = adminListPaymentTransactionsController;
const zod_1 = require("zod");
const admin_payments_validation_1 = require("./admin.payments.validation");
const admin_payments_service_1 = require("./admin.payments.service");
function validationError(res, err) {
    return res.status(400).json({
        message: "Validation failed",
        errors: err.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
        })),
    });
}
async function adminListPaymentGatewaysController(_req, res) {
    try {
        const gateways = await (0, admin_payments_service_1.listAdminPaymentGateways)();
        return res.json({ items: gateways });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to list payment gateways" });
    }
}
async function adminCreatePaymentGatewayController(req, res) {
    try {
        const body = admin_payments_validation_1.createPaymentGatewaySchema.parse(req.body);
        const gateway = await (0, admin_payments_service_1.createAdminPaymentGateway)(body);
        return res.status(201).json({
            message: "Payment gateway created",
            gateway,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return validationError(res, error);
        if (error.message === "PAYMENT_GATEWAY_ALREADY_EXISTS") {
            return res.status(409).json({ message: "Gateway already exists" });
        }
        if (error.message === "PAYMENT_PROVIDER_NOT_IMPLEMENTED") {
            return res
                .status(400)
                .json({ message: "Provider exists but runtime integration is not yet implemented" });
        }
        console.error(error);
        return res.status(500).json({ message: "Failed to create payment gateway" });
    }
}
async function adminUpdatePaymentGatewayController(req, res) {
    try {
        const { provider } = admin_payments_validation_1.paymentGatewayProviderParamSchema.parse(req.params);
        const body = admin_payments_validation_1.updatePaymentGatewaySchema.parse(req.body);
        const gateway = await (0, admin_payments_service_1.updateAdminPaymentGateway)(provider, body);
        return res.json({
            message: "Payment gateway updated",
            gateway,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return validationError(res, error);
        if (error.message === "PAYMENT_GATEWAY_NOT_FOUND") {
            return res.status(404).json({ message: "Gateway not found" });
        }
        if (error.message === "DEFAULT_GATEWAY_DISABLE_FORBIDDEN") {
            return res.status(400).json({ message: "Default gateway cannot be disabled" });
        }
        if (error.message === "PAYMENT_PROVIDER_NOT_IMPLEMENTED") {
            return res
                .status(400)
                .json({ message: "Provider exists but runtime integration is not yet implemented" });
        }
        console.error(error);
        return res.status(500).json({ message: "Failed to update payment gateway" });
    }
}
async function adminSetPaymentGatewayEnabledController(req, res) {
    try {
        const { provider } = admin_payments_validation_1.paymentGatewayProviderParamSchema.parse(req.params);
        const body = admin_payments_validation_1.togglePaymentGatewaySchema.parse(req.body);
        const gateway = await (0, admin_payments_service_1.setAdminPaymentGatewayEnabled)(provider, body.isEnabled);
        return res.json({
            message: "Payment gateway status updated",
            gateway,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return validationError(res, error);
        if (error.message === "PAYMENT_GATEWAY_NOT_FOUND") {
            return res.status(404).json({ message: "Gateway not found" });
        }
        if (error.message === "DEFAULT_GATEWAY_DISABLE_FORBIDDEN") {
            return res.status(400).json({ message: "Default gateway cannot be disabled" });
        }
        console.error(error);
        return res
            .status(500)
            .json({ message: "Failed to update payment gateway status" });
    }
}
async function adminSetDefaultPaymentGatewayController(req, res) {
    try {
        const { provider } = admin_payments_validation_1.paymentGatewayProviderParamSchema.parse(req.params);
        const gateway = await (0, admin_payments_service_1.setAdminDefaultPaymentGateway)(provider);
        return res.json({
            message: "Default payment gateway updated",
            gateway,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return validationError(res, error);
        if (error.message === "PAYMENT_GATEWAY_NOT_FOUND") {
            return res.status(404).json({ message: "Gateway not found" });
        }
        if (error.message === "PAYMENT_GATEWAY_NOT_ENABLED") {
            return res.status(400).json({ message: "Gateway must be enabled first" });
        }
        if (error.message === "PAYMENT_PROVIDER_NOT_IMPLEMENTED") {
            return res
                .status(400)
                .json({ message: "Provider exists but runtime integration is not yet implemented" });
        }
        console.error(error);
        return res
            .status(500)
            .json({ message: "Failed to update default payment gateway" });
    }
}
async function adminGetPaymentSettingsController(_req, res) {
    try {
        const settings = await (0, admin_payments_service_1.getAdminPaymentSettings)();
        return res.json(settings);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch payment settings" });
    }
}
async function adminUpdatePaymentSettingsController(req, res) {
    try {
        const body = admin_payments_validation_1.updatePaymentSettingsSchema.parse(req.body);
        const settings = await (0, admin_payments_service_1.updateAdminPaymentSettings)(body);
        return res.json({
            message: "Payment settings updated",
            settings,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return validationError(res, error);
        console.error(error);
        return res.status(500).json({ message: "Failed to update payment settings" });
    }
}
async function adminListPaymentTransactionsController(req, res) {
    try {
        const query = admin_payments_validation_1.listPaymentTransactionsQuerySchema.parse(req.query);
        const result = await (0, admin_payments_service_1.listAdminPaymentTransactions)(query);
        return res.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            return validationError(res, error);
        console.error(error);
        return res
            .status(500)
            .json({ message: "Failed to fetch payment transactions" });
    }
}
