"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.changeTemporaryPassword = changeTemporaryPassword;
exports.logoutUser = logoutUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../prisma");
const otp_service_1 = require("./otp.service");
const jwt_1 = require("../../utils/jwt");
const maskPhone_1 = require("../../utils/maskPhone");
function isTempPasswordExpired(user) {
    if (!user.mustChangePassword)
        return false;
    if (!user.tempPasswordExpiresAt)
        return false;
    return user.tempPasswordExpiresAt.getTime() < Date.now();
}
async function registerUser(data) {
    const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
    // ✅ split phone into country code + number
    const match = data.phone.match(/^(\+\d{1,3})(\d{6,15})$/);
    if (!match) {
        throw new Error("Invalid phone format");
    }
    const [phoneCountry, phoneNumber] = match;
    const existingUser = await prisma_1.prisma.user.findFirst({
        where: {
            OR: [
                { email: data.email.toLowerCase() },
                {
                    AND: [{ phoneCountry }, { phoneNumber }],
                },
            ],
        },
    });
    if (existingUser) {
        throw new Error("USER_ALREADY_EXISTS");
    }
    return prisma_1.prisma.user.create({
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email.toLowerCase(),
            password: hashedPassword,
            phoneCountry,
            phoneNumber,
            nationality: data.country,
            dateOfBirth: new Date(data.dob),
            authProvider: "EMAIL",
        },
    });
}
async function loginUser(email, password) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });
    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }
    if (!user.isActive) {
        throw new Error("ACCOUNT_SUSPENDED");
    }
    const isMatch = await bcryptjs_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new Error("INVALID_CREDENTIALS");
    }
    if (isTempPasswordExpired(user)) {
        throw new Error("TEMP_PASSWORD_EXPIRED");
    }
    if (user.mustChangePassword) {
        throw new Error("PASSWORD_CHANGE_REQUIRED");
    }
    // 🔒 Not verified → send OTP
    if (!user.isVerified) {
        const otp = await (0, otp_service_1.generateOtp)(user.id, "VERIFY_ACCOUNT");
        await (0, otp_service_1.sendOtpEmail)(user.email, otp.code);
        return {
            status: "VERIFICATION_REQUIRED",
            userId: user.id,
            phone: (0, maskPhone_1.maskPhone)(user.phoneNumber),
        };
    }
    const session = await prisma_1.prisma.session.create({
        data: {
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
    });
    // ✅ Verified → issue JWT
    const token = (0, jwt_1.signToken)({
        type: "USER",
        userId: user.id,
        email: user.email,
        sessionId: session.id,
    });
    return {
        status: "SUCCESS",
        token,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
        },
    };
}
async function forgotPassword(email) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });
    // security: don't reveal if email exists
    if (!user)
        return;
    const otp = await (0, otp_service_1.generateOtp)(user.id, "RESET_PASSWORD");
    await (0, otp_service_1.sendOtpEmail)(user.email, otp.code);
}
async function resetPassword(email, password) {
    const normalizedEmail = email.toLowerCase();
    const hashed = await bcryptjs_1.default.hash(password, 10);
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.user.update({
            where: { email: normalizedEmail },
            data: {
                password: hashed,
                mustChangePassword: false,
                tempPasswordExpiresAt: null,
            },
        }),
        prisma_1.prisma.otp.deleteMany({
            where: {
                user: { is: { email: normalizedEmail } },
                purpose: "RESET_PASSWORD",
            },
        }),
    ]);
}
async function changeTemporaryPassword(email, temporaryPassword, newPassword) {
    const normalizedEmail = email.toLowerCase();
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: normalizedEmail },
    });
    if (!user) {
        throw new Error("INVALID_TEMP_CREDENTIALS");
    }
    const valid = await bcryptjs_1.default.compare(temporaryPassword, user.password);
    if (!valid) {
        throw new Error("INVALID_TEMP_CREDENTIALS");
    }
    if (!user.mustChangePassword) {
        throw new Error("TEMP_PASSWORD_NOT_REQUIRED");
    }
    if (isTempPasswordExpired(user)) {
        throw new Error("TEMP_PASSWORD_EXPIRED");
    }
    const hash = await bcryptjs_1.default.hash(newPassword, 10);
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: {
            password: hash,
            mustChangePassword: false,
            tempPasswordExpiresAt: null,
        },
    });
}
async function logoutUser(userId, sessionId) {
    await prisma_1.prisma.session.updateMany({
        where: { id: sessionId, userId },
        data: { isActive: false },
    });
}
