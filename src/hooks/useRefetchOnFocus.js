import { useEffect, useRef } from "react";

export default function useRefetchOnFocus(callback) {
  const pendingRefresh = useRef(null);

  useEffect(() => {
    const handleFocus = () => {
      if (pendingRefresh.current) return;

      // Keep the guard through settlement, including a paired visibility event.
      const refresh = {};
      pendingRefresh.current = refresh;
      const clearPending = () => {
        if (pendingRefresh.current === refresh) pendingRefresh.current = null;
      };
      try {
        Promise.resolve(callback()).then(clearPending, clearPending);
      } catch (error) {
        clearPending();
        throw error;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleFocus();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [callback]);
}
