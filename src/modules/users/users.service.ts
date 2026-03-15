import { prisma } from "../../prisma";
import bcrypt from "bcryptjs";

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      kyc: true,
    },
  });

  if (!user) throw new Error("USER_NOT_FOUND");

  const { password, ...safeUser } = user;

  return safeUser;
}

export async function updateCurrentUser(userId: string, data: any) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    const { password, ...safeUser } = user;

    return safeUser;
  } catch (err: any) {
    if (err.code === "P2002") {
      throw new Error("DUPLICATE");
    }
    throw err;
  }
}

export async function updateUserPassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("USER_NOT_FOUND");

  const valid = await bcrypt.compare(oldPassword, user.password);

  if (!valid) throw new Error("INVALID_OLD_PASSWORD");

  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hash,
      mustChangePassword: false,
      tempPasswordExpiresAt: null,
    },
  });

  return { message: "Password updated successfully" };
}

export async function deactivateUser(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
    },
  });

  const { password, ...safeUser } = user;

  return safeUser;
}
