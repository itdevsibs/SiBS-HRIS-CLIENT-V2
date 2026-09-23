import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  MapPin,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  return `${parts[0][0] || ""}${parts.length > 1 ? parts.at(-1)[0] : ""}`.toUpperCase();
}

export default function DepartmentCard({ department, onView }) {
  const active = department.status === "active";
  const visibleAccounts = department.accounts.slice(0, 2);
  const remainingAccounts = Math.max(department.accounts.length - visibleAccounts.length, 0);

  return (
    <article className="flex min-h-[440px] flex-col overflow-hidden rounded-2xl border border-sibs-border bg-white transition hover:-translate-y-0.5 hover:border-sibs-orange/40 hover:shadow-lg">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sibs-faint">{department.code} · KRONOS</p>
            <h3 className="mt-1 font-heading text-lg font-bold leading-tight text-sibs-orange">{department.name}</h3>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ${active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}`}>
            {active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {active ? "Active" : "Inactive"}
          </span>
        </div>

        <p className="mt-3 line-clamp-2 min-h-10 text-xs font-semibold leading-relaxed text-sibs-muted">{department.description}</p>

        <div className="mt-4 flex min-h-[74px] items-center gap-3 rounded-xl border border-sibs-border bg-sibs-surface p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sibs-navy text-xs font-extrabold text-white">{initials(department.lead?.name)}</span>
          <div className="min-w-0">
            <p className="text-[8px] font-extrabold uppercase tracking-wide text-sibs-faint">Department Lead</p>
            <p className="truncate text-xs font-extrabold text-sibs-navy">{department.lead?.name || "Supervisor unavailable"}</p>
            <p className="truncate text-[9px] font-semibold text-sibs-muted">{department.lead?.title || "No supervisor assignment found"}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-[10px] font-semibold text-sibs-secondary">
          <span className="flex min-w-0 items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0 text-sibs-orange" /><span className="truncate">{department.primaryLocation}</span></span>
          {department.locations.length > 1 ? <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[8px] font-extrabold text-sibs-muted">+{department.locations.length - 1} site</span> : null}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3 text-[10px] font-extrabold text-sibs-navy">
            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Staff Coverage</span>
            <span>{department.activeStaff} / {department.totalStaff} <span className="text-sibs-faint">({department.staffCoverage}%)</span></span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-sibs-orange transition-all" style={{ width: `${Math.min(department.staffCoverage, 100)}%` }} />
          </div>
        </div>

        <div className="mt-4 flex min-h-12 flex-wrap content-start gap-1.5">
          {visibleAccounts.map((account) => (
            <span key={account.id} className="inline-flex max-w-[calc(50%-0.25rem)] items-center gap-1 rounded-md border border-sibs-border bg-sibs-surface px-2 py-1 text-[8px] font-bold text-sibs-secondary">
              <BriefcaseBusiness className="h-3 w-3 shrink-0 text-emerald-600" /><span className="truncate">{account.name}</span>
            </span>
          ))}
          {remainingAccounts > 0 ? <span className="rounded-md border border-sibs-border bg-sibs-surface px-2 py-1 text-[8px] font-bold text-sibs-muted">+{remainingAccounts} more</span> : null}
          {!department.accounts.length ? <span className="text-[9px] font-semibold text-sibs-faint">No linked account programs</span> : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-sibs-border bg-sibs-surface px-5 py-3">
        <span className="inline-flex items-center gap-2 text-[10px] font-extrabold text-sibs-muted"><WalletCards className="h-4 w-4 text-emerald-600" /> Budget not available</span>
        <button type="button" onClick={() => onView(department)} className="inline-flex items-center gap-2 text-xs font-extrabold text-sibs-navy transition hover:text-sibs-orange">
          <Building2 className="h-4 w-4" /> View Details <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
