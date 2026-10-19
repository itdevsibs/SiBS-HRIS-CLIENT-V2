import React from "react";

export default function HeaderCalendarModalShell({ children }) {
  return (
    <div className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden p-0 font-jakarta sm:px-4 sm:py-6">
      <section className="sibs-modal-pop-in relative flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_28px_90px_rgba(2,30,56,0.45)] sm:h-[min(852px,calc(100vh-48px))] sm:max-w-[min(1120px,calc(100vw-24px))] sm:rounded-[14px] sm:pb-0">
        {children}
      </section>
    </div>
  );
}
