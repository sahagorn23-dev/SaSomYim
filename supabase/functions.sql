-- SaSomYim: PostgreSQL functions
-- Run in Supabase SQL Editor after schema.sql

CREATE OR REPLACE FUNCTION redeem_promotion(
    p_member_id UUID,
    p_promotion_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_points_balance INT;
    v_points_cost INT;
    v_quantity_available INT;
    v_is_active BOOLEAN;
    v_redemption_code TEXT;
    v_attempts INT := 0;
BEGIN
    -- 1. Lock member row
    SELECT points_balance
    INTO v_points_balance
    FROM members
    WHERE id = p_member_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'MEMBER_NOT_FOUND: ไม่พบสมาชิก';
    END IF;

    -- 2. Lock promotion row
    SELECT points_cost, quantity_available, is_active
    INTO v_points_cost, v_quantity_available, v_is_active
    FROM promotions
    WHERE id = p_promotion_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PROMOTION_NOT_FOUND: ไม่พบโปรโมชั่น';
    END IF;

    -- 3. Validate business rules
    IF NOT v_is_active THEN
        RAISE EXCEPTION 'PROMOTION_INACTIVE: โปรโมชั่นปิดแล้ว';
    END IF;

    IF v_quantity_available <= 0 THEN
        RAISE EXCEPTION 'OUT_OF_STOCK: ของหมด';
    END IF;

    IF v_points_balance < v_points_cost THEN
        RAISE EXCEPTION 'INSUFFICIENT_POINTS: แต้มไม่พอ';
    END IF;

    -- 4. Deduct member points
    UPDATE members
    SET points_balance = points_balance - v_points_cost,
        updated_at = NOW()
    WHERE id = p_member_id;

    -- 5. Decrease promotion stock
    UPDATE promotions
    SET quantity_available = quantity_available - 1
    WHERE id = p_promotion_id;

    -- 6. Record points transaction
    INSERT INTO point_transactions (member_id, type, amount, note)
    VALUES (p_member_id, 'redeem', v_points_cost, 'แลกโปรโมชั่น');

    -- 7 & 8. Generate unique 6-digit code and insert redemption
    LOOP
        v_redemption_code := lpad(floor(random() * 1000000)::text, 6, '0');
        v_attempts := v_attempts + 1;

        IF v_attempts > 100 THEN
            RAISE EXCEPTION 'CODE_GENERATION_FAILED: ไม่สามารถสร้างรหัสแลกรางวัลได้';
        END IF;

        BEGIN
            INSERT INTO redemptions (member_id, promotion_id, redemption_code, status)
            VALUES (p_member_id, p_promotion_id, v_redemption_code, 'unused');
            EXIT;
        EXCEPTION
            WHEN unique_violation THEN
                NULL;
        END;
    END LOOP;

    -- 9. Return redemption code
    RETURN v_redemption_code;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

-- Callable only via service_role (API routes using supabase-admin)
REVOKE ALL ON FUNCTION redeem_promotion(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION redeem_promotion(UUID, UUID) TO service_role;
