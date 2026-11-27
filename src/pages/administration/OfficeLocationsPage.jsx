import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, CheckCircle2, Clock3, MapPin, RefreshCw, UsersRound } from "lucide-react";

import Header from "../../components/layout/Header";
import {
  EmptyStatePanel,
  MetricCard,
  MetricGrid,
  MetricGridSkeleton,
  PageHeaderHero,
  Skeleton,
} from "@/components/ui";
import { getOfficeLocations } from "../../lib/axios/officeLocations";

const DEFAULT_LOCATIONS = [
  {
    id: 0,
    name: "Tagum Site",
    address:
      "Ramos Building, Arellano Street, Tagum City, Davao del Norte, Philippines",
    employeeCount: 0,
    comingSoon: false,
  },
  {
    id: 1,
    name: "Davao Site",
    address:
      "Robinsons Cybergate Delta, Tower 2, 5th Floor, Bajada, Davao City",
    employeeCount: 0,
    comingSoon: false,
  },
  {
    id: 4,
    name: "Mabini Site",
    address: "Lagulos Building, Poblacion, Mabini, Davao de Oro, Philippines",
    employeeCount: null,
    comingSoon: true,
  },
];

function safeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function getAnimationStyle(delay = 0) {
  return {
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
  };
}

const locationCardClass = "flex min-h-[300px] flex-col overflow-hidden rounded-[14px] border border-sibs-border bg-white font-jakarta shadow-xs";

function LocationCardSkeleton({ index = 0 }) {
  return (
    <article
      data-testid="location-card-skeleton"
      aria-busy="true"
      className={locationCardClass}
      style={getAnimationStyle(Math.min(index, 12) * 50)}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-4 flex min-h-[86px] items-center gap-3 rounded-[10px] border border-sibs-border bg-sibs-surface p-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-sibs-border bg-sibs-surface px-5 py-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </article>
  );
}

function LocationCard({ location, index = 0 }) {
  const comingSoon = Boolean(location.comingSoon);
  const sharedCount = safeCount(location.sharedSiteAllocatedCount);

  return (
    <article
      className={`sibs-page-card-in ${locationCardClass} transition hover:-translate-y-0.5 hover:border-sibs-orange/40 hover:shadow-lg`}
      style={getAnimationStyle(Math.min(index, 12) * 50)}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sibs-faint">
              Office Location · KRONOS
            </p>
            <h3 className="mt-1 font-heading text-lg font-bold leading-tight text-sibs-orange">
              {location.name}
            </h3>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ${comingSoon ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {comingSoon ? <Clock3 className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            {comingSoon ? "Coming Soon" : "Active"}
          </span>
        </div>

        <div className="mt-4 flex min-h-[86px] items-center gap-3 rounded-[10px] border border-sibs-border bg-sibs-surface p-3">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sibs-navy text-white">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[8px] font-extrabold uppercase tracking-wide text-sibs-faint">
              Site Address
            </p>
            <p className="mt-0.5 break-words text-xs font-semibold leading-relaxed text-sibs-navy">
              {location.address || "Address unavailable"}
            </p>
          </div>
        </div>

        {comingSoon ? (
          <div className="mt-4">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold text-sibs-navy">
              <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
              Active Employees
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-sibs-faint" aria-label="Not available">—</p>
            <p className="mt-1 text-[10px] font-semibold leading-relaxed text-sibs-muted">
              Employee location data is not yet available in Kronos for {location.name}.
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold text-sibs-navy">
              <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
              Active Employees
            </p>
            <p className="mt-1 font-heading text-3xl font-bold tabular-nums tracking-tight text-sibs-navy">
              {safeCount(location.employeeCount).toLocaleString()}
            </p>
            {sharedCount > 0 ? (
              <p className="mt-1 text-[10px] font-semibold leading-relaxed text-sibs-muted">
                Includes {sharedCount.toLocaleString()} Both Sites
                {sharedCount === 1 ? " employee" : " employees"} for reporting
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sibs-border bg-sibs-surface px-5 py-3">
        <span className="inline-flex items-center gap-2 text-[10px] font-extrabold text-sibs-muted">
          <Building2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          Kronos Site
        </span>
        <span className="text-[10px] font-extrabold text-sibs-secondary">
          {comingSoon ? "Data not available" : "Employee headcount"}
        </span>
      </div>
    </article>
  );
}

export default function OfficeLocationsPage() {
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadLocations = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setErrorMessage("");

    try {
      const { data, summary: locationSummary } = await getOfficeLocations();
      setSummary(locationSummary);
      const byId = new Map(data.map((item) => [Number(item.id), item]));

      setLocations(
        DEFAULT_LOCATIONS.map((fallback) => ({
          ...fallback,
          ...(byId.get(fallback.id) || {}),
          id: fallback.id,
          name: fallback.name,
          address: fallback.address || "",
          comingSoon: fallback.comingSoon,
        })),
      );
    } catch (error) {
      setSummary(null);
      setErrorMessage(error?.message || "Unable to load office location counts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const totalActiveEmployees = useMemo(
    () =>
      summary?.activeHeadcount != null
        ? safeCount(summary.activeHeadcount)
        : locations
            .filter((location) => !location.comingSoon)
            .reduce((total, location) => total + safeCount(location.employeeCount), 0),
    [locations, summary],
  );
  const otherHeadcount = safeCount(summary?.otherHeadcount);
  const otherBreakdown = summary?.otherBreakdown ?? {};
  const otherLabels = [
    ["Both sites", otherBreakdown.bothSites],
    ["Hybrid", otherBreakdown.hybrid],
    ["No assigned location", otherBreakdown.unassigned],
    ["Other location code", otherBreakdown.otherLocation],
  ]
    .filter(([, count]) => safeCount(count) > 0)
    .map(([name, count]) => `${name}: ${safeCount(count).toLocaleString()}`);

  return (
    <div className="sibs-dashboard-shell font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <PageHeaderHero
            kicker="Administration"
            title="Office Locations"
            description="View active employee headcount by assigned Kronos office location."
            actions={
              <div className="flex shrink-0 items-center gap-2 2xl:gap-2.5 max-sm:w-full">
                <button
                  type="button"
                  onClick={() => loadLocations({ refresh: true })}
                  disabled={refreshing || loading}
                  className="sibs-btn-icon"
                  title="Refresh office locations"
                  aria-label="Refresh office locations"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      refreshing ? "animate-spin text-sibs-orange" : ""
                    }`}
                  />
                </button>

                <span className="sibs-btn-primary pointer-events-none max-sm:flex-1">
                  <Building2 className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
                  Kronos Sites
                </span>
              </div>
            }
          />

          {loading ? (
            <MetricGridSkeleton
              columns={2}
              count={2}
              labels={["Configured Sites", "Active Headcount"]}
              ariaLabel="Loading location metrics"
            />
          ) : (
            <MetricGrid columns={2}>
              <MetricCard
                title="Configured Sites"
                value={locations.length}
                description="Registered company office locations"
                icon={Building2}
                tone="navy"
                index={0}
              />

              <MetricCard
                title="Active Headcount"
                value={totalActiveEmployees.toLocaleString()}
                description="Active employees across all Kronos location assignments"
                icon={UsersRound}
                tone="coral"
                index={1}
              />
            </MetricGrid>
          )}

          {errorMessage ? (
            <div className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm font-semibold text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {!loading && !errorMessage && otherHeadcount > 0 ? (
            <div
              role="status"
              className="flex items-start gap-3 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                <p className="font-bold">
                  {otherHeadcount.toLocaleString()} active {otherHeadcount === 1 ? "employee is" : "employees are"} not assigned exclusively to Tagum or Davao.
                </p>
                <p className="text-xs font-medium leading-5">
                  {otherLabels.join(" · ")}. Included in Active Headcount, but not added to either site without a matching Kronos assignment.
                </p>
              </div>
            </div>
          ) : null}

          <section
            aria-labelledby="office-locations-directory-title"
            className="sibs-page-card-in sibs-card mt-5 overflow-hidden rounded-[14px] border border-sibs-border bg-white font-jakarta shadow-xs"
            style={getAnimationStyle(240)}
          >
            <div className="flex flex-col gap-3 border-b border-sibs-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 id="office-locations-directory-title" className="sibs-card-title">
                  Office Locations Directory
                </h2>
                <p className="sibs-card-subtitle">
                  Review office addresses, site status, and active employee headcount.
                </p>
              </div>
              <span className="self-start rounded-[10px] border border-sibs-border bg-sibs-surface px-3 py-1.5 text-[10px] font-extrabold text-sibs-secondary sm:self-auto">
                {locations.length} {locations.length === 1 ? "site" : "sites"} configured
              </span>
            </div>
            <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
              {loading
                ? Array.from({ length: 3 }).map((_, idx) => (
                    <LocationCardSkeleton key={idx} index={idx} />
                  ))
                : locations.length === 0
                  ? (
                    <div className="col-span-full">
                      <EmptyStatePanel
                        title="No office locations found"
                        description="No active or pending office locations are registered in Kronos."
                      />
                    </div>
                  )
                  : locations.map((location, index) => (
                    <LocationCard key={location.id} location={location} index={index} />
                  ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
