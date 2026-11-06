import PaginationTable from "@/services/pagination/PaginationTable";
import { useMemo, useState } from "react";
import { Award, RotateCcw, Users } from "lucide-react";
import { DataCard, EmptyStatePanel, ResponsiveTableShell, TablePagination, TableSkeletonRows } from "@/components/ui";
import { buildOnboardingRoster, filterOnboardingRoster } from "@/lib/utils/journey/onboardingRoster";
import { formatHrisDateLocalized } from "@/lib/axios/dateFormatter";

const PAGE_SIZE = 8;
const dateLabel = (value) => value ? formatHrisDateLocalized(value, "en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—";

function Outcome({ row }) {
  const tone = row.outcome === "True Hire" ? "green" : ["No Show", "Pre-start Withdrawal"].includes(row.outcome) ? "red" : "amber";
  return <div className="space-y-1.5">
    <span className={`inline-flex rounded-full px-2 py-1 sibs-text-micro font-extrabold sibs-tone-${tone}-icon`}>
      {row.outcome || "Journey record"}
    </span>
    <p className="sibs-text-micro font-semibold text-sibs-muted">Start: {dateLabel(row.record?.actualStartDate || row.record?.expectedStartDate || row.journey?.startDate)}</p>
  </div>;
}

function JourneyProgress({ journey }) {
  if (!journey) return <span className="sibs-text-xs text-sibs-muted">No linked journey</span>;
  const progress = Math.max(0, Math.min(100, Number(journey.overallProgressPct) || 0));
  return <div className="min-w-32 space-y-1.5">
    <div className="flex justify-between gap-2 sibs-text-micro font-bold text-sibs-navy"><span>Day {journey.daysElapsed || 0} / 90</span><span>{progress}%</span></div>
    <div role="progressbar" aria-label={`${journey.fullName} journey progress`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-sibs-border">
      <div className="h-full rounded-full bg-sibs-navy" style={{ width: `${progress}%` }} />
    </div>
    <p className="sibs-text-micro font-semibold text-sibs-muted">{journey.stage}</p>
  </div>;
}

function Milestones({ journey }) {
  return <dl className="grid min-w-40 grid-cols-3 gap-2 text-center">
    {[30, 60, 90].map((day) => {
      const milestone = journey?.[`day${day}`];
      const score = day === 30 ? milestone?.nestingQaScore : day === 60 ? milestone?.coreProductionScore : milestone?.compositeScore;
      return <div key={day}>
        <dt className="sibs-text-micro font-bold text-sibs-muted">Day {day}</dt>
        <dd className="mt-1 sibs-text-xs font-extrabold tabular-nums text-sibs-navy">{score == null ? "—" : `${score}%`}</dd>
        <dd className="mt-1 sibs-text-micro text-sibs-muted">{milestone?.status || "—"}</dd>
      </div>;
    })}
  </dl>;
}

export default function OnboardingJourneyRoster({ records, journeys, loading, onViewRecord, onViewJourney, coachingActions = [] }) {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const rows = useMemo(() => buildOnboardingRoster(records, journeys, coachingActions), [records, journeys, coachingActions]);
  const filtered = useMemo(() => filterOnboardingRoster(rows, filters), [rows, filters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const updateFilter = (key, value) => { setFilters((previous) => ({ ...previous, [key]: value })); setPage(1); };
  const options = (key) => [...new Set(rows.map((row) => key === "phase" ? row.journey?.stage : row[key]).filter(Boolean))].sort();
  const view = (row) => row.record ? onViewRecord(row.record) : onViewJourney(row.journey);
  const openProfile = (row) => row.journey ? onViewJourney(row.journey) : onViewRecord(row.record);
  const profileInteraction = (row) => ({
    tabIndex: 0,
    "aria-label": `Open profile for ${row.name}`,
    onClick: (event) => {
      if (!event.target.closest("button, a, input, select, textarea")) openProfile(row);
    },
    onKeyDown: (event) => {
      if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        openProfile(row);
      }
    },
  });
  const actions = (row) => <div className="flex flex-col items-start gap-1.5">
    {row.reviewsDue > 0 && <span className="sibs-badge-warning">{row.reviewsDue} Reviews Due</span>}
    {row.openCoaching > 0 && <span className="sibs-badge-info">{row.openCoaching} Coaching Actions</span>}
    {row.handoffDue && <span className="inline-flex items-center gap-1 rounded-full bg-sibs-cream px-2 py-1 sibs-text-micro font-extrabold text-sibs-orange"><Award size={12} />Handoff Due</span>}
    <button type="button" onClick={() => view(row)} className="sibs-text-xs font-extrabold text-sibs-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-sibs-orange">{row.record ? "View onboarding" : "Review journey"}<span className="sr-only"> for {row.name}</span></button>
    {row.record && row.journey && <button type="button" onClick={() => onViewJourney(row.journey)} className="sibs-text-xs font-bold text-sibs-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-sibs-orange">Review journey<span className="sr-only"> for {row.name}</span></button>}
  </div>;
  const empty = <EmptyStatePanel icon={Users} title="No onboarding or journey records found" description="No candidates or trainees match the current search and filters." />;
  return <section
    id="section-roster"
    aria-labelledby="onboarding-roster-title"
    className="sibs-page-card-in scroll-mt-6 rounded-2xl border border-sibs-border bg-white font-jakarta shadow-sm"
    style={{ animationDelay: "260ms", animationFillMode: "both" }}
  >
    <header className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2"><h2 id="onboarding-roster-title" className="sibs-card-title">Employee Onboarding &amp; Journey Records</h2><span className="rounded-full bg-sibs-navy px-2 py-1 sibs-text-micro font-extrabold uppercase text-white">Unified Roster</span></div>
          <p className="sibs-card-subtitle">Review candidate start outcomes, training progression, and 30/60/90 milestones.</p>
        </div>
        <p aria-live="polite" className="rounded-lg border border-sibs-border bg-sibs-surface px-3 py-2 sibs-text-xs font-bold text-sibs-navy">{loading ? "Loading records…" : `Showing ${filtered.length} of ${rows.length} Records`}</p>
      </div>
      <div className="relative z-[90] mt-3.5 overflow-visible 2xl:mt-4">
        <PaginationTable
          filterLayout="ta-inline"
          controlsClassName="flex flex-col gap-3 overflow-visible xl:flex-row xl:items-end"
          searchClassName="relative w-full min-w-0 xl:flex-[2_1_0%]"
          showFilterPanel={false}
          showFilterHeader={false}
          showPagination={false}
          loading={loading}
          searchValue={filters.search || ""}
          onSearchChange={(value) => updateFilter("search", value)}
          searchPlaceholder="Name, SIBS ID, role…"
          className="border-0 bg-transparent p-0 shadow-none font-jakarta"
          dropdownFilters={[
            ["stage", "Stage", "All Stages", options("stage")],
            ["outcome", "Outcome", "All Outcomes", ["Pending Start", "True Hire", "No Show", "Pre-start Withdrawal"]],
            ["phase", "Phase", "All Phases", options("phase")],
            ["account", "Account", "All Accounts", options("account")],
            ["site", "Site", "All Sites", options("site")],
            ["trainer", "Trainer", "All Trainers", options("trainer")],
            ["action", "HR Action", "All HR Actions", [
              { value: "handoff", label: "Post-FST Handoff Due" },
              { value: "reviews", label: "Reviews Due" },
              { value: "coaching", label: "Open Coaching Actions" },
              { value: "hires", label: "True Hire Placements" },
              { value: "dropoffs", label: "Drop-offs" },
            ]],
          ].map(([key, label, allLabel, values]) => ({
            key,
            label,
            className: "w-full min-w-0 xl:flex-1",
            allLabel,
            placeholder: allLabel,
            value: filters[key] || "",
            options: [{ value: "", label: allLabel }, ...values.map((value) => typeof value === "string" ? { value, label: value } : value)],
            onChange: (value) => updateFilter(key, value),
            includeAll: false,
            searchable: ["account", "site", "trainer", "phase"].includes(key),
          }))}
          rightContent={<button type="button" onClick={() => { setFilters({}); setPage(1); }} disabled={!Object.values(filters).some(Boolean)} className="sibs-btn-secondary w-full xl:w-auto"><RotateCcw size={14} />Clear</button>}
        />
      </div>
    </header>
    <div className="p-4 sm:p-5 2xl:p-6">
      <ResponsiveTableShell desktopContent={
        <div className="overflow-x-auto rounded-xl border border-sibs-border sibs-scrollbar">
          <table className="w-full min-w-[1100px] text-left sibs-text-xs">
            <caption className="sr-only">Employee onboarding and journey records</caption>
            <thead className="sibs-data-table-head"><tr>{["Employee / Candidate", "Onboarding Status", "Trainer & TA Owner", "Journey Progress", "Milestone Performance", "HR Action"].map((label) => <th key={label} scope="col" className="sibs-data-table-th px-3.5 py-3">{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-sibs-border">
              {loading ? <TableSkeletonRows count={6} columns={6} /> : visible.length === 0 ? <tr><td colSpan={6}>{empty}</td></tr> : visible.map((row) => <tr key={row.key} {...profileInteraction(row)} className="sibs-data-table-row cursor-pointer focus-visible:outline-2 focus-visible:outline-sibs-orange">
                <td className="px-3.5 py-3"><button type="button" onClick={() => openProfile(row)} className="text-left font-extrabold text-sibs-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-sibs-orange">{row.name}</button><p className="mt-1 sibs-text-micro font-bold text-sibs-muted">{row.employeeId || row.record?.onboardingId || row.journey?.id || row.record?.id}</p><p className="mt-1 sibs-text-micro text-sibs-muted">{row.role} · {row.account || "Unassigned account"}</p><p className="mt-1 sibs-text-micro text-sibs-muted">{row.site}</p></td>
                <td className="px-3.5 py-3"><Outcome row={row} /></td>
                <td className="px-3.5 py-3"><p className="font-bold text-sibs-navy">{row.trainer || "Trainer unassigned"}</p><p className="mt-1 sibs-text-micro text-sibs-muted">Owner: {row.owner || "Unassigned"}</p></td>
                <td className="px-3.5 py-3"><JourneyProgress journey={row.journey} /></td>
                <td className="px-3.5 py-3"><Milestones journey={row.journey} /></td>
                <td className="px-3.5 py-3">{actions(row)}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      } mobileContent={loading ? <DataCard.Skeleton count={4} lines={3} /> : visible.length === 0 ? empty : <div className="space-y-3">{visible.map((row) => <article key={row.key} {...profileInteraction(row)} className="cursor-pointer space-y-4 rounded-xl border border-sibs-border p-4 focus-visible:outline-2 focus-visible:outline-sibs-orange">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-extrabold text-sibs-navy">{row.name}</h3><p className="mt-1 sibs-text-xs text-sibs-muted">{row.employeeId || row.record?.onboardingId || row.journey?.id}</p><p className="mt-1 sibs-text-xs text-sibs-muted">{row.role} · {row.account}</p></div><Outcome row={row} /></div>
        <p className="sibs-text-xs text-sibs-muted">Trainer: {row.trainer || "Unassigned"} · Owner: {row.owner || "Unassigned"}</p><JourneyProgress journey={row.journey} /><Milestones journey={row.journey} />{actions(row)}
      </article>)}</div>} />
      <TablePagination currentPage={currentPage} totalPages={totalPages} totalRecords={filtered.length} pageSize={PAGE_SIZE} loadedCount={visible.length} onPageChange={setPage} loading={loading} recordLabel="records" className="mt-3" />
    </div>
  </section>;
}
