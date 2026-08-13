import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyLiffToken } from "@/lib/verify-liff";

// ─── Server-side validators ───────────────────────────────────────────────────
function validateBody(
  full_name: unknown,
  student_id: unknown,
  phone: unknown
): string | null {
  if (typeof full_name !== "string" || full_name.trim().length === 0) {
    return "กรุณากรอกชื่อ-นามสกุล";
  }
  if (typeof student_id !== "string" || !/^\d{11}$/.test(student_id.trim())) {
    return "รหัสนักศึกษาต้องเป็นตัวเลข 11 หลัก";
  }
  if (typeof phone !== "string" || !/^0[0-9]{9}$/.test(phone.trim())) {
    return "เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 10 หลัก)";
  }
  return null;
}

// ─── POST /api/members/register ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. ตรวจสอบ Authorization header — เหมือน pattern ใน /api/redeem
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = authHeader.split(" ")[1];

  // 2. Verify LIFF idToken ผ่าน verifyLiffToken() — ห้าม implement เองหรือยิง API โดยตรง
  let lineUserId: string;
  try {
    lineUserId = await verifyLiffToken(idToken);
  } catch (err) {
    console.error("[register] verifyLiffToken failed:", err);
    return NextResponse.json(
      { error: "Unauthorized: token ไม่ถูกต้องหรือหมดอายุ" },
      { status: 401 }
    );
  }

  // 3. อ่าน JSON body — body ตอนนี้มีแค่ full_name, student_id, phone
  //    ห้ามรับ line_user_id จาก body (ต้องมาจาก token เท่านั้น)
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { full_name, student_id, phone } = body;

  // 4. Server-side validation
  const validationError = validateBody(full_name, student_id, phone);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // 5. Insert ลง Supabase ด้วย Service Role Key (bypass RLS)
  //    ใช้ lineUserId ที่ได้จาก token เท่านั้น — ไม่รับจาก client body
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("members")
    .insert({
      line_user_id: lineUserId,
      full_name: (full_name as string).trim(),
      student_id: (student_id as string).trim(),
      phone: (phone as string).trim(),
      points_balance: 50,
    })
    .select()
    .single();

  if (error) {
    // 6. ดักจับ Postgres unique_violation (23505)
    if (error.code === "23505") {
      const detail = error.details ?? error.message ?? "";
      let conflictMsg = "ข้อมูลนี้มีในระบบแล้ว";
      if (detail.includes("line_user_id")) {
        conflictMsg = "LINE User ID นี้มีในระบบแล้ว";
      } else if (detail.includes("student_id")) {
        conflictMsg = "รหัสนักศึกษานี้มีในระบบแล้ว";
      }
      return NextResponse.json({ error: conflictMsg }, { status: 409 });
    }

    // 7. Error อื่นๆ — log server-side, ไม่ leak detail ออก client
    console.error("[register] unexpected supabase error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }

  // 8. แจกแต้มต้อนรับลงใน points_transactions
  const { error: txError } = await supabase
    .from("points_transactions")
    .insert({
      member_id: data.id,
      type: "earn",
      points_change: 50,
      reason: "แต้มพิเศษต้อนรับสมาชิกใหม่",
      created_by: "system"
    });

  if (txError) {
    console.error("[register] failed to insert welcome points transaction:", txError);
  }

  // 9. สำเร็จ
  return NextResponse.json(
    { success: true, message: "ลงทะเบียนสำเร็จ", member: data },
    { status: 201 }
  );
}
