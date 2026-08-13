import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/** Example API route — all DB writes must use getSupabaseAdmin() */
export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { error: "Supabase is not configured. Fill in .env.local first." },
      { status: 503 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("promotions")
    .select("id, title, description, points_cost, image_url, is_active")
    .eq("is_active", true)
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ promotions: data });
}
