import { Sparkles } from "lucide-react";

export default function AdminDashboardWorkforceKpi({
  utilization,
  absenteeismBuffer,
  delay = 0,
}) {
  const safeUtilization = Math.max(
    0,
    Math.min(100, Number(utilization || 0)),
  );

  return (
    <section
      className="sibs-page-card-in rounded-2xl border border-blue-400/20 bg-gradient-to-br from-[#042C51] to-[#031D36] p-3 2xl:p-5 text-white shadow-md"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="rounded bg-white/10 px-2 py-0.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-wider text-slate-200">
          Live Workforce KPI
        </span>
        <Sparkles className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-[#FF5C28]" />
      </div>

      <div className="mt-2.5 2xl:mt-5">
        <span className="sibs-text-xs font-medium text-slate-300">
          Workforce Utilization
        </span>
        <p className="mt-0.5 2xl:mt-1 text-xl 2xl:text-3xl font-extrabold tabular-nums tracking-tight text-[#FF5C28]">
          {safeUtilization.toFixed(1)}%
        </p>
      </div>

      <div className="mt-2 2xl:mt-4 h-1.5 2xl:h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#FF5C28] transition-all duration-300"
          style={{ width: `${safeUtilization}%` }}
        />
      </div>

      <p className="mt-2 2xl:mt-4 sibs-text-xs leading-snug text-slate-300/90">
        Active manpower allocation is calculated from today&apos;s schedule and
        attendance records. Absenteeism buffer is currently{" "}
        <span className="font-extrabold text-[#FF5C28]">
          {absenteeismBuffer}%
        </span>
        .
      </p>

      <p className="mt-2 2xl:mt-3 rounded-lg border border-white/10 bg-white/5 px-2 py-1 2xl:px-3 2xl:py-2 sibs-text-micro leading-relaxed text-slate-300">
        Read-only values refresh automatically every 60 seconds while this tab
        is active.
      </p>
    </section>
  );
}
