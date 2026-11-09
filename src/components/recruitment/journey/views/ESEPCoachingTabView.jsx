import EsepCoachingActions from "../EsepCoachingActions";
/* eslint-disable react-hooks/set-state-in-effect, no-unused-vars */
import { useState, useMemo, useEffect } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Eye,
  Check,
  Users,
  RotateCcw,
} from "lucide-react";

import {
  TablePagination,
  TableEmptyRow,
} from "@/components/ui";
import PaginationTable from "@/services/pagination/PaginationTable";

import { useJourney } from "../JourneyContext";
import {
  coachingForEmployee,
  evaluationFor,
  kpiComparison,
  coachingStatus,
} from "../trainerCoachingUtils";
import TrainerCoachingDetailsModal from "../TrainerCoachingDetailsModal";

const OVERVIEW_PAGE_SIZE = 8;
const HISTORY_PAGE_SIZE = 8;

export default function ESEPCoachingTabView({
  currentJourney,
  onSelectEmployee,
  onSwitchModule,
}) {
  const {
    journeys = [],
    esepSessions = [],
    esepEvaluations = [],
    simulatedCurrentDate = "",
  } = useJourney();

  const fallbackJourney = currentJourney || journeys[0];
  const [selectedEmpId, setSelectedEmpId] = useState(
    fallbackJourney?.sibsEmployeeId || fallbackJourney?.id || ""
  );

  useEffect(() => {
    if (currentJourney?.sibsEmployeeId || currentJourney?.id) {
      setSelectedEmpId(currentJourney.sibsEmployeeId || currentJourney.id);
    }
  }, [currentJourney]);

  // Section 1: Overview search, filters & pagination (QDS Dashboard Pattern)
  const [overviewSearchQuery, setOverviewSearchQuery] = useState("");
  const [overviewStatusFilter, setOverviewStatusFilter] = useState("All");
  const [overviewAccountFilter, setOverviewAccountFilter] = useState("All");
  const [overviewTlFilter, setOverviewTlFilter] = useState("All");
  const [overviewPage, setOverviewPage] = useState(1);

  // Section 3: History search, filters & pagination (QDS Dashboard Pattern)
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyTypeFilter, setHistoryTypeFilter] = useState("All");
  const [historyFacilitatorFilter, setHistoryFacilitatorFilter] = useState("All");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("All");
  const [historyPage, setHistoryPage] = useState(1);

  // Modal inspection state
  const [viewResultModalEmployee, setViewResultModalEmployee] = useState(null);
  const [activeGrowModalSessionId, setActiveGrowModalSessionId] = useState(null);

  // Selected Coachee Profile
  const activeTrainee = useMemo(() => {
    return (
      journeys.find(
        (j) => (j.sibsEmployeeId || j.id) === selectedEmpId || j.id === selectedEmpId
      ) || fallbackJourney || journeys[0]
    );
  }, [journeys, selectedEmpId, fallbackJourney]);

  const modalSession = activeGrowModalSessionId
    ? esepSessions.find((s) => s.id === activeGrowModalSessionId)
    : null;

  // Options for Section 1 Filters (QDS Table Format)
  const overviewStatusOptions = useMemo(
    () => [
      { label: "All Statuses", value: "All" },
      { label: "Evaluated", value: "Evaluated" },
      { label: "Awaiting evaluation", value: "Awaiting evaluation" },
      { label: "No sessions", value: "No sessions" },
    ],
    []
  );

  const overviewAccountOptions = useMemo(() => {
    const list = [{ label: "All Accounts", value: "All" }];
    const unique = Array.from(new Set(journeys.map((j) => j.account).filter(Boolean))).sort();
    unique.forEach((acc) => {
      list.push({ label: acc, value: acc });
    });
    return list;
  }, [journeys]);

  const overviewTlOptions = useMemo(() => {
    const list = [{ label: "All Team Leaders", value: "All" }];
    const unique = Array.from(new Set(journeys.map((j) => j.tl).filter(Boolean))).sort();
    unique.forEach((tl) => {
      list.push({ label: tl, value: tl });
    });
    return list;
  }, [journeys]);

  const hasOverviewActiveFilters = Boolean(
    overviewSearchQuery.trim() ||
      overviewStatusFilter !== "All" ||
      overviewAccountFilter !== "All" ||
      overviewTlFilter !== "All"
  );

  const handleClearOverviewFilters = () => {
    setOverviewSearchQuery("");
    setOverviewStatusFilter("All");
    setOverviewAccountFilter("All");
    setOverviewTlFilter("All");
    setOverviewPage(1);
  };

  // Section 1: Filtering & Pagination
  const filteredEmployees = useMemo(() => {
    return journeys.filter((j) => {
      if (overviewSearchQuery.trim()) {
        const q = overviewSearchQuery.toLowerCase();
        const matchesQuery =
          j.fullName?.toLowerCase().includes(q) ||
          (j.sibsEmployeeId && j.sibsEmployeeId.toLowerCase().includes(q)) ||
          (j.account && j.account.toLowerCase().includes(q)) ||
          (j.tl && j.tl.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      if (overviewStatusFilter !== "All") {
        const empSessions = coachingForEmployee(esepSessions, j);
        const count = empSessions.length;
        const latestSession = empSessions[0] || null;
        const status = latestSession
          ? coachingStatus(latestSession, esepEvaluations, simulatedCurrentDate)
          : null;

        if (overviewStatusFilter === "No sessions" && count > 0) return false;
        if (overviewStatusFilter === "Evaluated" && status !== "Evaluated") return false;
        if (
          overviewStatusFilter === "Awaiting evaluation" &&
          (count === 0 || status === "Evaluated")
        )
          return false;
      }

      if (overviewAccountFilter !== "All" && j.account !== overviewAccountFilter) {
        return false;
      }

      if (overviewTlFilter !== "All" && j.tl !== overviewTlFilter) {
        return false;
      }

      return true;
    });
  }, [
    journeys,
    overviewSearchQuery,
    overviewStatusFilter,
    overviewAccountFilter,
    overviewTlFilter,
    esepSessions,
    esepEvaluations,
    simulatedCurrentDate,
  ]);

  const overviewTotalPages = Math.max(1, Math.ceil(filteredEmployees.length / OVERVIEW_PAGE_SIZE));
  const paginatedEmployees = useMemo(() => {
    const start = (overviewPage - 1) * OVERVIEW_PAGE_SIZE;
    return filteredEmployees.slice(start, start + OVERVIEW_PAGE_SIZE);
  }, [filteredEmployees, overviewPage]);

  // Options for Section 3 Filters (QDS Table Format)
  const historyTypeOptions = useMemo(() => {
    const list = [{ label: "All Session Types", value: "All" }];
    const unique = Array.from(new Set(esepSessions.map((s) => s.type).filter(Boolean))).sort();
    unique.forEach((t) => {
      list.push({ label: t, value: t });
    });
    return list;
  }, [esepSessions]);

  const historyFacilitatorOptions = useMemo(() => {
    const list = [{ label: "All Facilitators", value: "All" }];
    const unique = Array.from(new Set(esepSessions.map((s) => s.facilitator).filter(Boolean))).sort();
    unique.forEach((f) => {
      list.push({ label: f, value: f });
    });
    return list;
  }, [esepSessions]);

  const historyStatusOptions = useMemo(
    () => [
      { label: "All Outcomes", value: "All" },
      { label: "Evaluated", value: "Evaluated" },
      { label: "Awaiting evaluation", value: "Awaiting evaluation" },
    ],
    []
  );

  const hasHistoryActiveFilters = Boolean(
    historySearchQuery.trim() ||
      historyTypeFilter !== "All" ||
      historyFacilitatorFilter !== "All" ||
      historyStatusFilter !== "All"
  );

  const handleClearHistoryFilters = () => {
    setHistorySearchQuery("");
    setHistoryTypeFilter("All");
    setHistoryFacilitatorFilter("All");
    setHistoryStatusFilter("All");
    setHistoryPage(1);
  };

  // Section 3: Filtering & Pagination
  const filteredHistorySessions = useMemo(() => {
    return esepSessions.filter((session) => {
      const empObj = journeys.find(
        (j) => (j.sibsEmployeeId || j.id) === session.emp || j.id === session.emp
      );

      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase();
        const matchesQuery =
          session.id?.toString().toLowerCase().includes(q) ||
          session.emp?.toLowerCase().includes(q) ||
          empObj?.fullName?.toLowerCase().includes(q) ||
          session.facilitator?.toLowerCase().includes(q) ||
          session.type?.toLowerCase().includes(q) ||
          session.goal?.toLowerCase().includes(q) ||
          session.will?.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      if (historyTypeFilter !== "All" && session.type !== historyTypeFilter) {
        return false;
      }

      if (historyFacilitatorFilter !== "All" && session.facilitator !== historyFacilitatorFilter) {
        return false;
      }

      if (historyStatusFilter !== "All") {
        const status = coachingStatus(session, esepEvaluations, simulatedCurrentDate);
        if (historyStatusFilter === "Evaluated" && status !== "Evaluated") return false;
        if (historyStatusFilter === "Awaiting evaluation" && status === "Evaluated") return false;
      }

      return true;
    });
  }, [
    esepSessions,
    journeys,
    historySearchQuery,
    historyTypeFilter,
    historyFacilitatorFilter,
    historyStatusFilter,
    esepEvaluations,
    simulatedCurrentDate,
  ]);

  const historyTotalPages = Math.max(1, Math.ceil(filteredHistorySessions.length / HISTORY_PAGE_SIZE));
  const paginatedHistorySessions = useMemo(() => {
    const start = (historyPage - 1) * HISTORY_PAGE_SIZE;
    return filteredHistorySessions.slice(start, start + HISTORY_PAGE_SIZE);
  }, [filteredHistorySessions, historyPage]);

  return (
    <div className="space-y-6 font-jakarta">
      {/* ======================================================== */}
      {/* SECTION 1: COACHING RESULTS OVERVIEW & OUTCOMES         */}
      {/* ======================================================== */}
      <section
        className="sibs-page-card-in sibs-card min-w-0 overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs font-jakarta"
        style={{ animationDelay: "200ms", animationFillMode: "both" }}
      >
        {/* Card Header & QDS Dashboard Dedicated Filter Bar */}
        <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6 font-jakarta">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="sibs-section-title font-extrabold text-sibs-navy">
                Coaching Results &amp; Performance Outcomes
              </h3>
              <p className="sibs-section-subtitle text-sibs-muted">
                Documented outcomes per coachee: coaching observations, agreed commitments, follow-up findings, and measured KPI lift.
              </p>
            </div>

            <div className="mt-2 sm:mt-0 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-sibs-border bg-sibs-surface px-3 py-1.5 sibs-text-xs font-bold text-sibs-navy">
                Total: <strong className="text-sibs-orange tabular-nums">{filteredEmployees.length}</strong> Coachees
              </span>
            </div>
          </div>

          {/* QDS Dashboard Inline Table Filter Bar */}
          <PaginationTable
            filterLayout="ta-inline"
            showFilterPanel={false}
            showFilterHeader={false}
            showPagination={false}
            searchValue={overviewSearchQuery}
            onSearchChange={(val) => {
              setOverviewSearchQuery(val);
              setOverviewPage(1);
            }}
            searchPlaceholder="Search coachee, SIBS ID, account, or TL..."
            filters={[
              {
                key: "status",
                label: "Status",
                value: overviewStatusFilter,
                options: overviewStatusOptions,
                allLabel: "All Statuses",
                includeAll: false,
                searchable: false,
                onChange: (val) => {
                  setOverviewStatusFilter(val);
                  setOverviewPage(1);
                },
              },
              {
                key: "account",
                label: "Account",
                value: overviewAccountFilter,
                options: overviewAccountOptions,
                allLabel: "All Accounts",
                includeAll: false,
                searchable: true,
                onChange: (val) => {
                  setOverviewAccountFilter(val);
                  setOverviewPage(1);
                },
              },
              {
                key: "tl",
                label: "Team Leader",
                value: overviewTlFilter,
                options: overviewTlOptions,
                allLabel: "All Team Leaders",
                includeAll: false,
                searchable: true,
                onChange: (val) => {
                  setOverviewTlFilter(val);
                  setOverviewPage(1);
                },
              },
            ]}
            className="mt-3.5 border-0 bg-transparent p-0 shadow-none 2xl:mt-4"
            rightContent={
              <button
                type="button"
                onClick={handleClearOverviewFilters}
                disabled={!hasOverviewActiveFilters}
                className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-sibs-border disabled:hover:bg-white disabled:hover:text-sibs-muted xl:w-auto"
                title="Reset active search and filters"
              >
                <RotateCcw size={14} />
                <span>Clear</span>
              </button>
            }
          />
        </div>

        {/* Master Table with Standard SiBS Typography */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sibs-data-table-head sticky top-0 z-10 bg-sibs-surface border-b border-sibs-border">
              <tr className="sibs-data-table-head-row">
                <th scope="col" className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">EMPLOYEE</th>
                <th scope="col" className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">SESSIONS</th>
                <th scope="col" className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">LATEST RESULT</th>
                <th scope="col" className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">EFFECTIVENESS EVIDENCE</th>
                <th scope="col" className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">FOLLOW-UP</th>
                <th scope="col" className="sibs-data-table-th text-right px-3 2xl:px-4 py-2.5 2xl:py-3">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sibs-border/60 text-sibs-navy">
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp) => {
                  const empSessions = coachingForEmployee(esepSessions, emp);
                  const count = empSessions.length;
                  const latestSession = empSessions[0] || null;
                  const evalObj = latestSession ? evaluationFor(latestSession, esepEvaluations) : null;
                  const comp = kpiComparison(evalObj);
                  const status = latestSession ? coachingStatus(latestSession, esepEvaluations, simulatedCurrentDate) : null;
                  const isSelected = (emp.sibsEmployeeId || emp.id) === selectedEmpId || emp.id === selectedEmpId;
                  const initials = emp.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("");

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmpId(emp.sibsEmployeeId || emp.id);
                        setViewResultModalEmployee(emp);
                      }}
                      className={`sibs-data-table-row transition-colors cursor-pointer ${
                        isSelected ? "bg-sibs-orange/5 border-l-4 border-l-sibs-orange" : "hover:bg-sibs-surface/60"
                      }`}
                    >
                      <td className="px-3 2xl:px-4 py-2.5 2xl:py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-sibs-navy text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-sibs-navy sibs-text-xs leading-tight block hover:text-sibs-orange transition-colors truncate">
                              {emp.fullName}
                            </div>
                            <div className="sibs-text-micro text-sibs-muted font-medium mt-0.5 truncate">
                              {emp.sibsEmployeeId || emp.id} • {emp.account} (TL: {emp.tl || "Anton Reyes"})
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 2xl:px-4 py-2.5 2xl:py-3 text-center">
                        <span className="tabular-nums font-extrabold text-sibs-navy sibs-text-xs">
                          {count}
                        </span>
                      </td>

                      <td className="px-3 2xl:px-4 py-2.5 2xl:py-3">
                        {count === 0 ? (
                          <span className="sibs-badge-neutral">
                            No sessions
                          </span>
                        ) : status === "Evaluated" ? (
                          <span className="sibs-badge-success">
                            <CheckCircle2 size={11} />
                            Evaluated
                          </span>
                        ) : (
                          <span className="sibs-badge-warning">
                            <Clock size={11} />
                            Awaiting evaluation
                          </span>
                        )}
                      </td>

                      <td className="px-3 2xl:px-4 py-2.5 2xl:py-3">
                        {comp ? (
                          <div className="space-y-1">
                            <span className="sibs-badge-success">
                              <TrendingUp size={11} className="text-emerald-600" />
                              Recorded KPI: {comp.differenceLabel}
                            </span>
                            <div className="sibs-text-micro font-semibold text-sibs-muted">
                              {comp.before} → {comp.after}
                            </div>
                          </div>
                        ) : (
                          <span className="sibs-text-micro text-sibs-muted font-medium italic">
                            Not measured
                          </span>
                        )}
                      </td>

                      <td className="px-3 2xl:px-4 py-2.5 2xl:py-3">
                        <span className="sibs-badge-success">
                          No overdue
                        </span>
                      </td>

                      <td className="px-3 2xl:px-4 py-2.5 2xl:py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmpId(emp.sibsEmployeeId || emp.id);
                            setViewResultModalEmployee(emp);
                          }}
                          className="sibs-btn-secondary h-8 px-3 text-xs font-bold gap-1 cursor-pointer"
                        >
                          <span>View results</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <TableEmptyRow
                  colSpan={6}
                  title="No employee results match search and filters"
                  description="Try adjusting your keyword, status, account, or team leader filters to view coachee performance."
                  actionLabel={hasOverviewActiveFilters ? "Clear Filters" : undefined}
                  onAction={hasOverviewActiveFilters ? handleClearOverviewFilters : undefined}
                />
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-sibs-border p-3 sm:p-4 bg-white">
          <TablePagination
            currentPage={overviewPage}
            totalPages={overviewTotalPages}
            totalRecords={filteredEmployees.length}
            pageSize={OVERVIEW_PAGE_SIZE}
            recordLabel="Coachees"
            onPageChange={setOverviewPage}
          />
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 2: COACH ACCOUNTABILITY & WEEKLY COVERAGE        */}
      {/* ======================================================== */}
      <section
        className="sibs-page-card-in grid grid-cols-1 lg:grid-cols-2 gap-4"
        style={{ animationDelay: "260ms", animationFillMode: "both" }}
      >
        {/* Left Table: Daily Coaching Accountability */}
        <div className="sibs-card p-5 space-y-3 shadow-xs bg-white">
          <div className="flex items-center justify-between border-b border-sibs-border pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="sibs-card-title text-sm font-extrabold text-sibs-navy">
                  Daily Coaching Accountability
                </h3>
              </div>
              <p className="sibs-card-subtitle text-sibs-muted mt-0.5">
                Monitoring team leaders &amp; QDS coaches against the standard 3–5 daily session quota.
              </p>
            </div>
            <span className="sibs-badge-info">
              Target: 3-5 per coach
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-sibs-border">
            <table className="w-full text-left text-xs">
              <thead className="sibs-data-table-head border-b border-sibs-border bg-sibs-surface">
                <tr className="sibs-data-table-head-row">
                  <th scope="col" className="sibs-data-table-th text-left py-3 px-3">TL / QDS COACH</th>
                  <th scope="col" className="sibs-data-table-th text-center py-3 px-3">ASSIGNED CSRS</th>
                  <th scope="col" className="sibs-data-table-th text-center py-3 px-3">TODAY&apos;S SESSIONS</th>
                  <th scope="col" className="sibs-data-table-th text-center py-3 px-3">WEEKLY TL 1:1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sibs-border/60 text-sibs-navy">
                {[
                  { name: "Anton Reyes", role: "Team Leader", assigned: 3 },
                  { name: "Rico Torres", role: "Team Leader", assigned: 3 },
                  { name: "Elena Santos", role: "QDS / QA", assigned: 3 },
                  { name: "Ella Lim", role: "QDS / QA", assigned: 3 },
                ].map((coach) => {
                  const coachSessions = esepSessions.filter((s) =>
                    s.facilitator?.toLowerCase().includes(coach.name.toLowerCase())
                  );
                  const todayCount = coachSessions.filter(
                    (s) => s.date === simulatedCurrentDate || s.date === "2026-10-18"
                  ).length;
                  const weeklyCount = coachSessions.filter((s) => s.type === "Weekly 1:1").length;

                  return (
                    <tr key={coach.name} className="hover:bg-sibs-cream-light transition-colors">
                      <td className="py-2.5 px-3">
                        <strong className="font-extrabold text-sibs-navy sibs-text-xs leading-tight block">
                          {coach.name}
                        </strong>
                        <span className="sibs-text-micro text-sibs-muted font-medium mt-0.5 block">
                          {coach.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center sibs-text-xs text-sibs-muted font-semibold">
                        {coach.assigned} in sample
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={
                            todayCount >= 3
                              ? "sibs-badge-success"
                              : todayCount > 0
                              ? "sibs-badge-warning"
                              : "sibs-badge-neutral"
                          }
                        >
                          {todayCount} / 3-5
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-sibs-navy sibs-text-xs tabular-nums">
                        {coach.role === "Team Leader" ? `${weeklyCount} / ${coach.assigned}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Table: Weekly CSR Coaching Coverage */}
        <div className="sibs-card p-5 space-y-3 shadow-xs bg-white">
          <div className="border-b border-sibs-border pb-3">
            <div className="flex items-center gap-2">
              <h3 className="sibs-card-title text-sm font-extrabold text-sibs-navy">
                Weekly CSR Coaching Coverage
              </h3>
            </div>
            <p className="sibs-card-subtitle text-sibs-muted mt-0.5">
              Reporting week: Active operational cycle. Mandatory 1-on-1 coaching completion per coachee.
            </p>
          </div>

          <div className="divide-y divide-sibs-border/60">
            {journeys.slice(0, 6).map((csr) => {
              const hasCompleted1on1 = esepSessions.some(
                (s) => (s.emp === csr.sibsEmployeeId || s.emp === csr.id) && s.type === "Weekly 1:1"
              );
              const initials = csr.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("");
              return (
                <div key={csr.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-sibs-surface/40 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-sibs-navy text-white flex items-center justify-center font-extrabold text-[11px] shrink-0 shadow-2xs">
                      {initials}
                    </div>
                    <div>
                      <strong className="font-extrabold text-sibs-navy sibs-text-xs leading-tight block">
                        {csr.fullName}
                      </strong>
                      <span className="sibs-text-micro text-sibs-muted font-medium mt-0.5 block">
                        {csr.sibsEmployeeId || csr.id} • TL: {csr.tl || "Anton Reyes"}
                      </span>
                    </div>
                  </div>
                  {hasCompleted1on1 ? (
                    <span className="sibs-badge-success">
                      <CheckCircle2 size={11} />
                      Completed
                    </span>
                  ) : (
                    <span className="sibs-badge-warning">
                      <Clock size={11} />
                      No 1:1 recorded
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION 3: GROW COACHING HISTORY & EVIDENCE LEDGER       */}
      {/* ======================================================== */}
      <section
        className="sibs-page-card-in sibs-card min-w-0 overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs font-jakarta"
        style={{ animationDelay: "320ms", animationFillMode: "both" }}
      >
        {/* Card Header & QDS Dashboard Dedicated Filter Bar */}
        <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6 font-jakarta">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md border border-sibs-border bg-sibs-surface px-2 py-0.5 sibs-text-micro font-extrabold text-sibs-muted">
                  CHRONOLOGICAL AUDIT TRAIL
                </span>
              </div>
              <h3 className="sibs-section-title font-extrabold text-sibs-navy mt-0.5">
                GROW Coaching History &amp; Evidence Ledger
              </h3>
              <p className="sibs-section-subtitle text-sibs-muted">
                Detailed chronological logs: Goal, Reality, Options, and Way Forward; QA calibrations and weekly 1:1 sessions.
              </p>
            </div>

            <div className="mt-2 sm:mt-0 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-sibs-border bg-sibs-surface px-3 py-1.5 sibs-text-xs font-bold text-sibs-navy">
                Total: <strong className="text-sibs-orange tabular-nums">{filteredHistorySessions.length}</strong> Sessions
              </span>
              <EsepCoachingActions targetEmployee={activeTrainee} actionOnly />
            </div>
          </div>

          {/* QDS Dashboard Inline Table Filter Bar */}
          <PaginationTable
            filterLayout="ta-inline"
            showFilterPanel={false}
            showFilterHeader={false}
            showPagination={false}
            searchValue={historySearchQuery}
            onSearchChange={(val) => {
              setHistorySearchQuery(val);
              setHistoryPage(1);
            }}
            searchPlaceholder="Search session ID, CSR, facilitator, goal, or action plan..."
            filters={[
              {
                key: "type",
                label: "Session Type",
                value: historyTypeFilter,
                options: historyTypeOptions,
                allLabel: "All Session Types",
                includeAll: false,
                searchable: false,
                onChange: (val) => {
                  setHistoryTypeFilter(val);
                  setHistoryPage(1);
                },
              },
              {
                key: "facilitator",
                label: "Facilitator",
                value: historyFacilitatorFilter,
                options: historyFacilitatorOptions,
                allLabel: "All Facilitators",
                includeAll: false,
                searchable: true,
                onChange: (val) => {
                  setHistoryFacilitatorFilter(val);
                  setHistoryPage(1);
                },
              },
              {
                key: "status",
                label: "Outcome Status",
                value: historyStatusFilter,
                options: historyStatusOptions,
                allLabel: "All Outcomes",
                includeAll: false,
                searchable: false,
                onChange: (val) => {
                  setHistoryStatusFilter(val);
                  setHistoryPage(1);
                },
              },
            ]}
            className="mt-3.5 border-0 bg-transparent p-0 shadow-none 2xl:mt-4"
            rightContent={
              <button
                type="button"
                onClick={handleClearHistoryFilters}
                disabled={!hasHistoryActiveFilters}
                className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-sibs-border disabled:hover:bg-white disabled:hover:text-sibs-muted xl:w-auto"
                title="Reset active search and filters"
              >
                <RotateCcw size={14} />
                <span>Clear</span>
              </button>
            }
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sibs-data-table-head sticky top-0 z-10 bg-sibs-surface border-b border-sibs-border">
              <tr className="sibs-data-table-head-row">
                <th scope="col" className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">DATE</th>
                <th scope="col" className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">CSR / EMPLOYEE</th>
                <th scope="col" className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">FACILITATOR</th>
                <th scope="col" className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">SESSION TYPE</th>
                <th scope="col" className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">GOAL &amp; ACTION PLAN</th>
                <th scope="col" className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">FOLLOW-UP</th>
                <th scope="col" className="sibs-data-table-th text-right px-3 2xl:px-4 py-2.5 2xl:py-3">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sibs-border/60 text-sibs-navy">
              {paginatedHistorySessions.length > 0 ? (
                paginatedHistorySessions.map((session) => {
                  const empObj = journeys.find(
                    (j) => (j.sibsEmployeeId || j.id) === session.emp || j.id === session.emp
                  );
                  const evalObj = evaluationFor(session, esepEvaluations);
                  const comp = kpiComparison(evalObj);
                  const status = coachingStatus(session, esepEvaluations, simulatedCurrentDate);
                  const initials = empObj
                    ? empObj.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")
                    : "CS";

                  return (
                    <tr key={session.id} className="sibs-data-table-row hover:bg-sibs-cream-light transition-colors">
                      <td className="px-3 2xl:px-4 py-2.5 2xl:py-3 whitespace-nowrap font-bold tabular-nums text-sibs-navy sibs-text-xs">
                        {session.date}
                      </td>
                      <td className="px-3 2xl:px-4 py-2.5 2xl:py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-sibs-navy text-white flex items-center justify-center font-extrabold text-[11px] shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <strong className="font-extrabold text-sibs-navy sibs-text-xs leading-tight block">
                              {empObj?.fullName || session.emp}
                            </strong>
                            <span className="sibs-text-micro text-sibs-muted font-medium mt-0.5 block">
                              {session.emp}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 2xl:px-4 py-2.5 2xl:py-3">
                        <strong className="font-extrabold text-sibs-navy sibs-text-xs leading-tight block">
                          {session.facilitator}
                        </strong>
                        <span className="sibs-text-micro text-sibs-muted font-medium mt-0.5 block">
                          {session.facilitatorRole}
                        </span>
                      </td>
                      <td className="px-3 2xl:px-4 py-2.5 2xl:py-3 whitespace-nowrap">
                        <span className="sibs-badge-neutral">
                          {session.type}
                        </span>
                      </td>
                      <td className="px-3 2xl:px-4 py-2.5 2xl:py-3 max-w-xs">
                        <div className="font-extrabold text-sibs-navy sibs-text-xs truncate">
                          {session.goal}
                        </div>
                        <div className="sibs-text-micro text-sibs-muted font-medium line-clamp-1 mt-0.5">
                          Plan: {session.will || session.actionPlan}
                        </div>
                      </td>
                      <td className="px-3 2xl:px-4 py-2.5 2xl:py-3 whitespace-nowrap">
                        {status === "Evaluated" ? (
                          <span className="sibs-badge-success">
                            <CheckCircle2 size={11} />
                            {comp ? `KPI ${comp.differenceLabel}` : "Evaluated"}
                          </span>
                        ) : (
                          <span className="sibs-badge-warning">
                            <Clock size={11} />
                            Due {session.due}
                          </span>
                        )}
                      </td>
                      <td className="px-3 2xl:px-4 py-2.5 2xl:py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmpId(session.emp);
                            setActiveGrowModalSessionId(session.id);
                          }}
                          className="sibs-btn-secondary h-8 px-3 text-xs font-bold gap-1 cursor-pointer"
                        >
                          <Eye size={12} className="text-sibs-navy" />
                          <span>View GROW</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <TableEmptyRow
                  colSpan={7}
                  title="No GROW sessions match search and filters"
                  description="Try adjusting your keyword, session type, facilitator, or outcome filter."
                  actionLabel={hasHistoryActiveFilters ? "Clear Filters" : undefined}
                  onAction={hasHistoryActiveFilters ? handleClearHistoryFilters : undefined}
                />
              )}
            </tbody>
          </table>
        </div>

        {/* History Pagination */}
        <div className="border-t border-sibs-border p-3 sm:p-4 bg-white">
          <TablePagination
            currentPage={historyPage}
            totalPages={historyTotalPages}
            totalRecords={filteredHistorySessions.length}
            pageSize={HISTORY_PAGE_SIZE}
            recordLabel="Sessions"
            onPageChange={setHistoryPage}
          />
        </div>
      </section>

      {/* VIEW RESULTS / GROW COACHING DETAIL MODAL */}
      {(viewResultModalEmployee || modalSession) && (
        <TrainerCoachingDetailsModal
          employee={viewResultModalEmployee || activeTrainee}
          sessions={esepSessions}
          evaluations={esepEvaluations}
          asOf={simulatedCurrentDate}
          onClose={() => {
            setViewResultModalEmployee(null);
            setActiveGrowModalSessionId(null);
          }}
          initialSessionId={modalSession?.id}
        />
      )}
    </div>
  );
}
