import { NextRequest, NextResponse } from "next/server";
import { verifyStaffSession } from "@/lib/staff-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  // 1. ตรวจสอบ Staff Session
  if (!verifyStaffSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { redemption_code } = await req.json();

    // 2. Validate input
    if (!redemption_code || typeof redemption_code !== "string" || redemption_code.trim().length === 0) {
      return NextResponse.json({ error: "กรุณากรอกรหัสคูปอง" }, { status: 400 });
    }

    // 3. เรียก RPC use_redemption_code
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("use_redemption_code", {
      p_redemption_code: redemption_code.trim(),
    });

    if (error) {
      // 4. Map error message เป็นภาษาไทย
      if (error.message.includes("CODE_NOT_FOUND")) {
        return NextResponse.json({ error: "ไม่พบรหัสคูปองนี้" }, { status: 404 });
      }
      if (error.message.includes("ALREADY_USED")) {
        return NextResponse.json({ error: "คูปองนี้ถูกใช้ไปแล้ว" }, { status: 400 });
      }
      if (error.message.includes("EXPIRED")) {
        return NextResponse.json({ error: "คูปองหมดอายุแล้ว" }, { status: 400 });
      }
      console.error("[verify-coupon] RPC error:", error);
      return NextResponse.json({ error: "เกิดข้อผิดพลาดในการตรวจสอบคูปอง" }, { status: 500 });
    }

    // 5. สำเร็จ
    return NextResponse.json({
      success: true,
      promotion_title: data.promotion_title,
    });
  } catch (error) {
    console.error("[verify-coupon] Unexpected error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดไม่ทราบสาเหตุ" }, { status: 500 });
  }
}
