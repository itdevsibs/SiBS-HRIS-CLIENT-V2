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
      maxWidth="max-w-md"
      variant="navy"
      icon={Mail}
      title={isSent ? "Application Link Sent" : "Sending Application Link"}
      subtitle="SiBS HRIS · Talent Acquisition"
      hideCloseButton={true}
      closeOnBackdrop={false}
      closeOnEscape={false}
      bodyClassName="px-5 py-5 sm:px-6 sm:py-6"
      footerMeta={
        <span className="text-xs font-semibold text-sibs-muted">
          {isSent
            ? "Application email delivery completed."
            : "Please wait until the email process finishes."}
        </span>
      }
    >
      <div
        className="space-y-4 font-jakarta"
        role="status"
        aria-live="polite"
        aria-busy={!isSent}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
              isSent
                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                : "border-blue-100 bg-blue-50 text-sibs-navy"
            }`}
          >
            {isSent ? (
              <CircleCheckBig size={22} strokeWidth={2.3} />
            ) : (
              <LoaderCircle size={22} strokeWidth={2.3} className="animate-spin" />
            )}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="sibs-modal-section-title text-sibs-navy">
              {isSent ? "Email sent successfully" : "Sending application email"}
            </p>
            <p className="sibs-modal-subtitle mt-1 break-words text-sibs-muted">
              {isSent
                ? `The application email was sent to ${candidateName}.`
                : `Please wait while HRIS sends the application email to ${candidateName}.`}
            </p>
          </div>
        </div>

      </div>
    </ModalShell>
  );
}
