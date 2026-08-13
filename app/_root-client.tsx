"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LiffGuard } from "@/components/LiffGuard";
import { useLiff } from "@/hooks/useLiff";

function RootRoutingContent() {
  const { idToken } = useLiff();
  const router = useRouter();

  useEffect(() => {
    if (!idToken) return;

    fetch("/api/members/me", {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          router.replace("/register");
          return;
        }
        const data = await res.json();
        if (data.registered === true) {
          router.replace("/dashboard");
        } else {
          router.replace("/register");
        }
      })
      .catch((err) => {
        console.error("Root routing error:", err);
        router.replace("/register");
      });
  }, [idToken, router]);

  // แม้ LIFF จะ load เสร็จแล้ว (LiffGuard เลิกโชว์ skeleton ของตัวเอง)
  // แต่เราต้องใช้เวลาเรียก API และ Redirect 
  // จึงโชว์ Skeleton ของแอปเพื่อไม่ให้จอขาวว่างๆ
  return (
    <div className="min-h-screen bg-[#F3ECE7] flex flex-col px-5 pt-8 pb-32 animate-pulse space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#E8DDD7]" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-[#E8DDD7] rounded-full w-24" />
          <div className="h-5 bg-[#E8DDD7] rounded-full w-36" />
          <div className="h-3 bg-[#E8DDD7] rounded-full w-28" />
        </div>
      </div>
      <div className="h-20 rounded-[20px] bg-[#F2A66B]/30" />
      <div className="h-52 rounded-[20px] bg-[#FDFBF9]" />
    </div>
  );
}

export default function RootClient() {
  return (
    <LiffGuard>
      <RootRoutingContent />
    </LiffGuard>
  );
}
