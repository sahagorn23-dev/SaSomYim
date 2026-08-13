"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function AdminLoginClient() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Login failed");
        setLoading(false);
      } else {
        // Reload page to re-run Server Component check (verifyAdminSession)
        window.location.reload();
      }
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-5 font-ibm">
      <div className="w-full max-w-sm bg-card rounded-[24px] shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="font-kanit font-bold text-2xl text-ink">Admin Access</h1>
          <p className="text-sm text-muted mt-2">กรุณาเข้าสู่ระบบด้วยรหัสผ่านแอดมิน</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <input
              type="password"
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-center tracking-widest text-2xl font-bold bg-transparent border-b-2 border-muted/20 pb-2 outline-none focus:border-espresso transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg p-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!password || loading}
            className="w-full bg-espresso text-white font-kanit font-semibold rounded-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
