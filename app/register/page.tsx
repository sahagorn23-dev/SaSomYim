// Server Component — no "use client"
// LIFF SDK requires browser APIs (window/navigator) so we prevent SSR
// by using dynamic import with ssr:false, matching the pattern used in /test-liff
import dynamic from "next/dynamic";

const RegisterClient = dynamic(() => import("./_client"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#F3ECE7] flex flex-col px-5 pt-8 pb-32 animate-pulse space-y-5">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#E8DDD7]" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-[#E8DDD7] rounded-full w-24" />
          <div className="h-5 bg-[#E8DDD7] rounded-full w-36" />
          <div className="h-3 bg-[#E8DDD7] rounded-full w-28" />
        </div>
      </div>
      {/* Incentive card skeleton */}
      <div className="h-20 rounded-[20px] bg-[#F2A66B]/30" />
      {/* Form skeleton */}
      <div className="h-52 rounded-[20px] bg-[#FDFBF9]" />
    </div>
  ),
});

export default function RegisterPage() {
  return <RegisterClient />;
}
