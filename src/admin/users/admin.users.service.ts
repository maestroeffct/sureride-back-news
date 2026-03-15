import { prisma } from "../../prisma";
import bcrypt from "bcryptjs";
import { ProfileStatus } from "@prisma/client";
import { randomBytes } from "crypto";
import { mailer } from "../../utils/mailer";

const adminUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phoneCountry: true,
  phoneNumber: true,
  dateOfBirth: true,
  nationality: true,
  isVerified: true,
  isActive: true,
  mustChangePassword: true,
  tempPasswordExpiresAt: true,
  profileStatus: true,
  createdAt: true,
  updatedAt: true,
  kyc: true,
} as const;

async function sendUserCredentialsEmailSafe(payload: {
  firstName: string;
  email: string;
  password: string;
}) {
  const loginUrl = process.env.USER_LOGIN_URL;

  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM,
      to: payload.email,
      subject: "Your SureRide account credentials",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Your SureRide account is ready</h2>
          <p>Hello ${payload.firstName},</p>
          <p>Your account has been created by SureRide admin.</p>
          <p><b>Email:</b> ${payload.email}</p>
          <p><b>Temporary password:</b> ${payload.password}</p>
          <p>Please sign in and change your password immediately.</p>
          ${
            loginUrl
              ? `<p><a href="${loginUrl}" target="_blank" rel="noopener noreferrer">Open SureRide app</a></p>`
              : ""
          }
          <p>If prompted, complete OTP verification from your email.</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("[AdminUsers] Failed to send credentials email", {
      email: payload.email,
      error,
    });
    return false;
  }
}

function toUploadUrl(
  fileName: string | null | undefined,
  publicBaseUrl?: string,
): string {
  if (!fileName) return "";
  if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
    return fileName;
  }
  const cleanBase = (publicBaseUrl || "").replace(/\/+$/, "");
  return cleanBase ? `${cleanBase}/uploads/${fileName}` : `/uploads/${fileName}`;
}

function mapUserForAdmin<T extends { password?: string; kyc?: any }>(
  user: T,
  publicBaseUrl?: string,
) {
  const { password, ...safeUser } = user;

  if (!safeUser.kyc) {
    return safeUser;
  }

  return {
    ...safeUser,
    kyc: {
      ...safeUser.kyc,
      passportPhotoUrl: toUploadUrl(safeUser.kyc.passportPhotoUrl, publicBaseUrl),
      governmentIdFrontUrl: toUploadUrl(
        safeUser.kyc.governmentIdFrontUrl,
        publicBaseUrl,
      ),
      governmentIdBackUrl: toUploadUrl(
        safeUser.kyc.governmentIdBackUrl,
        publicBaseUrl,
      ),
      driverLicenseFrontUrl: toUploadUrl(
        safeUser.kyc.driverLicenseFrontUrl,
        publicBaseUrl,
      ),
      driverLicenseBackUrl: toUploadUrl(
        safeUser.kyc.driverLicenseBackUrl,
        publicBaseUrl,
      ),
    },
  };
}

export async function adminListUsers(query: any, publicBaseUrl?: string) {
  const { q, profileStatus, isVerified, isActive, page, limit } = query;

  const where: any = {};

  if (profileStatus) where.profileStatus = profileStatus;
  if (isVerified !== undefined) where.isVerified = isVerified;
  if (isActive !== undefined) where.isActive = isActive;

  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { kyc: true },
    }),
    prisma.user.count({ where }),
  ]);

  const sanitized = items.map((u) => mapUserForAdmin(u, publicBaseUrl));

  return {
    items: sanitized,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function adminGetUser(userId: string, publicBaseUrl?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { kyc: true },
  });

  if (!user) throw new Error("USER_NOT_FOUND");

  return mapUserForAdmin(user, publicBaseUrl);
}

export async function adminUpdateUserStatus(userId: string, isActive: boolean) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { isActive },
      select: adminUserSelect,
    });

    if (!isActive) {
      await tx.session.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    }

    return mapUserForAdmin(user);
  });
}

export async function adminUpdateVerification(
  userId: string,
  isVerified: boolean,
  profileStatus?: any,
) {
  const resolvedProfileStatus =
    profileStatus ?? (isVerified ? undefined : "REJECTED");

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        isVerified,
        ...(resolvedProfileStatus ? { profileStatus: resolvedProfileStatus } : {}),
      },
      select: adminUserSelect,
    });

    if (!isVerified) {
      await tx.session.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    }

    return mapUserForAdmin(user);
  });
}

export async function adminUpdateProfileStatus(
  userId: string,
  profileStatus: any,
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { profileStatus },
    select: adminUserSelect,
  });

  return mapUserForAdmin(user);
}

export async function adminCreateUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phoneCountry: string;
  phoneNumber: string;
  dateOfBirth: Date;
  nationality: string;
  isActive?: boolean;
  isVerified?: boolean;
  profileStatus?: ProfileStatus;
  sendInvite?: boolean;
}) {
  const email = input.email.toLowerCase();
  const sendInvite = input.sendInvite !== false;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        {
          AND: [
            { phoneCountry: input.phoneCountry },
            { phoneNumber: input.phoneNumber },
          ],
        },
      ],
    },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error("USER_ALREADY_EXISTS");
  }

  const plainPassword = input.password ?? randomBytes(6).toString("hex");
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  const ttlHours = Number(process.env.USER_TEMP_PASSWORD_TTL_HOURS || 24);
  const tempPasswordExpiresAt =
    sendInvite && Number.isFinite(ttlHours)
      ? new Date(Date.now() + ttlHours * 60 * 60 * 1000)
      : null;
  const profileStatus =
    input.profileStatus ??
    (input.isVerified ? ProfileStatus.VERIFIED : ProfileStatus.INCOMPLETE);

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email,
      password: hashedPassword,
      phoneCountry: input.phoneCountry,
      phoneNumber: input.phoneNumber,
      dateOfBirth: input.dateOfBirth,
      nationality: input.nationality,
      isActive: input.isActive ?? true,
      isVerified: input.isVerified ?? false,
      profileStatus,
      authProvider: "EMAIL",
      mustChangePassword: sendInvite,
      tempPasswordExpiresAt,
    },
    select: adminUserSelect,
  });

  let inviteEmailSent = false;
  if (sendInvite) {
    inviteEmailSent = await sendUserCredentialsEmailSafe({
      firstName: input.firstName,
      email,
      password: plainPassword,
    });
  }

  return {
    user: mapUserForAdmin(user),
    inviteEmailSent,
    temporaryPasswordGenerated: !input.password,
    temporaryPasswordExpiresAt: user.tempPasswordExpiresAt,
  };
}

export async function adminApproveUserKyc(
  userId: string,
  publicBaseUrl?: string,
) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!existingUser) throw new Error("USER_NOT_FOUND");

  const existingKyc = await prisma.userKyc.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!existingKyc) throw new Error("KYC_NOT_FOUND");

  const user = await prisma.$transaction(async (tx) => {
    await tx.userKyc.update({
      where: { userId },
      data: {
        status: "VERIFIED",
        rejectionReason: null,
      },
    });

    return tx.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        profileStatus: "VERIFIED",
      },
      include: { kyc: true },
    });
  });

  return mapUserForAdmin(user, publicBaseUrl);
}

export async function adminRejectUserKyc(
  userId: string,
  reason: string,
  publicBaseUrl?: string,
) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!existingUser) throw new Error("USER_NOT_FOUND");

  const existingKyc = await prisma.userKyc.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!existingKyc) throw new Error("KYC_NOT_FOUND");

  const user = await prisma.$transaction(async (tx) => {
    await tx.userKyc.update({
      where: { userId },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
      },
    });

    return tx.user.update({
      where: { id: userId },
      data: {
        isVerified: false,
        profileStatus: "REJECTED",
      },
      include: { kyc: true },
    });
  });

  return mapUserForAdmin(user, publicBaseUrl);
}
