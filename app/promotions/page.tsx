// Server Component — no "use client"
// ใช้ dynamic + ssr:false ตาม pattern เดียวกับ /dashboard
import dynamic from "next/dynamic";

const PromotionsClient = dynamic(() => import("./_client"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#F3ECE7] px-5 pt-10 pb-8 animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-6 bg-[#E8DDD7] rounded-full w-32" />
        <div className="h-3 bg-[#E8DDD7] rounded-full w-48" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-48 rounded-[20px] bg-[#FDFBF9]" />
        <div className="h-48 rounded-[20px] bg-[#FDFBF9]" />
        <div className="h-48 rounded-[20px] bg-[#FDFBF9]" />
        <div className="h-48 rounded-[20px] bg-[#FDFBF9]" />
      </div>
    </div>
  ),
});

export default function PromotionsPage() {
  return <PromotionsClient />;
}
