-- แก้คอลัมน์ในตาราง points_transactions ให้ตรงตามที่โค้ดเรียก
ALTER TABLE points_transactions
ADD COLUMN points_change integer NOT NULL,
DROP COLUMN amount;

-- สร้าง index เพิ่มเติมที่คอลัมน์ใหม่ (เพื่อความเร็วในการดึงประวัติ)
create index idx_points_transactions_points_change on points_transactions(points_change);
