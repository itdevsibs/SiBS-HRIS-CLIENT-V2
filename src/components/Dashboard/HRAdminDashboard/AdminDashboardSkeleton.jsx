export default function AdminDashboardSkeleton() {
  return (
    <div className="sibs-dashboard-shell">
      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
          <section className="sibs-page-card-in sibs-card p-5 sm:p-6">
            <div className="mb-3 h-5 w-44 animate-sibs-pulse rounded-lg bg-slate-200" />
            <div className="h-8 w-72 max-w-full animate-sibs-pulse rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-64 max-w-full animate-sibs-pulse rounded-lg bg-slate-200" />
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="sibs-page-card-in sibs-card h-[116px] p-4"
              >
                <div className="flex h-full items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="h-3 w-24 animate-sibs-pulse rounded bg-slate-200" />
                    <div className="h-7 w-20 animate-sibs-pulse rounded bg-slate-200" />
                    <div className="h-3 w-32 animate-sibs-pulse rounded bg-slate-200" />
                  </div>
                  <div className="h-10 w-10 animate-sibs-pulse rounded-xl bg-slate-200" />
                </div>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="sibs-page-card-in sibs-card h-[360px] lg:col-span-8" />
            <div className="space-y-5 lg:col-span-4">
              <div className="sibs-page-card-in sibs-card h-[250px]" />
              <div className="h-[220px] rounded-2xl bg-slate-300" />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
