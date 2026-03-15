"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeController = getMeController;
exports.updateMeController = updateMeController;
exports.updatePasswordController = updatePasswordController;
exports.deleteMeController = deleteMeController;
const zod_1 = require("zod");
const users_validation_1 = require("./users.validation");
const users_service_1 = require("./users.service");
function validationError(res, err) {
    return res.status(400).json({
        message: "Validation failed",
        errors: err.issues,
    });
}
function getAuthenticatedUserId(req, res) {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return undefined;
    }
    return userId;
}
async function getMeController(req, res) {
    try {
        const userId = getAuthenticatedUserId(req, res);
        if (!userId)
            return;
        const user = await (0, users_service_1.getCurrentUser)(userId);
        return res.json(user);
    }
    catch (err) {
        if (err.message === "USER_NOT_FOUND")
            return res.status(404).json({ message: "User not found" });
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function updateMeController(req, res) {
    try {
        const userId = getAuthenticatedUserId(req, res);
        if (!userId)
            return;
        const body = users_validation_1.updateProfileSchema.parse(req.body);
        const user = await (0, users_service_1.updateCurrentUser)(userId, body);
        return res.json(user);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return validationError(res, err);
        if (err.message === "DUPLICATE")
            return res.status(409).json({ message: "Phone or email already exists" });
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function updatePasswordController(req, res) {
    try {
        const userId = getAuthenticatedUserId(req, res);
        if (!userId)
            return;
        const body = users_validation_1.updatePasswordSchema.parse(req.body);
        const result = await (0, users_service_1.updateUserPassword)(userId, body.oldPassword, body.newPassword);
        return res.json(result);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return validationError(res, err);
        if (err.message === "INVALID_OLD_PASSWORD")
            return res.status(400).json({ message: "Old password is incorrect" });
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function deleteMeController(req, res) {
    try {
        const userId = getAuthenticatedUserId(req, res);
        if (!userId)
            return;
        const user = await (0, users_service_1.deactivateUser)(userId);
        return res.json({
            message: "Account deactivated",
            user,
        });
    }
    catch {
        return res.status(500).json({ message: "Internal server error" });
    }
}
