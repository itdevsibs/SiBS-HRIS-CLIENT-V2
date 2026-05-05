import { useEffect } from "react";

export default function useRefetchOnFocus(callback) {
  useEffect(() => {
    const handleFocus = () => {
      callback();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        callback();
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