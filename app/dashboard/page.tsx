// Server Component — no "use client"
// ใช้ dynamic + ssr:false ตาม pattern เดียวกับ /register และ /test-liff
import dynamic from "next/dynamic";

const DashboardClient = dynamic(() => import("./_client"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#F3ECE7] px-5 pt-10 pb-8 animate-pulse space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-13 h-13 rounded-full bg-[#E8DDD7]" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-[#E8DDD7] rounded-full w-20" />
          <div className="h-5 bg-[#E8DDD7] rounded-full w-32" />
        </div>
      </div>
      <div className="h-52 rounded-[20px] bg-[#FDFBF9]" />
    </div>
  ),
});

export default function DashboardPage() {
  return <DashboardClient />;
}
