import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  Layers3,
  Loader2,
  Mail,
  MapPin,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";

import { ModalShell } from "@/components/ui";

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  return `${parts[0][0] || ""}${parts.length > 1 ? parts.at(-1)[0] : ""}`.toUpperCase();
}

export default function DepartmentDetailsModal({ department, loading, error, onClose }) {
  if (!department) return null;
  const active = department.status === "active";

  return (
    <ModalShell
      open
      onClose={onClose}
      title={department.name}
      subtitle={department.description}
      icon={Layers3}
      badge={`${department.code} · Kronos Department`}
      maxWidth="max-w-3xl"
      bodyClassName="max-h-[68vh] overflow-y-auto"
      footer={(
        <div className="flex w-full items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-[10px] font-extrabold text-sibs-muted"><WalletCards className="h-4 w-4 text-emerald-600" /> Budget data unavailable in Kronos</span>
          <button type="button" className="sibs-btn-primary" onClick={onClose}>Close Directory</button>
        </div>
      )}
    >
      {loading ? (
        <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-sibs-orange" /></div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center text-rose-700"><AlertTriangle className="mx-auto h-7 w-7" /><p className="mt-2 text-sm font-extrabold">{error}</p></div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-xl border border-sibs-border bg-sibs-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sibs-navy text-sm font-extrabold text-white">{initials(department.lead?.name)}</span>
              <div className="min-w-0">
                <p className="sibs-field-label">Department Lead</p>
                <p className="truncate text-sm font-extrabold text-sibs-navy">{department.lead?.name || "Supervisor unavailable"}</p>
                <p className="text-[10px] font-semibold text-sibs-muted">{department.lead?.title || "No supervisor assignment found"}</p>
                {department.lead?.email ? <p className="mt-1 flex items-center gap-1 truncate text-[9px] font-bold text-sibs-orange"><Mail className="h-3 w-3" /> {department.lead.email}</p> : null}
              </div>
            </div>
            <span className={`inline-flex self-start items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold sm:self-auto ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
              {active ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{active ? "Active & Staffed" : "No Active Accounts"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[["Active Staff", department.activeStaff, "text-sibs-navy"], ["Total Staff", department.totalStaff, "text-blue-700"], ["Staff Coverage", `${department.staffCoverage}%`, "text-emerald-700"]].map(([label, value, tone]) => (
              <div key={label} className="rounded-xl border border-sibs-border bg-white p-4 text-center"><p className="text-[9px] font-extrabold uppercase text-sibs-muted">{label}</p><p className={`mt-2 text-xl font-extrabold ${tone}`}>{value}</p></div>
            ))}
          </div>

          <section>
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-sibs-navy"><MapPin className="h-4 w-4 text-sibs-orange" /> Site Allocation</h3>
            <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-sibs-border bg-sibs-surface p-4">
              {department.locations.length ? department.locations.map((location) => <span key={location} className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3 py-2 text-[10px] font-extrabold text-sibs-secondary"><MapPin className="h-3.5 w-3.5 text-sibs-orange" /> {location}</span>) : <span className="text-xs font-semibold text-sibs-muted">Location information unavailable.</span>}
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-sibs-navy"><BriefcaseBusiness className="h-4 w-4" /> Programs & Linked Accounts ({department.accounts.length})</h3>
            {department.accounts.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {department.accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between gap-3 rounded-xl border border-sibs-border bg-sibs-surface p-3">
                    <div className="min-w-0"><p className="truncate text-xs font-extrabold text-sibs-navy">{account.name}</p><p className="mt-0.5 truncate text-[9px] font-semibold text-sibs-muted">{account.code}{account.longName ? ` · ${account.longName}` : ""}</p></div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-extrabold uppercase ${account.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{account.status}</span>
                  </div>
                ))}
              </div>
            ) : <div className="mt-3 rounded-xl border border-dashed border-sibs-border p-6 text-center text-xs font-semibold text-sibs-muted">No accounts are linked to this department.</div>}
          </section>

          <div className="flex items-center justify-between rounded-xl border border-sibs-border bg-sibs-surface p-4">
            <span className="flex items-center gap-2 text-xs font-extrabold text-sibs-navy"><Users className="h-4 w-4" /> Account Status</span>
            <span className="text-[10px] font-bold text-sibs-muted">{department.activeAccounts} active · {department.inactiveAccounts} inactive</span>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
