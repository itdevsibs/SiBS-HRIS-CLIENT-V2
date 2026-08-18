export default function EmployeeDirectoryHeader() {
  return (
    <section className="sibs-page-header-in sibs-card relative overflow-hidden p-4 font-jakarta 2xl:p-6">
      <span className="sibs-top-accent pointer-events-none absolute left-[1px] right-[1px] top-[1px] h-1 rounded-t-[15px] bg-gradient-to-r from-[#042C51] via-[#FF5C28] to-[#042C51]" aria-hidden="true" />

      <div className="mt-0.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-[#042C51]">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
              Employee Directory View
            </span>
          </div>

          <h1 className="break-words text-lg 2xl:text-2xl font-extrabold text-[#042C51]">
            Employee Directory
          </h1>

          <p className="sibs-text-sm font-semibold leading-relaxed text-[#667085]">
            Manage employee records and CHWCP compliance information.
          </p>
        </div>
      </div>
    </section>
  );
}
