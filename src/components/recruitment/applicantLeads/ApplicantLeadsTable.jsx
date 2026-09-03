import React, { useEffect, useMemo, useState } from "react";
import {
  CircleCheckBig,
  Mail,
  MapPin,
  Phone,
  RotateCw,
  UserRound,
  UsersRound,
} from "lucide-react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";
import PaginationTable from "../../../services/pagination/PaginationTable";
import { isApplicantLeadApplicationLinkSent } from "../../../lib/utils/applicantLeads/applicantLeadEmailStatus";
import StatusModal from "../../modals/StatusModal";
import ApplicantLeadStatusBadge from "./ApplicantLeadStatusBadge";

function cleanText(value, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export default function ApplicantLeadsTable({
  leadsOverride = null,
  leadViewOverride = "",
  emptyTitle = "No applicant leads found",
  emptyMessage = "Try changing or resetting your search and filter criteria.",
  recordLabel = "applicant leads",
}) {
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

  const usesOverride = Array.isArray(leadsOverride);
  const displayedLeads = usesOverride ? leadsOverride : paginatedLeads;
  const activeLeadView = leadViewOverride || leadView;
  const [overridePage, setOverridePage] = useState(1);
  const [emailConfirmationLead, setEmailConfirmationLead] = useState(null);
  const overridePageSize = pageSize || 10;
  const overrideTotalPages = Math.max(
    1,
    Math.ceil((leadsOverride?.length || 0) / overridePageSize),
  );
  const safeOverridePage = Math.min(overridePage, overrideTotalPages);
  const overridePaginatedLeads = useMemo(() => {
    if (!usesOverride) return [];

    const startIndex = (safeOverridePage - 1) * overridePageSize;
    return leadsOverride.slice(startIndex, startIndex + overridePageSize);
  }, [leadsOverride, overridePageSize, safeOverridePage, usesOverride]);

  useEffect(() => {
    if (usesOverride) {
      setOverridePage(1);
    }
  }, [leadsOverride, usesOverride]);
  const rows = usesOverride ? overridePaginatedLeads : displayedLeads;
  const tableTotalPages = usesOverride ? overrideTotalPages : totalPages;
  const tableCurrentPage = usesOverride ? safeOverridePage : currentPage;
  const tableTotalRecords = usesOverride ? leadsOverride.length : totalRecords;

  function goToPreviousPage() {
    if (usesOverride) {
      setOverridePage((prev) => Math.max(prev - 1, 1));
      return;
    }

    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }

  function goToNextPage() {
    if (usesOverride) {
      setOverridePage((prev) => Math.min(prev + 1, tableTotalPages));
      return;
    }

    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }

  function requestSendApplicationLink(event, lead) {
    event.stopPropagation();
    setEmailConfirmationLead(lead);
  }

  function closeEmailConfirmation() {
    setEmailConfirmationLead(null);
  }

  function confirmSendApplicationLink() {
    if (!emailConfirmationLead) return;

    const lead = emailConfirmationLead;
    setEmailConfirmationLead(null);
    markApplicationLinkSent(lead);
  }

  const confirmationLeadName = cleanText(
    emailConfirmationLead?.fullName,
    "this lead",
  );
  const confirmationLeadEmail = cleanText(emailConfirmationLead?.email);
  const confirmationLeadPhone = cleanText(emailConfirmationLead?.cpNum);

  return (
    <div className="w-full">
      {/* =====================================================
          TABLE SHELL (Seamlessly connected to tabs above)
      ===================================================== */}
      <div className="overflow-hidden rounded-b-xl border border-t-0 border-[#E6ECF2] bg-white font-jakarta">
        <div className="overflow-x-auto max-h-[480px] 2xl:max-h-[640px] overflow-y-auto sibs-scrollbar">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
              <tr className="border-b border-[#E6ECF2]">
                <th className="w-[18%] px-3 2xl:px-4 py-2.5 2xl:py-3 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]">
                  Lead ID &amp; Name
                </th>

                <th className="w-[18%] px-3 2xl:px-4 py-2.5 2xl:py-3 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]">
                  CP Number / Email
                </th>

                <th className="w-[24%] px-3 2xl:px-4 py-2.5 2xl:py-3 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]">
                  Department &amp; Account / Client
                </th>

                <th className="w-[12%] px-3 2xl:px-4 py-2.5 2xl:py-3 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]">
                  Site
                </th>

                <th className="w-[10%] px-3 2xl:px-4 py-2.5 2xl:py-3 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]">
                  Status
                </th>

                <th className="w-[12%] px-3 2xl:px-4 py-2.5 2xl:py-3 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]">
                  Inputted By
                </th>

                <th className="w-[6%] px-3 2xl:px-4 py-2.5 2xl:py-3 text-right text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E6ECF2] bg-white">
              {rows.map((lead, index) => {
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
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold leading-5 text-[#042C51] group-hover:text-[#FF5C28] transition-colors">
                          {fullName}
                        </p>

                        {leadId && (
                          <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-wide text-[#98A2B3]">
                            Lead ID: {leadId}
                          </p>
                        )}
                        {activeLeadView === "archive" && talentPoolApplicationId ? (
                          <p className="mt-0.5 truncate text-[9px] font-extrabold uppercase tracking-wide text-emerald-700">
                            TP ID: {talentPoolApplicationId}
                          </p>
                        ) : null}
                      </div>
                    </td>

                    {/* CP NUMBER / EMAIL */}
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                      <div className="min-w-0 space-y-0.5">
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
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
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
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
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
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                      <div className="flex items-center">
                        <ApplicantLeadStatusBadge status={lead.status} />
                      </div>
                    </td>

                    {/* INPUTTED BY */}
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
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
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                      {activeLeadView === "archive" ? (
                        <div className="h-7" />
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={isSendingApplicationLink}
                            onClick={(event) => requestSendApplicationLink(event, lead)}
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
                            className={`inline-flex h-6.5 w-6.5 2xl:h-7 2xl:w-7 items-center justify-center rounded-lg border transition active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100 ${
                              applicationLinkSent
                                ? "cursor-pointer border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60"
                                : "cursor-pointer border-purple-200 bg-purple-50 text-purple-600 hover:border-purple-300 hover:bg-purple-100 disabled:opacity-60"
                            }`}
                          >
                            {applicationLinkSent ? (
                              <RotateCw size={12} strokeWidth={2.2} />
                            ) : (
                              <Mail size={12} strokeWidth={2} />
                            )}
                          </button>

                          {applicationLinkSent ? (
                            <span
                              title="Application link email has been sent"
                              className="inline-flex h-6.5 w-6.5 2xl:h-7 2xl:w-7 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-600"
                            >
                              <CircleCheckBig size={12} strokeWidth={2.2} />
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
                    <div className="flex flex-col items-center justify-center text-[#667085]">
                      <RotateCw className="h-6 w-6 animate-spin text-[#FF5C28]" />
                      <p className="mt-2 text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
                        Loading applicant leads...
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* ERROR */}
              {!isLoading && errorMessage && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    <p className="text-xs font-bold text-red-500">
                      {errorMessage}
                    </p>
                  </td>
                </tr>
              )}

              {/* EMPTY */}
              {!isLoading && !errorMessage && !rows.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center justify-center text-[#667085]">
                      <UsersRound className="h-6 w-6 text-[#98A2B3]" />
                      <p className="mt-2 text-[13px] font-extrabold text-[#042C51]">
                        {emptyTitle}
                      </p>
                      <p className="mt-1 text-xs font-medium">
                        {emptyMessage}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationTable
        showSearch={false}
        showPagination
        showCount
        currentPage={tableCurrentPage}
        totalPages={tableTotalPages}
        loadedCount={rows.length}
        totalRecords={tableTotalRecords}
        recordLabel={recordLabel}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
        className="border-0 bg-transparent p-0 shadow-none"
      />

      <StatusModal
        open={Boolean(emailConfirmationLead)}
        type="confirm"
        title="Send Application Link?"
        message={`Send the application link email to ${confirmationLeadName} at ${confirmationLeadEmail}${
          confirmationLeadPhone !== "-" ? ` (${confirmationLeadPhone})` : ""
        }?`}
        confirmLabel="Send Email"
        cancelLabel="Cancel"
        confirmTone="brand"
        onCancel={closeEmailConfirmation}
        onConfirm={confirmSendApplicationLink}
      />
    </div>
  );
}
