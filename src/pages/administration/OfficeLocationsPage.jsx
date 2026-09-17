import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Loader2, MapPin, RefreshCw, UsersRound } from "lucide-react";

import Header from "../../components/layout/Header";
import { PageHeaderHero } from "@/components/ui";
import { getOfficeLocations } from "../../lib/axios/officeLocations";

const DEFAULT_LOCATIONS = [
  { id: 0, name: "Tagum Site", employeeCount: 0, comingSoon: false },
  { id: 1, name: "Davao Site", employeeCount: 0, comingSoon: false },
  { id: 4, name: "Mabini Site", employeeCount: null, comingSoon: true },
];

function safeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function LocationCard({ location, loading }) {
  const comingSoon = Boolean(location.comingSoon);

  return (
    <article className="sibs-card relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FF5C28]/[0.06]" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF2ED] text-[#FF5C28]">
            <MapPin size={20} strokeWidth={2.2} />
          </span>

          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8A98B8]">
              Office Location
            </p>
            <h2 className="mt-0.5 truncate text-base font-extrabold text-[#042C51]">
              {location.name}
            </h2>
          </div>
        </div>

        <span className="rounded-full border border-[#DDE7F0] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-extrabold text-[#667085]">
          ID {location.id}
        </span>
      </div>

      <div className="relative mt-6 border-t border-[#EEF2F6] pt-5">
        {comingSoon ? (
          <div>
            <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-extrabold text-[#D9480F]">
              Coming Soon
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-[#667085]">
              Employee location data is not yet available in Kronos for Mabini Site.
            </p>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#667085]">Active Employees</p>
              <div className="mt-1 flex min-h-10 items-center">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-[#042C51]" />
                ) : (
                  <span className="text-3xl font-extrabold tracking-tight text-[#042C51]">
                    {safeCount(location.employeeCount).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2F6FA] text-[#174A7C]">
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
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-5">
          <PageHeaderHero
            kicker="Administration"
            title="Office Locations"
            description="View active employee headcount by assigned Kronos office location."
            actions={
              <button
                type="button"
                onClick={() => loadLocations({ refresh: true })}
                disabled={refreshing || loading}
                className="sibs-btn-icon"
                title="Refresh office locations"
                aria-label="Refresh office locations"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            }
          />

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sibs-card rounded-2xl border border-[#E6ECF2] bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF4FA] text-[#174A7C]">
                  <Building2 size={19} />
                </span>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8A98B8]">
                    Sites
                  </p>
                  <p className="text-xl font-extrabold text-[#042C51]">3</p>
                </div>
              </div>
            </div>

            <div className="sibs-card rounded-2xl border border-[#E6ECF2] bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF2ED] text-[#FF5C28]">
                  <UsersRound size={19} />
                </span>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8A98B8]">
                    Active Employees
                  </p>
                  <p className="text-xl font-extrabold text-[#042C51]">
                    {loading ? "—" : totalActiveEmployees.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                loading={loading && !location.comingSoon}
              />
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
