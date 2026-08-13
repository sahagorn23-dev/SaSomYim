import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

/**
 * เข้ารหัส memberId พร้อม Timestamp
 * รูปแบบก่อนเข้ารหัส: `${memberId}|${Date.now()}`
 */
export function encryptQrToken(memberId: string): string {
  const secretKey = process.env.QR_SECRET;
  if (!secretKey || secretKey.length !== 32) {
    throw new Error("QR_SECRET is not configured correctly (Must be exactly 32 bytes/characters)");
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secretKey), iv);

  const timestamp = Date.now();
  const payload = `${memberId}|${timestamp}`;

  let encrypted = cipher.update(payload, "utf8", "hex");
  encrypted += cipher.final("hex");

  // คืนค่า IV พร้อมกับข้อมูลที่เข้ารหัส
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * ถอดรหัส token และตรวจสอบ Replay Attack (อายุไม่เกิน 90 วินาที)
 * คืนค่า memberId หากสำเร็จ, โยน Error หากล้มเหลว
 */
export function decryptQrToken(token: string): string {
  const secretKey = process.env.QR_SECRET;
  if (!secretKey || secretKey.length !== 32) {
    throw new Error("QR_SECRET is not configured correctly (Must be exactly 32 bytes/characters)");
  }

  const parts = token.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid token format");
  }

  const [ivHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(secretKey), iv);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  const [memberId, timestampStr] = decrypted.split("|");
  if (!memberId || !timestampStr) {
    throw new Error("Invalid payload format");
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    throw new Error("Invalid timestamp");
  }

  const now = Date.now();
  const diffSeconds = (now - timestamp) / 1000;

  // ตรวจสอบอายุของ QR Code ป้องกัน Replay Attack (90 วินาที)
  if (diffSeconds > 90 || diffSeconds < -5) {
    throw new Error("Token expired");
  }

  return memberId;
}
