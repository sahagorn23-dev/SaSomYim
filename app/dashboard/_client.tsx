"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LiffGuard } from "@/components/LiffGuard";
import { useLiff } from "@/hooks/useLiff";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X, Clock, Loader2, Gift, Ticket } from "lucide-react";

type Transaction = {
  id: string;
  type: "earn" | "redeem";
  amount: number;
  created_at: string;
};

function DashboardContent() {
  const { profile, idToken } = useLiff();
  const router = useRouter();
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // loadingHistory = true เฉพาะครั้งแรก (initial load) เพื่อโชว์ skeleton
  // การ refetch ครั้งถัดไปจะเงียบๆ โดยไม่ reset เป็น true ซ้ำ ป้องกันจอกระพริบ
  const [loadingHistory, setLoadingHistory] = useState(true);
  const isInitialLoad = useRef(true); // ติดตามว่าเป็นการโหลดครั้งแรกหรือไม่

  // QR Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [qrLoading, setQrLoading] = useState(false);

  // ─ fetchHistory: แยกเป็น useCallback เพื่อเรียกซ้ำได้จากหลายจุด ─────────
  const fetchHistory = useCallback(async () => {
    if (!idToken) return;
    // แสดง skeleton เฉพาะตอน initial load ครั้งแรกเท่านั้น
    if (isInitialLoad.current) {
      setLoadingHistory(true);
    }
    try {
      const res = await fetch("/api/points/history", {
        headers: { Authorization: `Bearer ${idToken}` },
        cache: "no-store",
      });
      
      if (res.status === 404) {
        router.push("/register");
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setPointsBalance(data.points_balance);
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoadingHistory(false);
      isInitialLoad.current = false; // หลังจาก fetch ครั้งแรกเสร็จ ไม่โชว์ skeleton ซ้ำ
    }
  }, [idToken]);

  // โหลดประวัติตอน component mount หรือ idToken พร้อม
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ─ Visibility Refetch: refetch เงียบๆ เมื่อผู้ใช้กลับมาที่แอป ───────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchHistory();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchHistory]);

  // Fetch QR Token
  const fetchQrToken = useCallback(async () => {
    if (!idToken) return;
    try {
      setQrLoading(true);
      const res = await fetch("/api/checkin/token", {
        headers: { Authorization: `Bearer ${idToken}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setQrToken(data.token);
        setExpiresAt(data.expires_at);
        // Force initial remaining seconds calculation immediately
        setRemainingSeconds(Math.max(0, Math.floor((data.expires_at - Date.now()) / 1000)));
      }
    } catch (err) {
      console.error("Failed to fetch QR token", err);
    } finally {
      setQrLoading(false);
    }
  }, [idToken]);

  const handleOpenQr = () => {
    setShowQrModal(true);
    fetchQrToken();
  };

  // ─ ปิด QR Modal แล้ว refetch ทันที ───────────────────────────────────────
  // เพราะโอกาสสูงสุดที่แต้มจะเปลี่ยนคือช่วงที่ modal เปิดอยู่ (ลูกค้ายื่น QR)
  const handleCloseQrModal = () => {
    setShowQrModal(false);
    fetchHistory(); // refetch เงียบๆ ไม่โชว์ skeleton ซ้ำ
  };

  // QR Timer and Auto-refresh Logic
  useEffect(() => {
    if (!showQrModal || !expiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setRemainingSeconds(remaining);

      // Auto-refresh when time is low (< 10 seconds)
      // We check !qrLoading so we don't spam fetch if it's already fetching
      if (remaining < 10 && !qrLoading) {
        fetchQrToken();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showQrModal, expiresAt, fetchQrToken, qrLoading]);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));
  };

  return (
    <div className="min-h-screen bg-cream font-ibm pb-8 relative">
      {/* Dynamic Background Area */}
      <div className="bg-peach/20 pt-10 pb-20 px-5 rounded-b-[40px] shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {profile?.pictureUrl ? (
            <Image
              src={profile.pictureUrl}
              alt={profile.displayName}
              width={52}
              height={52}
              className="rounded-full object-cover ring-2 ring-white shadow-sm"
            />
          ) : (
            <div className="w-[52px] h-[52px] rounded-full bg-white ring-2 ring-white flex items-center justify-center text-espresso text-xl">
              {profile?.displayName?.[0] ?? "U"}
            </div>
          )}
          <div>
            <p className="text-xs text-espresso/70 font-medium">ยินดีต้อนรับกลับมา 👋</p>
            <h1 className="font-kanit font-bold text-xl text-espresso leading-tight truncate max-w-[200px]">
              {profile?.displayName ?? "สมาชิก"}
            </h1>
          </div>
        </div>

        {/* Big Points Display */}
        <div className="text-center">
          <p className="text-sm font-kanit font-medium text-espresso mb-1">แต้มสะสมทั้งหมด</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-6xl font-black text-espresso">
              {pointsBalance !== null ? pointsBalance : "--"}
            </span>
            <span className="text-xl font-kanit font-bold text-espresso self-end mb-2">แต้ม</span>
          </div>
        </div>
      </div>

      {/* Floating Action Button for QR */}
      <div className="px-5 -mt-8 relative z-10">
        <button
          onClick={handleOpenQr}
          className="w-full bg-espresso text-white rounded-[24px] p-5 shadow-lg flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <QrCode className="text-white" size={28} />
            </div>
            <div className="text-left">
              <h3 className="font-kanit font-bold text-lg">แสดง QR สะสมแต้ม</h3>
              <p className="text-xs text-white/70">ให้พนักงานสแกนเพื่อรับ/ใช้แต้ม</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <span className="text-lg">›</span>
          </div>
        </button>
      </div>

      {/* ─── Shortcut Buttons: แลกแต้ม + คูปองของฉัน ─── */}
      <div className="px-5 mt-3 grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push("/promotions")}
          className="bg-chip-mint rounded-[20px] p-4 flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] active:scale-[0.97] transition-all"
        >
          <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center shrink-0">
            <Gift size={20} className="text-espresso" />
          </div>
          <div className="text-left">
            <p className="font-kanit font-bold text-sm text-espresso leading-tight">แลกแต้ม</p>
            <p className="text-[10px] text-espresso/60 mt-0.5">ดูโปรโมชั่น</p>
          </div>
        </button>
        <button
          onClick={() => router.push("/coupons")}
          className="bg-chip-peach rounded-[20px] p-4 flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] active:scale-[0.97] transition-all"
        >
          <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center shrink-0">
            <Ticket size={20} className="text-espresso" />
          </div>
          <div className="text-left">
            <p className="font-kanit font-bold text-sm text-espresso leading-tight">คูปองของฉัน</p>
            <p className="text-[10px] text-espresso/60 mt-0.5">ดูคูปอง</p>
          </div>
        </button>
      </div>
      <div className="px-5 mt-8">
        <h3 className="font-kanit font-bold text-lg text-ink mb-4 flex items-center gap-2">
          <Clock size={20} className="text-muted" />
          ประวัติรายการ
        </h3>

        {loadingHistory ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-espresso" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-card rounded-[24px] p-8 text-center text-muted text-sm shadow-sm">
            ยังไม่มีประวัติการทำรายการ
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-card rounded-[20px] p-4 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <div>
                  <p className="font-kanit font-semibold text-ink text-sm">
                    {tx.type === "earn" ? "รับแต้มจากยอดซื้อ" : "ใช้แต้มแลกส่วนลด"}
                  </p>
                  <p className="text-[11px] text-muted mt-1">{formatDate(tx.created_at)}</p>
                </div>
                <div className={`font-bold text-lg ${tx.type === "earn" ? "text-chip-mint" : "text-peach"}`}>
                  <span className={tx.type === "earn" ? "text-line-green" : "text-peach"}>
                    {tx.type === "earn" ? "+" : "-"}{tx.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-5 py-10 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-[32px] p-8 relative flex flex-col items-center animate-in zoom-in-95 duration-300 shadow-2xl">
            <button
              onClick={handleCloseQrModal}
              className="absolute top-4 right-4 p-2 bg-cream rounded-full text-muted"
            >
              <X size={20} />
            </button>

            <h2 className="font-kanit font-bold text-2xl text-ink mb-2 mt-2">QR Code ของคุณ</h2>
            <p className="text-sm text-muted text-center mb-8">
              ยื่นหน้านี้ให้พนักงานสแกน <br/> 
              เพื่อรับแต้มหรือใช้แต้มแลกส่วนลด
            </p>

            <div className="bg-white p-4 rounded-[24px] shadow-sm mb-6 relative">
              {qrToken ? (
                <QRCodeSVG
                  value={qrToken}
                  size={200}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#4A2E1E"
                />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center">
                  <Loader2 className="animate-spin text-espresso" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">รหัสจะเปลี่ยนในอีก</span>
              <span className={`font-bold font-mono text-lg ${remainingSeconds < 10 ? "text-red-500" : "text-espresso"}`}>
                {remainingSeconds}s
              </span>
            </div>
            
            <p className="text-[10px] text-muted/60 mt-6 text-center max-w-[200px]">
              ห้ามบันทึกภาพหน้าจอ <br/> รหัส QR นี้ใช้ได้เพียงครั้งเดียวและจะรีเฟรชอัตโนมัติ
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardClient() {
  return (
    <LiffGuard>
      <DashboardContent />
    </LiffGuard>
  );
}
