"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginProvider = loginProvider;
exports.logoutProvider = logoutProvider;
const zod_1 = require("zod");
const provider_auth_validation_1 = require("./provider.auth.validation");
const provider_auth_service_1 = require("./provider.auth.service");
async function loginProvider(req, res) {
    try {
        const data = provider_auth_validation_1.providerLoginSchema.parse(req.body);
        const result = await (0, provider_auth_service_1.providerLogin)(data.email, data.password);
        return res.json({
            message: "Login successful",
            ...result,
        });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError) {
            return res.status(400).json({
                message: "Validation failed",
                errors: err.issues.map((e) => ({
                    field: e.path.join("."),
                    message: e.message,
                })),
            });
        }
        if (err.message === "PROVIDER_PENDING_APPROVAL" ||
            err.message === "PROVIDER_ACCOUNT_NOT_READY") {
            return res.status(403).json({
                message: "Provider account is awaiting admin approval",
            });
        }
        if (err.message === "PROVIDER_SUSPENDED") {
            return res.status(403).json({
                message: "Provider account is suspended",
            });
        }
        if (err.message === "PROVIDER_NOT_VERIFIED") {
            return res.status(403).json({
                message: "Provider account not verified yet",
            });
        }
        if (err.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function logoutProvider(req, res) {
    try {
        const sessionId = req.user?.sessionId;
        await (0, provider_auth_service_1.providerLogout)(sessionId);
        return res.json({ message: "Logged out successfully" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
