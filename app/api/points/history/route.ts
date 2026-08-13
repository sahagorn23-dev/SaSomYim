import { NextRequest, NextResponse } from "next/server";
import { verifyLiffToken } from "@/lib/verify-liff";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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
  
  // 1. หาข้อมูลสมาชิกเพื่อเอา member_id และ points_balance
  // ใช้ .limit(1) แทน .single() เพื่อหลีกเลี่ยง bug ใน supabase-js กับ PostgREST
  const { data: memberRows, error: memberError } = await supabase
    .from("members")
    .select("id, points_balance")
    .eq("line_user_id", lineUserId)
    .limit(1);

  const member = memberRows?.[0] ?? null;

  if (memberError || !member) {
    return NextResponse.json({ error: "ไม่พบข้อมูลสมาชิก" }, { status: 404, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
  }

  // 2. ดึงประวัติ point_transactions (ใช้ตารางที่พนักงานสร้างขึ้นมา)
  const { data: transactions, error: txError } = await supabase
    .from("point_transactions")
    .select("id, type, amount, created_at")
    .eq("member_id", member.id)
    .order("created_at", { ascending: false });

  if (txError) {
    console.error("[points/history] Error fetching transactions:", txError);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงประวัติ" }, { status: 500, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
  }

  return NextResponse.json(
    {
      points_balance: member.points_balance,
      transactions: transactions || [],
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
