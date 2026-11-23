import { useEffect, useState } from 'react';
import { Monitor, ShieldCheck, Smartphone } from 'lucide-react';
import { isAssessmentDesktopUnavailable } from './assessmentDevicePolicy';

/** Keep the registration and the emailed assessment link off phones/tablets. */
export default function PublicAssessmentDesktopOnly({ children }) {
  const [desktopUnavailable, setDesktopUnavailable] = useState(() => isAssessmentDesktopUnavailable());

  useEffect(() => {
    const update = () => setDesktopUnavailable(isAssessmentDesktopUnavailable());
    const mediaQueries = typeof window.matchMedia === 'function'
      ? [window.matchMedia('(max-width: 1023px)'), window.matchMedia('(hover: none) and (pointer: coarse)')]
      : [];

    // Device emulation can change the viewport without navigating/reloading.
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    window.addEventListener('pageshow', update);
    mediaQueries.forEach(query => query.addEventListener?.('change', update));
    update();

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('pageshow', update);
      mediaQueries.forEach(query => query.removeEventListener?.('change', update));
    };
  }, []);

  if (!desktopUnavailable) return children;
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f3f7fb] px-4 py-8 font-['Plus_Jakarta_Sans']">
      <section role="alert" aria-labelledby="assessment-desktop-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#cbdceb] bg-white shadow-sm">
        <header className="flex items-center justify-between gap-3 bg-[#082e53] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}SiBSLogoNavy.png`} className="h-12 w-24 rounded-lg bg-white object-contain p-1.5" alt="SiBS" />
            <div><p className="text-sm font-extrabold">SiBS CSR-Fit Assessment</p><p className="mt-0.5 text-[11px] text-white/70">Secure public assessment</p></div>
          </div>
          <ShieldCheck size={20} className="shrink-0 text-white/80" aria-hidden="true" />
        </header>
        <div className="px-6 py-8 text-center sm:px-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eff6fd] text-[#082e53]">
            <Monitor size={32} aria-hidden="true" />
          </div>
          <h1 id="assessment-desktop-title" className="mt-5 text-xl font-extrabold text-[#082e53]">Desktop or laptop required</h1>
          <p className="mt-3 text-sm leading-6 text-[#49647c]">
            Public CSR-Fit registration and the seven-module assessment are not available on mobile phones or tablets.
            Please open this page on a desktop or laptop computer with a keyboard, and use a browser window at least 1024 pixels wide.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-[#d5e3ef] bg-[#f6faff] px-4 py-3 text-left text-xs text-[#49647c]">
            <Smartphone size={19} className="shrink-0 text-[#ff5c28]" aria-hidden="true" />
            <span>Mobile access is restricted. If your test has already started, its original deadline continues.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
