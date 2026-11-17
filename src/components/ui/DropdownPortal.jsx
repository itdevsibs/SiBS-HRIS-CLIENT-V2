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
  topLayer = false,
}) {
  const [style, setStyle] = useState(null);
  const [mounted, setMounted] = useState(Boolean(open));
  const [active, setActive] = useState(Boolean(open));
  const [prevOpen, setPrevOpen] = useState(Boolean(open));
  const panelRef = useRef(null);
  const useNativePopover =
    topLayer && typeof HTMLElement !== "undefined" &&
    typeof HTMLElement.prototype.showPopover === "function";
  const positioned = Boolean(style);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMounted(true);
      setActive(true);
    } else {
      setActive(false);
    }
  }

  useEffect(() => {
    let timer;

    if (!open && mounted) {
      timer = setTimeout(() => {
        setMounted(false);
      }, 200);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      const clickedAnchor = anchorRef.current?.contains(event.target);
      const clickedPanel = panelRef.current?.contains(event.target);

      if (!clickedAnchor && !clickedPanel) onClose?.();
    }

    function handleKeyDown(event) {
      if (event.key !== "Escape") return;
      if (topLayer) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      onClose?.(event);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown, topLayer);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, topLayer);
    };
  }, [open, anchorRef, onClose, topLayer]);

  useLayoutEffect(() => {
    if (useNativePopover && open && positioned) {
      panelRef.current?.showPopover();
    }
  }, [useNativePopover, open, positioned]);

  useLayoutEffect(() => {
    if (!mounted || !anchorRef.current) return undefined;

    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const viewportPadding = 10;
      const panelWidth = Math.min(
        Number(width) || (matchAnchorWidth ? rect.width : Math.max(rect.width, 280)),
        Math.max(topLayer ? 0 : 220, window.innerWidth - viewportPadding * 2),
      );

      // Keep dropdowns within their modal, but NEVER mistake a decorative
      // border on the modal header (or a card inside its body) for its footer.
      // The previous querySelector('[class*="border-t"]') matched the Helpdesk
      // header's border-t-[3px], giving a false bottom boundary above the
      // status selector and forcing its options over the modal title.
      const dialog = anchor.closest?.('[role="dialog"], .sibs-modal-shell, .sibs-modal-blur > div');
      const dialogRect = dialog?.getBoundingClientRect() || null;
      const footer = dialog
        ? Array.from(dialog.querySelectorAll('footer, [data-sibs-modal-footer], .sibs-modal-footer, [class*="border-t"]'))
          .reverse()
          .find((candidate) => {
            const candidateRect = candidate.getBoundingClientRect();
            if (candidateRect.top <= rect.bottom + offset) return false;
            if (candidate.matches('footer, [data-sibs-modal-footer], .sibs-modal-footer')) return true;
            // A standard SiBS modal footer is the LAST direct child of the
            // dialog itself, or of its direct dialog-content wrapper.
            const parent = candidate.parentElement;
            return candidate === parent?.lastElementChild &&
              (parent === dialog || parent?.parentElement === dialog);
          })
        : null;
      const footerRect = footer?.getBoundingClientRect() || null;

      const bottomBoundary = footerRect
        ? Math.min(window.innerHeight - viewportPadding, footerRect.top - offset)
        : dialogRect
          ? Math.min(window.innerHeight - viewportPadding, dialogRect.bottom - offset)
          : window.innerHeight - viewportPadding;

      // If there isn't room to open below, an upward menu must still remain
      // underneath the modal header rather than covering its title/close button.
      const scrollBody = dialog ? anchor.closest('.sibs-scrollbar') : null;
      const header = scrollBody?.previousElementSibling;
      const headerBottom = header && scrollBody?.parentElement === header.parentElement &&
        (scrollBody.parentElement === dialog || scrollBody.parentElement?.parentElement === dialog)
        ? header.getBoundingClientRect().bottom + offset
        : 0;
      const topBoundary = dialogRect
        ? Math.max(viewportPadding, dialogRect.top + offset, headerBottom)
        : viewportPadding;

      const spaceBelow = Math.max(0, bottomBoundary - rect.bottom - offset);
      const spaceAbove = Math.max(0, rect.top - topBoundary - offset);
      const requiredHeight = Math.min(maxHeight, 260);
      const shouldFlipUp = spaceBelow < requiredHeight && spaceAbove > spaceBelow;
      const availableHeight = dialog
        ? Math.max(0, shouldFlipUp ? spaceAbove : spaceBelow)
        : Math.max(topLayer ? 0 : 140, shouldFlipUp ? spaceAbove : spaceBelow);
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
        ? Math.max(topBoundary, rect.top - renderedHeight - offset)
        : rect.bottom + offset;

      setStyle({
        top,
        bottom: window.innerHeight - rect.top + offset,
        left,
        width: panelWidth,
        maxHeight: resolvedMaxHeight,
        isUpward: shouldFlipUp,
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
  }, [mounted, anchorRef, width, matchAnchorWidth, maxHeight, offset, align, topLayer]);

  if (!mounted || !style || (topLayer && !open) || typeof document === "undefined") return null;

  const panel = (
    <div
      ref={panelRef}
      popover={useNativePopover ? "manual" : undefined}
      className={`sibs-animated-dropdown ${active ? "open" : "closed"} ${
        style.isUpward ? "sibs-animated-dropdown-up" : ""
      } fixed z-[999999] ${useNativePopover ? "m-0 overflow-visible border-0 bg-transparent p-0 text-inherit" : ""} ${className}`}
      style={{
        top: topLayer && style.isUpward ? "auto" : style.top,
        bottom: topLayer && style.isUpward ? style.bottom : "auto",
        left: style.left,
        right: "auto",
        width: style.width,
      }}
    >
      <div className="sibs-animated-dropdown-inner">
        <div
          className="sibs-animated-dropdown-box overflow-hidden rounded-[10px] border border-sibs-border bg-white font-jakarta shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
          style={{
            maxHeight: `${style.maxHeight}px`,
            "--dropdown-max-height": `${Math.max(0, style.maxHeight - (topLayer ? 2 : 0))}px`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return useNativePopover ? panel : createPortal(panel, document.body);
}
