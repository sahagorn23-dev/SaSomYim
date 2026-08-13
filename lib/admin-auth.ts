import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "admin_session";

function getAdminSessionSecret() {
  return process.env.ADMIN_PASSWORD || "default_admin_secret_for_development";
}

export function setAdminSession() {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", getAdminSessionSecret())
    .update(timestamp)
    .digest("hex");
  const token = `${timestamp}.${signature}`;

  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60, // 8 hours
  });
}

export function verifyAdminSession(): boolean {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", getAdminSessionSecret())
    .update(timestamp)
    .digest("hex");

  if (signature !== expectedSignature) return false;

  // Max age: 8 hours
  const now = Date.now();
  const tokenTime = parseInt(timestamp, 10);
  if (now - tokenTime > 8 * 60 * 60 * 1000) return false;

  return true;
}

export function clearAdminSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}
