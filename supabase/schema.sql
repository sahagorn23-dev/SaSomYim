-- SaSomYim: LINE OA Cooperative Points System
-- Run this in Supabase SQL Editor after creating your project.

CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_user_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    points_balance INT NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    points_cost INT NOT NULL CHECK (points_cost > 0),
    image_url TEXT,
    quantity_available INT NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
    expire_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
    redemption_code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused','used','expired')),
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- service_role bypasses RLS and is used only in server-side API routes.
-- Browser clients (anon key) must NOT write directly — no INSERT/UPDATE/DELETE
-- policies are defined for anon or authenticated roles.
-- ---------------------------------------------------------------------------

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

-- Public read: active promotions only (for client-side display)
CREATE POLICY "anon_read_active_promotions"
    ON promotions
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- members, redemptions: no anon/authenticated policies
-- → browser client cannot read or write these tables directly.
-- All mutations go through API routes using SUPABASE_SERVICE_ROLE_KEY.
