import React, { useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Eye, CalendarDays } from "lucide-react";
import { useOnboarding } from "../../../services/context/OnboardingContext";
import { usePagination } from "../../../services/context/PaginationContext";
// 1. IMPORT THE NEW VIEW
import OnboardingMobileCardView from "./OnboardingMobileCardView";

const formatDate = (d) =>
  !d
    ? "—"
    : new Date(d).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

const getShowStatusClass = (s) =>
  s === "Show"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : s === "No Show"
    ? "border-red-200 bg-red-50 text-red-700"
    : s === "Withdrawn"
    ? "border-orange-200 bg-orange-50 text-orange-700"
    : s === "Pending"
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-gray-200 bg-gray-50 text-gray-600";


function getOnboardingDisplayId(item = {}) {
  return (
    item.onboardingId ||
    item.onboarding_id ||
    (item.id
      ? `ONB-${String(item.id).padStart(5, "0")}`
      : "—")
  );
}

function getRecordValue(
  item = {},
  camelKey,
  snakeKey,
  fallback = "",
) {
  return (
    item?.[camelKey] ??
    item?.[snakeKey] ??
    fallback
  );
}

const getOutcomeClass = (o) =>
  o === "True Hire"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : o === "No Show"
    ? "border-red-200 bg-red-50 text-red-700"
    : o === "Pre-start Withdrawal"
    ? "border-orange-200 bg-orange-50 text-orange-700"
    : o === "Pending Start"
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-gray-200 bg-gray-50 text-gray-600";

export default function OnboardingTable({ onView }) {
  const { list, loading } = useOnboarding();

  const {
    page,
    setPage,
    setPagination,
    search,
    filterValues,
  } = usePagination("onboarding");

  const limit = 8;

  const safeList = Array.isArray(list)
    ? list
    : [];

  const filteredList = useMemo(() => {
    const keyword = String(
      search || "",
    ).toLowerCase();

    return safeList.filter((item) => {
      const candidateName = String(
        getRecordValue(
          item,
          "candidateName",
          "candidate_name",
        ) || "",
      ).toLowerCase();

      const candidateEmail = String(
        getRecordValue(
          item,
          "candidateEmail",
          "candidate_email",
        ) || "",
      ).toLowerCase();

      const roleTitle = String(
        getRecordValue(
          item,
          "roleTitle",
          "role_title",
        ) || "",
      ).toLowerCase();

      const onboardingId =
        getOnboardingDisplayId(item)
          .toLowerCase();

      const matchS =
        !keyword ||
        candidateName.includes(keyword) ||
        onboardingId.includes(keyword) ||
        candidateEmail.includes(keyword) ||
        roleTitle.includes(keyword) ||
        String(item.account || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.owner || "")
          .toLowerCase()
          .includes(keyword);

      const matchStatus =
        filterValues.showStatus === "All Status" ||
        !filterValues.showStatus ||
        item.showStatus === filterValues.showStatus;

      const matchOutcome =
        filterValues.outcome === "All Outcomes" ||
        !filterValues.outcome ||
        item.finalOutcome === filterValues.outcome;

      const matchOwner =
        filterValues.owner === "All Owners" ||
        !filterValues.owner ||
        item.owner === filterValues.owner;

      return matchS && matchStatus && matchOutcome && matchOwner;
    });
  }, [safeList, search, filterValues]);

  const totalPages = Math.ceil(filteredList.length / limit) || 1;
  const paginatedData = useMemo(
    () => filteredList.slice((page - 1) * limit, page * limit),
    [filteredList, page, limit]
  );

  useEffect(() => {
    setPagination({
      total: filteredList.length,
      totalPages,
    });
  }, [
    filteredList.length,
    totalPages,
    setPagination,
  ]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages, setPage]);

  const firstVisibleRecord =
    filteredList.length > 0
      ? (page - 1) * limit + 1
      : 0;

  const lastVisibleRecord =
    filteredList.length > 0
      ? Math.min(
          page * limit,
          filteredList.length,
        )
      : 0;

  return (
    <div className="p-4 sm:p-6">
      {/* 3. MOBILE VIEW (Using the External View Component) */}
      <div className="space-y-3 lg:hidden">
        {paginatedData.length > 0 ? (
          paginatedData.map((item) => (
            <OnboardingMobileCardView
              key={item.id}
              record={item}
              onView={() => onView(item)}
              formatDate={formatDate}
              getShowStatusClass={getShowStatusClass}
              getOutcomeClass={getOutcomeClass}
            />
          ))
        ) : (
          <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
            No onboarding records found.
          </div>
        )}
      </div>

      {/* 4. DESKTOP VIEW (Restored Original Density) */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto rounded-2xl border border-[#D9E2EC]">
          <table className="w-full min-w-[1350px] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C] whitespace-nowrap">
                <th className="px-5 py-4">Onboarding ID</th>
                <th className="px-5 py-4">Candidate</th>
                <th className="px-5 py-4">Role / Account</th>
                <th className="px-5 py-4">Accepted Offer</th>
                <th className="px-5 py-4">Expected Start</th>
                <th className="px-5 py-4">Actual Start</th>
                <th className="px-5 py-4 text-center">Show Status</th>
                <th className="px-5 py-4 text-center">Final Outcome</th>
                <th className="px-5 py-4">Owner</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr key={item.id} className="transition duration-200 hover:bg-[#FAFBFC]">
                  <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-bold text-sibs-primary-1">
                    {getOnboardingDisplayId(item)}
                  </td>
                  <td className="border-b border-[#E6ECF2] px-5 py-5">
                    <p className="text-sm font-bold text-[#101828]">{item.candidateName}</p>
                    <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                      {item.candidateEmail}
                    </p>
                  </td>
                  <td className="border-b border-[#E6ECF2] px-5 py-5">
                    <p className="text-sm font-bold text-[#344054]">{item.roleTitle}</p>
                    <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">{item.account}</p>
                  </td>
                  <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={15} className="text-gray-400" />
                      {formatDate(item.acceptedOfferDate)}
                    </div>
                  </td>
                  <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold">
                    {formatDate(item.expectedStartDate)}
                  </td>
                  <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold">
                    {formatDate(item.actualStartDate)}
                  </td>
                  <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${getShowStatusClass(
                        item.showStatus
                      )}`}
                    >
                      {item.showStatus}
                    </span>
                  </td>
                  <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold whitespace-nowrap ${getOutcomeClass(
                        item.finalOutcome
                      )}`}
                    >
                      {item.finalOutcome}
                    </span>
                  </td>
                  <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054] whitespace-nowrap">
                    {item.owner}
                  </td>
                  <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
                    <button
                      onClick={() => onView(item)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 py-2 text-xs font-bold text-sibs-primary-1 hover:bg-[#F8FAFC] active:scale-[0.98]"
                    >
                      <Eye size={15} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. FOOTER (Exact Original Text) */}
      <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <p className="text-sm font-semibold text-sibs-tertiary-5">
          Showing {firstVisibleRecord} to{" "}
          {lastVisibleRecord} of{" "}
          {filteredList.length} onboarding records
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition ${
                page === i + 1
                  ? "bg-sibs-primary-1 text-white shadow-sm"
                  : "border border-[#E6ECF2] bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}