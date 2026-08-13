import { NextRequest, NextResponse } from "next/server";
import { verifyLiffToken } from "@/lib/verify-liff";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { encryptQrToken } from "@/lib/qr-crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
  }

  const idToken = authHeader.split(" ")[1];

  let lineUserId: string;
  try {
    lineUserId = await verifyLiffToken(idToken);
  } catch (err) {
    return NextResponse.json(
      { error: "Unauthorized: token ไม่ถูกต้องหรือหมดอายุ" },
      { status: 401, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: member, error } = await supabase
    .from("members")
    .select("id")
    .eq("line_user_id", lineUserId)
    .single();

  if (error || !member) {
    return NextResponse.json({ error: "ไม่พบข้อมูลสมาชิก" }, { status: 404, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
  }

  // สร้าง QR Token ที่หมดอายุใน 90 วินาที
  // ฟังก์ชัน encryptQrToken ฝัง timestamp ปัจจุบันเข้าไปใน payload แล้ว
  try {
    const token = encryptQrToken(member.id);
    const expiresAt = Date.now() + 90 * 1000; // ส่งเวลาหมดอายุให้ Client ทราบ

    return NextResponse.json({ token, expires_at: expiresAt }, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
  } catch (err) {
    console.error("[checkin/token] Error generating token:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างรหัส QR" },
      { status: 500, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
