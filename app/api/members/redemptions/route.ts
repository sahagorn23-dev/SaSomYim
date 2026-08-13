import { NextRequest, NextResponse } from "next/server";
import { verifyLiffToken } from "@/lib/verify-liff";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
  }

  const idToken = authHeader.split(" ")[1];

  let lineUserId: string;
  try {
    lineUserId = await verifyLiffToken(idToken);
  } catch (err) {
    return NextResponse.json(
      { error: "Unauthorized: token ไม่ถูกต้องหรือหมดอายุ" },
      { status: 401, headers: NO_CACHE_HEADERS }
    );
  }

  const supabase = getSupabaseAdmin();

  // 1. หาข้อมูลสมาชิกเพื่อเอา member_id
  // ใช้ .limit(1) แทน .single() เพื่อหลีกเลี่ยง bug ใน supabase-js กับ PostgREST
  const { data: memberRows, error: memberError } = await supabase
    .from("members")
    .select("id")
    .eq("line_user_id", lineUserId)
    .limit(1);

  const member = memberRows?.[0] ?? null;

  if (memberError || !member) {
    return NextResponse.json({ error: "ไม่พบข้อมูลสมาชิก" }, { status: 404, headers: NO_CACHE_HEADERS });
  }

  // 2. ดึงประวัติคูปอง (redemptions) พร้อมข้อมูลโปรโมชั่น
  const { data: redemptions, error: redemptionsError } = await supabase
    .from("redemptions")
    .select("id, redemption_code, status, redeemed_at, used_at, promotions(title, description, image_url, points_cost)")
    .eq("member_id", member.id)
    .order("redeemed_at", { ascending: false });

  if (redemptionsError) {
    console.error("[members/redemptions] Error fetching redemptions:", redemptionsError);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงประวัติคูปอง" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }

  return NextResponse.json(
    { redemptions: redemptions || [] },
    { headers: NO_CACHE_HEADERS }
  );
}
