"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptSecret = encryptSecret;
exports.decryptSecret = decryptSecret;
const crypto_1 = require("crypto");
const PREFIX = "enc:v1:";
function resolveKey() {
    const source = process.env.PAYMENT_CONFIG_ENCRYPTION_KEY || process.env.JWT_SECRET || "dev_secret";
    return (0, crypto_1.createHash)("sha256").update(source).digest();
}
function encryptSecret(value) {
    if (!value)
        return null;
    const iv = (0, crypto_1.randomBytes)(12);
    const cipher = (0, crypto_1.createCipheriv)("aes-256-gcm", resolveKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(value, "utf8"),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64")}`;
}
function decryptSecret(value) {
    if (!value)
        return null;
    // Backward compatibility for unencrypted values.
    if (!value.startsWith(PREFIX))
        return value;
    const raw = Buffer.from(value.slice(PREFIX.length), "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const payload = raw.subarray(28);
    const decipher = (0, crypto_1.createDecipheriv)("aes-256-gcm", resolveKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
        decipher.update(payload),
        decipher.final(),
    ]);
    return decrypted.toString("utf8");
}
