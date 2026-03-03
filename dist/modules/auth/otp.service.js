"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCode = generateCode;
exports.generateOtp = generateOtp;
exports.verifyOtp = verifyOtp;
exports.sendOtpEmail = sendOtpEmail;
exports.resendOtp = resendOtp;
exports.verifyResetOtp = verifyResetOtp;
exports.resendForgotPasswordOtp = resendForgotPasswordOtp;
const prisma_1 = require("../../prisma");
const mailer_1 = require("../../utils/mailer");
function generateCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}
async function generateOtp(userId, purpose = "VERIFY_ACCOUNT") {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    return prisma_1.prisma.otp.create({
        data: {
            userId,
            code,
            expiresAt,
            purpose,
        },
    });
}
async function verifyOtp(userId, code) {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new Error("USER_NOT_FOUND");
    if (user.isVerified)
        throw new Error("ALREADY_VERIFIED");
    const otp = await prisma_1.prisma.otp.findFirst({
        where: {
            userId,
            code,
            expiresAt: { gt: new Date() },
        },
    });
    if (!otp) {
        throw new Error("INVALID_OR_EXPIRED_OTP");
    }
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.user.update({
            where: { id: userId },
            data: { isVerified: true },
        }),
        prisma_1.prisma.otp.deleteMany({
            where: { userId },
        }),
    ]);
}
// placeholder (Twilio / Termii later)
async function sendOtpEmail(email, code) {
    await mailer_1.mailer.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Your SureRide Verification Code",
        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6">
        <h2>Verify your SureRide account</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 4px;">${code}</h1>
        <p>This code will expire in <b>5 minutes</b>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br />
        <p>— SureRide Team</p>
      </div>
    `,
    });
}
// RESEND OTP FUNCTION (if needed in future)
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
async function resendOtp(userId) {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new Error("USER_NOT_FOUND");
    if (user.isVerified)
        throw new Error("ALREADY_VERIFIED");
    const existingOtp = await prisma_1.prisma.otp.findFirst({
        where: {
            userId,
            expiresAt: { gt: new Date() },
        },
    });
    const now = Date.now();
    // 🔒 Cooldown check
    if (existingOtp) {
        const lastSent = existingOtp.lastSentAt.getTime();
        if (now - lastSent < RESEND_COOLDOWN_MS) {
            const secondsLeft = Math.ceil((RESEND_COOLDOWN_MS - (now - lastSent)) / 1000);
            throw new Error(`COOLDOWN_${secondsLeft}`);
        }
        // resend same OTP
        await prisma_1.prisma.otp.update({
            where: { id: existingOtp.id },
            data: { lastSentAt: new Date() },
        });
        await sendOtpEmail(user.email, existingOtp.code);
        return;
    }
    // No valid OTP → generate new
    const otp = await generateOtp(userId);
    await sendOtpEmail(user.email, otp.code);
}
async function verifyResetOtp(email, code) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });
    if (!user)
        throw new Error("INVALID_OTP");
    const otp = await prisma_1.prisma.otp.findFirst({
        where: {
            userId: user.id,
            code,
            purpose: "RESET_PASSWORD",
            expiresAt: { gt: new Date() },
        },
    });
    if (!otp)
        throw new Error("INVALID_OTP");
    return { userId: user.id };
}
async function resendForgotPasswordOtp(email) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });
    // ✅ Always return success (anti-enumeration)
    if (!user)
        return;
    // ⏱ Rate limit (60s)
    const lastOtp = await prisma_1.prisma.otp.findFirst({
        where: {
            userId: user.id,
            purpose: "RESET_PASSWORD",
        },
        orderBy: { createdAt: "desc" },
    });
    if (lastOtp && Date.now() - lastOtp.lastSentAt.getTime() < 60000) {
        throw new Error("OTP_TOO_SOON");
    }
    // ❌ Invalidate previous OTPs
    await prisma_1.prisma.otp.updateMany({
        where: {
            userId: user.id,
            purpose: "RESET_PASSWORD",
            used: false,
        },
        data: { used: true },
    });
    // ✅ Create new OTP
    const code = generateCode();
    await prisma_1.prisma.otp.create({
        data: {
            userId: user.id,
            code,
            purpose: "RESET_PASSWORD",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            lastSentAt: new Date(),
        },
    });
    // 📧 Send email
    await sendOtpEmail(user.email, code);
}
