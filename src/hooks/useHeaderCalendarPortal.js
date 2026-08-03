import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

export default function useHeaderCalendarPortal({
  open,
  onClose,
  onOpen,
  onCleanup,
}) {
  useEffect(() => {
    if (!open) return undefined;

    onOpen?.();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      onCleanup?.();
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCleanup, onClose, onOpen, open]);

  return useCallback((content) => {
    if (typeof document === "undefined") {
      return content;
    }

    return createPortal(content, document.body);
  }, []);
}
