-- เปลี่ยนชื่อคอลัมน์จาก note เป็น reason ตามที่ Backend ต้องการ
ALTER TABLE points_transactions
RENAME COLUMN note TO reason;
