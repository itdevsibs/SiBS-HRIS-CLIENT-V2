import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import PaginationTable from "@/services/pagination/PaginationTable.jsx";
import { ResponsiveTableShell } from "@/components/ui";
import CandidateExperienceMobileCards from "./CandidateExperienceMobileCards.jsx";
import { OutcomeBadge, RatingStars, ResponseSourceBadge, SurveyStatusBadge, formatExperienceDate } from "./presentation.jsx";

const DEFAULT_PAGE_SIZE = 10;

export default function CandidateExperienceTable({ records, onSelect }) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [records]);

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRecords = records.slice(startIndex, startIndex + pageSize);

  return (
    <div className="font-jakarta">
      <ResponsiveTableShell
        mobileContent={
          <CandidateExperienceMobileCards
            records={paginatedRecords}
            onSelect={onSelect}
          />
        }
        desktopContent={
          <div className="overflow-x-auto rounded-xl border border-sibs-border bg-white">
            <table className="w-full min-w-[1200px] border-collapse font-jakarta text-xs text-left">

          <thead className="bg-sibs-surface">
            <tr className="border-b border-sibs-border">
              {[
                "Candidate",
                "Role / Account",
                "Outcome",
                "Final Stage",
                "Survey Status",
                "Source",
                "Rating",
                "Category",
                "Date",
              ].map((label) => (
                <th
                  key={label}
                  className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sibs-border font-jakarta">
            {paginatedRecords.length ? (
              paginatedRecords.map((record, index) => (
                <tr
                  key={record.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(record)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(record);
                    }
                  }}
                  className="sibs-data-table-row sibs-page-card-in cursor-pointer bg-white outline-none transition hover:bg-[#F8FAFC] focus:bg-[#E9F0FC]/60 focus:ring-2 focus:ring-inset focus:ring-[#FF5C28]/20"
                  style={{ animationDelay: `${index * 35}ms`, animationFillMode: "both" }}
                >
                  <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                    <p className="sibs-text-xs font-extrabold text-sibs-navy">{record.candidateName || "Unnamed Candidate"}</p>
                    <p className="mt-0.5 max-w-[220px] truncate font-mono text-[10px] 2xl:text-[10.5px] font-semibold tabular-nums text-sibs-muted">
                      {record.candidateEmail || record.candidateId || "—"}
                    </p>
                  </td>
                  <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                    <p className="sibs-text-xs font-extrabold text-sibs-navy">{record.roleTitle || "—"}</p>
                    <p className="mt-0.5 text-[10px] 2xl:text-[10.5px] font-semibold uppercase text-sibs-muted">
                      {record.account || "—"}
                    </p>
                  </td>
                  <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                    <OutcomeBadge outcome={record.outcome} />
                  </td>
                  <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle sibs-text-xs font-semibold text-sibs-secondary">
                    {record.finalStage || "—"}
                  </td>
                  <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                    <SurveyStatusBadge status={record.surveyStatus} />
                  </td>
                  <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                    <ResponseSourceBadge source={record.responseSource} />
                  </td>
                  <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                    <RatingStars rating={record.experienceRating} />
                  </td>
                  <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                    <span className="inline-flex max-w-[180px] truncate rounded-md border border-sibs-border-subtle bg-sibs-surface px-2 py-0.5 text-[10px] font-extrabold text-sibs-navy">
                      {record.feedbackCategory || "—"}
                    </span>
                  </td>
                  <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[10px] 2xl:text-[10.5px] font-semibold tabular-nums text-sibs-muted">
                      <CalendarDays size={12} className="text-sibs-muted" />
                      {formatExperienceDate(record.surveySubmittedAt || record.dateRecorded)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-xs font-semibold text-sibs-muted">
                  No candidate experience records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    }
  />


      <div className="mt-2 font-jakarta">
        <PaginationTable
          showSearch={false}
          recordLabel="candidate experience records"
          loadedCount={paginatedRecords.length}
          totalRecords={records.length}
          currentPage={safePage}
          totalPages={totalPages}
          hasPreviousPage={safePage > 1}
          hasNextPage={safePage < totalPages}
          onPreviousPage={() => setPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      </div>
    </div>
  );
}
