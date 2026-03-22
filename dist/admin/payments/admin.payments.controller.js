"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListPaymentGatewaysController = adminListPaymentGatewaysController;
exports.adminCreatePaymentGatewayController = adminCreatePaymentGatewayController;
exports.adminUpdatePaymentGatewayController = adminUpdatePaymentGatewayController;
exports.adminReplacePaymentGatewayFieldsController = adminReplacePaymentGatewayFieldsController;
exports.adminReplacePaymentGatewayValuesController = adminReplacePaymentGatewayValuesController;
exports.adminSetPaymentGatewayEnabledController = adminSetPaymentGatewayEnabledController;
exports.adminSetDefaultPaymentGatewayController = adminSetDefaultPaymentGatewayController;
exports.adminDeletePaymentGatewayController = adminDeletePaymentGatewayController;
exports.adminUploadPaymentGatewayLogoController = adminUploadPaymentGatewayLogoController;
exports.adminGetPaymentSettingsController = adminGetPaymentSettingsController;
exports.adminUpdatePaymentSettingsController = adminUpdatePaymentSettingsController;
exports.adminListPaymentTransactionsController = adminListPaymentTransactionsController;
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
const admin_payments_validation_1 = require("./admin.payments.validation");
const admin_payments_service_1 = require("./admin.payments.service");
function validationError(res, err) {
    return res.status(400).json({
        message: "VALIDATION_FAILED",
        errors: err.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
        })),
    });
}
function mapGatewayErrorStatus(errorCode) {
    if (errorCode === "GATEWAY_NOT_FOUND")
        return 404;
    if (errorCode === "GATEWAY_FIELD_NOT_FOUND")
        return 404;
    if (errorCode === "GATEWAY_KEY_ALREADY_EXISTS")
        return 409;
    if (errorCode === "GATEWAY_FIELD_KEY_CONFLICT")
        return 409;
    if (errorCode === "GATEWAY_DEFAULT_DISABLE_FORBIDDEN")
        return 409;
    if (errorCode === "GATEWAY_DEFAULT_DELETE_FORBIDDEN")
        return 409;
    if (errorCode === "GATEWAY_NOT_ENABLED")
        return 400;
    if (errorCode === "GATEWAY_RUNTIME_NOT_IMPLEMENTED")
        return 400;
    if (errorCode === "GATEWAY_REQUIRED_VALUES_MISSING")
        return 400;
    return 500;
}
function gatewayError(res, error, fallbackMessage) {
    if (error instanceof zod_1.ZodError)
        return validationError(res, error);
    const message = error instanceof Error && error.message ? error.message : fallbackMessage;
    const status = mapGatewayErrorStatus(message);
    if (status === 500) {
        console.error(error);
    }
    return res.status(status).json({ message });
}
function getPublicBaseUrl(req) {
    if (process.env.PUBLIC_BASE_URL) {
        return process.env.PUBLIC_BASE_URL.replace(/\/+$/, "");
    }
    const forwardedProto = req.headers["x-forwarded-proto"];
    const protocol = typeof forwardedProto === "string"
        ? forwardedProto.split(",")[0]
        : req.protocol;
    const host = req.get("host");
    return host ? `${protocol}://${host}` : "";
}
async function adminListPaymentGatewaysController(_req, res) {
    try {
        const gateways = await (0, admin_payments_service_1.listAdminPaymentGateways)();
        return res.json({ items: gateways });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "INTERNAL_SERVER_ERROR" });
    }
}
async function adminCreatePaymentGatewayController(req, res) {
    try {
        const body = admin_payments_validation_1.createPaymentGatewaySchema.parse(req.body);
        const gateway = await (0, admin_payments_service_1.createAdminPaymentGateway)({
            ...body,
            updatedByAdminId: req.user?.adminId,
        });
        return res.status(201).json(gateway);
    }
    catch (error) {
        return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
    }
}
async function adminUpdatePaymentGatewayController(req, res) {
    try {
        const { key } = admin_payments_validation_1.paymentGatewayKeyParamSchema.parse(req.params);
        const body = admin_payments_validation_1.updatePaymentGatewaySchema.parse(req.body);
        const gateway = await (0, admin_payments_service_1.updateAdminPaymentGateway)(key, body);
        return res.json(gateway);
    }
    catch (error) {
        return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
    }
}
async function adminReplacePaymentGatewayFieldsController(req, res) {
    try {
        const { key } = admin_payments_validation_1.paymentGatewayKeyParamSchema.parse(req.params);
        const body = admin_payments_validation_1.replacePaymentGatewayFieldsSchema.parse(req.body);
        const gateway = await (0, admin_payments_service_1.replaceAdminPaymentGatewayFields)(key, body);
        return res.json(gateway);
    }
    catch (error) {
        return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
    }
}
async function adminReplacePaymentGatewayValuesController(req, res) {
    try {
        const { key } = admin_payments_validation_1.paymentGatewayKeyParamSchema.parse(req.params);
        const body = admin_payments_validation_1.replacePaymentGatewayValuesSchema.parse(req.body);
        const gateway = await (0, admin_payments_service_1.replaceAdminPaymentGatewayValues)(key, {
            ...body,
            updatedByAdminId: req.user?.adminId,
        });
        return res.json(gateway);
    }
    catch (error) {
        return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
    }
}
async function adminSetPaymentGatewayEnabledController(req, res) {
    try {
        const { key } = admin_payments_validation_1.paymentGatewayKeyParamSchema.parse(req.params);
        const body = admin_payments_validation_1.togglePaymentGatewaySchema.parse(req.body);
        const gateway = await (0, admin_payments_service_1.setAdminPaymentGatewayEnabled)(key, body.isEnabled);
        return res.json(gateway);
    }
    catch (error) {
        return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
    }
}
async function adminSetDefaultPaymentGatewayController(req, res) {
    try {
        const { key } = admin_payments_validation_1.paymentGatewayKeyParamSchema.parse(req.params);
        const gateway = await (0, admin_payments_service_1.setAdminDefaultPaymentGateway)(key);
        return res.json(gateway);
    }
    catch (error) {
        return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
    }
}
async function adminDeletePaymentGatewayController(req, res) {
    try {
        const { key } = admin_payments_validation_1.paymentGatewayKeyParamSchema.parse(req.params);
        await (0, admin_payments_service_1.softDeleteAdminPaymentGateway)(key);
        return res.json({ message: "Gateway archived" });
    }
    catch (error) {
        return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
    }
}
async function adminUploadPaymentGatewayLogoController(req, res) {
    try {
        const { key } = admin_payments_validation_1.paymentGatewayKeyParamSchema.parse(req.params);
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: "VALIDATION_FAILED" });
        }
        const extension = path_1.default.extname(file.originalname || "").toLowerCase();
        const allowed = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);
        if (extension && !allowed.has(extension)) {
            return res.status(400).json({ message: "VALIDATION_FAILED" });
        }
        const logoUrl = `${getPublicBaseUrl(req)}/uploads/${file.filename}`;
        const gateway = await (0, admin_payments_service_1.updateAdminPaymentGatewayLogo)(key, logoUrl);
        return res.json({ logoUrl: gateway.logoUrl });
    }
    catch (error) {
        return gatewayError(res, error, "INTERNAL_SERVER_ERROR");
    }
}
async function adminGetPaymentSettingsController(_req, res) {
    try {
        const settings = await (0, admin_payments_service_1.getAdminPaymentSettings)();
        return res.json(settings);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "INTERNAL_SERVER_ERROR" });
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
        return res.status(500).json({ message: "INTERNAL_SERVER_ERROR" });
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
        return res.status(500).json({ message: "INTERNAL_SERVER_ERROR" });
    }
}
