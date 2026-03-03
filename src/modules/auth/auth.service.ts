import bcrypt from "bcryptjs";
import { prisma } from "../../prisma";
import { generateOtp, sendOtpEmail } from "./otp.service";
import { signToken } from "../../utils/jwt";
import { maskPhone } from "../../utils/maskPhone";

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string; // +2348128903046
  country: string; // Nigeria
  dob: string; // ISO date
};

export async function registerUser(data: RegisterPayload) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // ✅ split phone into country code + number
  const match = data.phone.match(/^(\+\d{1,3})(\d{6,15})$/);

  if (!match) {
    throw new Error("Invalid phone format");
  }

  const [phoneCountry, phoneNumber] = match;

  const existingUser = await prisma.user.findFirst({
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

  return prisma.user.create({
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

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // 🔒 Not verified → send OTP
  if (!user.isVerified) {
    const otp = await generateOtp(user.id, "VERIFY_ACCOUNT");
    await sendOtpEmail(user.email, otp.code);

    return {
      status: "VERIFICATION_REQUIRED",
      userId: user.id,
      phone: maskPhone(user.phoneNumber),
    };
  }

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // ✅ Verified → issue JWT
  const token = signToken({
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

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // security: don't reveal if email exists
  if (!user) return;

  const otp = await generateOtp(user.id, "RESET_PASSWORD");
  await sendOtpEmail(user.email, otp.code);
}

export async function resetPassword(email: string, password: string) {
  const hashed = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: email },
      data: { password: hashed },
    }),
    prisma.otp.deleteMany({
      where: { user: { is: { email: email } }, purpose: "RESET_PASSWORD" },
    }),
  ]);
}

export async function logoutUser(userId: string, sessionId: string) {
  await prisma.session.updateMany({
    where: { id: sessionId, userId },
    data: { isActive: false },
  });
}
