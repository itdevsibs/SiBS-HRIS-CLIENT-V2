import { Download, Plus, RefreshCw } from "lucide-react";

export default function CandidateExperienceHeader({ onAddManual, onRefresh, refreshing, onExport }) {
  return (
    <section
      className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-4 font-jakarta shadow-sm 2xl:p-6"
      style={{ animationDelay: "0ms", animationFillMode: "both" }}
    >
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-0.5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-[#042C51]">
              <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
              Recruitment View
            </span>
          </div>

          <h1 className="break-words text-lg 2xl:text-2xl font-extrabold text-[#042C51]">
            Candidate Experience
          </h1>
          <p className="max-w-5xl sibs-text-sm font-semibold leading-relaxed text-[#667085]">
            Monitor completed and drop-off candidate journeys, survey delivery, response sources, ratings, and Voice of Candidate feedback.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2.5 xl:w-auto xl:justify-end">
          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-[#042C51] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#063B6B] active:scale-[0.98]"
          >
            <Download className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-[#FF5C28]" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh Candidate Experience"
            title="Refresh Candidate Experience"
            className="inline-flex h-8.5 2xl:h-10 w-8.5 2xl:w-10 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white text-[#042C51] shadow-sm outline-none transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] focus-visible:ring-2 focus-visible:ring-[#FF5C28]/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={onAddManual}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E04F20] active:scale-[0.98]"
          >
            <Plus size={15} />
            Add Manual Entry
          </button>
        </div>
      </div>
    </section>
  );
}
