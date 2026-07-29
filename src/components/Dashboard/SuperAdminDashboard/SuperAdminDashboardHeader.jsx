import { ShieldCheck, UserPlus, Users } from "lucide-react";

export default function SuperAdminDashboardHeader({
  displayName,
  onAddUser,
  onOpenEmployees,
}) {
  return (
    <section className="sibs-page-header-in sibs-card relative overflow-hidden p-5 sm:p-6">
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-1 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
              <ShieldCheck size={14} className="text-[#FF5C28]" />
              Super Admin Operations Dashboard
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold text-emerald-800">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-emerald-500" />
              System Governance Online
            </span>
          </div>

          <h1 className="mt-3 break-words text-xl font-extrabold tracking-tight text-[#042C51] sm:text-2xl">
            Whole-System HRIS Operations &amp; Governance
          </h1>

          <p className="mt-1 max-w-4xl text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
            Cross-module visibility, user access role governance, risk exception
            monitoring, approval queue routing, and operational snapshots across
            HR, TA, OM, and Finance modules.
          </p>

          <p className="mt-2 text-[10px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
            Signed in as {displayName}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onAddUser}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#063866] hover:shadow-md"
          >
            <UserPlus size={15} className="text-[#FF5C28]" />
            Add Admin / User
          </button>

          <button
            type="button"
            onClick={onOpenEmployees}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#E95324] hover:shadow-md"
          >
            <Users size={15} />
            Employee Directory
          </button>
        </div>
      </div>
    </section>
  );
}
