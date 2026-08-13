import { waitUntil } from "@vercel/functions";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// ─── Webhook Handler ──────────────────────────────────────────────────────────
export async function POST(req: Request) {
  // 1. อ่าน body เป็น raw text (ต้องเป็น text ไม่ใช่ json()
  //    เพราะต้องใช้ข้อความต้นฉบับที่ไม่ผ่านการแปลงเพื่อคำนวณ signature)
  const rawBody = await req.text();

  // 2. ตรวจสอบ X-Line-Signature ด้วย HMAC-SHA256
  const signature = req.headers.get("x-line-signature");
  const secret = process.env.LINE_CHANNEL_SECRET;

  if (!secret) {
    console.error("[webhook] LINE_CHANNEL_SECRET is not set");
    return new Response("Server misconfigured", { status: 500 });
  }

  if (!signature) {
    return new Response("Missing signature", { status: 401 });
  }

  const expectedHash = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");

  if (expectedHash !== signature) {
    console.warn("[webhook] Invalid signature — possible spoofed request");
    return new Response("Invalid signature", { status: 401 });
  }

  // 3. แปลง raw body เป็น JSON (ผ่านการตรวจสอบ signature แล้ว)
  let body: { events: any[] };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // 4. ใช้ waitUntil เพื่อการันตีว่า Vercel จะไม่ freeze instance
  //    ก่อน background task ทำงานเสร็จ (ต่างจาก fire-and-forget ทั่วไป)
  waitUntil(processEvents(body.events ?? []));

  // 5. Return 200 ทันทีโดยไม่รอ processEvents — LINE ต้องการ response เร็ว
  return new Response("OK", { status: 200 });
}

// ─── Event Processor ──────────────────────────────────────────────────────────
async function processEvents(events: any[]) {
  for (const event of events) {
    try {
      switch (event.type) {
        case "follow": {
          // ผู้ใช้กด Add Friend หรือ Unblock
          const lineUserId: string = event.source?.userId;
          console.log("[webhook] follow →", lineUserId);

          // TODO: upsert สมาชิกใหม่เข้า Supabase
          // const supabase = getSupabaseAdmin();
          // await supabase.from("members").upsert({
          //   line_user_id: lineUserId,
          //   created_at: new Date().toISOString(),
          // }, { onConflict: "line_user_id" });
          break;
        }

        case "unfollow": {
          // ผู้ใช้ Block หรือ Remove Friend
          const lineUserId: string = event.source?.userId;
          console.log("[webhook] unfollow →", lineUserId);

          // TODO: อัปเดตสถานะสมาชิกใน Supabase (เช่น is_blocked = true)
          break;
        }

        case "message": {
          const lineUserId: string = event.source?.userId;
          const replyToken: string = event.replyToken;
          const message = event.message;

          console.log("[webhook] message →", {
            userId: lineUserId,
            type: message?.type,
            text: message?.type === "text" ? message.text : "(non-text)",
          });

          // TODO: เชื่อมต่อ LLM (เช่น Gemini / OpenAI) ตอบกลับอัตโนมัติ
          // const reply = await generateReply(message.text);
          // await lineClient.replyMessage(replyToken, [{ type: "text", text: reply }]);
          break;
        }

        default:
          console.log("[webhook] unhandled event type:", event.type);
      }
    } catch (err) {
      // จับ error แยกแต่ละ event ไม่ให้ event เดียว crash ทั้ง loop
      console.error("[webhook] error processing event:", event.type, err);
    }
  }
}
