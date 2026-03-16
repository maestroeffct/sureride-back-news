import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function resolveKey() {
  const source =
    process.env.PAYMENT_CONFIG_ENCRYPTION_KEY || process.env.JWT_SECRET || "dev_secret";
  return createHash("sha256").update(source).digest();
}

export function encryptSecret(value?: string | null) {
  if (!value) return null;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", resolveKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64")}`;
}

export function decryptSecret(value?: string | null) {
  if (!value) return null;

  // Backward compatibility for unencrypted values.
  if (!value.startsWith(PREFIX)) return value;

  const raw = Buffer.from(value.slice(PREFIX.length), "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const payload = raw.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", resolveKey(), iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(payload),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
