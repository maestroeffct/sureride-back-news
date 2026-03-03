import { prisma } from "../../prisma";
import { mailer } from "../../utils/mailer";

export function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function generateOtp(
  userId: string,
  purpose: "VERIFY_ACCOUNT" | "RESET_PASSWORD" = "VERIFY_ACCOUNT",
) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  return prisma.otp.create({
    data: {
      userId,
      code,
      expiresAt,
      purpose,
    },
  });
}

export async function verifyOtp(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.isVerified) throw new Error("ALREADY_VERIFIED");

  const otp = await prisma.otp.findFirst({
    where: {
      userId,
      code,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otp) {
    throw new Error("INVALID_OR_EXPIRED_OTP");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    }),
    prisma.otp.deleteMany({
      where: { userId },
    }),
  ]);
}

// placeholder (Twilio / Termii later)
export async function sendOtpEmail(email: string, code: string) {
  await mailer.sendMail({
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

export async function resendOtp(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.isVerified) throw new Error("ALREADY_VERIFIED");

  const existingOtp = await prisma.otp.findFirst({
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
      const secondsLeft = Math.ceil(
        (RESEND_COOLDOWN_MS - (now - lastSent)) / 1000,
      );
      throw new Error(`COOLDOWN_${secondsLeft}`);
    }

    // resend same OTP
    await prisma.otp.update({
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

export async function verifyResetOtp(email: string, code: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) throw new Error("INVALID_OTP");

  const otp = await prisma.otp.findFirst({
    where: {
      userId: user.id,
      code,
      purpose: "RESET_PASSWORD",
      expiresAt: { gt: new Date() },
    },
  });

  if (!otp) throw new Error("INVALID_OTP");

  return { userId: user.id };
}

export async function resendForgotPasswordOtp(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // ✅ Always return success (anti-enumeration)
  if (!user) return;

  // ⏱ Rate limit (60s)
  const lastOtp = await prisma.otp.findFirst({
    where: {
      userId: user.id,
      purpose: "RESET_PASSWORD",
    },
    orderBy: { createdAt: "desc" },
  });

  if (lastOtp && Date.now() - lastOtp.lastSentAt.getTime() < 60_000) {
    throw new Error("OTP_TOO_SOON");
  }

  // ❌ Invalidate previous OTPs
  await prisma.otp.updateMany({
    where: {
      userId: user.id,
      purpose: "RESET_PASSWORD",
      used: false,
    },
    data: { used: true },
  });

  // ✅ Create new OTP
  const code = generateCode();

  await prisma.otp.create({
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
