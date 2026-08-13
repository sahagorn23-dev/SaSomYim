"use client";

import { useEffect, useState } from "react";
import { useLiff } from "@/hooks/useLiff";

import { LoadingScreen } from "./LoadingScreen";

// ─── Error view ───────────────────────────────────────────────────────────────
function ErrorView({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-5xl">😕</span>
      <p className="text-gray-700 font-medium">เกิดข้อผิดพลาด</p>
      <p className="text-sm text-gray-400 break-all">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-6 py-2.5 rounded-full bg-[#06C755] text-white text-sm font-semibold active:opacity-80 transition-opacity"
      >
        ลองใหม่
      </button>
    </div>
  );
}

import { usePathname, useRouter } from "next/navigation";

// ─── LiffGuard ───────────────────────────────────────────────────────────────
type LiffGuardProps = {
  children: React.ReactNode;
};

/**
 * Wraps any LIFF page.
 * - Shows a skeleton while LIFF is initialising / redirecting to login.
 * - Shows an error screen (with retry) only when liff.init() itself throws.
 * - Renders children once the user is authenticated (works both inside the
 *   LINE app and in an external browser via web-login).
 */
export function LiffGuard({ children }: LiffGuardProps) {
  // isMounted: ฝั่ง Server และ Client จะ render null เหมือนกันในรอบแรก
  // หลังจาก useEffect ทำงาน (client-only) isMounted จะเป็น true
  // แล้วค่อย render LIFF content จริง — ป้องกัน Hydration Mismatch
  const [isMounted, setIsMounted] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<"checking" | "registered" | "unregistered">("checking");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { isLoading, error, idToken } = useLiff();

  useEffect(() => {
    if (!idToken) return;

    fetch("/api/members/me", {
      headers: { Authorization: `Bearer ${idToken}` },
      cache: "no-store",
    })
      .then((res) => {
        if (res.ok) {
          setMembershipStatus("registered");
        } else if (res.status === 404) {
          setMembershipStatus("unregistered");
        } else {
          setMembershipStatus("unregistered"); // Fallback
        }
      })
      .catch((err) => {
        console.error("LiffGuard checking membership error:", err);
        setMembershipStatus("unregistered");
      });
  }, [idToken]);

  // Handle Redirection logic
  useEffect(() => {
    if (membershipStatus === "checking") return;

    if (membershipStatus === "unregistered" && pathname !== "/register") {
      router.replace("/register");
    } else if (membershipStatus === "registered" && pathname === "/register") {
      router.replace("/dashboard");
    }
  }, [membershipStatus, pathname, router]);

  if (!isMounted) return null;
  if (isLoading || membershipStatus === "checking") return <LoadingScreen />;
  if (error) return <ErrorView message={error.message} />;

  // ห้าม render children ขณะที่กำลังจะ Redirect ป้องกัน UI Flash
  if (membershipStatus === "unregistered" && pathname !== "/register") return <LoadingScreen />;
  if (membershipStatus === "registered" && pathname === "/register") return <LoadingScreen />;

  return <>{children}</>;
}
