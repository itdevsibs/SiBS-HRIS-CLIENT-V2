import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, MapPin, RefreshCw, UsersRound } from "lucide-react";

import Header from "../../components/layout/Header";
import {
  EmptyStatePanel,
  MetricCard,
  MetricGrid,
  MetricGridSkeleton,
  PageHeaderHero,
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

function LocationCardSkeleton({ index = 0 }) {
  return (
    <article
      className="sibs-card relative overflow-hidden rounded-[14px] border border-sibs-border bg-white p-5 sm:p-6"
      style={getAnimationStyle(120 + index * 60)}
    >
      <div className="sibs-top-accent opacity-40" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-[10px] bg-slate-100" />
          <div className="min-w-0 space-y-2">
            <div className="h-2.5 w-20 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-sibs-border pt-5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-8 w-16 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-10 w-10 animate-pulse rounded-[10px] bg-slate-100" />
        </div>
      </div>
    </article>
  );
}

function LocationCard({ location, loading, index = 0 }) {
  const comingSoon = Boolean(location.comingSoon);

  return (
    <article
      className="sibs-card sibs-page-card-in relative overflow-hidden rounded-[14px] border border-sibs-border bg-white p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={getAnimationStyle(120 + index * 60)}
    >
      <div className="sibs-top-accent" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-sibs-cream-light text-sibs-orange shadow-xs">
            <MapPin size={20} strokeWidth={2.2} />
          </span>

          <div className="min-w-0">
            <p className="sibs-kpi-kicker text-[10px] font-extrabold uppercase tracking-[0.12em] text-sibs-faint">
              Office Location
            </p>
            <h2 className="font-heading mt-0.5 truncate text-base 2xl:text-lg font-bold text-sibs-navy tracking-tight">
              {location.name}
            </h2>
            {location.address ? (
              <p className="font-jakarta mt-1 max-w-md sibs-text-xs font-semibold leading-5 text-sibs-muted">
                {location.address}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative mt-6 border-t border-sibs-border pt-5">
        {comingSoon ? (
          <div>
            <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 sibs-text-micro font-extrabold text-amber-700">
              Coming Soon
            </div>
            <p className="font-jakarta mt-3 sibs-text-xs font-semibold leading-5 text-sibs-muted">
              Employee location data is not yet available in Kronos for {location.name}.
            </p>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-jakarta sibs-text-xs font-bold text-sibs-muted">Active Employees</p>
              <div className="mt-1 flex min-h-10 items-center">
                {loading ? (
                  <div className="h-8 w-20 animate-pulse rounded bg-slate-100" />
                ) : (
                  <span className="font-heading text-3xl 2xl:text-4xl font-bold tabular-nums tracking-tight text-sibs-navy">
                    {safeCount(location.employeeCount).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-sibs-surface text-sibs-navy">
              <UsersRound size={19} />
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

export default function OfficeLocationsPage() {
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadLocations = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setErrorMessage("");

    try {
      const data = await getOfficeLocations();
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
      locations
        .filter((location) => !location.comingSoon)
        .reduce((total, location) => total + safeCount(location.employeeCount), 0),
    [locations],
  );

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
                description="Assigned employees in Kronos biometric systems"
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

          <section
            aria-label="Office locations directory"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:gap-5"
          >
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
                    <LocationCard
                      key={location.id}
                      location={location}
                      loading={loading && !location.comingSoon}
                      index={index}
                    />
                  ))}
          </section>
        </div>
      </main>
    </div>
  );
}
