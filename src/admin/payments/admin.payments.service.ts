import {
  PaymentGatewayRuntimeAdapter,
  PaymentMode,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../prisma";
import {
  decryptSecret,
  encryptSecret,
} from "../../modules/payments/payment-secrets";

const IMPLEMENTED_RUNTIME_ADAPTERS = new Set<PaymentGatewayRuntimeAdapter>([
  "STRIPE",
]);

type PaymentFieldInput = {
  key: string;
  label: string;
  type: "TEXT" | "SECRET" | "EMAIL" | "URL" | "NUMBER" | "BOOLEAN" | "JSON";
  isRequired: boolean;
  isSecret: boolean;
  sortOrder: number;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  validationRegex?: string;
  options?: Record<string, unknown>;
};

type PaymentValueInput = {
  fieldKey: string;
  value: string;
};

type PrismaTx = Prisma.TransactionClient;

type GatewayWithRelations = Prisma.PaymentGatewayGetPayload<{
  include: {
    fields: {
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }];
    };
    values: {
      include: {
        field: true;
      };
    };
  };
}>;

function toInputJsonValue(
  value: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

function isRuntimeSupported(adapter: PaymentGatewayRuntimeAdapter) {
  return IMPLEMENTED_RUNTIME_ADAPTERS.has(adapter);
}

function shouldEncryptField(field: { isSecret: boolean; type: string }) {
  return field.isSecret || field.type === "SECRET";
}

function sanitizeValue(value: string) {
  return value.trim();
}

function hasStoredValue(value: {
  valuePlain: string | null;
  valueEncrypted: string | null;
} | null) {
  if (!value) return false;
  if (value.valueEncrypted && value.valueEncrypted.trim()) return true;
  if (value.valuePlain && value.valuePlain.trim()) return true;
  return false;
}

function fieldRuntimeRequiredKeys(adapter: PaymentGatewayRuntimeAdapter) {
  if (adapter === "STRIPE") {
    return ["publishable_key", "secret_key"];
  }
  return [];
}

function valueMapFromGateway(gateway: GatewayWithRelations) {
  const values = new Map<string, string>();

  for (const valueRow of gateway.values) {
    const decrypted = valueRow.valueEncrypted
      ? decryptSecret(valueRow.valueEncrypted)
      : valueRow.valuePlain;

    if (decrypted && decrypted.trim()) {
      values.set(valueRow.field.key, decrypted.trim());
    }
  }

  for (const field of gateway.fields) {
    if (!values.has(field.key) && field.defaultValue?.trim()) {
      values.set(field.key, field.defaultValue.trim());
    }
  }

  return values;
}

function getMissingRequiredFieldKeys(gateway: GatewayWithRelations) {
  const valueByFieldId = new Map(
    gateway.values.map((value) => [value.fieldId, value]),
  );

  return gateway.fields
    .filter((field) => field.isRequired)
    .filter((field) => {
      const found = valueByFieldId.get(field.id);
      if (hasStoredValue(found ?? null)) return false;
      return !(field.defaultValue && field.defaultValue.trim());
    })
    .map((field) => field.key);
}

function getMissingRuntimeFieldKeys(gateway: GatewayWithRelations) {
  const required = fieldRuntimeRequiredKeys(gateway.runtimeAdapter);
  if (!required.length) return [];
  const values = valueMapFromGateway(gateway);
  return required.filter((key) => !values.get(key));
}

function ensureDefaultEligibility(gateway: GatewayWithRelations) {
  if (!gateway.isEnabled) {
    throw new Error("GATEWAY_NOT_ENABLED");
  }
  if (!isRuntimeSupported(gateway.runtimeAdapter)) {
    throw new Error("GATEWAY_RUNTIME_NOT_IMPLEMENTED");
  }

  const missingRequired = getMissingRequiredFieldKeys(gateway);
  const missingRuntime = getMissingRuntimeFieldKeys(gateway);
  if (missingRequired.length || missingRuntime.length) {
    throw new Error("GATEWAY_REQUIRED_VALUES_MISSING");
  }
}

function mapGatewayResponse(gateway: GatewayWithRelations) {
  const valueByFieldId = new Map(
    gateway.values.map((value) => [value.fieldId, value]),
  );

  const missingRequired = getMissingRequiredFieldKeys(gateway);
  const missingRuntime = getMissingRuntimeFieldKeys(gateway);
  const runtimeSupported = isRuntimeSupported(gateway.runtimeAdapter);

  return {
    key: gateway.key,
    displayName: gateway.displayName,
    logoUrl: gateway.logoUrl,
    runtimeAdapter: gateway.runtimeAdapter,
    mode: gateway.mode,
    isEnabled: gateway.isEnabled,
    isDefault: gateway.isDefault,
    merchantDisplayName: gateway.merchantDisplayName,
    supportedCurrencies: gateway.supportedCurrencies,
    metadata: gateway.metadata,
    fields: gateway.fields.map((field) => {
      const value = valueByFieldId.get(field.id);
      return {
        key: field.key,
        label: field.label,
        type: field.type,
        isRequired: field.isRequired,
        isSecret: field.isSecret,
        sortOrder: field.sortOrder,
        placeholder: field.placeholder,
        helpText: field.helpText,
        defaultValue: field.isSecret ? null : field.defaultValue,
        validationRegex: field.validationRegex,
        options: field.options,
        credentialState: {
          hasValue:
            hasStoredValue(value ?? null) ||
            Boolean(field.defaultValue && field.defaultValue.trim()),
          updatedAt: value?.updatedAt || null,
        },
      };
    }),
    isRuntimeSupported: runtimeSupported,
    isReadyForCheckout:
      gateway.isEnabled &&
      runtimeSupported &&
      missingRequired.length === 0 &&
      missingRuntime.length === 0,
  };
}

async function getGatewayOrThrow(
  tx: PrismaTx,
  key: string,
): Promise<GatewayWithRelations> {
  const gateway = await tx.paymentGateway.findFirst({
    where: { key, isArchived: false },
    include: {
      fields: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      values: {
        include: { field: true },
      },
    },
  });

  if (!gateway) throw new Error("GATEWAY_NOT_FOUND");
  return gateway;
}

function ensureUniqueFieldKeys(fields: Array<{ key: string }>) {
  const set = new Set<string>();
  for (const field of fields) {
    if (set.has(field.key)) {
      throw new Error("GATEWAY_FIELD_KEY_CONFLICT");
    }
    set.add(field.key);
  }
}

async function replaceGatewayValues(
  tx: PrismaTx,
  gateway: GatewayWithRelations,
  values: PaymentValueInput[],
  updatedByAdminId?: string,
) {
  if (!values.length) return;

  const fieldsByKey = new Map(gateway.fields.map((field) => [field.key, field]));

  for (const value of values) {
    const field = fieldsByKey.get(value.fieldKey);
    if (!field) {
      throw new Error("GATEWAY_FIELD_NOT_FOUND");
    }

    const normalized = sanitizeValue(value.value);
    const shouldEncrypt = shouldEncryptField(field);

    await tx.paymentGatewayFieldValue.upsert({
      where: {
        gatewayId_fieldId: {
          gatewayId: gateway.id,
          fieldId: field.id,
        },
      },
      create: {
        gatewayId: gateway.id,
        fieldId: field.id,
        valuePlain: shouldEncrypt ? null : normalized || null,
        valueEncrypted: shouldEncrypt
          ? encryptSecret(normalized || null)
          : null,
        updatedByAdminId,
      },
      update: {
        valuePlain: shouldEncrypt ? null : normalized || null,
        valueEncrypted: shouldEncrypt
          ? encryptSecret(normalized || null)
          : null,
        updatedByAdminId,
      },
    });
  }
}

async function unsetOtherDefaults(tx: PrismaTx, key: string) {
  await tx.paymentGateway.updateMany({
    where: { isDefault: true, isArchived: false, key: { not: key } },
    data: { isDefault: false },
  });
}

export async function listAdminPaymentGateways() {
  const gateways = await prisma.paymentGateway.findMany({
    where: { isArchived: false },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    include: {
      fields: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      values: {
        include: { field: true },
      },
    },
  });

  return gateways.map(mapGatewayResponse);
}

export async function createAdminPaymentGateway(input: {
  key: string;
  displayName: string;
  logoUrl?: string;
  runtimeAdapter?: PaymentGatewayRuntimeAdapter;
  mode?: PaymentMode;
  isEnabled?: boolean;
  isDefault?: boolean;
  merchantDisplayName?: string;
  supportedCurrencies?: string[];
  metadata?: Record<string, unknown>;
  fields?: PaymentFieldInput[];
  values?: PaymentValueInput[];
  updatedByAdminId?: string;
}) {
  ensureUniqueFieldKeys(input.fields || []);

  const existing = await prisma.paymentGateway.findUnique({
    where: { key: input.key },
    select: { id: true },
  });
  if (existing) throw new Error("GATEWAY_KEY_ALREADY_EXISTS");

  const gateway = await prisma.$transaction(async (tx) => {
    await tx.paymentGateway.create({
      data: {
        key: input.key,
        displayName: input.displayName,
        logoUrl: input.logoUrl,
        runtimeAdapter: input.runtimeAdapter || "CUSTOM",
        mode: input.mode || "TEST",
        isEnabled: input.isEnabled || input.isDefault || false,
        merchantDisplayName: input.merchantDisplayName,
        supportedCurrencies: input.supportedCurrencies || [],
        metadata: toInputJsonValue(input.metadata),
      },
    });

    const gatewayBase = await getGatewayOrThrow(tx, input.key);

    if (input.fields?.length) {
      await tx.paymentGatewayField.createMany({
        data: input.fields.map((field) => ({
          gatewayId: gatewayBase.id,
          key: field.key,
          label: field.label,
          type: field.type,
          isRequired: field.isRequired,
          isSecret: field.isSecret,
          sortOrder: field.sortOrder,
          placeholder: field.placeholder,
          helpText: field.helpText,
          defaultValue: field.defaultValue,
          validationRegex: field.validationRegex,
          options: toInputJsonValue(field.options),
        })),
      });
    }

    let withFields = await getGatewayOrThrow(tx, input.key);
    if (input.values?.length) {
      await replaceGatewayValues(
        tx,
        withFields,
        input.values,
        input.updatedByAdminId,
      );
      withFields = await getGatewayOrThrow(tx, input.key);
    }

    if (input.isDefault) {
      ensureDefaultEligibility(withFields);
      await unsetOtherDefaults(tx, input.key);
      await tx.paymentGateway.update({
        where: { id: withFields.id },
        data: { isDefault: true, isEnabled: true },
      });
    }

    return getGatewayOrThrow(tx, input.key);
  });

  return mapGatewayResponse(gateway);
}

export async function updateAdminPaymentGateway(
  key: string,
  input: {
    displayName?: string;
    logoUrl?: string | null;
    runtimeAdapter?: PaymentGatewayRuntimeAdapter;
    mode?: PaymentMode;
    merchantDisplayName?: string | null;
    supportedCurrencies?: string[];
    metadata?: Record<string, unknown> | null;
  },
) {
  const gateway = await prisma.$transaction(async (tx) => {
    const existing = await getGatewayOrThrow(tx, key);

    await tx.paymentGateway.update({
      where: { id: existing.id },
      data: {
        ...(input.displayName !== undefined
          ? { displayName: input.displayName }
          : {}),
        ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
        ...(input.runtimeAdapter !== undefined
          ? { runtimeAdapter: input.runtimeAdapter }
          : {}),
        ...(input.mode !== undefined ? { mode: input.mode } : {}),
        ...(input.merchantDisplayName !== undefined
          ? { merchantDisplayName: input.merchantDisplayName }
          : {}),
        ...(input.supportedCurrencies !== undefined
          ? { supportedCurrencies: input.supportedCurrencies }
          : {}),
        ...(input.metadata !== undefined
          ? { metadata: toInputJsonValue(input.metadata) }
          : {}),
      },
    });

    const updated = await getGatewayOrThrow(tx, key);
    if (updated.isDefault) {
      ensureDefaultEligibility(updated);
    }

    return updated;
  });

  return mapGatewayResponse(gateway);
}

export async function replaceAdminPaymentGatewayFields(
  key: string,
  input: {
    fields: PaymentFieldInput[];
  },
) {
  ensureUniqueFieldKeys(input.fields);

  const gateway = await prisma.$transaction(async (tx) => {
    const existing = await getGatewayOrThrow(tx, key);

    const currentValueByFieldKey = new Map<
      string,
      {
        valuePlain: string | null;
        valueEncrypted: string | null;
      }
    >();

    for (const valueRow of existing.values) {
      currentValueByFieldKey.set(valueRow.field.key, {
        valuePlain: valueRow.valuePlain,
        valueEncrypted: valueRow.valueEncrypted,
      });
    }

    await tx.paymentGatewayField.deleteMany({
      where: { gatewayId: existing.id },
    });

    if (input.fields.length) {
      await tx.paymentGatewayField.createMany({
        data: input.fields.map((field) => ({
          gatewayId: existing.id,
          key: field.key,
          label: field.label,
          type: field.type,
          isRequired: field.isRequired,
          isSecret: field.isSecret,
          sortOrder: field.sortOrder,
          placeholder: field.placeholder,
          helpText: field.helpText,
          defaultValue: field.defaultValue,
          validationRegex: field.validationRegex,
          options: toInputJsonValue(field.options),
        })),
      });
    }

    const withNewFields = await getGatewayOrThrow(tx, key);

    for (const field of withNewFields.fields) {
      const oldValue = currentValueByFieldKey.get(field.key);
      if (!oldValue || (!oldValue.valuePlain && !oldValue.valueEncrypted)) {
        continue;
      }

      await tx.paymentGatewayFieldValue.create({
        data: {
          gatewayId: withNewFields.id,
          fieldId: field.id,
          valuePlain: oldValue.valuePlain,
          valueEncrypted: oldValue.valueEncrypted,
        },
      });
    }

    const updated = await getGatewayOrThrow(tx, key);
    if (updated.isDefault) {
      ensureDefaultEligibility(updated);
    }

    return updated;
  });

  return mapGatewayResponse(gateway);
}

export async function replaceAdminPaymentGatewayValues(
  key: string,
  input: {
    values: PaymentValueInput[];
    updatedByAdminId?: string;
  },
) {
  const gateway = await prisma.$transaction(async (tx) => {
    let existing = await getGatewayOrThrow(tx, key);
    await replaceGatewayValues(tx, existing, input.values, input.updatedByAdminId);
    existing = await getGatewayOrThrow(tx, key);

    if (existing.isDefault) {
      ensureDefaultEligibility(existing);
    }

    return existing;
  });

  return mapGatewayResponse(gateway);
}

export async function setAdminPaymentGatewayEnabled(key: string, isEnabled: boolean) {
  const gateway = await prisma.$transaction(async (tx) => {
    const existing = await getGatewayOrThrow(tx, key);

    if (existing.isDefault && !isEnabled) {
      throw new Error("GATEWAY_DEFAULT_DISABLE_FORBIDDEN");
    }

    await tx.paymentGateway.update({
      where: { id: existing.id },
      data: { isEnabled },
    });

    return getGatewayOrThrow(tx, key);
  });

  return mapGatewayResponse(gateway);
}

export async function setAdminDefaultPaymentGateway(key: string) {
  const gateway = await prisma.$transaction(async (tx) => {
    const existing = await getGatewayOrThrow(tx, key);
    ensureDefaultEligibility(existing);
    await unsetOtherDefaults(tx, key);

    await tx.paymentGateway.update({
      where: { id: existing.id },
      data: { isDefault: true, isEnabled: true },
    });

    return getGatewayOrThrow(tx, key);
  });

  return mapGatewayResponse(gateway);
}

export async function softDeleteAdminPaymentGateway(key: string) {
  await prisma.$transaction(async (tx) => {
    const existing = await getGatewayOrThrow(tx, key);
    if (existing.isDefault) {
      throw new Error("GATEWAY_DEFAULT_DELETE_FORBIDDEN");
    }

    await tx.paymentGateway.update({
      where: { id: existing.id },
      data: {
        isArchived: true,
        isEnabled: false,
        isDefault: false,
      },
    });
  });
}

export async function updateAdminPaymentGatewayLogo(key: string, logoUrl: string) {
  const gateway = await prisma.$transaction(async (tx) => {
    const existing = await getGatewayOrThrow(tx, key);
    await tx.paymentGateway.update({
      where: { id: existing.id },
      data: { logoUrl },
    });
    return getGatewayOrThrow(tx, key);
  });

  return mapGatewayResponse(gateway);
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
  gatewayKey?: string;
  status?: PaymentStatus;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}) {
  const where: Prisma.BookingWhereInput = {
    ...(input.provider ? { paymentProvider: input.provider } : {}),
    ...(input.gatewayKey ? { paymentGatewayKey: input.gatewayKey } : {}),
    ...(input.status ? { paymentStatus: input.status } : {}),
    ...(input.from || input.to
      ? {
          createdAt: {
            ...(input.from ? { gte: input.from } : {}),
            ...(input.to ? { lte: input.to } : {}),
          },
        }
      : {}),
    OR: [{ paymentProvider: { not: null } }, { paymentGatewayKey: { not: null } }],
  };

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
        paymentGatewayKey: true,
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
