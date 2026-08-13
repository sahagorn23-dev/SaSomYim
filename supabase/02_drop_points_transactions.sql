-- Migration: Drop unused 'points_transactions' (plural) table
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    v_count INT;
    v_fk_count INT;
BEGIN
    -- 1. ตรวจสอบว่ามีตารางนี้อยู่หรือไม่
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'points_transactions'
    ) THEN
        
        -- 2. ตรวจสอบว่าตารางว่างเปล่าจริง (ไม่มี records)
        EXECUTE 'SELECT COUNT(*) FROM public.points_transactions' INTO v_count;
        IF v_count > 0 THEN
            RAISE EXCEPTION 'Cannot drop table points_transactions: it contains % records.', v_count;
        END IF;

        -- 3. ตรวจสอบว่าไม่มี Foreign Key จากตารางอื่นอ้างอิงมาหาตารางนี้
        SELECT COUNT(*)
        INTO v_fk_count
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'points_transactions' 
        AND ccu.table_schema = 'public';

        IF v_fk_count > 0 THEN
            RAISE EXCEPTION 'Cannot drop table points_transactions: there are % foreign keys referencing it.', v_fk_count;
        END IF;

        -- 4. หากผ่านการตรวจสอบทั้งหมด ให้ลบตารางทิ้ง
        DROP TABLE public.points_transactions;
        RAISE NOTICE 'Table points_transactions successfully dropped.';
    ELSE
        RAISE NOTICE 'Table points_transactions does not exist. Skipping.';
    END IF;
END $$;
