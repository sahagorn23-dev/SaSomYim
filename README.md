# SaSomYim — LINE OA สหกรณ์มหาวิทยาลัย

Next.js 14 (App Router, TypeScript) + Supabase + LINE Official Account

## เริ่มต้น

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. สมัคร Supabase (ยังไม่มีบัญชี)

1. ไปที่ [https://supabase.com](https://supabase.com) → Sign up (ฟรี)
2. **New project** → ตั้งชื่อโปรเจกต์ → ตั้งรหัสผ่าน DB → เลือก region (Singapore ใกล้ไทย)
3. รอสักครู่จนโปรเจกต์พร้อม

### 3. รัน SQL schema

1. ใน Supabase Dashboard → **SQL Editor** → **New query**
2. คัดลอกเนื้อหาจาก `supabase/schema.sql` ทั้งไฟล์ → **Run**

### 4. ใส่ค่า environment

1. Dashboard → **Project Settings** → **API**
2. คัดลอก **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. คัดลอก **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. คัดลอก **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`
5. ใส่ใน `.env.local` (มี template อยู่แล้ว)

### 5. รัน dev server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## โครงสร้างสำคัญ

| ไฟล์ | ใช้เมื่อ |
|------|---------|
| `lib/supabase-client.ts` | Client — อ่านโปรโมชันสาธารณะเท่านั้น (anon key) |
| `lib/supabase-admin.ts` | API routes / Server — เขียน/อ่านทุกตาราง (service_role) |

**ห้าม** import `supabase-admin.ts` ในไฟล์ที่มี `"use client"`

## RLS

- เปิด RLS ทุกตาราง
- Browser (anon) อ่านได้เฉพาะ `promotions` ที่ `is_active = true`
- ตาราง `members`, `points_transactions`, `redemptions` — client เข้าไม่ได้
- การเขียนข้อมูลทั้งหมดผ่าน API route + `getSupabaseAdmin()` เท่านั้น
