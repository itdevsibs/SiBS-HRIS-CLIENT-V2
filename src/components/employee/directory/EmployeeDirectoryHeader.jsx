export default function EmployeeDirectoryHeader() {
  return (
    <section className="sibs-page-header-in sibs-card relative overflow-hidden p-5 font-jakarta sm:p-6">
      <span className="sibs-top-accent pointer-events-none absolute left-[1px] right-[1px] top-[1px] h-1 rounded-t-[15px] bg-gradient-to-r from-[#042C51] via-[#FF5C28] to-[#042C51]" aria-hidden="true" />

      <div className="mt-1 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-[#042C51]">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
              Employee Directory View
            </span>

            <span className="inline-flex max-w-full rounded border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-[#FF5C28]">
              Module: Core HR
            </span>
          </div>

          <h1 className="break-words text-xl font-extrabold text-[#042C51] sm:text-2xl">
            Employee Directory
          </h1>

          <p className="text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
            Manage employee records and CHWCP compliance information.
          </p>
        </div>
      </div>
    </section>
  );
}
