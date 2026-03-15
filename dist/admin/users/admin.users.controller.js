"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListUsersController = adminListUsersController;
exports.adminGetUserController = adminGetUserController;
exports.adminUserStatusController = adminUserStatusController;
exports.adminVerificationController = adminVerificationController;
exports.adminProfileStatusController = adminProfileStatusController;
exports.adminApproveKycController = adminApproveKycController;
exports.adminRejectKycController = adminRejectKycController;
const zod_1 = require("zod");
const admin_users_validation_1 = require("./admin.users.validation");
const admin_users_service_1 = require("./admin.users.service");
function validationError(res, err) {
    return res.status(400).json({
        message: "Validation failed",
        errors: err.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
        })),
    });
}
function normalizeParam(param) {
    if (!param)
        return undefined;
    return Array.isArray(param) ? param[0] : param;
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
/**
 * GET /admin/users
 */
async function adminListUsersController(req, res) {
    try {
        const query = admin_users_validation_1.adminUsersQuerySchema.parse(req.query);
        const users = await (0, admin_users_service_1.adminListUsers)(query, getPublicBaseUrl(req));
        return res.json(users);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return validationError(res, err);
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
/**
 * GET /admin/users/:userId
 */
async function adminGetUserController(req, res) {
    try {
        const userId = normalizeParam(req.params.userId);
        if (!userId) {
            return res.status(400).json({ message: "Invalid userId" });
        }
        const user = await (0, admin_users_service_1.adminGetUser)(userId, getPublicBaseUrl(req));
        return res.json(user);
    }
    catch (err) {
        if (err.message === "USER_NOT_FOUND")
            return res.status(404).json({ message: "User not found" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
/**
 * PATCH /admin/users/:userId/status
 */
async function adminUserStatusController(req, res) {
    try {
        const userId = normalizeParam(req.params.userId);
        if (!userId) {
            return res.status(400).json({ message: "Invalid userId" });
        }
        const body = admin_users_validation_1.adminUserStatusSchema.parse(req.body);
        const user = await (0, admin_users_service_1.adminUpdateUserStatus)(userId, body.isActive);
        return res.json({
            message: "User status updated",
            user,
        });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return validationError(res, err);
        if (err.message === "USER_NOT_FOUND")
            return res.status(404).json({ message: "User not found" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
/**
 * PATCH /admin/users/:userId/verification
 */
async function adminVerificationController(req, res) {
    try {
        const userId = normalizeParam(req.params.userId);
        if (!userId) {
            return res.status(400).json({ message: "Invalid userId" });
        }
        const body = admin_users_validation_1.adminVerificationSchema.parse(req.body);
        const user = await (0, admin_users_service_1.adminUpdateVerification)(userId, body.isVerified, body.profileStatus);
        return res.json({
            message: "User verification updated",
            user,
        });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return validationError(res, err);
        if (err.message === "USER_NOT_FOUND")
            return res.status(404).json({ message: "User not found" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
/**
 * PATCH /admin/users/:userId/profile-status
 */
async function adminProfileStatusController(req, res) {
    try {
        const userId = normalizeParam(req.params.userId);
        if (!userId) {
            return res.status(400).json({ message: "Invalid userId" });
        }
        const body = admin_users_validation_1.adminProfileStatusSchema.parse(req.body);
        const user = await (0, admin_users_service_1.adminUpdateProfileStatus)(userId, body.profileStatus);
        return res.json({
            message: "Profile status updated",
            user,
        });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return validationError(res, err);
        if (err.message === "USER_NOT_FOUND")
            return res.status(404).json({ message: "User not found" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
/**
 * PATCH /admin/users/:userId/kyc/approve
 */
async function adminApproveKycController(req, res) {
    try {
        const userId = normalizeParam(req.params.userId);
        if (!userId) {
            return res.status(400).json({ message: "Invalid userId" });
        }
        const user = await (0, admin_users_service_1.adminApproveUserKyc)(userId, getPublicBaseUrl(req));
        return res.json({
            message: "KYC approved",
            user,
        });
    }
    catch (err) {
        if (err.message === "USER_NOT_FOUND")
            return res.status(404).json({ message: "User not found" });
        if (err.message === "KYC_NOT_FOUND")
            return res.status(404).json({ message: "KYC record not found" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
/**
 * PATCH /admin/users/:userId/kyc/reject
 */
async function adminRejectKycController(req, res) {
    try {
        const userId = normalizeParam(req.params.userId);
        if (!userId) {
            return res.status(400).json({ message: "Invalid userId" });
        }
        const body = admin_users_validation_1.adminRejectKycSchema.parse(req.body);
        const user = await (0, admin_users_service_1.adminRejectUserKyc)(userId, body.reason, getPublicBaseUrl(req));
        return res.json({
            message: "KYC rejected",
            user,
        });
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return validationError(res, err);
        if (err.message === "USER_NOT_FOUND")
            return res.status(404).json({ message: "User not found" });
        if (err.message === "KYC_NOT_FOUND")
            return res.status(404).json({ message: "KYC record not found" });
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
