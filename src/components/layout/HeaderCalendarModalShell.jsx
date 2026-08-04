import React from "react";

export default function HeaderCalendarModalShell({ children }) {
  return (
    <div className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[2147483000] flex items-center justify-center overflow-hidden px-3 py-6 font-jakarta sm:px-4">
      <section className="sibs-modal-pop-in relative flex h-[min(852px,calc(100vh-48px))] w-full max-w-[min(1120px,calc(100vw-24px))] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_28px_90px_rgba(2,30,56,0.45)]">
        {children}
      </section>
    </div>
  );
}
