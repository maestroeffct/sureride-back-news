INSERT INTO "PaymentGateway" (
  "id",
  "key",
  "displayName",
  "logoUrl",
  "runtimeAdapter",
  "mode",
  "isEnabled",
  "isDefault",
  "isArchived",
  "merchantDisplayName",
  "supportedCurrencies",
  "metadata",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy_' || lower(cfg."provider"::text) AS "id",
  lower(cfg."provider"::text) AS "key",
  cfg."displayName",
  NULL AS "logoUrl",
  cfg."provider"::text::"PaymentGatewayRuntimeAdapter" AS "runtimeAdapter",
  cfg."mode",
  cfg."isEnabled",
  cfg."isDefault",
  false AS "isArchived",
  cfg."merchantDisplayName",
  cfg."supportedCurrencies",
  cfg."options" AS "metadata",
  cfg."createdAt",
  cfg."updatedAt"
FROM "PaymentGatewayConfig" cfg
WHERE NOT EXISTS (
  SELECT 1
  FROM "PaymentGateway" pg
  WHERE pg."key" = lower(cfg."provider"::text)
);

INSERT INTO "PaymentGatewayField" (
  "id",
  "gatewayId",
  "key",
  "label",
  "type",
  "isRequired",
  "isSecret",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
SELECT
  pg."id" || '_publishable_key',
  pg."id",
  'publishable_key',
  'Publishable Key',
  'TEXT',
  true,
  false,
  1,
  now(),
  now()
FROM "PaymentGateway" pg
WHERE pg."runtimeAdapter" IN ('STRIPE', 'PAYSTACK', 'FLUTTERWAVE')
  AND NOT EXISTS (
    SELECT 1
    FROM "PaymentGatewayField" f
    WHERE f."gatewayId" = pg."id"
      AND f."key" = 'publishable_key'
  );

INSERT INTO "PaymentGatewayField" (
  "id",
  "gatewayId",
  "key",
  "label",
  "type",
  "isRequired",
  "isSecret",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
SELECT
  pg."id" || '_secret_key',
  pg."id",
  'secret_key',
  'Secret Key',
  'SECRET',
  true,
  true,
  2,
  now(),
  now()
FROM "PaymentGateway" pg
WHERE pg."runtimeAdapter" IN ('STRIPE', 'PAYSTACK', 'FLUTTERWAVE')
  AND NOT EXISTS (
    SELECT 1
    FROM "PaymentGatewayField" f
    WHERE f."gatewayId" = pg."id"
      AND f."key" = 'secret_key'
  );

INSERT INTO "PaymentGatewayField" (
  "id",
  "gatewayId",
  "key",
  "label",
  "type",
  "isRequired",
  "isSecret",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
SELECT
  pg."id" || '_webhook_secret',
  pg."id",
  'webhook_secret',
  'Webhook Secret',
  'SECRET',
  false,
  true,
  3,
  now(),
  now()
FROM "PaymentGateway" pg
WHERE pg."runtimeAdapter" IN ('STRIPE', 'PAYSTACK', 'FLUTTERWAVE')
  AND NOT EXISTS (
    SELECT 1
    FROM "PaymentGatewayField" f
    WHERE f."gatewayId" = pg."id"
      AND f."key" = 'webhook_secret'
  );

INSERT INTO "PaymentGatewayFieldValue" (
  "id",
  "gatewayId",
  "fieldId",
  "valuePlain",
  "valueEncrypted",
  "updatedAt"
)
SELECT
  pg."id" || '_publishable_value',
  pg."id",
  f."id",
  cfg."publishableKey",
  NULL,
  now()
FROM "PaymentGatewayConfig" cfg
JOIN "PaymentGateway" pg
  ON pg."key" = lower(cfg."provider"::text)
JOIN "PaymentGatewayField" f
  ON f."gatewayId" = pg."id"
  AND f."key" = 'publishable_key'
WHERE cfg."publishableKey" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "PaymentGatewayFieldValue" v
    WHERE v."gatewayId" = pg."id"
      AND v."fieldId" = f."id"
  );

INSERT INTO "PaymentGatewayFieldValue" (
  "id",
  "gatewayId",
  "fieldId",
  "valuePlain",
  "valueEncrypted",
  "updatedAt"
)
SELECT
  pg."id" || '_secret_value',
  pg."id",
  f."id",
  NULL,
  cfg."secretKeyEncrypted",
  now()
FROM "PaymentGatewayConfig" cfg
JOIN "PaymentGateway" pg
  ON pg."key" = lower(cfg."provider"::text)
JOIN "PaymentGatewayField" f
  ON f."gatewayId" = pg."id"
  AND f."key" = 'secret_key'
WHERE cfg."secretKeyEncrypted" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "PaymentGatewayFieldValue" v
    WHERE v."gatewayId" = pg."id"
      AND v."fieldId" = f."id"
  );

INSERT INTO "PaymentGatewayFieldValue" (
  "id",
  "gatewayId",
  "fieldId",
  "valuePlain",
  "valueEncrypted",
  "updatedAt"
)
SELECT
  pg."id" || '_webhook_value',
  pg."id",
  f."id",
  NULL,
  cfg."webhookSecretEncrypted",
  now()
FROM "PaymentGatewayConfig" cfg
JOIN "PaymentGateway" pg
  ON pg."key" = lower(cfg."provider"::text)
JOIN "PaymentGatewayField" f
  ON f."gatewayId" = pg."id"
  AND f."key" = 'webhook_secret'
WHERE cfg."webhookSecretEncrypted" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "PaymentGatewayFieldValue" v
    WHERE v."gatewayId" = pg."id"
      AND v."fieldId" = f."id"
  );
