import bcrypt from "bcryptjs";
import { prisma } from "../../prisma";
import { signToken } from "../../utils/jwt";

export async function providerLogin(email: string, password: string) {
  const provider = await prisma.rentalProvider.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!provider) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (!provider.password) {
    throw new Error("PROVIDER_ACCOUNT_NOT_READY");
  }

  const ok = await bcrypt.compare(password, provider.password);
  if (!ok) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (provider.status === "SUSPENDED" || !provider.isActive) {
    throw new Error("PROVIDER_SUSPENDED");
  }

  if (provider.status !== "ACTIVE") {
    throw new Error("PROVIDER_PENDING_APPROVAL");
  }

  if (!provider.isVerified) {
    throw new Error("PROVIDER_NOT_VERIFIED");
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const session = await prisma.providerSession.create({
    data: {
      providerId: provider.id,
      expiresAt,
    },
  });

  const token = signToken({
    type: "PROVIDER",
    sessionId: session.id,
    providerId: provider.id,
    email: provider.email,
  });

  return {
    token,
    provider: {
      id: provider.id,
      name: provider.name,
      email: provider.email,
      status: provider.status,
    },
  };
}

export async function providerLogout(sessionId: string) {
  await prisma.providerSession.update({
    where: { id: sessionId },
    data: { isActive: false },
  });
}
