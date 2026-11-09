import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Global offline indicator banner for SiBS HRIS.
 * Alerts users when network connectivity is lost so they avoid attempting writes.
 */
export default function OfflineStatusBanner() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return true;
    }
    return navigator.onLine;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[100] flex w-full items-center justify-center gap-2 border-b border-amber-300 bg-amber-400 px-4 py-1.5 text-center font-jakarta text-xs font-bold text-slate-950 shadow-xs"
    >
      <WifiOff size={15} className="shrink-0 text-slate-950" />
      <span>
        You are currently offline. Actions and changes will not be saved until your connection is restored.
      </span>
    </div>
  );
}
