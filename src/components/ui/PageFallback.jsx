import React from "react";

export default function PageFallback() {
  return (
    <div
      className="flex min-h-[60vh] w-full flex-1 flex-col items-center justify-center p-6 font-jakarta"
      role="status"
      aria-label="Loading page content"
    >
      <div className="relative flex items-center justify-center">
        {/* Outer spinner using SiBS border-subtle & top orange accent */}
        <div className="h-10 w-10 2xl:h-12 2xl:w-12 rounded-full border-2 border-sibs-border-subtle border-t-sibs-orange animate-spin" />
        {/* Center navy dot with breathing pulse */}
        <div className="absolute h-2 w-2 rounded-full bg-sibs-navy animate-sibs-pulse" />
      </div>
      <p className="mt-3.5 sibs-text-xs font-extrabold uppercase tracking-wider text-sibs-muted">
        Loading...
      </p>
    </div>
  );
}
