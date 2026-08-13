-- คำสั่งนี้จะทำการลบ "ข้อมูล" ทั้งหมดในทุกตาราง แต่ยังคงโครงสร้างตารางไว้เหมือนเดิม
-- CASCADE จะช่วยลบข้อมูลในตารางที่มีความสัมพันธ์กัน (Foreign Key) ให้อัตโนมัติ

TRUNCATE TABLE members, promotions, redemptions, points_transactions CASCADE;
