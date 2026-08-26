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

  // 2. ดึงประวัติจาก point_transactions (ตารางหลัก — Staff earn/redeem + redeem_promotion)
  const { data: ptTransactions, error: ptError } = await supabase
    .from("point_transactions")
    .select("id, type, amount, created_at")
    .eq("member_id", member.id)
    .order("created_at", { ascending: false });

  if (ptError) {
    console.error("[points/history] Error fetching point_transactions:", ptError);
  }

  // 3. ดึงประวัติจาก points_transactions (ตารางเสริม — อาจมี records เก่าหรือจาก RPC เวอร์ชันเก่า)
  const { data: psTransactions, error: psError } = await supabase
    .from("points_transactions")
    .select("id, type, points_change, reason, created_at")
    .eq("member_id", member.id)
    .order("created_at", { ascending: false });

  if (psError) {
    console.error("[points/history] Error fetching points_transactions:", psError);
  }

  // 4. Normalize ทั้ง 2 ตารางให้เป็น format เดียวกัน
  type Transaction = {
    id: string;
    type: "earn" | "redeem";
    amount: number;
    created_at: string;
  };

  const normalizedPt: Transaction[] = (ptTransactions || []).map((tx) => ({
    id: tx.id,
    type: tx.type as "earn" | "redeem",
    amount: tx.amount,
    created_at: tx.created_at,
  }));

  // points_transactions ใช้ points_change (บวก = earn, ลบ = redeem)
  const normalizedPs: Transaction[] = (psTransactions || []).map((tx) => ({
    id: tx.id,
    type: tx.points_change > 0 ? "earn" as const : "redeem" as const,
    amount: Math.abs(tx.points_change),
    created_at: tx.created_at,
  }));

  // 5. รวม + deduplicate (ตัด record ซ้ำที่อาจมี id เดียวกัน) + เรียงตามเวลา
  const mergedMap = new Map<string, Transaction>();
  for (const tx of [...normalizedPt, ...normalizedPs]) {
    if (!mergedMap.has(tx.id)) {
      mergedMap.set(tx.id, tx);
    }
  }

  const allTransactions = Array.from(mergedMap.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json(
    {
      points_balance: member.points_balance,
      transactions: allTransactions,
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
