-- SaSomYim: Points System Schema & Functions
-- นำโค้ดนี้ไปรันใน Supabase SQL Editor ได้เลยครับ

-- 1. สร้างตาราง point_transactions
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('earn', 'redeem')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ป้องกันไม่ให้ client-side (anon/authenticated) เข้าถึงโดยตรง (เหมือนตารางอื่นๆ)
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- 2. ฟังก์ชันสะสมแต้ม (earn_points)
CREATE OR REPLACE FUNCTION earn_points(
    p_member_id UUID,
    p_net_amount NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_points_balance INT;
    v_earned_points INT;
BEGIN
    -- ล็อค Row ป้องกัน Race Condition
    SELECT points_balance
    INTO v_points_balance
    FROM members
    WHERE id = p_member_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'MEMBER_NOT_FOUND: ไม่พบสมาชิก';
    END IF;

    -- คำนวณแต้ม: ยอดสุทธิ / 10 ปัดเศษลง แล้วคูณ 3
    v_earned_points := floor(p_net_amount / 10) * 3;

    IF v_earned_points > 0 THEN
        -- บันทึกประวัติ
        INSERT INTO point_transactions (member_id, type, amount, note)
        VALUES (p_member_id, 'earn', v_earned_points, 'Earn points from purchase');

        -- อัปเดตแต้ม
        UPDATE members
        SET points_balance = points_balance + v_earned_points,
            updated_at = NOW()
        WHERE id = p_member_id
        RETURNING points_balance INTO v_points_balance;
    END IF;

    -- ส่งค่ากลับเป็น JSON
    RETURN json_build_object(
        'points_earned', v_earned_points,
        'points_balance_latest', v_points_balance
    );
END;
$$;

-- ให้เรียกผ่าน API (service_role) เท่านั้น
REVOKE ALL ON FUNCTION earn_points(UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION earn_points(UUID, NUMERIC) TO service_role;


-- 3. ฟังก์ชันใช้แต้มเป็นส่วนลด (redeem_points_cash)
CREATE OR REPLACE FUNCTION redeem_points_cash(
    p_member_id UUID,
    p_points INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_points_balance INT;
    v_discount_baht NUMERIC;
BEGIN
    -- ล็อค Row ป้องกัน Race Condition
    SELECT points_balance
    INTO v_points_balance
    FROM members
    WHERE id = p_member_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'MEMBER_NOT_FOUND: ไม่พบสมาชิก';
    END IF;

    IF p_points <= 0 THEN
        RAISE EXCEPTION 'INVALID_POINTS: จำนวนแต้มต้องมากกว่า 0';
    END IF;

    -- เช็คว่าแต้มพอไหม
    IF v_points_balance < p_points THEN
        RAISE EXCEPTION 'INSUFFICIENT_POINTS: แต้มไม่พอ';
    END IF;

    -- คำนวณส่วนลด (100 แต้ม = 1 บาท)
    v_discount_baht := p_points / 100.0;

    -- บันทึกประวัติ
    INSERT INTO point_transactions (member_id, type, amount, note)
    VALUES (p_member_id, 'redeem', p_points, 'Redeem points for cash discount');

    -- อัปเดตแต้ม (หักแต้ม)
    UPDATE members
    SET points_balance = points_balance - p_points,
        updated_at = NOW()
    WHERE id = p_member_id
    RETURNING points_balance INTO v_points_balance;

    -- ส่งค่ากลับเป็น JSON
    RETURN json_build_object(
        'discount_baht', v_discount_baht,
        'points_balance_latest', v_points_balance
    );
END;
$$;

-- ให้เรียกผ่าน API (service_role) เท่านั้น
REVOKE ALL ON FUNCTION redeem_points_cash(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION redeem_points_cash(UUID, INT) TO service_role;
