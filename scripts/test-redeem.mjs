/**
 * One-off test script for POST /api/redeem
 * Usage: node scripts/test-redeem.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env.local");
  const content = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureTestData() {
  let memberId;
  let promotionId;

  const { data: members } = await supabase
    .from("members")
    .select("id, points_balance")
    .limit(1);

  if (members?.length) {
    memberId = members[0].id;
    if (members[0].points_balance < 100) {
      await supabase
        .from("members")
        .update({ points_balance: 500 })
        .eq("id", memberId);
      console.log("Updated member points_balance to 500");
    }
  } else {
    const { data, error } = await supabase
      .from("members")
      .insert({
        line_user_id: `test_${Date.now()}`,
        full_name: "Test Member",
        student_id: `TEST${Date.now()}`,
        phone: "0800000000",
        points_balance: 500,
      })
      .select("id")
      .single();
    if (error) throw error;
    memberId = data.id;
    console.log("Created test member:", memberId);
  }

  const { data: promotions } = await supabase
    .from("promotions")
    .select("id, quantity_available, is_active")
    .eq("is_active", true)
    .gt("quantity_available", 0)
    .limit(1);

  if (promotions?.length) {
    promotionId = promotions[0].id;
  } else {
    const { data, error } = await supabase
      .from("promotions")
      .insert({
        title: "Test Promotion",
        description: "For redeem API test",
        points_cost: 50,
        quantity_available: 10,
        is_active: true,
      })
      .select("id")
      .single();
    if (error) throw error;
    promotionId = data.id;
    console.log("Created test promotion:", promotionId);
  }

  return { memberId, promotionId };
}

async function main() {
  console.log("Ensuring test data...");
  const { memberId, promotionId } = await ensureTestData();
  console.log("member_id:", memberId);
  console.log("promotion_id:", promotionId);

  console.log("\nCalling POST /api/redeem ...");
  const res = await fetch("http://localhost:3000/api/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ member_id: memberId, promotion_id: promotionId }),
  });

  const body = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(body, null, 2));

  if (!res.ok) process.exit(1);
}

main().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
