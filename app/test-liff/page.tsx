// Server Component — ห้ามใส่ "use client" ที่นี่
// ใช้ dynamic + ssr:false เพื่อป้องกัน @line/liff จาก SSR
// เพราะ LIFF SDK ต้องการ window/navigator ซึ่งไม่มีบน server
import dynamic from "next/dynamic";

const LiffTestClient = dynamic(() => import("./_client"), {
  ssr: false,
  // แสดง skeleton ง่ายๆ ระหว่าง JS bundle กำลังโหลด
  // (ก่อนที่ LiffGuard จะ render ตัวเองได้)
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 animate-pulse">
      <div className="w-full max-w-sm space-y-4">
        <div className="h-6 bg-gray-200 rounded w-40 mx-auto" />
        <div className="h-24 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-16 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  ),
});

export default function TestLiffPage() {
  return <LiffTestClient />;
}
