import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  Mail,
  MapPin,
  Phone,
  RotateCw,
  UserRound,
  UsersRound,
} from "lucide-react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";
import { isApplicantLeadApplicationLinkSent } from "../../../lib/utils/applicantLeads/applicantLeadEmailStatus";
import ApplicantLeadStatusBadge from "./ApplicantLeadStatusBadge";

function cleanText(value, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export default function ApplicantLeadsTable() {
  const {
    paginatedLeads = [],
    filteredLeads = [],
    currentPage = 1,
    setCurrentPage,
    totalPages = 1,
    totalRecords = 0,
    pageSize = 10,
    setPageSize,
    isLoading,
    errorMessage,
    markApplicationLinkSent,
    openEditModal,
    isSendingApplicationLink,
    leadView,
  } = useApplicantLeadsPage();

  function goToPreviousPage() {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }

  function goToNextPage() {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }

  return (
    <div className="w-full">
      {/* =====================================================
          TABLE SHELL (Seamlessly connected to tabs above)
      ===================================================== */}
      <div className="overflow-hidden rounded-b-xl border border-t-0 border-[#E6ECF2] bg-white">
        <div className="overflow-x-auto sibs-scrollbar">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
              <tr className="border-b border-[#E6ECF2]">
                <th className="w-[18%] px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]">
                  Lead ID &amp; Name
                </th>

                <th className="w-[18%] px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]">
                  CP Number / Email
                </th>

                <th className="w-[24%] px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]">
                  Department &amp; Account / Client
                </th>

                <th className="w-[12%] px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]">
                  Site
                </th>

                <th className="w-[10%] px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]">
                  Status
                </th>

                <th className="w-[12%] px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]">
                  Inputted By
                </th>

                <th className="w-[6%] px-4 py-3.5 text-right text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E6ECF2] bg-white">
              {paginatedLeads.map((lead, index) => {
                const leadId = cleanText(lead.leadId || lead.lead_id, "");
                const fullName = cleanText(lead.fullName, "Unnamed Applicant");
                const phone = cleanText(lead.cpNum);
                const email = cleanText(lead.email);
                const department = cleanText(lead.department);
                const account = cleanText(lead.specificAccount);
                const site = cleanText(lead.preferredSite);
                const inputtedBy = cleanText(lead.inputtedBy);
                const dateLogged = cleanText(lead.dateLogged);
                const applicationLinkSent = isApplicantLeadApplicationLinkSent(lead);
                const talentPoolApplicationId = cleanText(
                  lead.talentPoolApplicationId,
                  "",
                );

                return (
                  <tr
                    key={lead.id || `lead-${index}`}
                    onClick={() => openEditModal(lead)}
                    tabIndex={0}
                    style={{
                      animationDelay: `${index * 30}ms`,
                      animationFillMode: "both",
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openEditModal(lead);
                      }
                    }}
                    className="sibs-page-card-in group cursor-pointer bg-white text-xs transition-colors duration-150 hover:bg-[#F8FAFC] focus:bg-[#F8FAFC] focus:outline-none"
                  >
                    {/* LEAD ID & NAME */}
                    <td className="px-4 py-3 align-middle">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold leading-5 text-[#042C51] group-hover:text-[#FF5C28] transition-colors">
                          {fullName}
                        </p>

                        {leadId && (
                          <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-wide text-[#98A2B3]">
                            Lead ID: {leadId}
                          </p>
                        )}
                        {leadView === "archive" && talentPoolApplicationId ? (
                          <p className="mt-0.5 truncate text-[9px] font-extrabold uppercase tracking-wide text-emerald-700">
                            TP ID: {talentPoolApplicationId}
                          </p>
                        ) : null}
                      </div>
                    </td>

                    {/* CP NUMBER / EMAIL */}
                    <td className="px-4 py-3 align-middle">
                      <div className="min-w-0 space-y-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Phone
                            size={12}
                            strokeWidth={2}
                            className="shrink-0 text-emerald-600"
                          />
                          <span className="truncate text-[11px] font-bold text-[#344054]">
                            {phone}
                          </span>
                        </div>

                        <div className="flex min-w-0 items-center gap-1.5">
                          <Mail
                            size={12}
                            strokeWidth={2}
                            className="shrink-0 text-[#98A2B3]"
                          />
                          <span
                            title={lead.email || ""}
                            className="max-w-[185px] truncate text-[10px] font-medium text-[#667085]"
                          >
                            {email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* DEPARTMENT / ACCOUNT */}
                    <td className="px-4 py-3 align-middle">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold text-[#042C51]">
                          {department}
                        </p>

                        <p
                          title={lead.specificAccount || ""}
                          className="mt-0.5 max-w-[280px] truncate text-[10px] font-medium text-[#667085]"
                        >
                          <span className="font-bold text-[#98A2B3]">Account:</span>{" "}
                          {account}
                        </p>
                      </div>
                    </td>

                    {/* SITE */}
                    <td className="px-4 py-3 align-middle">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <MapPin
                          size={12}
                          strokeWidth={2}
                          className="shrink-0 text-[#98A2B3]"
                        />
                        <span
                          title={lead.preferredSite || ""}
                          className="max-w-[170px] truncate text-[10px] font-medium text-[#667085]"
                        >
                          {site}
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center">
                        <ApplicantLeadStatusBadge status={lead.status} />
                      </div>
                    </td>

                    {/* INPUTTED BY */}
                    <td className="px-4 py-3 align-middle">
                      <div className="flex min-w-0 items-start gap-1.5">
                        <UserRound
                          size={12}
                          strokeWidth={2}
                          className="mt-0.5 shrink-0 text-[#FF5C28]"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-[#042C51]">
                            {inputtedBy}
                          </p>
                          <p className="mt-0.5 truncate text-[9px] font-medium text-[#98A2B3]">
                            Logged: {dateLogged}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-3 align-middle">
                      {leadView === "archive" ? (
                        <div className="h-7" />
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={isSendingApplicationLink}
                            onClick={(event) => {
                              event.stopPropagation();
                              markApplicationLinkSent(lead);
                            }}
                            title={
                              applicationLinkSent
                                ? "Resend application link email"
                                : "Send application link email"
                            }
                            aria-label={
                              applicationLinkSent
                                ? `Resend application link email to ${fullName}`
                                : `Send application link email to ${fullName}`
                            }
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100 ${
                              applicationLinkSent
                                ? "cursor-pointer border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60"
                                : "cursor-pointer border-purple-200 bg-purple-50 text-purple-600 hover:border-purple-300 hover:bg-purple-100 disabled:opacity-60"
                            }`}
                          >
                            {applicationLinkSent ? (
                              <RotateCw size={13} strokeWidth={2.2} />
                            ) : (
                              <Mail size={13} strokeWidth={2} />
                            )}
                          </button>

                          {applicationLinkSent ? (
                            <span
                              title="Application link email has been sent"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-600"
                            >
                              <CircleCheckBig size={13} strokeWidth={2.2} />
                            </span>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* LOADING */}
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <p className="text-xs font-bold text-[#667085]">
                      Loading applicant leads from the database...
                    </p>
                  </td>
                </tr>
              )}

              {/* ERROR */}
              {!isLoading && errorMessage && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <p className="text-xs font-bold text-red-600">
                      {errorMessage}
                    </p>
                  </td>
                </tr>
              )}

              {/* EMPTY */}
              {!isLoading && !errorMessage && !paginatedLeads.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center justify-center text-[#667085]">
                      <UsersRound className="h-6 w-6 text-[#98A2B3]" />
                      <p className="mt-2 text-[13px] font-extrabold text-[#042C51]">
                        No applicant leads found
                      </p>
                      <p className="mt-1 text-xs font-medium">
                        Try changing or resetting your search and filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          SIBS PAGINATION
      ===================================================== */}
      <div className="sibs-pagination sibs-pagination--compact mt-4">
        <p className="sibs-pagination__summary">
          Showing <span>{paginatedLeads.length}</span> loaded applicant leads
          {totalRecords > 0 ? (
            <>
              {" "}
              out of <span>{totalRecords}</span>
            </>
          ) : null}
        </p>

        {totalRecords > 0 ? (
          <div className="sibs-pagination__controls">
            <button
              type="button"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
              className="sibs-pagination__button h-10 gap-1.5 px-3 sm:px-4"
            >
              <ChevronLeft size={15} />
              <span>Previous</span>
            </button>

            <span className="sibs-pagination__page is-active h-10 px-3 sm:px-4">
              Page {currentPage}
              {totalPages > 1 ? ` of ${totalPages}` : ""}
            </span>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
              className="sibs-pagination__button h-10 gap-1.5 px-3 sm:px-4"
            >
              <span>Next</span>
              <ChevronRight size={15} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
