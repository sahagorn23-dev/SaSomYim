import Image from "next/image";
import { X, Gift } from "lucide-react";

export type PromotionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  pointsCost?: number;
  quantity?: number;
  redeemedAt?: string;
  status?: string;
  actionButton?: React.ReactNode;
};

export function PromotionModal({
  isOpen,
  onClose,
  title,
  description,
  imageUrl,
  pointsCost,
  quantity,
  redeemedAt,
  status,
  actionButton
}: PromotionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-5 py-10 animate-in fade-in duration-200">
      {/* คลิกพื้นหลังโปร่งแสงเพื่อปิดได้ */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="bg-card w-full max-w-sm rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 shadow-2xl relative z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full z-10 backdrop-blur-md transition-colors"
          aria-label="ปิด"
        >
          <X size={20} />
        </button>

        {/* รูปภาพ */}
        <div className="relative w-full aspect-video bg-cream shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gift size={48} className="text-muted/30" />
            </div>
          )}
        </div>

        {/* เนื้อหาที่ไถ Scroll ได้ */}
        <div className="p-6 overflow-y-auto flex-1 font-ibm">
          <h2 className="font-kanit font-bold text-2xl text-ink leading-tight mb-3">
            {title}
          </h2>
          
          {(pointsCost !== undefined || quantity !== undefined) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {pointsCost !== undefined && (
                <span className="text-sm font-bold text-peach bg-peach/10 px-3 py-1 rounded-full font-kanit">
                  ใช้ {pointsCost} แต้ม
                </span>
              )}
              {quantity !== undefined && (
                <span className="text-xs text-muted font-medium bg-cream px-3 py-1 rounded-full">
                  สิทธิ์คงเหลือ: {quantity}
                </span>
              )}
            </div>
          )}

          {(redeemedAt || status) && (
            <div className="flex flex-col gap-1 mb-4 text-sm text-muted bg-cream/50 p-3 rounded-2xl">
              {redeemedAt && <p><strong>แลกเมื่อ:</strong> {redeemedAt}</p>}
              {status && (
                <p>
                  <strong>สถานะ:</strong>{" "}
                  <span className={status === 'unused' ? 'text-espresso font-semibold' : ''}>
                    {status === 'unused' ? 'ใช้งานได้' : status === 'used' ? 'ใช้แล้ว' : 'หมดอายุ'}
                  </span>
                </p>
              )}
            </div>
          )}

          <div className="border-t border-muted/10 pt-4 mt-2">
            <h3 className="font-kanit font-semibold text-ink text-sm mb-2">รายละเอียดและเงื่อนไข</h3>
            <p className="font-ibm text-sm text-muted leading-relaxed whitespace-pre-wrap">
              {description || "ไม่มีรายละเอียดเพิ่มเติม"}
            </p>
          </div>
        </div>

        {/* ปุ่มด้านล่างสุด */}
        {actionButton && (
          <div className="p-5 bg-white border-t border-muted/10 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] shrink-0">
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
}
