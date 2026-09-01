import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import PaginationTable from "@/services/pagination/PaginationTable.jsx";
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
      <CandidateExperienceMobileCards records={paginatedRecords} onSelect={onSelect} />

      <div className="hidden overflow-x-auto rounded-xl border border-sibs-border bg-white md:block">
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
                  className="px-2.5 py-2 2xl:px-4 2xl:py-3 text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy"
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
                  <td className="px-2.5 py-1.5 2xl:px-4 2xl:py-3 align-middle">
                    <p className="text-xs 2xl:text-sm font-extrabold text-[#042C51]">{record.candidateName || "Unnamed Candidate"}</p>
                    <p className="mt-0.5 max-w-[220px] truncate text-[10px] 2xl:text-[11px] font-semibold font-mono text-[#667085]">
                      {record.candidateEmail || record.candidateId || "—"}
                    </p>
                  </td>
                  <td className="px-2.5 py-1.5 2xl:px-4 2xl:py-3 align-middle">
                    <p className="text-xs 2xl:text-sm font-extrabold text-[#042C51]">{record.roleTitle || "—"}</p>
                    <p className="mt-0.5 text-[10px] 2xl:text-[11px] font-normal uppercase tracking-tight text-[#667085]">
                      {record.account || "—"}
                    </p>
                  </td>
                  <td className="px-2.5 py-1.5 2xl:px-4 2xl:py-3 align-middle">
                    <OutcomeBadge outcome={record.outcome} />
                  </td>
                  <td className="px-2.5 py-1.5 2xl:px-4 2xl:py-3 align-middle text-xs font-medium text-[#344054]">
                    {record.finalStage || "—"}
                  </td>
                  <td className="px-2.5 py-1.5 2xl:px-4 2xl:py-3 align-middle">
                    <SurveyStatusBadge status={record.surveyStatus} />
                  </td>
                  <td className="px-2.5 py-1.5 2xl:px-4 2xl:py-3 align-middle">
                    <ResponseSourceBadge source={record.responseSource} />
                  </td>
                  <td className="px-2.5 py-1.5 2xl:px-4 2xl:py-3 align-middle">
                    <RatingStars rating={record.experienceRating} />
                  </td>
                  <td className="px-2.5 py-1.5 2xl:px-4 2xl:py-3 align-middle">
                    <span className="inline-flex max-w-[180px] truncate rounded-md border border-[#D6DEE8] bg-[#F8FAFC] px-2 py-0.5 text-[10px] font-extrabold text-[#042C51]">
                      {record.feedbackCategory || "—"}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5 2xl:px-4 2xl:py-3 align-middle">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[10px] 2xl:text-[11px] font-semibold text-[#667085]">
                      <CalendarDays size={12} className="text-[#667085]" />
                      {formatExperienceDate(record.surveySubmittedAt || record.dateRecorded)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-xs font-semibold text-[#667085]">
                  No candidate experience records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
