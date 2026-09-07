import { Skeleton } from "@/components/ui/skeleton";

const METRIC_COUNT = 6;
const TABLE_ROW_COUNT = 6;

function SkeletonLines({ widths = ["w-full", "w-4/5"] }) {
  return widths.map((width, index) => (
    <Skeleton key={`${width}-${index}`} className={`h-3 ${width}`} />
  ));
}

export function SuperAdminDashboardStatsSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 2xl:gap-3"
    >
      {Array.from({ length: METRIC_COUNT }, (_, index) => (
        <div
          key={`super-admin-metric-skeleton-${index}`}
          className="sibs-metric-card relative flex h-[104px] min-h-[96px] flex-col justify-between overflow-hidden p-3 2xl:h-[116px] 2xl:min-h-[112px] 2xl:p-3.5"
        >
          <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
            <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
              <div className="space-y-2">
                <Skeleton className="h-2.5 w-20" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-16 2xl:h-8" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
              </div>
              <Skeleton className="h-2.5 w-4/5" />
            </div>
            <Skeleton className="h-8 w-8 shrink-0 rounded-full 2xl:h-9 2xl:w-9" />
          </div>
        </div>
      ))}
    </section>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4 2xl:space-y-5">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-3.5">
        {Array.from({ length: 4 }, (_, index) => (
          <article
            key={`super-admin-overview-skeleton-${index}`}
            className="flex h-[104px] flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3 2xl:h-[116px] 2xl:p-3.5"
          >
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-5 w-16 2xl:h-6" />
              <Skeleton className="h-2.5 w-4/5" />
            </div>
            <Skeleton className="h-3 w-20" />
          </article>
        ))}
      </div>

      <section className="rounded-xl bg-sibs-navy p-4 text-white shadow-sm 2xl:rounded-2xl 2xl:p-5">
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 bg-white/20" />
              <Skeleton className="h-3 w-56 max-w-[70%] bg-white/20" />
            </div>
            <Skeleton className="h-3 w-full max-w-3xl bg-white/20" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8.5 w-28 bg-white/20 2xl:h-10" />
            <Skeleton className="h-8.5 w-36 bg-white/20 2xl:h-10" />
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterSkeleton({ controls = 2 }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Skeleton className="h-9 min-w-0 flex-1" />
      {Array.from({ length: controls }, (_, index) => (
        <Skeleton
          key={`super-admin-filter-skeleton-${index}`}
          className="h-9 w-full sm:w-40"
        />
      ))}
    </div>
  );
}

function MobileCardSkeleton() {
  return (
    <article className="sibs-card space-y-3 p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <SkeletonLines />
      </div>
      <Skeleton className="h-2.5 w-24" />
    </article>
  );
}

function TableSkeleton({ columns = 7 }) {
  return (
    <>
      <div className="space-y-3 lg:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <MobileCardSkeleton key={`super-admin-mobile-row-skeleton-${index}`} />
        ))}
      </div>

      <div className="mt-4 hidden overflow-hidden rounded-xl border border-sibs-border bg-white lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] table-fixed border-collapse">
            <thead className="sibs-data-table-head">
              <tr className="sibs-data-table-head-row">
                {Array.from({ length: columns }, (_, index) => (
                  <th key={`super-admin-table-head-skeleton-${index}`} className="px-3 py-3 2xl:px-4">
                    <Skeleton className="h-2.5 w-3/4" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F6]">
              {Array.from({ length: TABLE_ROW_COUNT }, (_, rowIndex) => (
                <tr key={`super-admin-table-row-skeleton-${rowIndex}`}>
                  {Array.from({ length: columns }, (_, columnIndex) => (
                    <td
                      key={`super-admin-table-cell-skeleton-${rowIndex}-${columnIndex}`}
                      className="px-3 py-2.5 2xl:px-4"
                    >
                      <Skeleton className={columnIndex === 0 ? "h-3 w-4/5" : "h-3 w-full"} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function TablePanelSkeleton({ activeTab }) {
  const isAccess = activeTab === "access_roles";
  const isActivity = activeTab === "activity";

  return (
    <div className="space-y-4 2xl:space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-5 w-72 max-w-full" />
        <Skeleton className="h-3 w-full max-w-2xl" />
      </div>
      {isAccess ? (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5 xl:grid-cols-10">
          {Array.from({ length: 10 }, (_, index) => (
            <Skeleton key={`super-admin-access-tier-skeleton-${index}`} className="h-8" />
          ))}
        </div>
      ) : null}
      <FilterSkeleton controls={isActivity ? 2 : 1} />
      <TableSkeleton columns={7} />
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}

function ExceptionsSkeleton() {
  return (
    <div className="space-y-4 2xl:space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-5 w-72 max-w-full" />
        <Skeleton className="h-3 w-full max-w-2xl" />
      </div>
      <FilterSkeleton controls={1} />
      <div className="space-y-2.5 2xl:space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <article
            key={`super-admin-exception-skeleton-${index}`}
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-3.5 2xl:p-4"
          >
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-3.5 w-52 max-w-[55%]" />
                </div>
                <Skeleton className="h-3 w-full max-w-3xl" />
              </div>
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#EEF2F6] pt-2.5">
              <Skeleton className="h-3 w-36" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function SnapshotSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:gap-5">
      {Array.from({ length: 4 }, (_, index) => (
        <article
          key={`super-admin-snapshot-skeleton-${index}`}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs 2xl:p-5"
        >
          <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-2.5 2xl:pb-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 2xl:mt-4 2xl:gap-3">
            {Array.from({ length: 4 }, (_, metricIndex) => (
              <div
                key={`super-admin-snapshot-metric-skeleton-${index}-${metricIndex}`}
                className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5 2xl:p-3"
              >
                <Skeleton className="h-2.5 w-3/4" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export function SuperAdminTabPanelSkeleton({ activeTab }) {
  let content = <OverviewSkeleton />;

  if (activeTab === "exceptions") {
    content = <ExceptionsSkeleton />;
  } else if (activeTab === "access_roles" || activeTab === "activity") {
    content = <TablePanelSkeleton activeTab={activeTab} />;
  } else if (activeTab === "snapshot") {
    content = <SnapshotSkeleton />;
  }

  return <div aria-hidden="true">{content}</div>;
}
