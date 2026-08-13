import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "staff_session";

// ใช้ SECRET ง่ายๆ ในการเซ็น cookie แบบง่าย (ในที่นี้เราใช้ STAFF_PIN ร่วมกับ QR_SECRET)
function getSessionSecret() {
  return process.env.QR_SECRET || "default_secret_for_development";
}

export function setStaffSession() {
  // สร้าง token อย่างง่าย: timestamp_signature
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(timestamp)
    .digest("hex");
  const token = `${timestamp}.${signature}`;

  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60, // 8 ชั่วโมง
  });
}

export function verifyStaffSession(): boolean {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(timestamp)
    .digest("hex");

  if (signature !== expectedSignature) return false;

  // ตรวจสอบอายุ (ไม่เกิน 8 ชั่วโมง)
  const now = Date.now();
  const tokenTime = parseInt(timestamp, 10);
  if (now - tokenTime > 8 * 60 * 60 * 1000) return false;

  return true;
}

export function clearStaffSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}
