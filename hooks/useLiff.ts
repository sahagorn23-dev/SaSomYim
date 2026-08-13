"use client";

import { useEffect, useRef, useState } from "react";
import liff from "@line/liff";
import type { Profile } from "@liff/get-profile";

export type UseLiffReturn = {
  isLoading: boolean;
  isInClient: boolean;
  isLoggedIn: boolean;
  error: Error | null;
  profile: Profile | null;
  idToken: string | null;
};

export function useLiff(): UseLiffReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isInClient, setIsInClient] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  // Guard against React Strict Mode calling useEffect twice in dev mode.
  // Without this, liff.init() would run twice and liff.login() could fire
  // multiple overlapping redirects before the first one completes.
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) {
      setError(new Error("NEXT_PUBLIC_LIFF_ID is not set"));
      setIsLoading(false);
      return;
    }

    liff
      .init({ liffId })
      .then(async () => {
        // เก็บ isInClient ไว้แค่ปรับ UI ไม่ใช่บล็อก flow
        setIsInClient(liff.isInClient());

        if (!liff.isLoggedIn()) {
          // ทั้งในแอปและนอกแอป ให้เรียก login() ทันที
          // LINE จะ redirect ไปหน้า login ถ้าเปิดในเบราว์เซอร์
          // หรือ login อัตโนมัติถ้าเปิดในแอป LINE
          liff.login();
          return; // รอ redirect — ไม่ต้อง set isLoading = false
        }

        setIsLoggedIn(true);

        const [userProfile, token] = await Promise.all([
          liff.getProfile(),
          Promise.resolve(liff.getIDToken()),
        ]);

        setProfile(userProfile);
        setIdToken(token);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[useLiff] liff.init() failed:", error);
        setError(error);
        setIsLoading(false);
      });
  }, []);

  return { isLoading, isInClient, isLoggedIn, error, profile, idToken };
}
