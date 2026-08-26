"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LiffGuard } from "@/components/LiffGuard";
import { useLiff } from "@/hooks/useLiff";
import { ArrowLeft, Loader2, X, Ticket, Clock } from "lucide-react";
import Barcode from "react-barcode";
import { PromotionModal } from "@/components/PromotionModal";

// ─── Types ────────────────────────────────────────────────────────────────────
type Redemption = {
  id: string;
  redemption_code: string;
  status: "unused" | "used" | "expired";
  redeemed_at: string;
  used_at: string | null;
  promotions: {
    title: string;
    description: string | null;
    image_url: string | null;
    points_cost: number;
  };
};

// ─── Coupons Content ──────────────────────────────────────────────────────────
function CouponsContent() {
  const { idToken } = useLiff();
  const router = useRouter();

  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState<Redemption | null>(null); // For Barcode
  const [viewingCouponDetail, setViewingCouponDetail] = useState<Redemption | null>(null); // For Detail Modal

  // ─ ดึงข้อมูลคูปอง ─────────────────────────────────────────────────────────
  const fetchRedemptions = useCallback(async () => {
    if (!idToken) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/members/redemptions?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        cache: "no-store",
      });

      if (res.status === 404) {
        router.push("/register");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setRedemptions(data.redemptions || []);
      }
    } catch (err) {
      console.error("Failed to fetch redemptions", err);
    } finally {
      setLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    fetchRedemptions();
  }, [fetchRedemptions]);

  // ─ Visibility refetch: เมื่อกลับมาที่แอป ──────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchRedemptions();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchRedemptions]);

  // ─ แยกคูปองตาม status ─────────────────────────────────────────────────────
  const unusedCoupons = redemptions.filter((r) => r.status === "unused");
  const historyCoupons = redemptions.filter((r) => r.status !== "unused");

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));
  };

  const statusLabel = (status: string) => {
    if (status === "used") return "ใช้แล้ว";
    if (status === "expired") return "หมดอายุ";
    return status;
  };

  return (
    <div className="min-h-screen bg-cream font-ibm pb-8">
      {/* Header */}
      <div className="bg-peach/20 pt-10 pb-6 px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-9 h-9 bg-white/60 rounded-full flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-espresso" />
          </button>
          <h1 className="font-kanit font-bold text-xl text-espresso">คูปองของฉัน</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-espresso" />
        </div>
      ) : redemptions.length === 0 ? (
        <div className="px-5 mt-6">
          <div className="bg-card rounded-[24px] p-8 text-center text-muted text-sm shadow-sm">
            ยังไม่มีคูปอง — ลองแลกแต้มดูสิ!
          </div>
        </div>
      ) : (
        <div className="px-5 mt-6 space-y-6">
          {/* ─── คูปองที่ใช้ได้ ─── */}
          {unusedCoupons.length > 0 && (
            <div>
              <h3 className="font-kanit font-bold text-base text-ink mb-3 flex items-center gap-2">
                <Ticket size={18} className="text-peach" />
                ใช้ได้ ({unusedCoupons.length})
              </h3>
              <div className="space-y-3">
                {unusedCoupons.map((coupon) => (
                  <button
                    key={coupon.id}
                    onClick={() => setSelectedCoupon(coupon)}
                    className="w-full bg-card rounded-[20px] p-4 flex items-center gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all text-left"
                  >
                    <div className="w-12 h-12 bg-chip-mint rounded-[14px] flex items-center justify-center shrink-0">
                      <Ticket size={22} className="text-espresso" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-kanit font-semibold text-sm text-ink leading-tight truncate">
                        {coupon.promotions.title}
                      </p>
                      <p className="text-[11px] text-muted mt-1">
                        แลกเมื่อ {formatDate(coupon.redeemed_at)}
                      </p>
                    </div>
                    <div className="shrink-0 bg-chip-mint/60 px-3 py-1 rounded-full">
                      <span className="font-kanit font-semibold text-xs text-espresso">ใช้งาน</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── ประวัติ (used / expired) ─── */}
          {historyCoupons.length > 0 && (
            <div>
              <h3 className="font-kanit font-bold text-base text-ink mb-3 flex items-center gap-2">
                <Clock size={18} className="text-muted" />
                ประวัติ ({historyCoupons.length})
              </h3>
              <div className="space-y-3">
                {historyCoupons.map((coupon) => (
                  <button
                    key={coupon.id}
                    onClick={() => setViewingCouponDetail(coupon)}
                    className="w-full bg-card rounded-[20px] p-4 flex items-center gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] opacity-60 hover:opacity-100 transition-opacity active:scale-[0.98] text-left cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-muted/10 rounded-[14px] flex items-center justify-center shrink-0">
                      <Ticket size={22} className="text-muted/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-kanit font-semibold text-sm text-ink leading-tight truncate">
                        {coupon.promotions.title}
                      </p>
                      <p className="text-[11px] text-muted mt-1">
                        {coupon.status === "used" && coupon.used_at
                          ? `ใช้เมื่อ ${formatDate(coupon.used_at)}`
                          : `แลกเมื่อ ${formatDate(coupon.redeemed_at)}`}
                      </p>
                    </div>
                    <div className="shrink-0 bg-muted/10 px-3 py-1 rounded-full">
                      <span className="font-kanit font-semibold text-xs text-muted">{statusLabel(coupon.status)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Barcode Modal ─── */}
      {selectedCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-5 py-10 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-[32px] p-8 relative flex flex-col items-center animate-in zoom-in-95 duration-300 shadow-2xl">
            <button
              onClick={() => setSelectedCoupon(null)}
              className="absolute top-4 right-4 p-2 bg-cream rounded-full text-muted"
            >
              <X size={20} />
            </button>

            <h2 className="font-kanit font-bold text-2xl text-ink mb-2 mt-2">คูปองของคุณ</h2>
            <p className="text-sm text-muted text-center mb-2">
              {selectedCoupon.promotions.title}
            </p>
            <p className="text-xs text-muted/70 text-center mb-6">
              ยื่นหน้านี้ให้พนักงานสแกน <br /> หรือแจ้งรหัสด้านล่าง
            </p>

            {/* Barcode */}
            <div className="bg-white p-4 rounded-[24px] shadow-sm mb-4">
              <Barcode
                value={selectedCoupon.redemption_code}
                format="CODE128"
                width={2}
                height={80}
                displayValue={false}
                background="#ffffff"
                lineColor="#4A2E1E"
              />
            </div>

            {/* รหัสคูปองตัวใหญ่ */}
            <div className="bg-cream rounded-[16px] px-6 py-3 mb-6">
              <p className="font-mono font-bold text-3xl text-espresso tracking-[0.3em] text-center select-all">
                {selectedCoupon.redemption_code}
              </p>
            </div>

            <p className="text-[10px] text-muted/60 text-center max-w-[220px]">
              ห้ามบันทึกภาพหน้าจอ <br /> รหัสคูปองนี้ใช้ได้เพียงครั้งเดียว
            </p>
          </div>
        </div>
      )}

      {/* ─── Detail Modal (For History) ─── */}
      <PromotionModal
        isOpen={!!viewingCouponDetail}
        onClose={() => setViewingCouponDetail(null)}
        title={viewingCouponDetail?.promotions.title || ""}
        description={viewingCouponDetail?.promotions.description}
        imageUrl={viewingCouponDetail?.promotions.image_url}
        pointsCost={viewingCouponDetail?.promotions.points_cost}
        redeemedAt={viewingCouponDetail ? formatDate(viewingCouponDetail.redeemed_at) : undefined}
        status={viewingCouponDetail?.status}
      />
    </div>
  );
}

// ─── Export (wrapped with LiffGuard) ─────────────────────────────────────────
export default function CouponsClientPage() {
  return (
    <LiffGuard>
      <CouponsContent />
    </LiffGuard>
  );
}
