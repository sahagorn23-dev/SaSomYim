-- สร้างตาราง points_transactions สำหรับเก็บประวัติแต้ม
create table points_transactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) not null,
  type text not null check (type in ('earn', 'redeem')),
  amount integer not null, -- จำนวนแต้ม (บวกเสมอ ดูทิศทางจาก type)
  note text,
  created_at timestamptz default now()
);

-- สร้าง index เพื่อความเร็วในการค้นหา
create index idx_points_transactions_member_id on points_transactions(member_id);
create index idx_points_transactions_created_at on points_transactions(created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- service_role bypasses RLS and is used only in server-side API routes.
-- Browser clients (anon key) must NOT write directly
-- ---------------------------------------------------------------------------
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
