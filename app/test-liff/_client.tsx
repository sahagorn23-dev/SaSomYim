"use client";

import { LiffGuard } from "@/components/LiffGuard";
import { useLiff } from "@/hooks/useLiff";
import Image from "next/image";

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
        value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
      }`}
    >
      {value ? "true" : "false"}
    </span>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-28">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right break-all">
        {children}
      </span>
    </div>
  );
}

// ─── Inner content ────────────────────────────────────────────────────────────
function LiffTestContent() {
  const { isLoading, isInClient, isLoggedIn, error, profile, idToken } =
    useLiff();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">🧪 LIFF Test Page</h1>
          <p className="text-xs text-gray-400 mt-1">สำหรับทดสอบ useLiff() hook</p>
        </div>

        {/* Profile card */}
        {profile && (
          <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
            <Image
              src={profile.pictureUrl ?? ""}
              alt={profile.displayName}
              width={56}
              height={56}
              className="rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-gray-800">{profile.displayName}</p>
              <p className="text-xs text-gray-400 mt-0.5 break-all">
                {profile.userId}
              </p>
            </div>
          </div>
        )}

        {/* Hook States */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Hook States
          </p>
          <Row label="isLoading">
            <Badge value={isLoading} />
          </Row>
          <Row label="isInClient">
            <Badge value={isInClient} />
          </Row>
          <Row label="isLoggedIn">
            <Badge value={isLoggedIn} />
          </Row>
          <Row label="error">
            {error ? (
              <span className="text-red-500 text-xs">{error.message}</span>
            ) : (
              <span className="text-gray-400 text-xs">null</span>
            )}
          </Row>
        </div>

        {/* ID Token */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            ID Token (20 chars)
          </p>
          {idToken ? (
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <code className="text-xs text-gray-700 break-all">
                {idToken.slice(0, 20)}
                <span className="text-gray-400">…</span>
              </code>
            </div>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </div>

        {/* Profile raw */}
        {profile && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Profile (raw)
            </p>
            <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Export (wrapped with LiffGuard) ─────────────────────────────────────────
export default function LiffTestClient() {
  return (
    <LiffGuard>
      <LiffTestContent />
    </LiffGuard>
  );
}
