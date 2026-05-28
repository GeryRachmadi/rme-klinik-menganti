"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

interface UnauthorizedToastProps {
  error?: string;
}

export default function UnauthorizedToast({ error }: UnauthorizedToastProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (error === "unauthorized") {
      setVisible(true);
      router.replace("/beranda");
      timerRef.current = setTimeout(() => setVisible(false), 4000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [error, router]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white rounded-2xl shadow-lg px-5 py-3.5 border border-red-200"
      style={{ fontFamily: "var(--font-jakarta)" }}
    >
      <AlertCircle size={18} strokeWidth={2} className="text-red-500 flex-shrink-0" />
      <p className="text-sm text-gray-700 font-medium">
        Anda tidak memiliki akses ke halaman tersebut.
      </p>
    </div>
  );
}
