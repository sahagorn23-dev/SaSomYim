"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, CreditCard, Phone, CheckCircle2, Loader2, ChevronRight } from "lucide-react";
import { LiffGuard } from "@/components/LiffGuard";
import { useLiff } from "@/hooks/useLiff";
import { LoadingScreen } from "@/components/LoadingScreen";

// ─── Types ────────────────────────────────────────────────────────────────────
type Field = { id: "full_name" | "student_id" | "phone"; label: string; placeholder: string; type: string; numeric: boolean };

const FIELDS: Field[] = [
  { id: "full_name",   label: "ชื่อ-นามสกุล",    placeholder: "สมชาย ใจดี",     type: "text", numeric: false },
  { id: "student_id", label: "รหัสนักศึกษา",     placeholder: "640110001",      type: "text", numeric: true  },
  { id: "phone",      label: "เบอร์โทรศัพท์",    placeholder: "0812345678",     type: "tel",  numeric: true  },
];

const CHIP_COLORS = ["bg-chip-peach", "bg-chip-mint", "bg-chip-lavender"] as const;
const CHIP_ICONS  = [User, CreditCard, Phone];

// ─── Incentive Card ───────────────────────────────────────────────────────────
function IncentiveCard() {
  return (
    <div className="bg-peach rounded-[20px] p-5 flex items-center gap-4">
      <div className="shrink-0 w-14 h-14 bg-white/40 rounded-2xl flex items-center justify-center text-3xl select-none">
        🎁
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-kanit font-semibold text-espresso text-base leading-snug">
          สมัครวันนี้ รับ 50 แต้มต้อนรับฟรี!
        </p>
        <p className="font-ibm text-espresso/70 text-xs mt-0.5">
          เริ่มสะสมแต้มได้ทันทีหลังสมัคร
        </p>
      </div>
    </div>
  );
}

// ─── Timeline Form ────────────────────────────────────────────────────────────
type FormValues = { full_name: string; student_id: string; phone: string };

function TimelineForm({
  values,
  onChange,
}: {
  values: FormValues;
  onChange: (field: keyof FormValues, val: string) => void;
}) {
  const [focused, setFocused] = useState<string | null>(null);

  return (
    <div className="bg-card rounded-[20px] shadow-[0_4px_24px_0_rgba(74,46,30,0.07)] px-5 pt-5 pb-2">
      {FIELDS.map((field, i) => {
        const Icon = CHIP_ICONS[i];
        const chipColor = CHIP_COLORS[i];
        const filled = values[field.id].length > 0;
        const isLast = i === FIELDS.length - 1;

        return (
          <div key={field.id} className="flex gap-4">
            {/* Timeline indicator + line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-5 h-5 rounded-full border-2 mt-3 shrink-0 transition-all duration-300 ${
                  filled
                    ? "bg-espresso border-espresso scale-110"
                    : "bg-white border-muted/50"
                }`}
              />
              {!isLast && (
                <div className="w-px flex-1 border-l-2 border-dashed border-muted/30 my-1" />
              )}
            </div>

            {/* Field row */}
            <div className={`flex-1 pb-4 ${!isLast ? "min-h-[72px]" : ""}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-7 h-7 rounded-full ${chipColor} flex items-center justify-center shrink-0`}>
                  <Icon size={14} strokeWidth={2} className="text-espresso/80" />
                </span>
                <label
                  htmlFor={field.id}
                  className="font-ibm text-xs text-muted font-medium"
                >
                  {field.label}
                </label>
              </div>
              <input
                id={field.id}
                type={field.type}
                inputMode={field.numeric ? "numeric" : "text"}
                pattern={field.numeric ? "[0-9]*" : undefined}
                maxLength={field.id === "student_id" ? 11 : field.numeric ? 10 : undefined}
                placeholder={field.placeholder}
                value={values[field.id]}
                onFocus={() => setFocused(field.id)}
                onBlur={() => setFocused(null)}
                onChange={(e) => {
                  let val = e.target.value;
                  if (field.numeric) val = val.replace(/\D/g, "");
                  onChange(field.id, val);
                }}
                className={`w-full font-ibm text-sm text-ink bg-transparent outline-none pb-1.5 border-b transition-colors duration-200 placeholder:text-muted/40 ${
                  focused === field.id
                    ? "border-espresso"
                    : "border-muted/20"
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Success Card ─────────────────────────────────────────────────────────────
function SuccessCard({ name }: { name: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 gap-6">
      <div className="animate-[scale-in_0.4s_cubic-bezier(0.34,1.56,0.64,1)_forwards] opacity-0">
        <div className="w-24 h-24 bg-chip-mint rounded-full flex items-center justify-center">
          <CheckCircle2 size={52} strokeWidth={1.8} className="text-espresso" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="font-kanit font-bold text-2xl text-ink">สมัครสำเร็จแล้ว! 🎉</h2>
        <p className="font-ibm text-muted text-sm leading-relaxed">
          ยินดีต้อนรับ <span className="text-ink font-medium">{name}</span>
          <br />
          คุณได้รับ <span className="text-peach font-semibold">50 แต้ม</span> ต้อนรับฟรีแล้ว
          <br />
          <span className="text-xs text-muted/70">กำลังพาไปหน้าหลัก...</span>
        </p>
      </div>
    </div>
  );
}

// ─── Register Form Inner ──────────────────────────────────────────────────────
function RegisterContent() {
  const { profile, idToken } = useLiff();
  const router = useRouter();

  // ─ Early redirect: ตอนนี้ LiffGuard จัดการให้แล้วที่ Global ระดับบน ────────
  // ถ้าคอมโพเนนต์นี้ถูกเรนเดอร์ แปลว่าผู้ใช้ยังไม่ได้ลงทะเบียนแน่นอน (LiffGuard ปล่อยผ่านมา)
  const checkingMembership = false;

  const [values, setValues] = useState<FormValues>({ full_name: "", student_id: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allFilled =
    values.full_name.trim().length > 0 &&
    values.student_id.trim().length === 11 &&
    values.phone.trim().length === 10;

  const handleChange = (field: keyof FormValues, val: string) => {
    setValues((prev) => ({ ...prev, [field]: val }));
    setApiError(null);
  };

  const handleSubmit = async () => {
    if (!allFilled || loading) return;
    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/members/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          full_name: values.full_name.trim(),
          student_id: values.student_id.trim(),
          phone: values.phone.trim(),
        }),
      });

      if (res.status === 401) {
        // เซสชันหมดอายุ — ไม่ต้อง retry อัตโนมัติ ให้ผู้ใช้เปิดแอปใหม่
        setApiError("เซสชันหมดอายุ กรุณาปิดแล้วเปิดแอปใหม่");
        setLoading(false);
        return;
      }

      if (res.status === 409) {
        // 409 = สมัครไปแล้ว (duplicate) — แปลว่าเป็นสมาชิกจริงอยู่แล้ว
        // redirect ไป /dashboard ทันที ไม่แสดง error ค้างไว้
        router.replace("/dashboard");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        // 400 / 500 — แสดง error message จาก API ตรงๆ
        setApiError(data.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
      } else {
        // 201 — แสดง success state ค้าง 2 วิ แล้ว replace ไป /dashboard
        // ใช้ replace ไม่ใช่ push เพื่อป้องกันผู้ใช้กด Back กลับมาหน้านี้
        setSuccess(true);
        setTimeout(() => router.replace("/dashboard"), 2000);
      }
    } catch {
      // network error — fetch throw
      setApiError("เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต");
    } finally {
      setLoading(false);
    }
  };

  if (success) return <SuccessCard name={profile?.displayName ?? "สมาชิก"} />;

  // ระหว่างเรียก /api/members/me — แสดง LoadingScreen เต็มจอเพื่อป้องกัน UI Flash
  if (checkingMembership === null) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-32 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          {profile?.pictureUrl && (
            <div className="shrink-0">
              <Image
                src={profile.pictureUrl}
                alt={profile.displayName}
                width={56}
                height={56}
                className="rounded-full object-cover ring-2 ring-white shadow-sm"
              />
            </div>
          )}
          <div>
            {/* LINE connected badge */}
            <span className="inline-flex items-center gap-1 bg-line-green/10 text-line-green text-[10px] font-ibm font-semibold px-2 py-0.5 rounded-full mb-1">
              <span className="w-1.5 h-1.5 bg-line-green rounded-full" />
              เชื่อมต่อ LINE สำเร็จ
            </span>
            <h1 className="font-kanit font-bold text-xl text-ink leading-tight">
              สวัสดี, {profile?.displayName ?? "คุณ"}
            </h1>
            <p className="font-ibm text-xs text-muted mt-0.5">
              มาเป็นสมาชิกสหกรณ์กันเถอะ ✨
            </p>
          </div>
        </div>

        {/* ── Incentive Card ── */}
        <IncentiveCard />

        {/* ── Form ── */}
        <div>
          <p className="font-kanit text-sm font-semibold text-ink mb-3 px-1">
            กรอกข้อมูลสมาชิก
          </p>
          <TimelineForm values={values} onChange={handleChange} />
        </div>

        {/* ── API Error ── */}
        {apiError && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-start gap-2">
            <span className="text-red-400 text-base mt-0.5">⚠️</span>
            <p className="font-ibm text-sm text-red-600 leading-snug">{apiError}</p>
          </div>
        )}
      </div>

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-0 inset-x-0 px-5 pb-8 pt-4 bg-gradient-to-t from-cream via-cream/95 to-transparent">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allFilled || loading}
          className={`w-full font-kanit font-semibold text-sm tracking-wide rounded-full py-4 flex items-center justify-center gap-2 transition-all duration-200 ${
            allFilled && !loading
              ? "bg-espresso text-white shadow-[0_6px_20px_0_rgba(74,46,30,0.25)] active:scale-[0.98]"
              : "bg-espresso/30 text-white/50 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              กำลังส่งข้อมูล...
            </>
          ) : (
            "ยืนยันการสมัครสมาชิก"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Export (wrapped with LiffGuard) ─────────────────────────────────────────
export default function RegisterClient() {
  return (
    <LiffGuard>
      <RegisterContent />
    </LiffGuard>
  );
}
