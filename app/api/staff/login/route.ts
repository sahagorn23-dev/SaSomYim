import { NextRequest, NextResponse } from "next/server";
import { setStaffSession } from "@/lib/staff-auth";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!pin || pin !== process.env.STAFF_PIN) {
      return NextResponse.json({ error: "PIN ไม่ถูกต้อง" }, { status: 401 });
    }

    // Set cookie
    setStaffSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[login] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
