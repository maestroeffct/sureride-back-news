import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { signToken } from "../utils/jwt";

export async function adminLogin(email: string, password: string) {
  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!admin || !admin.isActive) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) throw new Error("INVALID_CREDENTIALS");

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const session = await prisma.$transaction(async (tx) => {
    const createdSession = await tx.adminSession.create({
      data: {
        adminId: admin.id,
        expiresAt,
      },
    });
    await tx.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    return createdSession;
  });

  const token = signToken({
    type: "ADMIN",
    sessionId: session.id,
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  });

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    },
  };
}

export async function adminLogout(sessionId: string) {
  await prisma.adminSession.update({
    where: { id: sessionId },
    data: { isActive: false },
  });
}
