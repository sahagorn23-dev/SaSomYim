import Image from "next/image";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream font-ibm">
      <div className="animate-pulse flex flex-col items-center">
        <Image
          src="/img/Loading.png"
          alt="Loading..."
          width={120}
          height={120}
          className="object-contain"
          priority
        />
        <p className="mt-4 text-espresso/70 font-medium text-sm font-kanit tracking-wide">
          กำลังโหลดข้อมูล...
        </p>
      </div>
    </div>
  );
}
