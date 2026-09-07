import React from "react";
import { CircleCheckBig, LoaderCircle, Mail } from "lucide-react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";

export default function ApplicantLeadEmailSendingModal() {
  const {
    applicationLinkSendStatus,
    isSendingApplicationLink,
    sendingApplicationLinkLead,
  } =
    useApplicantLeadsPage();

  if (!isSendingApplicationLink) return null;

  const candidateName =
    sendingApplicationLinkLead?.fullName ||
    [sendingApplicationLinkLead?.firstName, sendingApplicationLinkLead?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "the applicant lead";
  const isSent = applicationLinkSendStatus === "sent";

  return (
    <div className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[1200] flex items-center justify-center p-4">
      <div className="sibs-modal-pop-in w-full max-w-sm rounded-2xl border border-[#DCE6F1] bg-white p-6 text-center shadow-2xl font-jakarta">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ring-1 ${
            isSent
              ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
              : "bg-[#EEF6FF] text-[#0B4E8A] ring-[#CFE3F8]"
          }`}
        >
          {isSent ? (
            <CircleCheckBig size={22} strokeWidth={2.4} />
          ) : (
            <Mail size={20} strokeWidth={2.2} />
          )}
        </div>
        <h3 className="sibs-modal-title mt-4 text-[#042C51]">
          {isSent ? "Email sent successfully" : "Sending application link"}
        </h3>
        <p className="sibs-modal-subtitle mt-2 text-[#667085]">
          {isSent
            ? `The application email was sent to ${candidateName}.`
            : `Please wait while HRIS sends the application email to ${candidateName}.`}
        </p>
        <div
          className={`mt-5 flex items-center justify-center gap-2 font-jakarta text-xs font-extrabold uppercase tracking-normal ${
            isSent ? "text-emerald-600" : "text-[#0B4E8A]"
          }`}
        >
          {isSent ? (
            <CircleCheckBig size={16} strokeWidth={2.4} />
          ) : (
            <LoaderCircle size={16} className="animate-spin" />
          )}
          {isSent ? "Email sent" : "Sending email"}
        </div>
      </div>
    </div>
  );
}
