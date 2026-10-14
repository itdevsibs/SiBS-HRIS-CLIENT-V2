import { ShieldCheck } from "lucide-react";

export function PublicSibsLogo() {
  return (
    <div className="flex min-w-0 select-none items-center gap-3">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-sibs-orange shadow-[0_8px_20px_rgba(255,92,40,0.22)]">
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-sibs-navy bg-white" />
        <span className="relative text-[18px] font-black leading-none tracking-tight text-white">
          S
        </span>
      </div>

      <div className="min-w-0 leading-none">
        <div className="flex min-w-0 items-baseline whitespace-nowrap">
          <span className="text-[19px] font-black tracking-tight text-white">
            SiBS&nbsp;
          </span>
          <span className="text-[19px] font-black tracking-tight text-sibs-orange">
            HRIS
          </span>
        </div>
        <p className="mt-1 text-[8px] font-black uppercase tracking-widest text-slate-300">
          HUMAN RESOURCE SYSTEM
        </p>
      </div>
    </div>
  );
}

export default function SurveyHeader({ completed = false, progressPercentage = 70 }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-sibs-navy text-white shadow-md">
      <div className="mx-auto flex max-w-[1060px] items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <PublicSibsLogo />

          <div className="min-w-0 border-l border-white/10 pl-3">
            <span className="rounded-full border border-sibs-orange/40 bg-sibs-orange/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-sibs-orange sm:text-[10px]">
              Public Portal
            </span>
            <p className="mt-1 truncate text-[10px] font-semibold text-slate-300 sm:text-[11px]">
              Voice of Candidate Experience Survey
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-[10px] border border-white/10 bg-black/30 px-3 py-2 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-sibs-pulse" />
          <span className="text-[10px] font-bold text-slate-300 sm:text-[11px]">
            {completed ? "Survey Completed" : "Secure Survey Active"}
          </span>
        </div>
      </div>

      <div
        className="h-1.5 bg-black/30"
        role="progressbar"
        aria-label="Survey completion"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={completed ? 100 : progressPercentage}
      >
        <div
          className="h-full bg-sibs-orange transition-[width] duration-500 ease-out"
          style={{ width: `${completed ? 100 : progressPercentage}%` }}
        />
      </div>
    </header>
  );
}
