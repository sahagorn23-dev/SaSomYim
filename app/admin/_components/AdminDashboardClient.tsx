"use client";

import { useEffect, useState, useCallback } from "react";
import { LogOut, Loader2, Trash2, PlusCircle, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { PromotionModal } from "@/components/PromotionModal";

type Promotion = {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  image_url: string | null;
  quantity_available: number;
  is_active: boolean;
};

export function AdminDashboardClient() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pointsCost, setPointsCost] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // View State
  const [viewingPromo, setViewingPromo] = useState<Promotion | null>(null);

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/promotions", { cache: "no-store" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to fetch promotions");
      setPromotions(data.promotions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !pointsCost || !quantity || submitting) return;
    
    setSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("points_cost", pointsCost);
      formData.append("quantity_available", quantity);
      
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        setFormError(data.error || "เกิดข้อผิดพลาดในการสร้างโปรโมชั่น");
      } else {
        // Reset form and refetch
        setTitle("");
        setDescription("");
        setPointsCost("");
        setImageFile(null);
        setImagePreview(null);
        setQuantity("");
        
        // Reset file input
        const fileInput = document.getElementById("image-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        
        fetchPromotions();
      }
    } catch (err) {
      setFormError("เครือข่ายขัดข้อง");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบโปรโมชั่นนี้? การลบจะไม่สามารถกู้คืนได้")) return;
    
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchPromotions();
      } else {
        const data = await res.json();
        alert(data.error || "เกิดข้อผิดพลาดในการลบ");
      }
    } catch (err) {
      alert("เครือข่ายขัดข้อง");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col font-ibm pb-10">
      {/* Header */}
      <header className="bg-card px-5 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div>
          <h1 className="font-kanit font-bold text-xl text-ink">ระบบจัดการโปรโมชั่น (Admin)</h1>
          <p className="text-xs text-muted">SaSomYim CMS</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-red-500 bg-red-50 px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-red-100"
        >
          <LogOut size={16} />
          ออก
        </button>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 p-5 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Col: Create Form */}
        <div className="lg:col-span-4 bg-card rounded-[24px] shadow-sm p-6 lg:sticky lg:top-24">
          <h2 className="font-kanit font-bold text-lg text-ink mb-6 flex items-center gap-2">
            <PlusCircle size={20} className="text-espresso" />
            สร้างโปรโมชั่นใหม่
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">ชื่อโปรโมชั่น <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-cream border border-muted/20 rounded-xl px-4 py-2.5 outline-none focus:border-espresso transition-colors text-sm"
                placeholder="เช่น ส่วนลด 50 บาท"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink mb-1">รายละเอียด (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-cream border border-muted/20 rounded-xl px-4 py-2.5 outline-none focus:border-espresso transition-colors text-sm resize-none h-20"
                placeholder="เงื่อนไขการใช้งาน..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">แต้มที่ใช้ <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  value={pointsCost}
                  onChange={(e) => setPointsCost(e.target.value)}
                  className="w-full bg-cream border border-muted/20 rounded-xl px-4 py-2.5 outline-none focus:border-espresso transition-colors text-sm"
                  placeholder="50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">จำนวนสิทธิ์ <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-cream border border-muted/20 rounded-xl px-4 py-2.5 outline-none focus:border-espresso transition-colors text-sm"
                  placeholder="100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">รูปภาพ (Optional)</label>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative w-full aspect-video bg-cream rounded-xl mb-3 overflow-hidden border border-muted/20">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      const fileInput = document.getElementById("image-upload") as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full bg-cream border border-muted/20 rounded-xl px-4 py-2.5 outline-none focus:border-espresso transition-colors text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-espresso file:text-white hover:file:bg-espresso/90 file:cursor-pointer"
              />
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 flex gap-2 items-start">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p>{formError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !title || !pointsCost || !quantity}
              className="w-full bg-espresso text-white font-kanit font-semibold rounded-full py-3.5 mt-2 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : "สร้างโปรโมชั่น"}
            </button>
          </form>
        </div>

        {/* Right Col: Promotions List */}
        <div className="lg:col-span-8 bg-card rounded-[24px] shadow-sm p-6 min-h-[500px]">
          <h2 className="font-kanit font-bold text-lg text-ink mb-6">รายการโปรโมชั่นทั้งหมด</h2>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-espresso" size={32} />
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 text-center">
              {error}
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center text-muted py-20 bg-cream/50 rounded-2xl border border-dashed border-muted/30">
              ยังไม่มีโปรโมชั่น ลองสร้างโปรโมชั่นแรกเลย!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promotions.map((promo) => (
                <div 
                  key={promo.id} 
                  onClick={() => setViewingPromo(promo)}
                  className="bg-white border border-muted/10 rounded-2xl p-4 flex gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative group cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="w-20 h-20 bg-cream rounded-xl shrink-0 relative overflow-hidden flex items-center justify-center text-muted/30">
                    {promo.image_url ? (
                      <Image src={promo.image_url} alt={promo.title} fill className="object-cover" />
                    ) : (
                      <div className="text-[10px]">No Image</div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-kanit font-semibold text-ink leading-tight mb-1 truncate" title={promo.title}>
                      {promo.title}
                    </h3>
                    <p className="text-xs text-muted line-clamp-1 mb-2">
                      {promo.description || "-"}
                    </p>
                    <div className="flex items-center gap-3 mt-auto">
                      <span className="text-sm font-bold text-peach bg-peach/10 px-2 py-0.5 rounded-md">
                        {promo.points_cost} แต้ม
                      </span>
                      <span className="text-[10px] text-muted font-medium bg-cream px-2 py-1 rounded-md">
                        สิทธิ์: {promo.quantity_available}
                      </span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // ป้องกันไม่ให้คลิกแล้วเปิด Modal
                      handleDelete(promo.id);
                    }}
                    disabled={deletingId === promo.id}
                    className="absolute top-3 right-3 p-2 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 disabled:opacity-50"
                    title="ลบโปรโมชั่น"
                  >
                    {deletingId === promo.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ─── Detail Modal (Preview for Admin) ─── */}
      <PromotionModal
        isOpen={!!viewingPromo}
        onClose={() => setViewingPromo(null)}
        title={viewingPromo?.title || ""}
        description={viewingPromo?.description}
        imageUrl={viewingPromo?.image_url}
        pointsCost={viewingPromo?.points_cost}
        quantity={viewingPromo?.quantity_available}
        actionButton={
          <button
            onClick={() => setViewingPromo(null)}
            className="w-full font-kanit font-semibold text-sm py-3.5 rounded-full transition-all bg-cream text-espresso active:scale-[0.97]"
          >
            ปิดหน้าต่าง
          </button>
        }
      />
    </div>
  );
}
