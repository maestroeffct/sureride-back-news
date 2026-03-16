import {
  PaymentGatewayConfig,
  PaymentMode,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../prisma";
import { encryptSecret } from "../../modules/payments/payment-secrets";

function isRuntimeProviderImplemented(provider: PaymentProvider) {
  return provider === "STRIPE";
}

function toInputJsonValue(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
}

function maskGateway(config: PaymentGatewayConfig) {
  return {
    id: config.id,
    provider: config.provider,
    displayName: config.displayName,
    mode: config.mode,
    isEnabled: config.isEnabled,
    isDefault: config.isDefault,
    publishableKey: config.publishableKey,
    merchantDisplayName: config.merchantDisplayName,
    supportedCurrencies: config.supportedCurrencies,
    options: config.options,
    hasSecretKey: Boolean(config.secretKeyEncrypted),
    hasWebhookSecret: Boolean(config.webhookSecretEncrypted),
    isRuntimeSupported: isRuntimeProviderImplemented(config.provider),
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

export async function listAdminPaymentGateways() {
  const gateways = await prisma.paymentGatewayConfig.findMany({
    orderBy: { provider: "asc" },
  });

  return gateways.map(maskGateway);
}

export async function createAdminPaymentGateway(input: {
  provider: PaymentProvider;
  displayName?: string;
  mode?: PaymentMode;
  isEnabled?: boolean;
  isDefault?: boolean;
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  merchantDisplayName?: string;
  supportedCurrencies?: string[];
  options?: Record<string, unknown>;
}) {
  const existing = await prisma.paymentGatewayConfig.findUnique({
    where: { provider: input.provider },
    select: { id: true },
  });

  if (existing) {
    throw new Error("PAYMENT_GATEWAY_ALREADY_EXISTS");
  }

  const isDefault = input.isDefault === true;
  const isEnabled = input.isEnabled === true || isDefault;

  if (isDefault && !isRuntimeProviderImplemented(input.provider)) {
    throw new Error("PAYMENT_PROVIDER_NOT_IMPLEMENTED");
  }

  const created = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.paymentGatewayConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.paymentGatewayConfig.create({
      data: {
        provider: input.provider,
        displayName: input.displayName || input.provider,
        mode: input.mode || "TEST",
        isEnabled,
        isDefault,
        publishableKey: input.publishableKey,
        secretKeyEncrypted: encryptSecret(input.secretKey),
        webhookSecretEncrypted: encryptSecret(input.webhookSecret),
        merchantDisplayName: input.merchantDisplayName,
        supportedCurrencies: input.supportedCurrencies || [],
        options: toInputJsonValue(input.options),
      },
    });
  });

  return maskGateway(created);
}

export async function updateAdminPaymentGateway(
  provider: PaymentProvider,
  input: {
    displayName?: string;
    mode?: PaymentMode;
    isEnabled?: boolean;
    isDefault?: boolean;
    publishableKey?: string;
    secretKey?: string;
    webhookSecret?: string;
    merchantDisplayName?: string;
    supportedCurrencies?: string[];
    options?: Record<string, unknown>;
  },
) {
  const existing = await prisma.paymentGatewayConfig.findUnique({
    where: { provider },
  });
  if (!existing) {
    throw new Error("PAYMENT_GATEWAY_NOT_FOUND");
  }

  const willBeDefault = input.isDefault === true;
  const willBeEnabled = input.isEnabled ?? existing.isEnabled;

  if (existing.isDefault && input.isEnabled === false) {
    throw new Error("DEFAULT_GATEWAY_DISABLE_FORBIDDEN");
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (willBeDefault) {
      if (!isRuntimeProviderImplemented(provider)) {
        throw new Error("PAYMENT_PROVIDER_NOT_IMPLEMENTED");
      }
      await tx.paymentGatewayConfig.updateMany({
        where: { isDefault: true, provider: { not: provider } },
        data: { isDefault: false },
      });
    }

    return tx.paymentGatewayConfig.update({
      where: { provider },
      data: {
        displayName: input.displayName,
        mode: input.mode,
        isEnabled: willBeDefault ? true : willBeEnabled,
        isDefault: input.isDefault,
        publishableKey: input.publishableKey,
        secretKeyEncrypted:
          input.secretKey === undefined
            ? undefined
            : encryptSecret(input.secretKey),
        webhookSecretEncrypted:
          input.webhookSecret === undefined
            ? undefined
            : encryptSecret(input.webhookSecret),
        merchantDisplayName: input.merchantDisplayName,
        supportedCurrencies: input.supportedCurrencies,
        options: toInputJsonValue(input.options),
      },
    });
  });

  return maskGateway(updated);
}

export async function setAdminPaymentGatewayEnabled(
  provider: PaymentProvider,
  isEnabled: boolean,
) {
  const existing = await prisma.paymentGatewayConfig.findUnique({
    where: { provider },
  });
  if (!existing) {
    throw new Error("PAYMENT_GATEWAY_NOT_FOUND");
  }
  if (existing.isDefault && !isEnabled) {
    throw new Error("DEFAULT_GATEWAY_DISABLE_FORBIDDEN");
  }

  const updated = await prisma.paymentGatewayConfig.update({
    where: { provider },
    data: { isEnabled },
  });

  return maskGateway(updated);
}

export async function setAdminDefaultPaymentGateway(provider: PaymentProvider) {
  const existing = await prisma.paymentGatewayConfig.findUnique({
    where: { provider },
  });
  if (!existing) {
    throw new Error("PAYMENT_GATEWAY_NOT_FOUND");
  }
  if (!existing.isEnabled) {
    throw new Error("PAYMENT_GATEWAY_NOT_ENABLED");
  }
  if (!isRuntimeProviderImplemented(provider)) {
    throw new Error("PAYMENT_PROVIDER_NOT_IMPLEMENTED");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.paymentGatewayConfig.updateMany({
      where: { isDefault: true, provider: { not: provider } },
      data: { isDefault: false },
    });
    return tx.paymentGatewayConfig.update({
      where: { provider },
      data: { isDefault: true },
    });
  });

  return maskGateway(updated);
}

export async function getAdminPaymentSettings() {
  return prisma.paymentSettings.upsert({
    where: { id: "GLOBAL" },
    update: {},
    create: { id: "GLOBAL" },
  });
}

export async function updateAdminPaymentSettings(input: {
  defaultCurrency?: string;
  allowDelayedPaymentMethods?: boolean;
  bookingAutoCancelMinutes?: number;
}) {
  return prisma.paymentSettings.upsert({
    where: { id: "GLOBAL" },
    update: {
      ...(input.defaultCurrency !== undefined
        ? { defaultCurrency: input.defaultCurrency }
        : {}),
      ...(input.allowDelayedPaymentMethods !== undefined
        ? { allowDelayedPaymentMethods: input.allowDelayedPaymentMethods }
        : {}),
      ...(input.bookingAutoCancelMinutes !== undefined
        ? { bookingAutoCancelMinutes: input.bookingAutoCancelMinutes }
        : {}),
    },
    create: {
      id: "GLOBAL",
      defaultCurrency: input.defaultCurrency || "ngn",
      allowDelayedPaymentMethods: input.allowDelayedPaymentMethods ?? true,
      bookingAutoCancelMinutes: input.bookingAutoCancelMinutes ?? 30,
    },
  });
}

export async function listAdminPaymentTransactions(input: {
  provider?: PaymentProvider;
  status?: PaymentStatus;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}) {
  const where = {
    ...(input.provider ? { paymentProvider: input.provider } : {}),
    ...(input.status ? { paymentStatus: input.status } : {}),
    ...(input.from || input.to
      ? {
          createdAt: {
            ...(input.from ? { gte: input.from } : {}),
            ...(input.to ? { lte: input.to } : {}),
          },
        }
      : {}),
    paymentProvider: input.provider ?? { not: null },
  } as const;

  const skip = (input.page - 1) * input.limit;

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        carId: true,
        totalPrice: true,
        currency: true,
        status: true,
        paymentProvider: true,
        paymentStatus: true,
        paymentReference: true,
        paymentError: true,
        paidAt: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        car: {
          select: {
            brand: true,
            model: true,
          },
        },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    items,
    meta: {
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
    },
  };
}
