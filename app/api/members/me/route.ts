import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyLiffToken } from "@/lib/verify-liff";

export const dynamic = "force-dynamic";

// GET /api/members/me
// เช็คว่า LINE user นี้ลงทะเบียนเป็นสมาชิกแล้วหรือยัง
export async function GET(req: NextRequest) {
  // 1. ตรวจสอบ Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
  }

  const idToken = authHeader.split(" ")[1];

  // 2. Verify LIFF token — เหมือน pattern ใน /api/members/register และ /api/redeem
  let lineUserId: string;
  try {
    lineUserId = await verifyLiffToken(idToken);
  } catch (err) {
    console.error("[me] verifyLiffToken failed:", err);
    return NextResponse.json(
      { error: "Unauthorized: token ไม่ถูกต้องหรือหมดอายุ" },
      { status: 401, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }

  // 3. Query ตาราง members ด้วย line_user_id
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("line_user_id", lineUserId)
    .single();

  if (error || !data) {
    // ต้อง Return 404 เท่านั้น ห้าม Return 200 เด็ดขาด
    return NextResponse.json(
      { error: "User not found" },
      { status: 404, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }

  // 4. Return ผลลัพธ์
  return NextResponse.json(
    { registered: true },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
