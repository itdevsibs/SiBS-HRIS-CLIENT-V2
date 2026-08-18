import React, { useEffect, useMemo } from "react";
import {
  CalendarDays,
  Eye,
  UserRoundCheck,
} from "lucide-react";
import { useOnboarding } from "../../../services/context/OnboardingContext";
import { usePagination } from "../../../services/context/PaginationContext";
import OnboardingMobileCardView from "./OnboardingMobileCardView";
import PaginationTable from "../../../services/pagination/PaginationTable.jsx";

const PAGE_SIZE = 8;

function cleanText(value) {
  return String(value ?? "").trim();
}

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanText(value) || "—";

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function getRecordValue(item = {}, camelKey, snakeKey, fallback = "") {
  return item?.[camelKey] ?? item?.[snakeKey] ?? fallback;
}

function getOnboardingDisplayId(item = {}) {
  return (
    getRecordValue(item, "onboardingId", "onboarding_id") ||
    (item.id ? `ONB-${String(item.id).padStart(5, "0")}` : "—")
  );
}

function getInitials(name = "") {
  const parts = cleanText(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return "ON";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const getShowStatusClass = (status) =>
  status === "Show"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "No Show"
      ? "border-red-200 bg-red-50 text-red-700"
      : status === "Withdrawn"
        ? "border-orange-200 bg-orange-50 text-orange-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

const getOutcomeClass = (outcome) =>
  outcome === "True Hire"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : outcome === "No Show"
      ? "border-red-200 bg-red-50 text-red-700"
      : outcome === "Pre-start Withdrawal"
        ? "border-orange-200 bg-orange-50 text-orange-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

export default function OnboardingTable({ onView }) {
  const { list = [], loading } = useOnboarding();
  const { page, setPage, setPagination, search, filterValues } =
    usePagination("onboarding");

  const safeList = Array.isArray(list) ? list : [];

  const filteredList = useMemo(() => {
    const keyword = cleanText(search).toLowerCase();
    const showStatusFilter = filterValues.showStatus || "All Status";
    const outcomeFilter = filterValues.outcome || "All Outcomes";
    const ownerFilter = filterValues.owner || "All Owners";

    return safeList.filter((item) => {
      const candidateName = cleanText(
        getRecordValue(item, "candidateName", "candidate_name"),
      ).toLowerCase();
      const candidateEmail = cleanText(
        getRecordValue(item, "candidateEmail", "candidate_email"),
      ).toLowerCase();
      const roleTitle = cleanText(
        getRecordValue(item, "roleTitle", "role_title"),
      ).toLowerCase();
      const account = cleanText(item.account).toLowerCase();
      const owner = cleanText(item.owner);
      const onboardingId = getOnboardingDisplayId(item).toLowerCase();
      const showStatus = cleanText(
        getRecordValue(item, "showStatus", "show_status", "Pending"),
      );
      const finalOutcome = cleanText(
        getRecordValue(item, "finalOutcome", "final_outcome", "Pending Start"),
      );

      const matchesKeyword =
        !keyword ||
        candidateName.includes(keyword) ||
        candidateEmail.includes(keyword) ||
        roleTitle.includes(keyword) ||
        account.includes(keyword) ||
        owner.toLowerCase().includes(keyword) ||
        onboardingId.includes(keyword);

      const matchesStatus =
        showStatusFilter === "All Status" || showStatus === showStatusFilter;
      const matchesOutcome =
        outcomeFilter === "All Outcomes" || finalOutcome === outcomeFilter;
      const matchesOwner = ownerFilter === "All Owners" || owner === ownerFilter;

      return matchesKeyword && matchesStatus && matchesOutcome && matchesOwner;
    });
  }, [safeList, search, filterValues]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, Number(page || 1)), totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredList.slice(start, start + PAGE_SIZE);
  }, [filteredList, safePage]);

  useEffect(() => {
    setPagination({ total: filteredList.length, totalPages });
  }, [filteredList.length, totalPages, setPagination]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage, setPage]);

  return (
    <div className="relative z-[1] font-jakarta">
      <div className="space-y-3 p-4 lg:hidden">
        {loading ? (
          <div className="sibs-empty-panel">Loading onboarding records...</div>
        ) : paginatedData.length > 0 ? (
          paginatedData.map((item) => (
            <OnboardingMobileCardView
              key={item.id || getOnboardingDisplayId(item)}
              record={{
                ...item,
                onboardingId: getOnboardingDisplayId(item),
                candidateName: getRecordValue(item, "candidateName", "candidate_name"),
                candidateEmail: getRecordValue(item, "candidateEmail", "candidate_email"),
                roleTitle: getRecordValue(item, "roleTitle", "role_title"),
                showStatus: getRecordValue(item, "showStatus", "show_status", "Pending"),
                finalOutcome: getRecordValue(
                  item,
                  "finalOutcome",
                  "final_outcome",
                  "Pending Start",
                ),
              }}
              onView={() => onView(item)}
              formatDate={formatDate}
              getShowStatusClass={getShowStatusClass}
              getOutcomeClass={getOutcomeClass}
            />
          ))
        ) : (
          <div className="sibs-empty-panel">
            <UserRoundCheck size={22} className="mx-auto mb-2 text-[#6B88A8]" />
            No onboarding records match the current search and filters.
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-[#E6ECF2] bg-white lg:block">
        <div className="overflow-x-auto sibs-scrollbar">
          <table className="w-full min-w-[1020px] border-collapse bg-white">
            <thead className="sibs-data-table-head">
              <tr className="sibs-data-table-head-row">
              {[
                ["ONBOARDING ID", "text-left"],
                ["CANDIDATE", "text-left"],
                ["ASSIGNMENT", "text-left"],
                ["OFFER ACCEPTED", "text-left"],
                ["EXPECTED START", "text-left"],
                ["ACTUAL START", "text-left"],
                ["SHOW STATUS", "text-center"],
                ["FINAL OUTCOME", "text-center"],
                ["TA OWNER", "text-left"],
                ["ACTION", "text-right"],
              ].map(([header, align]) => (
                <th
                  key={header}
                  className={`sibs-data-table-th px-2.5 py-2 2xl:px-4 2xl:py-3.5 whitespace-nowrap ${align}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F1F5F9]">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center sibs-text-xs font-bold text-[#667085]">
                  Loading onboarding records...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center sibs-text-xs font-bold text-[#667085]">
                  No onboarding records match the current search and filters.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const candidateName = getRecordValue(
                  item,
                  "candidateName",
                  "candidate_name",
                  "Candidate",
                );
                const candidateEmail = getRecordValue(
                  item,
                  "candidateEmail",
                  "candidate_email",
                  "",
                );
                const roleTitle = getRecordValue(item, "roleTitle", "role_title", "—");
                const showStatus = getRecordValue(
                  item,
                  "showStatus",
                  "show_status",
                  "Pending",
                );
                const finalOutcome = getRecordValue(
                  item,
                  "finalOutcome",
                  "final_outcome",
                  "Pending Start",
                );

                return (
                  <tr
                    key={item.id || getOnboardingDisplayId(item)}
                    className="sibs-data-table-row sibs-page-card-in group transition-colors"
                    style={{ animationDelay: `${index * 35}ms` }}
                  >
                    <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 sibs-text-xs font-extrabold text-[#042C51]">
                      <button
                        type="button"
                        onClick={() => onView(item)}
                        className="font-extrabold text-[#042C51] transition hover:text-[#FF5C28]"
                      >
                        {getOnboardingDisplayId(item)}
                      </button>
                    </td>

                    <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 sibs-text-xs">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-7.5 w-7.5 2xl:h-8 2xl:w-8 shrink-0 items-center justify-center rounded-full bg-[#042C51] sibs-text-micro font-extrabold text-white shadow-sm">
                          {getInitials(candidateName)}
                        </span>
                        <div className="min-w-0">
                          <p className="m-0 max-w-[210px] truncate font-extrabold text-[#042C51]">
                            {candidateName}
                          </p>
                          <p className="mt-0.5 max-w-[210px] truncate sibs-text-micro font-semibold text-[#667085]">
                            {candidateEmail || "No email saved"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 sibs-text-xs">
                      <p className="max-w-[210px] truncate font-extrabold text-[#344054]">
                        {roleTitle}
                      </p>
                      <span className="mt-0.5 inline-flex max-w-[210px] truncate rounded bg-[#E6ECF2] px-1.5 py-0.5 sibs-text-micro font-bold text-[#52637A]">
                        {item.account || "No account"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 sibs-text-xs font-semibold text-[#52637A]">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={13} className="shrink-0 text-[#98A2B3]" />
                        {formatDate(getRecordValue(item, "acceptedOfferDate", "accepted_offer_date"))}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 sibs-text-xs font-extrabold text-[#042C51]">
                      {formatDate(getRecordValue(item, "expectedStartDate", "expected_start_date"))}
                    </td>

                    <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 sibs-text-xs font-semibold text-[#52637A]">
                      {formatDate(getRecordValue(item, "actualStartDate", "actual_start_date"))}
                    </td>

                    <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 text-center sibs-text-xs">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 sibs-text-micro font-extrabold ${getShowStatusClass(
                          showStatus,
                        )}`}
                      >
                        {showStatus}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 text-center sibs-text-xs">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 sibs-text-micro font-extrabold ${getOutcomeClass(
                          finalOutcome,
                        )}`}
                      >
                        {finalOutcome}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 sibs-text-xs font-semibold text-[#344054]">
                      <span className="block max-w-[150px] truncate">{item.owner || "—"}</span>
                    </td>

                    <td className="whitespace-nowrap px-2.5 py-1.5 2xl:px-4 2xl:py-3.5 text-right sibs-text-xs">
                      <button
                        type="button"
                        onClick={() => onView(item)}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#D6E0EA] bg-white px-3 sibs-text-micro font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/35 hover:bg-[#FFF7F3] hover:text-[#FF5C28] active:scale-[0.98]"
                      >
                        <Eye size={13} />
                        View Record
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="mt-2 font-jakarta">
        <PaginationTable
          showSearch={false}
          recordLabel="onboarding records"
          loadedCount={paginatedData.length}
          totalRecords={filteredList.length}
          currentPage={safePage}
          totalPages={totalPages}
          hasPreviousPage={safePage > 1}
          hasNextPage={safePage < totalPages}
          onPreviousPage={() => setPage(Math.max(1, safePage - 1))}
          onNextPage={() => setPage(Math.min(totalPages, safePage + 1))}
        />
      </div>
    </div>
  );
}
