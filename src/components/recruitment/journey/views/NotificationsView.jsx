import { useState } from "react";
import { useJourney } from "../JourneyContext";
import {
  Bell,
  Clock,
  AlertTriangle,
  Trash2,
  Layers
} from "lucide-react";
function NotificationsView({ onSwitchModule }) {
  const { notifications, clearNotifications, journeys, coachingActions, setSelectedJourney } = useJourney();
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("All");
  const roles = ["All", ...Array.from(new Set(notifications.map((n) => n.role).filter(Boolean)))];
  const filteredNotifs = notifications.filter((n) => {
    return selectedRoleFilter === "All" || n.role === selectedRoleFilter;
  });
  const openCoachingCount = coachingActions.filter((a) => a.status === "Open").length;
  return <div className="space-y-6">
      {
    /* SiBS HRIS Standard Header: White card with top accent gradient bar */
  }
      <section className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white shadow-xs">
        <div className="h-[3.5px] w-full bg-gradient-to-r from-[#042C51] via-[#c24b30] to-[#FF5C28]" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-[#E9F0FC] px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#042C51]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C28]" />
              System Notifications & Escalation Queue
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#042C51]">
              Journey Notifications
            </h1>
            <p className="text-xs text-[#667085] max-w-3xl leading-normal">
              Triggered by milestone evaluation dates, missing evidence, overdue coaching actions, pending approvals, and final handoff events.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-[#F7F9FC] border border-[#BECBDA] rounded-xl px-3 py-1.5">
              <span className="text-xs font-bold text-[#042C51] uppercase tracking-wider">Audience:</span>
              <select
    value={selectedRoleFilter}
    onChange={(e) => setSelectedRoleFilter(e.target.value)}
    className="text-xs font-semibold text-[#042C51] bg-transparent outline-none cursor-pointer"
  >
                {roles.map((r, i) => <option key={i} value={r}>{r}</option>)}
              </select>
            </div>

            {notifications.length > 0 && <button
    onClick={clearNotifications}
    className="px-3.5 py-2 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
  >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Clear History</span>
              </button>}

            {onSwitchModule && <button
    type="button"
    onClick={() => onSwitchModule("New Hire Orientation (NHO)")}
    className="px-3.5 py-2 rounded-xl border border-[#BECBDA] hover:bg-[#F7F9FC] text-[#042C51] font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
  >
                <Layers className="w-4 h-4 text-[#FF5C28]" />
                <span>Back to NHO</span>
              </button>}
          </div>
        </div>
      </section>

      {
    /* 3 Compact SiBS HRIS Metric Cards */
  }
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="flex min-h-[86px] sm:min-h-[92px] flex-col justify-between rounded-xl border border-[#E6ECF2] bg-white p-3 sm:p-3.5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 truncate">
              Live Alerts
            </span>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-[#042C51]">
              {filteredNotifs.length}
            </div>
            <div className="mt-0.5 text-[10.5px] font-medium text-slate-500 truncate">
              Matching audience filter
            </div>
          </div>
        </div>

        <div className="flex min-h-[86px] sm:min-h-[92px] flex-col justify-between rounded-xl border border-[#E6ECF2] bg-white p-3 sm:p-3.5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 truncate">
              Total Logged Events
            </span>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600">
              <Bell className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-[#042C51]">
              {notifications.length}
            </div>
            <div className="mt-0.5 text-[10.5px] font-medium text-slate-500 truncate">
              System audit trigger records
            </div>
          </div>
        </div>

        <div className="flex min-h-[86px] sm:min-h-[92px] flex-col justify-between rounded-xl border border-[#E6ECF2] bg-white p-3 sm:p-3.5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 truncate">
              Open Support Actions
            </span>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-orange-100 bg-orange-50 text-[#FF5C28]">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-[#FF5C28]">
              {openCoachingCount}
            </div>
            <div className="mt-0.5 text-[10.5px] font-medium text-slate-500 truncate">
              Pending TL & Trainer coaching tasks
            </div>
          </div>
        </div>
      </div>

      {
    /* Notifications Log List */
  }
      <div className="bg-white rounded-xl border border-[#E6ECF2] shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-[#042C51]">Automated Trigger Log</h2>
            <p className="text-xs text-slate-500">Chronological history of milestone milestones, alerts, and disposition notices.</p>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{filteredNotifs.length} items</span>
        </div>

        {filteredNotifs.length === 0 ? <div className="py-12 text-center text-slate-400 space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold">No notifications match audience filter "{selectedRoleFilter}".</p>
          </div> : <div className="space-y-2.5">
            {filteredNotifs.map((n) => {
    const matchedEmp = journeys.find((j) => j.sibsEmployeeId === n.emp || j.id === n.emp);
    return <div
      key={n.id}
      className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${n.text.includes("Day 30") || n.role === "HR" ? "border-[#FF5C28]/50 bg-gradient-to-r from-orange-50/50 via-white to-white" : "border-[#E6ECF2] bg-white hover:border-[#BECBDA]"}`}
    >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${n.role === "HR" ? "bg-[#FF5C28] text-white" : n.role === "Trainer" ? "bg-[#042C51] text-white" : "sibs-tone-blue-bg sibs-tone-blue-text border sibs-tone-blue-border"}`}>
                        {n.role}
                      </span>
                      <span className="text-[10px] text-slate-400">{n.date}</span>
                      {n.text.includes("Day 30") && <span className="text-[9px] font-black uppercase text-[#FF5C28] px-1.5 py-0.2 rounded bg-orange-100">
                          Day 30 Handoff
                        </span>}
                    </div>

                    <p className="text-xs text-[#042C51] font-bold">{n.text}</p>
                    <span className="text-[10.5px] text-slate-500 block">Trainee: <strong className="text-[#042C51]">{matchedEmp?.fullName || n.emp}</strong> ({matchedEmp?.account || "Operations"})</span>
                  </div>

                  {matchedEmp && <button
      onClick={() => setSelectedJourney(matchedEmp)}
      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${n.text.includes("Day 30") ? "bg-[#FF5C28] hover:bg-[#e04f20] text-white font-bold" : "border border-[#BECBDA] bg-white hover:bg-[#F7F9FC] text-[#042C51]"}`}
    >
                      <span>{n.text.includes("Day 30") ? "Review Handoff \u2192" : "Inspect Journey \u2192"}</span>
                    </button>}
                </div>;
  })}
          </div>}
      </div>
    </div>;
}
export {
  NotificationsView as default
};
