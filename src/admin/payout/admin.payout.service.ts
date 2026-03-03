import { prisma } from "../../prisma";

export async function upsertProviderPayoutAccount(
  providerId: string,
  data: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    currency?: string;
  },
) {
  return prisma.providerPayoutAccount.upsert({
    where: { providerId },
    update: {
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      currency: data.currency ?? "NGN",
      isVerified: true, // admin-set = verified
    },
    create: {
      providerId,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      currency: data.currency ?? "NGN",
      isVerified: true,
    },
  });
}

export async function createPayout(
  providerId: string,
  amount: number,
  note?: string,
) {
  return prisma.providerPayout.create({
    data: {
      providerId,
      amount,
      note,
      status: "PENDING",
    },
  });
}

export async function markPayoutPaid(payoutId: string, reference?: string) {
  return prisma.providerPayout.update({
    where: { id: payoutId },
    data: { status: "PAID", reference },
  });
}
