-- เพิ่มคอลัมน์ created_by ในตาราง points_transactions 
ALTER TABLE points_transactions
ADD COLUMN created_by TEXT;
