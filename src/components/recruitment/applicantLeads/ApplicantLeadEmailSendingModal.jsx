import React from "react";
import { CircleCheckBig, LoaderCircle, Mail } from "lucide-react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";
import ModalShell from "@/components/ui/ModalShell";

export default function ApplicantLeadEmailSendingModal() {
  const {
    applicationLinkSendStatus,
    isSendingApplicationLink,
    sendingApplicationLinkLead,
  } = useApplicantLeadsPage();

  const candidateName =
    sendingApplicationLinkLead?.fullName ||
    [sendingApplicationLinkLead?.firstName, sendingApplicationLinkLead?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "the applicant lead";
  const isSent = applicationLinkSendStatus === "sent";

  return (
    <ModalShell
      open={Boolean(isSendingApplicationLink)}
      maxWidth="max-w-sm"
      variant="white"
      hideCloseButton={true}
      closeOnBackdrop={false}
      closeOnEscape={false}
      bodyClassName="p-6 text-center font-jakarta"
    >
      <div
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ring-1 ${
          isSent
            ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
            : "bg-blue-50 text-sibs-navy ring-blue-200"
        }`}
      >
        {isSent ? (
          <CircleCheckBig size={22} strokeWidth={2.4} />
        ) : (
          <Mail size={20} strokeWidth={2.2} />
        )}
      </div>
      <h3 className="sibs-modal-title mt-4 text-sibs-navy">
        {isSent ? "Email sent successfully" : "Sending application link"}
      </h3>
      <p className="sibs-modal-subtitle mt-2 text-sibs-muted">
        {isSent
          ? `The application email was sent to ${candidateName}.`
          : `Please wait while HRIS sends the application email to ${candidateName}.`}
      </p>
      <div
        className={`mt-5 flex items-center justify-center gap-2 font-jakarta text-xs font-extrabold uppercase tracking-normal ${
          isSent ? "text-emerald-600" : "text-sibs-navy"
        }`}
      >
        {isSent ? (
          <CircleCheckBig size={16} strokeWidth={2.4} />
        ) : (
          <LoaderCircle size={16} className="animate-spin" />
        )}
        {isSent ? "Email sent" : "Sending email"}
      </div>
    </ModalShell>
  );
}

