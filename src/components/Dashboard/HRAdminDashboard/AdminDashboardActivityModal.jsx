import React, { useEffect, useMemo, useState } from "react";
import { Activity, ExternalLink, RefreshCw, Search, X } from "lucide-react";
import { formatLogDetails } from "../../../lib/utils/Dashboards/SuperAdminDashboard/superAdminDashboardHelpers.js";

const activityDotClass = {
  leave: "sibs-tone-amber-icon",
  employee: "sibs-tone-blue-icon",
  attendance: "sibs-tone-green-icon",
  hiring: "sibs-tone-indigo-icon",
  department: "sibs-tone-purple-icon",
  system: "sibs-tone-navy-icon",
};

export default function AdminDashboardActivityModal({
  activities = [],
  loading = false,
  error = "",
  onClose,
  onRefresh,
  onNavigate,
}) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const filteredActivities = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return activities;
    return activities.filter((item) =>
      [item.user, item.action, formatLogDetails(item.details), item.type]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [activities, search]);

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/55 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="hr-activity-history-title"
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between gap-4 bg-sibs-navy px-5 py-4 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="rounded-lg bg-sibs-orange p-2 text-white">
              <Activity className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 id="hr-activity-history-title" className="text-base font-extrabold sm:text-lg">
                Recent Activity History
              </h2>
              <p className="text-xs text-white/75">
                Latest HR dashboard activity across leave and recruitment modules
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close activity history" className="rounded-lg bg-white/10 p-2 hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-3 border-b border-sibs-border px-5 py-3">
          <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-sibs-border bg-sibs-cream-subtle px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-sibs-text-muted" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search activity, employee, or module..."
              aria-label="Search activity history"
              className="w-full min-w-0 bg-transparent text-sm text-sibs-navy outline-none"
            />
          </label>
          <button type="button" onClick={onRefresh} disabled={loading} className="sibs-btn-secondary !h-9 !px-3 text-xs disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
          {error && (
            <p role="alert" className="my-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {error} {activities.length ? "Showing the last available entries." : "Try refreshing."}
            </p>
          )}
          {filteredActivities.length === 0 ? (
            <p className="py-12 text-center text-sm text-sibs-text-muted">
              {loading ? "Loading recent activity..." : search ? "No matching activities." : "No recent activity available."}
            </p>
          ) : (
            <div className="divide-y divide-sibs-border">
              {filteredActivities.map((entry, index) => {
                const canOpen = typeof entry.path === "string" && entry.path.startsWith("/") && !entry.path.startsWith("//");
                return (
                  <div key={`${entry.id || "activity"}-${index}`} className="flex items-start gap-3 py-3">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${activityDotClass[entry.type] || activityDotClass.system}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-sibs-text-secondary">
                        <span className="font-extrabold text-sibs-navy">{entry.user || "System"}</span>{" "}
                        {entry.action || "updated a record"}
                      </p>
                      <p className="mt-0.5 text-xs text-sibs-text-muted">{formatLogDetails(entry.details)}</p>
                      {canOpen && (
                        <button type="button" onClick={() => onNavigate?.(entry.path)} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-sibs-orange hover:underline">
                          Open related module <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <time title={entry.happenedAt || undefined} className="shrink-0 whitespace-nowrap text-xs text-sibs-text-muted">
                      {entry.time || ""}
                    </time>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-sibs-border bg-sibs-cream-subtle px-5 py-3">
          <span className="text-xs text-sibs-text-muted">
            Showing {filteredActivities.length} of {activities.length} latest available activities (up to 50)
          </span>
          <button type="button" onClick={onClose} className="sibs-btn-secondary !h-9 !px-4 text-xs">
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}
