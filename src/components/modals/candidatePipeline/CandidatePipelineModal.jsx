import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  X,
  UserX,
  Eye,
  CalendarDays,
  ClipboardCheck,
  Mail,
  ChevronDown,
  CirclePlay,
} from "lucide-react";

import DetailRow from "../../layout/common/DetailRow";
import CandidateAvatar from "../../recruitment/candidatePipeline/CandidateAvatar";
import CandidateTalentPoolDetailsPanel from "../../recruitment/candidatePipeline/CandidateTalentPoolDetailsPanel";
import LeadPrfReviewCard from "../../recruitment/candidatePipeline/LeadPrfReviewCard";

import {
  offerApprovers,
  offerDecisionOptions,
} from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";

import {
  formatDateTime,
  formatCurrency,
} from "../../../lib/utils/candidatePipeline/candidatePipelineFormatters";

import {
  getNextStage,
  hasInterviewSchedule,
  getAssessmentResult,
  getDisplayInterviewStatus,
  getDisplayInterviewType,
  canScheduleInterview,
  canUpdateInterviewSchedule,
  getStageClass,
  getPrfStatusClass,
  getInterviewStatusClass,
  getAssessmentResultClass,
  getOfferApprovalClass,
  getOfferDecisionClass,
  getOfferApprovalSummary,
  isOfferApproved,
  buildOfferContractLink,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import { useNavigate } from "react-router-dom";
import { useCandidatePipeline } from "../../../services/context/CandidatePipelineContext";

const CandidatePipelineModal = ({
  open,
  candidate,
  onClose,
  onUpdatePrfStatus,
  onOpenScheduleModal,
  onOpenMoveModal,
  onOpenAssessmentModal,
  onOpenDropOffModal,
  onCompleteInterview,
  onSendAssessmentEmail,
  onCancelInterview,
  onUpdateOfferApproval,
  onSendOfferEmail,
  onOfferDecision,
}) => {
  const [showTalentPoolDetails, setShowTalentPoolDetails] = useState(false);
  const [interviewNotesDraft, setInterviewNotesDraft] = useState("");

  const { handleStartInterview } = useCandidatePipeline();

  const navigate = useNavigate();

  useEffect(() => {
    setShowTalentPoolDetails(false);
    setInterviewNotesDraft(candidate?.interviewNotes || "");
  }, [candidate?.id, open]);

  if (!open || !candidate) return null;

  const nextStage = getNextStage(candidate.currentStage);

  const isLeadStage = false;
  const isInitialScreening = candidate.currentStage === "Initial Screening";
  const isOnlineAssessment = candidate.currentStage === "Online Assessment";
  const isInterviewScheduled = candidate.currentStage === "Interview Scheduled";
  const isOffered = candidate.currentStage === "Offered";
  const isAccepted = candidate.currentStage === "Accepted";
  const candidateHasSchedule = hasInterviewSchedule(candidate);
  const modalStatus = getDisplayInterviewStatus(candidate);
  const isInterviewInProgress =
    isInterviewScheduled && modalStatus === "Interview in Progress";

  const disabledActionClass =
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50";

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Candidate Pipeline Details
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              View candidate movement, online assessment, and interview status.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div
            className={`grid grid-cols-1 gap-5 ${
              isLeadStage || isInitialScreening
                ? ""
                : "xl:grid-cols-[1fr_360px]"
            }`}
          >
            <div className="min-w-0 space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <CandidateAvatar candidate={candidate} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="break-words text-xl font-bold text-[#101828]">
                          {candidate.name}
                        </h3>
                        <p className="mt-1 break-words text-sm font-semibold text-sibs-tertiary-5">
                          {candidate.email}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setShowTalentPoolDetails((prev) => !prev)
                        }
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                      >
                        Talent Details
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${
                            showTalentPoolDetails ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStageClass(
                          candidate.currentStage,
                        )}`}
                      >
                        {candidate.currentStage}
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPrfStatusClass(
                          candidate.prfStatus || "Review",
                        )}`}
                      >
                        PRF: {candidate.prfStatus || "Review"}
                      </span>

                      {modalStatus && (
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getInterviewStatusClass(
                            modalStatus,
                          )}`}
                        >
                          {modalStatus}
                        </span>
                      )}

                      {!isLeadStage && candidate.assessmentResult && (
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentResultClass(
                            candidate.assessmentResult,
                          )}`}
                        >
                          {candidate.assessmentResult}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {showTalentPoolDetails && (
                <CandidateTalentPoolDetailsPanel candidate={candidate} />
              )}

              {isInitialScreening && (
                <LeadPrfReviewCard
                  candidate={candidate}
                  onUpdatePrfStatus={onUpdatePrfStatus}
                />
              )}

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">
                  Movement Timeline
                </h3>

                <div className="mt-5 space-y-4">
                  {(candidate.timeline || []).map((item, index) => {
                    const savedFormFullLink = item.savedFormLink
                      ? `${window.location.origin}${item.savedFormLink}`
                      : "";

                    return (
                      <div
                        key={`${item.stage}-${index}`}
                        className="flex min-w-0 gap-4"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${getStageClass(
                            item.stage,
                          )}`}
                        >
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-[#101828]">
                                {item.stage}
                              </p>
                              <p className="truncate text-xs font-semibold text-sibs-tertiary-5">
                                {item.timestamp}
                              </p>
                            </div>

                            <span className="w-fit shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600">
                              {item.owner}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-[#344054]">
                            {item.reason}
                          </p>

                          {item.remarks && (
                            <p className="mt-3 rounded-lg bg-white p-3 text-xs font-semibold leading-5 text-[#475467]">
                              {item.remarks}
                            </p>
                          )}

                          {item.savedFormLink && (
                            <div className="mt-3">
                              <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                                Job Evaluation Link
                              </p>

                              <div
                                type="button"
                                title={savedFormFullLink}
                                onClick={() => {
                                  window.open(
                                    item.savedFormLink,
                                    "_blank",
                                    "noopener,noreferrer",
                                  );
                                }}
                                className="mt-2 block w-full min-w-0 truncate rounded-lg border
                                  border-blue-100 bg-white px-3 py-2 text-left text-xs
                                  font-semibold text-blue-600 underline transition
                                  hover:border-blue-200 hover:bg-blue-50
                                  hover:text-blue-700 hover:cursor-pointer"
                              >
                                {savedFormFullLink}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isLeadStage && (
                <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-[#101828]">
                    Reason for Movement
                  </h3>

                  <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                    {candidate.reasonForMovement || "—"}
                  </p>
                </div>
              )}
            </div>

            {!isLeadStage && !isInitialScreening && (
              <div className="space-y-5">
                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                  <h3 className="text-sm font-bold text-sibs-primary-1">
                    Online Assessment
                  </h3>

                  <div className="mt-4 rounded-xl bg-white p-4">
                    <DetailRow
                      label="Assessment Result"
                      value={getAssessmentResult(candidate) || "—"}
                    />
                    <DetailRow
                      label="Email Sent"
                      value={candidate.assessmentEmailSent ? "Yes" : "No"}
                    />
                    <DetailRow
                      label="Email Sent At"
                      value={candidate.assessmentEmailSentAt}
                    />
                  </div>

                  {isOnlineAssessment && (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenAssessmentModal(candidate)}
                        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-bold text-white transition hover:bg-cyan-700"
                      >
                        <ClipboardCheck size={16} />
                        Update Assessment
                      </button>

                      <button
                        type="button"
                        onClick={() => onSendAssessmentEmail(candidate)}
                        className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-cyan-100 bg-white text-sm font-bold text-cyan-700 transition hover:bg-cyan-50"
                      >
                        <Mail size={16} />
                        Resend Assessment Email
                      </button>
                    </>
                  )}
                </div>

                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                  <h3 className="text-sm font-bold text-[#101828]">
                    Interview Details
                  </h3>

                  <div className="mt-4">
                    <DetailRow
                      label="Candidate ID"
                      value={candidate.candidateId}
                    />
                    <DetailRow
                      label="Role / Account"
                      value={candidate.roleAccount}
                    />
                    <DetailRow
                      label="Interview Date"
                      value={formatDateTime(candidate.interviewDate)}
                    />
                    <DetailRow
                      label="Interview Type"
                      value={getDisplayInterviewType(candidate)}
                    />
                    <DetailRow
                      label="Interview Status"
                      value={getDisplayInterviewStatus(candidate) || "—"}
                    />
                    <div className="mt-4 flex items-center justify-between gap-4 text-[12px]">
                      <span className="shrink-0 font-bold uppercase text-sibs-tertiary-5">
                        Interview Link
                      </span>

                      <span
                        title={candidate.onlineInterviewLink}
                        className={`block max-w-[60%] min-w-0 overflow-hidden truncate text-right ${
                          candidate.onlineInterviewLink
                            ? "text-blue-600 underline hover:cursor-pointer"
                            : "text-sm font-bold text-[#344054]"
                        }`}
                        onClick={() => {
                          if (candidate.onlineInterviewLink) {
                            window.open(
                              candidate.onlineInterviewLink,
                              "_blank",
                            );
                          }
                        }}
                      >
                        <span className="inline-block max-w-full overflow-hidden truncate align-bottom">
                          {candidate.onlineInterviewLink || "—"}
                        </span>
                      </span>
                    </div>
                    {candidate.interviewStatus === "Cancelled" && (
                      <DetailRow
                        label="Cancellation Reason"
                        value={candidate.cancellationReason || "—"}
                      />
                    )}
                  </div>

                  {isOnlineAssessment && canScheduleInterview(candidate) && (
                    <button
                      type="button"
                      onClick={() => onOpenScheduleModal(candidate)}
                      className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 text-sm font-bold text-white transition hover:opacity-90"
                    >
                      <CalendarDays size={16} />
                      Schedule Interview
                    </button>
                  )}

                  {isInterviewScheduled && candidateHasSchedule && (
                    <div className="mt-4 grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        disabled={isInterviewInProgress}
                        onClick={() => onOpenScheduleModal(candidate)}
                        className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100 ${disabledActionClass}`}
                      >
                        <CalendarDays size={16} />
                        Update Interview Schedule
                      </button>

                      <button
                        type="button"
                        disabled={isInterviewInProgress}
                        onClick={() => onCancelInterview(candidate)}
                        className={`inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-sibs-primary-1 transition hover:bg-red-100 ${disabledActionClass}`}
                      >
                        Cancel Interview
                      </button>

                      {candidate.interviewStatus !== "Completed" && (
                        <button
                          type="button"
                          disabled={isInterviewInProgress}
                          onClick={() => onCompleteInterview(candidate)}
                          className={`inline-flex h-10 w-full items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 ${disabledActionClass}`}
                        >
                          Mark Interview Completed
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {(isOffered || isAccepted) && (
                  <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <h3 className="text-sm font-bold text-sibs-primary-1">
                      Offer and Approval
                    </h3>

                    <div className="mt-4 rounded-xl bg-white p-4">
                      <DetailRow
                        label="Offer Role"
                        value={
                          candidate.offerDetails?.roleTitle ||
                          candidate.roleTitle
                        }
                      />
                      <DetailRow
                        label="Hiring Requirement"
                        value={
                          candidate.offerDetails?.hiringRequirementId ||
                          candidate.hiringRequirementId
                        }
                      />
                      <DetailRow
                        label="Final Role"
                        value={
                          candidate.offerDetails?.roleTitle ||
                          candidate.roleTitle
                        }
                      />
                      <DetailRow
                        label="Final Account"
                        value={candidate.offerDetails?.account}
                      />
                      <DetailRow
                        label="Basic Pay"
                        value={formatCurrency(candidate.offerDetails?.basicPay)}
                      />
                      <DetailRow
                        label="Deminimis / Daily Rate"
                        value={formatCurrency(
                          candidate.offerDetails?.deminimisDailyRate,
                        )}
                      />
                      <DetailRow
                        label="Approval Status"
                        value={
                          candidate.offerApprovalStatus ||
                          getOfferApprovalSummary(candidate)
                        }
                      />
                      <DetailRow
                        label="Offer Email Sent"
                        value={candidate.offerEmailSent ? "Yes" : "No"}
                      />
                      <DetailRow
                        label="Candidate Response"
                        value={candidate.offerDecision || "—"}
                      />
                    </div>
                    {isOffered && (
                      <p className="mt-4 rounded-xl border border-blue-100 bg-white p-4 text-sm font-semibold leading-6 text-sibs-primary-1">
                        Offer approval is managed in the Offers page. Once Raul
                        Nadela and Haasanor approve, TA/user can send or
                        manually open the offer email here.
                      </p>
                    )}

                    {isOffered && (
                      <div className="mt-4 space-y-4">
                        {(() => {
                          const approvedBy = offerApprovers.filter(
                            (approver) => {
                              const approval =
                                candidate.offerApprovals?.[approver];
                              return approval?.status === "Approved";
                            },
                          );

                          const isRejected = offerApprovers.some((approver) => {
                            const approval =
                              candidate.offerApprovals?.[approver];
                            return approval?.status === "Rejected";
                          });

                          const approvalStatus =
                            candidate.offerApprovalStatus ||
                            getOfferApprovalSummary(candidate);

                          return (
                            <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                    Offer Approval
                                  </p>

                                  <h4 className="mt-1 text-base font-extrabold text-[#101828]">
                                    {approvalStatus === "Approved"
                                      ? "Offer Approved"
                                      : isRejected
                                        ? "Offer Rejected"
                                        : "For Review"}
                                  </h4>
                                </div>

                                <span
                                  className={`w-fit rounded-full border px-3 py-1 text-xs font-extrabold ${getOfferApprovalClass(
                                    approvalStatus || "For Review",
                                  )}`}
                                >
                                  {approvalStatus || "For Review"}
                                </span>
                              </div>

                              <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                                <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                                  Approved By
                                </p>

                                <p className="mt-2 text-sm font-bold leading-6 text-sibs-primary-1">
                                  {approvedBy.length > 0
                                    ? approvedBy.join(", ")
                                    : "Waiting for approval"}
                                </p>
                              </div>

                              {approvalStatus !== "Approved" && !isRejected && (
                                <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm font-semibold leading-6 text-sibs-primary-1">
                                  Offer is still for review. The email button
                                  will be enabled once all required approvals
                                  are completed in the Offers page.
                                </p>
                              )}

                              {isRejected && (
                                <p className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-600">
                                  Offer approval was rejected. Please review the
                                  approval details in the Offers page.
                                </p>
                              )}
                            </div>
                          );
                        })()}

                        {isOfferApproved(candidate) &&
                          !candidate.offerEmailSent && (
                            <button
                              type="button"
                              onClick={() => onSendOfferEmail(candidate)}
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 text-sm font-bold text-white transition hover:opacity-90"
                            >
                              <Mail size={16} />
                              Send Offer Email to Candidate
                            </button>
                          )}

                        {isOfferApproved(candidate) && (
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                buildOfferContractLink(candidate),
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                          >
                            <Eye size={16} />
                            Open Candidate Offer Link Manually
                          </button>
                        )}

                        {candidate.offerEmailSent && (
                          <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                              Candidate Offer Response
                            </p>
                            <p className="mt-2 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                              Use these buttons only when the candidate cannot
                              access the email link or TA needs to record the
                              response manually.
                            </p>
                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                              {offerDecisionOptions.map((decision) => (
                                <button
                                  key={decision}
                                  type="button"
                                  onClick={() =>
                                    onOfferDecision(candidate, decision)
                                  }
                                  className={`inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-bold transition ${getOfferDecisionClass(
                                    decision,
                                  )}`}
                                >
                                  {decision}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-[#101828]">
                    Reason for Movement
                  </h3>

                  <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]">
                    {candidate.reasonForMovement || "—"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            {candidate.currentStage !== "Drop-off" &&
              candidate.currentStage !== "Accepted" && (
                <button
                  type="button"
                  disabled={isInterviewInProgress}
                  onClick={() => onOpenDropOffModal(candidate)}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-500 transition hover:bg-red-100 ${disabledActionClass}`}
                >
                  <UserX size={16} />
                  Mark Drop-off
                </button>
              )}

            {isOnlineAssessment && (
              <button
                type="button"
                onClick={() => onOpenAssessmentModal(candidate)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white transition hover:bg-cyan-700"
              >
                <ClipboardCheck size={16} />
                Update Assessment
              </button>
            )}

            {isOnlineAssessment && canScheduleInterview(candidate) && (
              <button
                type="button"
                onClick={() => onOpenScheduleModal(candidate)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
              >
                <CalendarDays size={16} />
                Schedule Interview
              </button>
            )}

            {isInterviewScheduled && canUpdateInterviewSchedule(candidate) && (
              <button
                type="button"
                disabled={isInterviewInProgress}
                onClick={() => {
                  if (isInterviewInProgress) return;

                  handleStartInterview(candidate);

                  if (candidate.onlineInterviewLink) {
                    window.open(
                      candidate.onlineInterviewLink,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }

                  onClose?.();

                  const positionId =
                    candidate.positionId ||
                    candidate.finalInterviewPositionId ||
                    candidate.offerDetails?.positionId ||
                    candidate.hiringRequirementId ||
                    "";

                  const formId =
                    candidate.finalInterviewFormId ||
                    (positionId ? `final-interview-${positionId}` : "");

                  navigate(
                    `/recruitment/final-interview-form?candidateId=${encodeURIComponent(
                      candidate.candidateId || "",
                    )}&candidateApplicationId=${encodeURIComponent(
                      candidate.candidateApplicationId || candidate.id || "",
                    )}&positionId=${encodeURIComponent(positionId)}&formId=${encodeURIComponent(
                      formId,
                    )}`,
                    {
                      state: {
                        candidate,
                      },
                    },
                  );
                }}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90 ${disabledActionClass}`}
              >
                <CirclePlay size={16} />
                Start Interview
              </button>
            )}

            {!isLeadStage &&
              !isInitialScreening &&
              !isOnlineAssessment &&
              !isInterviewScheduled &&
              !isOffered &&
              nextStage && (
                <button
                  type="button"
                  onClick={() => onOpenMoveModal(candidate)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <ArrowRight size={16} />
                  Move to {nextStage}
                </button>
              )}

            {isInitialScreening && nextStage && (
              <button
                type="button"
                onClick={() => onOpenMoveModal(candidate)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
              >
                <ArrowRight size={16} />
                Move to Online Assessment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidatePipelineModal;
