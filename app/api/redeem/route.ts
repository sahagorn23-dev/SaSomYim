import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyLiffToken } from "@/lib/verify-liff";

export const dynamic = "force-dynamic";

type RedeemBody = {
  promotion_id?: string;
};

function mapRpcError(message: string): { status: number; error: string } {
  if (message.includes("INSUFFICIENT_POINTS")) {
    return { status: 400, error: "แต้มไม่พอ" };
  }
  if (message.includes("OUT_OF_STOCK")) {
    return { status: 400, error: "ของหมด" };
  }
  if (message.includes("PROMOTION_INACTIVE")) {
    return { status: 400, error: "โปรโมชั่นปิดแล้ว" };
  }
  if (message.includes("MEMBER_NOT_FOUND")) {
    return { status: 404, error: "ไม่พบสมาชิก" };
  }
  if (message.includes("PROMOTION_NOT_FOUND")) {
    return { status: 404, error: "ไม่พบโปรโมชั่น" };
  }
  return { status: 500, error: message };
}

export async function POST(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { error: "Supabase is not configured. Fill in .env.local first." },
      { status: 503 }
    );
  }

  let body: RedeemBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { promotion_id } = body;

  if (!promotion_id) {
    return NextResponse.json(
      { error: "promotion_id is required" },
      { status: 400 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = authHeader.split(" ")[1];
  let lineUserId: string;
  try {
    lineUserId = await verifyLiffToken(idToken);
  } catch (error) {
    console.error("Verify LIFF token error:", error);
    return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // ใช้ .limit(1) แทน .single() เพื่อหลีกเลี่ยง bug ใน supabase-js กับ PostgREST
  const { data: memberRows, error: memberError } = await supabase
    .from("members")
    .select("id")
    .eq("line_user_id", lineUserId)
    .limit(1);

  const memberData = memberRows?.[0] ?? null;

  if (memberError || !memberData) {
    return NextResponse.json({ error: "ไม่พบข้อมูลสมาชิก" }, { status: 404 });
  }

  const member_id = memberData.id;

  const { data, error } = await supabase.rpc("redeem_promotion", {
    p_member_id: member_id,
    p_promotion_id: promotion_id,
  });

  if (error) {
    const mapped = mapRpcError(error.message);
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }

  return NextResponse.json({
    success: true,
    redemption_code: data as string,
  });
}
