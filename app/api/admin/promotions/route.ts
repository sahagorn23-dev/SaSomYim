import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic"; // ป้องกัน caching

export async function GET() {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ promotions: data });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const points_cost = formData.get("points_cost") as string;
    const quantity_available = formData.get("quantity_available") as string;
    const imageFile = formData.get("image") as File | null;

    if (!title || !points_cost) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" }, { status: 400 });
    }

    // Validation (ป้องกันค่าติดลบ หรือ 0)
    if (Number(points_cost) <= 0) {
      return NextResponse.json({ error: "แต้มที่ใช้ต้องมีค่ามากกว่า 0" }, { status: 400 });
    }
    
    if (Number(quantity_available) <= 0) {
      return NextResponse.json({ error: "จำนวนสิทธิ์ต้องมีค่ามากกว่า 0" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let image_url = null;

    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const buffer = Buffer.from(await imageFile.arrayBuffer());

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("promotions")
        .upload(fileName, buffer, {
          contentType: imageFile.type,
          upsert: false
        });

      if (uploadError) {
        console.error("[admin promotions post] upload error:", uploadError);
        return NextResponse.json({ error: "อัปโหลดรูปภาพไม่สำเร็จ" }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from("promotions")
        .getPublicUrl(fileName);
        
      image_url = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase
      .from("promotions")
      .insert([
        {
          title,
          description: description || null,
          points_cost: Number(points_cost),
          image_url,
          quantity_available: Number(quantity_available),
          is_active: true
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[admin promotions post] supabase error:", error);
      return NextResponse.json({ error: "ไม่สามารถสร้างโปรโมชั่นได้" }, { status: 500 });
    }

    return NextResponse.json({ promotion: data }, { status: 201 });
  } catch (err) {
    console.error("[admin promotions post] error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ระบุ ID ที่ต้องการลบ" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("promotions").delete().eq("id", id);

    if (error) {
      console.error("[admin promotions delete] supabase error:", error);
      return NextResponse.json({ error: "ไม่สามารถลบโปรโมชั่นได้" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin promotions delete] error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
