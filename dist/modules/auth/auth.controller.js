"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.verifyOtpHandler = verifyOtpHandler;
exports.resendOtpHandler = resendOtpHandler;
exports.getMe = getMe;
exports.forgotPasswordHandler = forgotPasswordHandler;
exports.verifyResetOtpHandler = verifyResetOtpHandler;
exports.resetPasswordHandler = resetPasswordHandler;
exports.logout = logout;
exports.resendForgotPassword = resendForgotPassword;
const auth_service_1 = require("./auth.service");
const auth_validation_1 = require("./auth.validation");
const zod_1 = require("zod");
const prisma_1 = require("../../prisma");
const jwt_1 = require("../../utils/jwt");
const otp_service_1 = require("./otp.service");
async function register(req, res) {
    try {
        const data = auth_validation_1.registerSchema.parse(req.body);
        const user = await (0, auth_service_1.registerUser)(data);
        res.status(201).json({
            message: "Account created successfully",
            user: {
                id: user.id,
                email: user.email,
            },
        });
    }
    catch (err) {
        // ✅ Zod validation error (CORRECT WAY)
        if (err instanceof zod_1.ZodError) {
            const formattedErrors = err.issues.map((e) => ({
                field: e.path.join("."),
                message: e.message,
            }));
            console.log("ZOD ERROR:", formattedErrors);
            return res.status(400).json({
                message: "Validation failed",
                errors: formattedErrors,
            });
        }
        if (err.message === "USER_ALREADY_EXISTS") {
            return res.status(409).json({
                message: "Email or phone number already exists",
            });
        }
        // ✅ Prisma unique constraint
        if (err.code === "P2002") {
            // Fallback-safe handling
            const targets = err.meta?.target;
            if (targets?.includes("email")) {
                return res.status(409).json({
                    message: "Email already exists",
                });
            }
            if (targets?.includes("phoneCountry") ||
                targets?.includes("phoneNumber")) {
                return res.status(409).json({
                    message: "Phone number already exists",
                });
            }
            // fallback (when Prisma doesn't expose target)
            return res.status(409).json({
                message: "Account already exists with these details",
            });
        }
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
// LOGIN CONTROLLER
async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
    }
    try {
        const result = await (0, auth_service_1.loginUser)(email, password);
        // 🔒 Needs OTP
        if (result.status === "VERIFICATION_REQUIRED") {
            return res.status(403).json({
                status: "verification_required",
                message: "Please verify your account",
                phone: result.phone,
                userId: result.userId,
            });
        }
        // ✅ Success
        return res.json({
            status: "success",
            token: result.token,
            user: result.user,
        });
    }
    catch (err) {
        return res.status(401).json({
            message: "Invalid email or password",
        });
    }
}
// OTP VERIFICATION CONTROLLER
async function verifyOtpHandler(req, res) {
    try {
        const { userId, code } = req.body;
        if (!userId || !code) {
            return res.status(400).json({ message: "OTP required" });
        }
        await (0, otp_service_1.verifyOtp)(userId, code);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const session = await prisma_1.prisma.session.create({
            data: {
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        const token = (0, jwt_1.signToken)({
            type: "USER",
            sessionId: session.id,
            userId: user.id,
            email: user.email,
        });
        return res.json({
            message: "Account verified successfully",
            token,
            user: {
                id: user.id,
                email: user.email,
            },
        });
    }
    catch (err) {
        if (err.message === "INVALID_OR_EXPIRED_OTP") {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        if (err.message === "ALREADY_VERIFIED") {
            return res.status(400).json({ message: "Account already verified" });
        }
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function resendOtpHandler(req, res) {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }
        await (0, otp_service_1.resendOtp)(userId);
        return res.json({
            message: "Verification code sent",
        });
    }
    catch (err) {
        if (err.message?.startsWith("COOLDOWN_")) {
            const seconds = err.message.split("_")[1];
            return res.status(429).json({
                message: `Please wait ${seconds}s before requesting a new code`,
            });
        }
        if (err.message === "ALREADY_VERIFIED") {
            return res.status(400).json({ message: "Account already verified" });
        }
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function getMe(req, res) {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            nationality: true,
            phoneCountry: true,
            phoneNumber: true,
            isVerified: true,
            isActive: true,
            profileStatus: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.json({
        message: "Authenticated",
        user,
    });
}
async function forgotPasswordHandler(req, res) {
    const { email } = req.body;
    await (0, auth_service_1.forgotPassword)(email);
    return res.json({
        message: "If the email exists, a verification code has been sent",
    });
}
async function verifyResetOtpHandler(req, res) {
    const { email, code } = req.body;
    const { userId } = await (0, otp_service_1.verifyResetOtp)(email, code);
    return res.json({
        message: "OTP verified",
        userId,
    });
}
async function resetPasswordHandler(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "userId and password required" });
    }
    await (0, auth_service_1.resetPassword)(email, password);
    return res.json({
        message: "Password reset successful",
    });
}
async function logout(req, res) {
    const payload = req.user;
    if (!payload ||
        payload.type !== "USER" ||
        !payload.userId ||
        !payload.sessionId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    await (0, auth_service_1.logoutUser)(payload.userId, payload.sessionId);
    return res.json({ message: "Logged out successfully" });
}
async function resendForgotPassword(req, res) {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }
    try {
        await (0, otp_service_1.resendForgotPasswordOtp)(email);
        return res.json({
            message: "Verification code resent to your email",
        });
    }
    catch (err) {
        if (err.message === "OTP_TOO_SOON") {
            return res.status(429).json({
                message: "Please wait before requesting another code",
            });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
}
