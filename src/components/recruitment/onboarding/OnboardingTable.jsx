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

      <div className="hidden overflow-x-auto rounded-xl border border-[#E6ECF2] bg-white lg:block">
        <table className="w-full min-w-[1250px] border-collapse text-left font-jakarta text-xs">
          <thead className="bg-[#F8FAFC]">
            <tr className="whitespace-nowrap border-b border-[#E6ECF2]">
              {["Onboarding ID", "Candidate", "Role / Account", "Accepted Offer", "Expected Start", "Actual Start", "Show Status", "Final Outcome", "Owner", "Action"].map((label) => (
                <th key={label} className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-[#042C51] ${label === "Action" ? "text-right" : label === "Show Status" || label === "Final Outcome" ? "text-center" : ""}`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
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
              paginatedData.map((item) => {
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
                    className="sibs-page-card-in group transition-colors hover:bg-[#FFF9F6]"
                    style={{ animationDelay: `${index * 35}ms` }}
                  >
                    <td className="sibs-data-table-td border-b border-[#EEF2F6]">
                      <button
                        type="button"
                        onClick={() => onView(item)}
                        className="font-extrabold text-[#042C51] transition hover:text-[#FF5C28]"
                      >
                        {getOnboardingDisplayId(item)}
                      </button>
                    </td>

                    <td className="sibs-data-table-td border-b border-[#EEF2F6]">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#042C51] text-[9px] font-extrabold text-white shadow-sm">
                          {getInitials(candidateName)}
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[210px] truncate font-extrabold text-[#101828]">
                            {candidateName}
                          </p>
                          <p className="mt-0.5 max-w-[210px] truncate text-[9px] font-semibold text-[#667085] 2xl:text-[10px]">
                            {candidateEmail || "No email saved"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="sibs-data-table-td border-b border-[#EEF2F6]">
                      <p className="max-w-[210px] truncate font-extrabold text-[#344054]">
                        {roleTitle}
                      </p>
                      <span className="mt-1 inline-flex max-w-[210px] truncate rounded-md border border-[#E6ECF2] bg-[#F8FAFC] px-2 py-0.5 text-[9px] font-bold text-[#667085]">
                        {item.account || "No account"}
                      </span>
                    </td>

                    <td className="sibs-data-table-td border-b border-[#EEF2F6]">
                      <div className="flex items-center gap-1.5 font-semibold text-[#475467]">
                        <CalendarDays size={13} className="shrink-0 text-[#98A2B3]" />
                        {formatDate(getRecordValue(item, "acceptedOfferDate", "accepted_offer_date"))}
                      </div>
                    </td>

                    <td className="sibs-data-table-td border-b border-[#EEF2F6] font-extrabold text-[#344054]">
                      {formatDate(getRecordValue(item, "expectedStartDate", "expected_start_date"))}
                    </td>

                    <td className="sibs-data-table-td border-b border-[#EEF2F6] font-semibold text-[#475467]">
                      {formatDate(getRecordValue(item, "actualStartDate", "actual_start_date"))}
                    </td>

                    <td className="sibs-data-table-td border-b border-[#EEF2F6] text-center">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${getShowStatusClass(
                          showStatus,
                        )}`}
                      >
                        {showStatus}
                      </span>
                    </td>

                    <td className="sibs-data-table-td border-b border-[#EEF2F6] text-center">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${getOutcomeClass(
                          finalOutcome,
                        )}`}
                      >
                        {finalOutcome}
                      </span>
                    </td>

                    <td className="sibs-data-table-td border-b border-[#EEF2F6] font-semibold text-[#344054]">
                      <span className="block max-w-[150px] truncate">{item.owner || "—"}</span>
                    </td>

                    <td className="sibs-data-table-td border-b border-[#EEF2F6] text-right">
                      <button
                        type="button"
                        onClick={() => onView(item)}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#D6E0EA] bg-white px-3 text-[9px] font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/35 hover:bg-[#FFF7F3] hover:text-[#FF5C28] active:scale-[0.98]"
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
