"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAdmin = loginAdmin;
exports.logoutAdmin = logoutAdmin;
const zod_1 = require("zod");
const admin_auth_validation_1 = require("./admin.auth.validation");
const admin_auth_service_1 = require("./admin.auth.service");
async function loginAdmin(req, res) {
    try {
        const data = admin_auth_validation_1.adminLoginSchema.parse(req.body);
        const result = await (0, admin_auth_service_1.adminLogin)(data.email, data.password);
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
        if (err.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function logoutAdmin(req, res) {
    try {
        const sessionId = req.user?.sessionId;
        await (0, admin_auth_service_1.adminLogout)(sessionId);
        return res.json({ message: "Logged out successfully" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
