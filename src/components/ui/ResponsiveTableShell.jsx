import React from "react";

/**
 * Universal layout wrapper establishing an unambiguous responsive contract:
 * - Desktop View: visible at >= 1024px (`hidden lg:block`), preserving full data density.
 * - Mobile View: visible at < 1024px (`block lg:hidden`), rendering touch-optimized cards.
 */
export default function ResponsiveTableShell({
  desktopContent,
  mobileContent,
  desktopView,
  mobileView,
  desktopClassName = "",
  mobileClassName = "",
  className = "",
}) {
  const resolvedDesktop = desktopContent ?? desktopView;
  const resolvedMobile = mobileContent ?? mobileView;

  return (
    <div className={className}>
      {/* Desktop Table View (>= 1024px) */}
      <div className={`hidden lg:block ${desktopClassName}`}>
        {resolvedDesktop}
      </div>

      {/* Mobile / Tablet Card View (< 1024px) */}
      <div className={`block lg:hidden ${mobileClassName}`}>
        {resolvedMobile}
      </div>
    </div>
  );
}
