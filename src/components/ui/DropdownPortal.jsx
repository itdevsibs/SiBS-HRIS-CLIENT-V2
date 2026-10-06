import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function DropdownPortal({
  open,
  anchorRef,
  onClose,
  children,
  className = "",
  width = null,
  matchAnchorWidth = true,
  maxHeight = 320,
  offset = 6,
  align = "left",
}) {
  const [style, setStyle] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      const clickedAnchor = anchorRef.current?.contains(event.target);
      const clickedPanel = panelRef.current?.contains(event.target);

      if (!clickedAnchor && !clickedPanel) onClose?.();
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, anchorRef, onClose]);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return undefined;

    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const viewportPadding = 10;
      const panelWidth = Math.min(
        Number(width) || (matchAnchorWidth ? rect.width : Math.max(rect.width, 280)),
        Math.max(220, window.innerWidth - viewportPadding * 2),
      );

      const spaceBelow = window.innerHeight - rect.bottom - offset - viewportPadding;
      const spaceAbove = rect.top - offset - viewportPadding;
      const shouldFlipUp = spaceBelow < 200 && spaceAbove > spaceBelow;
      const availableHeight = Math.max(140, shouldFlipUp ? spaceAbove : spaceBelow);
      const resolvedMaxHeight = Math.min(maxHeight, availableHeight);
      const renderedHeight = Math.min(
        panelRef.current?.offsetHeight || resolvedMaxHeight,
        resolvedMaxHeight,
      );

      let left = rect.left;
      if (align === "right") left = rect.right - panelWidth;
      if (align === "center") left = rect.left + rect.width / 2 - panelWidth / 2;

      left = Math.min(
        Math.max(viewportPadding, left),
        window.innerWidth - panelWidth - viewportPadding,
      );

      const top = shouldFlipUp
        ? Math.max(viewportPadding, rect.top - renderedHeight - offset)
        : rect.bottom + offset;

      setStyle({
        top,
        left,
        width: panelWidth,
        maxHeight: resolvedMaxHeight,
      });
    }

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef, width, matchAnchorWidth, maxHeight, offset, align]);

  if (!open || !style || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      className={`sibs-dropdown-pop-in fixed z-[999999] overflow-hidden rounded-xl border border-[#D7E3F0] bg-white font-jakarta shadow-[0_16px_36px_rgba(4,44,81,0.16)] ${className}`}
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        width: `${style.width}px`,
        maxHeight: `${style.maxHeight}px`,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
