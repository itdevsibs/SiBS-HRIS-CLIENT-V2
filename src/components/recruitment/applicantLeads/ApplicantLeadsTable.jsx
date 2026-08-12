import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";
import ApplicantLeadStatusBadge from "./ApplicantLeadStatusBadge";

function cleanText(value, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export default function ApplicantLeadsTable() {
  const {
    filteredLeads,
    isLoading,
    errorMessage,
    markApplicationLinkSent,
    openEditModal,
  } = useApplicantLeadsPage();

  const totalRecords = Array.isArray(filteredLeads) ? filteredLeads.length : 0;

  return (
    <div className="w-full bg-white px-5 py-5">
      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="overflow-hidden rounded-xl border border-[#D9E3EC] bg-white">
        <div className="overflow-x-auto sibs-scrollbar">
          <table className="w-full min-w-[1280px] border-collapse text-left">
            <thead>
            <tr className="border-b border-[#DCE4ED] bg-[#F8FAFC]">
              <th className="w-[17%] px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#5D7290]">
                Lead ID &amp; Name
              </th>

              <th className="w-[17%] px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#5D7290]">
                CP Number / Email
              </th>

              <th className="w-[25%] px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#5D7290]">
                Department &amp; Account / Client
              </th>

              {/* SOURCE REMOVED */}
              <th className="w-[12%] px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#5D7290]">
                Site
              </th>

              <th className="w-[10%] px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#5D7290]">
                Status
              </th>

              <th className="w-[13%] px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#5D7290]">
                Inputted By Account
              </th>

              <th className="w-[6%] px-5 py-4 text-right text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#5D7290]">
                Quick Actions
              </th>
            </tr>
            </thead>

            <tbody className="divide-y divide-[#E7EDF3] bg-white">
            {filteredLeads.map((lead) => {
              const leadId = cleanText(lead.leadId || lead.lead_id, "");

              const fullName = cleanText(lead.fullName, "Unnamed Applicant");

              const phone = cleanText(lead.cpNum);

              const email = cleanText(lead.email);

              const department = cleanText(lead.department);

              const account = cleanText(lead.specificAccount);

              const site = cleanText(lead.preferredSite);

              const inputtedBy = cleanText(lead.inputtedBy);

              const dateLogged = cleanText(lead.dateLogged);

              return (
                <tr
                  key={lead.id}
                  onClick={() => openEditModal(lead)}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openEditModal(lead);
                    }
                  }}
                  className="group cursor-pointer bg-white text-xs transition-colors duration-150 hover:bg-[#FBFCFE] focus:bg-[#FBFCFE] focus:outline-none"
                >
                  {/* =========================================
                      LEAD ID & NAME
                  ========================================= */}

                  <td className="px-5 py-4 align-middle">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-extrabold leading-5 text-[#002D55]">
                        {fullName}
                      </p>

                      {leadId && (
                        <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[0.035em] text-[#91A2B8]">
                          {leadId}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* =========================================
                      CP NUMBER / EMAIL
                  ========================================= */}

                  <td className="px-5 py-4 align-middle">
                    <div className="min-w-0 space-y-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <Phone
                          size={12}
                          strokeWidth={2}
                          className="shrink-0 text-[#11A873]"
                        />

                        <span className="truncate text-[11px] font-extrabold text-[#173B61]">
                          {phone}
                        </span>
                      </div>

                      <div className="flex min-w-0 items-center gap-1.5">
                        <Mail
                          size={12}
                          strokeWidth={2}
                          className="shrink-0 text-[#98AABD]"
                        />

                        <span
                          title={lead.email || ""}
                          className="max-w-[185px] truncate text-[10px] font-medium text-[#7A8CA3]"
                        >
                          {email}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* =========================================
                      DEPARTMENT / ACCOUNT
                  ========================================= */}

                  <td className="px-5 py-4 align-middle">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-extrabold text-[#042C51]">
                        {department}
                      </p>

                      <p
                        title={lead.specificAccount || ""}
                        className="mt-0.5 max-w-[280px] truncate text-[10px] font-medium text-[#536B89]"
                      >
                        <span className="font-semibold">Account:</span>{" "}
                        {account}
                      </p>
                    </div>
                  </td>

                  {/* =========================================
                      SITE ONLY
                  ========================================= */}

                  <td className="px-5 py-4 align-middle">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <MapPin
                        size={12}
                        strokeWidth={2}
                        className="shrink-0 text-[#9AABBF]"
                      />

                      <span
                        title={lead.preferredSite || ""}
                        className="max-w-[170px] truncate text-[10px] font-medium text-[#91A2B8]"
                      >
                        {site}
                      </span>
                    </div>
                  </td>

                  {/* =========================================
                      STATUS
                  ========================================= */}

                  <td className="px-5 py-4 align-middle">
                    <div className="flex items-center">
                      <ApplicantLeadStatusBadge status={lead.status} />
                    </div>
                  </td>

                  {/* =========================================
                      INPUTTED BY ACCOUNT
                  ========================================= */}

                  <td className="px-5 py-4 align-middle">
                    <div className="flex min-w-0 items-start gap-1.5">
                      <UserRound
                        size={13}
                        strokeWidth={2}
                        className="mt-0.5 shrink-0 text-[#FF5C28]"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-extrabold text-[#042C51]">
                          {inputtedBy}
                        </p>

                        <p className="mt-0.5 truncate text-[9px] font-medium text-[#91A2B8]">
                          Logged: {dateLogged}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* =========================================
                      QUICK ACTIONS
                  ========================================= */}

                  <td className="px-5 py-4 align-middle">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          markApplicationLinkSent(lead);
                        }}
                        title="Send application link"
                        aria-label={`Send application link to ${fullName}`}
                        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] border border-[#E7C7FF] bg-[#FCF7FF] text-[#9E28FF] transition hover:border-[#D7A3FF] hover:bg-[#F7EBFF] active:scale-95"
                      >
                        <Mail size={13} strokeWidth={2} />
                      </button>

                      <button
                        type="button"
                        disabled
                        onClick={(event) => event.stopPropagation()}
                        title="Delete action is not connected yet"
                        aria-label={`Delete ${fullName}`}
                        className="inline-flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-[7px] border border-[#FFC6CF] bg-[#FFF5F6] text-[#F04461]"
                      >
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* =================================================
                LOADING
            ================================================= */}

            {isLoading && (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center">
                  <p className="text-xs font-bold text-[#667085]">
                    Loading applicant leads from the database...
                  </p>
                </td>
              </tr>
            )}

            {/* =================================================
                ERROR
            ================================================= */}

            {!isLoading && errorMessage && (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center">
                  <p className="text-xs font-bold text-red-600">
                    {errorMessage}
                  </p>
                </td>
              </tr>
            )}

            {/* =================================================
                EMPTY
            ================================================= */}

            {!isLoading && !errorMessage && !filteredLeads.length && (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center">
                  <p className="text-xs font-bold text-[#667085]">
                    No applicant leads match the selected filters.
                  </p>
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-3 border-t border-[#E6ECF2] pt-4 sm:flex-row sm:items-center">
        <p className="text-xs font-semibold text-[#667085]">
          Showing{" "}
          <span className="font-extrabold text-[#042C51]">{totalRecords}</span>{" "}
          loaded applicant leads out of{" "}
          <span className="font-extrabold text-[#042C51]">{totalRecords}</span>
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-xs font-extrabold text-[#98A2B3] transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            <ChevronLeft size={14} />
            Previous
          </button>

          <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-[#FF5C28] px-4 text-sm font-extrabold text-white shadow-sm">
            1
          </span>

          <button
            type="button"
            disabled
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-xs font-extrabold text-[#98A2B3] transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
