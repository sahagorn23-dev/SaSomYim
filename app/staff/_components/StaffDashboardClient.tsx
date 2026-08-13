"use client";

import { useEffect, useState, useRef } from "react";
import { LogOut, ScanLine, X, Loader2, CheckCircle2, Ticket } from "lucide-react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";

type ScanResult = string | null;

export function StaffDashboardClient() {
  const [scannedToken, setScannedToken] = useState<ScanResult>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Modal states (QR flow)
  const [mode, setMode] = useState<"earn" | "redeem" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  // Coupon flow states (แยกจาก QR flow ทั้งหมด)
  const [couponMode, setCouponMode] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<{ promotion_title: string } | null>(null);

  const startScanner = () => {
    setScannerVisible(true);
    setScannedToken(null);
    setSuccessData(null);
    setMode(null);
  };

  const closeScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setScannerVisible(false);
  };

  const handleLogout = async () => {
    await fetch("/api/staff/logout", { method: "POST" });
    window.location.reload();
  };

  useEffect(() => {
    if (scannerVisible && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        },
        /* verbose= */ false
      );
      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          // Success
          setScannedToken(decodedText);
          closeScanner();
        },
        (error) => {
          // Ignore frequent scan errors
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [scannerVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedToken || !mode || !inputValue || loading) return;

    setLoading(true);
    setApiError(null);

    const isEarn = mode === "earn";
    const endpoint = isEarn ? "/api/staff/earn-points" : "/api/staff/redeem-points";
    
    // Payload keys based on mode
    const body: any = { qr_token: scannedToken };
    if (isEarn) body.net_amount = inputValue;
    else body.points = inputValue;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error || "เกิดข้อผิดพลาด");
      } else {
        setSuccessData(data);
      }
    } catch (err) {
      setApiError("การเชื่อมต่อล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setScannedToken(null);
    setMode(null);
    setInputValue("");
    setSuccessData(null);
    setApiError(null);
  };

  // ─ Coupon flow: เรียก POST /api/staff/verify-coupon ─────────────────────
  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput || couponInput.length !== 6 || couponLoading) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/staff/verify-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redemption_code: couponInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || "เกิดข้อผิดพลาด");
      } else {
        setCouponSuccess({ promotion_title: data.promotion_title });
      }
    } catch (err) {
      setCouponError("การเชื่อมต่อล้มเหลว");
    } finally {
      setCouponLoading(false);
    }
  };

  const resetCoupon = () => {
    setCouponMode(false);
    setCouponInput("");
    setCouponError(null);
    setCouponSuccess(null);
  };

  const resetCouponForm = () => {
    setCouponInput("");
    setCouponError(null);
    setCouponSuccess(null);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col font-ibm">
      {/* Header */}
      <header className="bg-card px-5 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="font-kanit font-bold text-xl text-ink">Staff Dashboard</h1>
          <p className="text-xs text-muted">ระบบจัดการแต้มลูกค้า</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-red-500 bg-red-50 px-3 py-1.5 rounded-full text-sm font-medium"
        >
          <LogOut size={16} />
          ออก
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 flex flex-col items-center">
        {/* ─── หน้าแรก: เลือก flow ─── */}
        {!scannerVisible && !scannedToken && !couponMode && (
          <div className="w-full max-w-sm flex flex-col items-center mt-20">
            <div className="w-24 h-24 bg-chip-mint rounded-full flex items-center justify-center mb-6">
              <ScanLine size={48} className="text-espresso" />
            </div>
            <h2 className="font-kanit text-2xl font-bold text-ink mb-2">สแกน QR Code ลูกค้า</h2>
            <p className="text-muted text-center text-sm mb-8">
              เพื่อทำการให้แต้มจากยอดซื้อ <br />หรือ ใช้แต้มแลกส่วนลดเงินสด
            </p>
            <button
              onClick={startScanner}
              className="w-full bg-espresso text-white font-kanit font-semibold rounded-full py-4 text-lg shadow-lg active:scale-[0.98] transition-transform"
            >
              เปิดกล้องสแกน QR
            </button>
            <button
              onClick={() => setCouponMode(true)}
              className="w-full mt-3 border-2 border-espresso text-espresso bg-transparent font-kanit font-semibold rounded-full py-4 text-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Ticket size={20} />
              ใช้คูปองส่วนลด
            </button>
          </div>
        )}

        {/* ─── Coupon Flow: ฟอร์มกรอกรหัสคูปอง ─── */}
        {couponMode && !couponSuccess && (
          <div className="w-full max-w-sm bg-card rounded-[24px] shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-kanit font-bold text-lg text-ink flex items-center gap-2">
                <Ticket size={20} className="text-peach" />
                ใช้คูปองส่วนลด
              </h2>
              <button onClick={resetCoupon} className="text-muted p-1 bg-cream rounded-full"><X size={16} /></button>
            </div>

            <p className="text-sm text-muted mb-6">กรอกรหัสคูปอง 6 หลักที่ลูกค้าแสดง</p>

            <form onSubmit={handleCouponSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.4em] text-4xl font-mono font-bold bg-transparent border-b-2 border-espresso/20 pb-3 outline-none focus:border-espresso transition-colors text-ink placeholder:text-muted/20"
                  autoFocus
                />
                <p className="text-xs text-muted text-center mt-2">
                  {couponInput.length}/6 หลัก
                </p>
              </div>

              {couponError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 flex gap-2 items-start">
                  <span>⚠️</span>
                  <p>{couponError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={couponLoading || couponInput.length !== 6}
                className="w-full bg-espresso text-white font-kanit font-semibold py-4 rounded-full flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {couponLoading ? <Loader2 className="animate-spin" size={20} /> : "ยืนยันใช้คูปอง"}
              </button>
            </form>
          </div>
        )}

        {/* ─── Coupon Flow: สำเร็จ ─── */}
        {couponMode && couponSuccess && (
          <div className="w-full max-w-sm bg-card rounded-[24px] shadow-lg p-8 flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-chip-mint rounded-full flex items-center justify-center mb-4 text-line-green">
              <CheckCircle2 size={40} strokeWidth={2} />
            </div>
            <h2 className="font-kanit font-bold text-2xl text-ink mb-2">ใช้คูปองสำเร็จ!</h2>

            <div className="bg-cream w-full rounded-2xl p-4 my-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">โปรโมชั่น</span>
                <span className="font-bold text-ink text-base">{couponSuccess.promotion_title}</span>
              </div>
            </div>

            <button
              onClick={resetCouponForm}
              className="w-full bg-espresso text-white font-kanit font-semibold py-3.5 rounded-full"
            >
              ใช้คูปองถัดไป
            </button>
            <button
              onClick={resetCoupon}
              className="w-full mt-3 text-muted font-kanit font-medium py-2 text-sm"
            >
              กลับหน้าหลัก
            </button>
          </div>
        )}

        {/* Scanner View */}
        {scannerVisible && (
          <div className="w-full max-w-sm flex flex-col">
            <div className="flex justify-end mb-4">
              <button
                onClick={closeScanner}
                className="bg-white p-2 rounded-full shadow text-ink"
              >
                <X size={24} />
              </button>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg border-4 border-white">
              <div id="qr-reader" className="w-full" />
            </div>
            <p className="text-center text-muted mt-4 text-sm animate-pulse">กำลังหากรอบ QR Code...</p>
          </div>
        )}

        {/* Action Form (After Scan) */}
        {scannedToken && !successData && (
          <div className="w-full max-w-sm bg-card rounded-[24px] shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-kanit font-bold text-lg text-ink">เลือกรายการ</h2>
              <button onClick={resetAll} className="text-muted p-1 bg-cream rounded-full"><X size={16} /></button>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-cream rounded-full p-1 mb-6">
              <button
                type="button"
                onClick={() => { setMode("earn"); setInputValue(""); setApiError(null); }}
                className={`flex-1 py-2.5 text-sm font-kanit font-semibold rounded-full transition-colors ${
                  mode === "earn" ? "bg-white text-espresso shadow-sm" : "text-muted"
                }`}
              >
                ให้แต้ม
              </button>
              <button
                type="button"
                onClick={() => { setMode("redeem"); setInputValue(""); setApiError(null); }}
                className={`flex-1 py-2.5 text-sm font-kanit font-semibold rounded-full transition-colors ${
                  mode === "redeem" ? "bg-white text-espresso shadow-sm" : "text-muted"
                }`}
              >
                แลกแต้ม
              </button>
            </div>

            {mode && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block font-kanit font-semibold text-ink text-sm mb-2">
                    {mode === "earn" ? "ยอดเงินสุทธิ (บาท)" : "จำนวนแต้มที่ต้องการแลก"}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0"
                    className="w-full text-right text-3xl font-bold bg-transparent border-b-2 border-espresso/20 pb-2 outline-none focus:border-espresso transition-colors text-ink placeholder:text-muted/30"
                    autoFocus
                  />
                  {mode === "redeem" && inputValue && !isNaN(Number(inputValue)) && (
                    <p className="text-sm text-peach font-semibold mt-2 text-right">
                      = ส่วนลด { (Number(inputValue) / 100).toFixed(2) } บาท
                    </p>
                  )}
                  {mode === "earn" && inputValue && !isNaN(Number(inputValue)) && (
                    <p className="text-sm text-chip-mint font-semibold mt-2 text-right text-line-green">
                      = ได้ { Math.floor(Number(inputValue) / 10) * 3 } แต้ม
                    </p>
                  )}
                </div>

                {apiError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 flex gap-2 items-start">
                    <span>⚠️</span>
                    <p>{apiError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !inputValue}
                  className="w-full bg-espresso text-white font-kanit font-semibold py-4 rounded-full flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "ยืนยันทำรายการ"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Success View */}
        {successData && (
          <div className="w-full max-w-sm bg-card rounded-[24px] shadow-lg p-8 flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-chip-mint rounded-full flex items-center justify-center mb-4 text-line-green">
              <CheckCircle2 size={40} strokeWidth={2} />
            </div>
            <h2 className="font-kanit font-bold text-2xl text-ink mb-2">ทำรายการสำเร็จ!</h2>
            
            <div className="bg-cream w-full rounded-2xl p-4 my-6 space-y-3">
              {successData.points_earned !== undefined && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">แต้มที่ได้รับ</span>
                  <span className="font-bold text-line-green text-lg">+{successData.points_earned}</span>
                </div>
              )}
              {successData.discount_baht !== undefined && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">ส่วนลดเงินสด</span>
                  <span className="font-bold text-peach text-lg">{successData.discount_baht} ฿</span>
                </div>
              )}
              <div className="w-full h-px bg-muted/20" />
              <div className="flex justify-between items-center">
                <span className="text-muted font-medium">แต้มคงเหลือล่าสุด</span>
                <span className="font-bold text-ink text-xl">{successData.new_balance}</span>
              </div>
            </div>

            <button
              onClick={startScanner}
              className="w-full bg-espresso text-white font-kanit font-semibold py-3.5 rounded-full"
            >
              สแกนคิวอาร์คิวถัดไป
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
