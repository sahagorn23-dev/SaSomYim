import { NextRequest, NextResponse } from "next/server";
import { setAdminSession } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    // Set cookie
    setAdminSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin login] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
