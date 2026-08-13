import { NextRequest, NextResponse } from "next/server";
import { verifyStaffSession } from "@/lib/staff-auth";
import { decryptQrToken } from "@/lib/qr-crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  // 1. ตรวจสอบ Staff Session
  if (!verifyStaffSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { qr_token, net_amount } = await req.json();

    // 2. Validate input
    if (!qr_token || typeof qr_token !== "string") {
      return NextResponse.json({ error: "QR Token ไม่ถูกต้อง" }, { status: 400 });
    }

    const amount = Number(net_amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "ยอดเงินสุทธิต้องมากกว่า 0" }, { status: 400 });
    }

    // 3. ถอดรหัส QR Token
    let memberId: string;
    try {
      memberId = decryptQrToken(qr_token);
    } catch (err: any) {
      if (err.message === "Token expired") {
        return NextResponse.json({ error: "QR Code หมดอายุ (กรุณาให้ลูกค้าสแกนใหม่)" }, { status: 400 });
      }
      return NextResponse.json({ error: "QR Code ไม่ถูกต้อง" }, { status: 400 });
    }

    // 4. เรียก RPC earn_points
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("earn_points", {
      p_member_id: memberId,
      p_net_amount: amount,
    });

    if (error) {
      if (error.message.includes("MEMBER_NOT_FOUND")) {
        return NextResponse.json({ error: "ไม่พบข้อมูลสมาชิกลูกค้า" }, { status: 404 });
      }
      console.error("[earn-points] RPC error:", error);
      return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกแต้ม" }, { status: 500 });
    }

    // 5. สำเร็จ
    return NextResponse.json({
      success: true,
      points_earned: data.points_earned,
      new_balance: data.points_balance_latest,
    });
  } catch (error) {
    console.error("[earn-points] Unexpected error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดไม่ทราบสาเหตุ" }, { status: 500 });
  }
}
