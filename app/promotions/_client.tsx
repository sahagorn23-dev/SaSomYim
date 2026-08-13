"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LiffGuard } from "@/components/LiffGuard";
import { useLiff } from "@/hooks/useLiff";
import { ArrowLeft, Loader2, X, Gift, AlertTriangle } from "lucide-react";
import { PromotionModal } from "@/components/PromotionModal";

// ─── Types ────────────────────────────────────────────────────────────────────
type Promotion = {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  image_url: string | null;
  quantity_available: number;
  is_active: boolean;
};

// ─── Promotions Content ───────────────────────────────────────────────────────
function PromotionsContent() {
  const { idToken } = useLiff();
  const router = useRouter();

  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Viewing modal state
  const [viewingPromo, setViewingPromo] = useState<Promotion | null>(null);

  // Confirm modal state
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  // ─ ดึงข้อมูล ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!idToken) return;
    setLoading(true);

    try {
      const [historyRes, promoRes] = await Promise.all([
        fetch("/api/points/history", {
          headers: { Authorization: `Bearer ${idToken}` },
          cache: "no-store",
        }),
        fetch("/api/promotions", { cache: "no-store" }),
      ]);

      if (historyRes.status === 404) {
        router.push("/register");
        return;
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setPointsBalance(historyData.points_balance);
      }

      if (promoRes.ok) {
        const promoData = await promoRes.json();
        setPromotions(promoData.promotions || []);
      }
    } catch (err) {
      console.error("Failed to fetch promotions data", err);
    } finally {
      setLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─ แลกแต้ม ────────────────────────────────────────────────────────────────
  const handleRedeem = async () => {
    if (!selectedPromo || !idToken || redeeming) return;
    setRedeeming(true);
    setRedeemError(null);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ promotion_id: selectedPromo.id }),
        cache: "no-store",
      });

      if (res.ok) {
        setSelectedPromo(null);
        router.push("/coupons");
        return;
      }

      const data = await res.json();
      setRedeemError(data.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } catch {
      setRedeemError("เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream font-ibm pb-8">
      {/* Header */}
      <div className="bg-peach/20 pt-10 pb-6 px-5">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-9 h-9 bg-white/60 rounded-full flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-espresso" />
          </button>
          <h1 className="font-kanit font-bold text-xl text-espresso">แลกแต้ม</h1>
        </div>
        {pointsBalance !== null && (
          <div className="bg-card rounded-[16px] px-4 py-3 flex items-center justify-between shadow-sm">
            <span className="text-sm text-muted font-medium">แต้มคงเหลือ</span>
            <span className="font-kanit font-bold text-2xl text-espresso">{pointsBalance} <span className="text-sm font-normal">แต้ม</span></span>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {apiError && (
        <div className="mx-5 mt-4 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <p className="font-ibm text-sm text-red-600 leading-snug">{apiError}</p>
        </div>
      )}

      {/* Promotion Grid */}
      <div className="px-5 mt-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-espresso" />
          </div>
        ) : promotions.length === 0 ? (
          <div className="bg-card rounded-[24px] p-8 text-center text-muted text-sm shadow-sm">
            ยังไม่มีโปรโมชั่นในขณะนี้
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {promotions.map((promo) => {
              const canAfford = pointsBalance !== null && pointsBalance >= promo.points_cost;
              return (
                <div
                  key={promo.id}
                  onClick={() => setViewingPromo(promo)}
                  className="bg-card rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col cursor-pointer group hover:shadow-md transition-all active:scale-[0.98]"
                >
                  {/* Image */}
                  <div className="relative w-full aspect-[4/3] bg-cream">
                    {promo.image_url ? (
                      <Image
                        src={promo.image_url}
                        alt={promo.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 200px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gift size={32} className="text-muted/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-kanit font-semibold text-sm text-ink leading-tight line-clamp-2 mb-2 flex-1 group-hover:text-espresso transition-colors">
                      {promo.title}
                    </h3>
                    <div className="flex items-center justify-between mt-auto">
                      <p className="font-kanit font-bold text-peach text-sm">
                        {promo.points_cost} แต้ม
                      </p>
                      <span className="text-[10px] text-muted bg-cream px-2 py-1 rounded-md">
                        คลิกดูรายละเอียด
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Detail Modal ─── */}
      <PromotionModal
        isOpen={!!viewingPromo}
        onClose={() => setViewingPromo(null)}
        title={viewingPromo?.title || ""}
        description={viewingPromo?.description}
        imageUrl={viewingPromo?.image_url}
        pointsCost={viewingPromo?.points_cost}
        quantity={viewingPromo?.quantity_available}
        actionButton={
          viewingPromo && (
            <button
              onClick={() => {
                const canAfford = pointsBalance !== null && pointsBalance >= viewingPromo.points_cost;
                if (canAfford) {
                  setSelectedPromo(viewingPromo);
                  setRedeemError(null);
                  setViewingPromo(null); // ปิดหน้าต่างรายละเอียด แล้วไปเปิดหน้าต่าง Confirm แทน
                }
              }}
              disabled={!(pointsBalance !== null && pointsBalance >= viewingPromo.points_cost)}
              className={`w-full font-kanit font-semibold text-sm py-3.5 rounded-full transition-all ${
                pointsBalance !== null && pointsBalance >= viewingPromo.points_cost
                  ? "bg-espresso text-white active:scale-[0.97] shadow-lg"
                  : "bg-muted/20 text-muted cursor-not-allowed"
              }`}
            >
              {pointsBalance !== null && pointsBalance >= viewingPromo.points_cost
                ? `ใช้ ${viewingPromo.points_cost} แต้ม แลกสิทธิ์`
                : "แต้มไม่พอ"}
            </button>
          )
        }
      />

      {/* ─── Confirm Modal ─── */}
      {selectedPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-5 py-10 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-[32px] p-8 relative flex flex-col items-center animate-in zoom-in-95 duration-300 shadow-2xl">
            <button
              onClick={() => { setSelectedPromo(null); setRedeemError(null); }}
              className="absolute top-4 right-4 p-2 bg-cream rounded-full text-muted"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-peach/20 rounded-full flex items-center justify-center mb-4 mt-2">
              <Gift size={28} className="text-peach" />
            </div>

            <h2 className="font-kanit font-bold text-xl text-ink mb-2 text-center">ยืนยันการแลก</h2>
            <p className="text-sm text-muted text-center mb-6 leading-relaxed">
              ใช้ <span className="font-bold text-peach">{selectedPromo.points_cost} แต้ม</span> แลก
              <br />
              <span className="font-semibold text-ink">{selectedPromo.title}</span>
            </p>

            {/* Error ใน Modal */}
            {redeemError && (
              <div className="w-full bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-4 flex items-start gap-2">
                <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                <p className="font-ibm text-xs text-red-600 leading-snug">{redeemError}</p>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <button
                onClick={() => { setSelectedPromo(null); setRedeemError(null); }}
                className="flex-1 font-kanit font-semibold text-sm py-3.5 rounded-full bg-cream text-espresso active:scale-[0.97] transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="flex-1 font-kanit font-semibold text-sm py-3.5 rounded-full bg-espresso text-white active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {redeeming ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    กำลังแลก...
                  </>
                ) : (
                  "ยืนยัน"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Export (wrapped with LiffGuard) ─────────────────────────────────────────
export default function PromotionsClient() {
  return (
    <LiffGuard>
      <PromotionsContent />
    </LiffGuard>
  );
}
