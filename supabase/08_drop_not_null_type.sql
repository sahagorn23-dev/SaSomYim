-- อนุญาตให้คอลัมน์ type มีค่าเป็น null ได้ (เนื่องจาก Backend อาจจะใช้เครื่องหมาย +/- ที่ points_change แทนแล้ว)
ALTER TABLE points_transactions
ALTER COLUMN type DROP NOT NULL;
