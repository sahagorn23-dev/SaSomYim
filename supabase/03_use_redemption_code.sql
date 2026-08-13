-- SaSomYim: ฟังก์ชันใช้งานคูปอง (redemption code)
-- Run in Supabase SQL Editor after functions.sql

CREATE OR REPLACE FUNCTION use_redemption_code(p_redemption_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_redemption_id UUID;
    v_status TEXT;
    v_redeemed_at TIMESTAMPTZ;
    v_promotion_title TEXT;
BEGIN
    -- 1. Lock row ใน redemptions พร้อม JOIN promotions เพื่อดึง title
    SELECT r.id, r.status, r.redeemed_at, p.title
    INTO v_redemption_id, v_status, v_redeemed_at, v_promotion_title
    FROM redemptions r
    JOIN promotions p ON p.id = r.promotion_id
    WHERE r.redemption_code = p_redemption_code
    FOR UPDATE OF r;

    -- 2. ถ้าไม่เจอ record → แจ้ง error
    IF NOT FOUND THEN
        RAISE EXCEPTION 'CODE_NOT_FOUND: ไม่พบรหัสคูปองนี้';
    END IF;

    -- 3. ถ้าสถานะไม่ใช่ 'unused' → คูปองถูกใช้หรือหมดอายุไปแล้ว
    IF v_status != 'unused' THEN
        RAISE EXCEPTION 'ALREADY_USED: คูปองนี้ถูกใช้ไปแล้วหรือหมดอายุ';
    END IF;

    -- 4. เช็คอายุคูปอง: ถ้า redeemed_at เก่ากว่า 30 วัน → อัปเดตเป็น expired แล้วแจ้ง error
    IF NOW() - v_redeemed_at > interval '30 days' THEN
        UPDATE redemptions
        SET status = 'expired'
        WHERE id = v_redemption_id;

        RAISE EXCEPTION 'EXPIRED: คูปองหมดอายุแล้ว';
    END IF;

    -- 5. ผ่านทุกเงื่อนไข → อัปเดตสถานะเป็น 'used' พร้อมบันทึกเวลาใช้งาน
    UPDATE redemptions
    SET status = 'used',
        used_at = NOW()
    WHERE id = v_redemption_id;

    -- 6. Return ข้อมูลคูปองที่ใช้สำเร็จ
    RETURN json_build_object(
        'promotion_title', v_promotion_title,
        'redemption_code', p_redemption_code
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

-- Callable only via service_role (API routes using supabase-admin)
REVOKE ALL ON FUNCTION use_redemption_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION use_redemption_code(TEXT) TO service_role;
