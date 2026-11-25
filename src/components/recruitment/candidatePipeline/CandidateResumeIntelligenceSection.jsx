import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  FileText,
  HelpCircle,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import {
  buildAuthorizedResumeDocumentUrl,
  getApplicationResumeIntelligence,
  regenerateApplicationResumeIntelligence,
  reviewResumeIntelligenceQuestions,
} from "@/lib/axios/resumeIntelligenceClient";
import {
  formatResumeFileSize,
  getResumeIntelligenceStatusMeta,
  resolveCandidateApplicationIdentifier,
} from "@/lib/utils/recruitment/resumeAnalysisClient";
import { CandidateModalSection } from "./CandidatePipelineModalShell";
import GeneratedQuestionsWorkspace from "./GeneratedQuestionsWorkspace";

export default function CandidateResumeIntelligenceSection({ candidate }) {
  const identifier = useMemo(
    () => resolveCandidateApplicationIdentifier(candidate),
    [candidate]
  );

  if (!identifier) return null;

  return (
    <CandidateResumeIntelligenceSectionInner
      key={String(identifier)}
      identifier={identifier}
    />
  );
}

function CandidateResumeIntelligenceSectionInner({ identifier }) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [permissions, setPermissions] = useState({
    canView: true,
    canReviewQuestions: false,
    canRegenerate: false,
  });
  const [intelData, setIntelData] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTab, setViewerTab] = useState("segments");
  const viewerTriggerRef = useRef(null);
  const activeIdentifierRef = useRef(identifier);

  useEffect(() => {
    activeIdentifierRef.current = identifier;
    return () => {
      activeIdentifierRef.current = null;
    };
  }, [identifier]);

  // Prevent Escape inside the nested Evidence Viewer from bubbling to the outer Candidate Pipeline modal
  useEffect(() => {
    if (!viewerOpen || typeof document === "undefined") return undefined;
    const handleCaptureEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation?.();
      event.stopPropagation();
      setViewerOpen(false);
    };
    document.addEventListener("keydown", handleCaptureEscape, true);
    return () => {
      document.removeEventListener("keydown", handleCaptureEscape, true);
    };
  }, [viewerOpen]);

  const fetchIntelligence = useCallback(
    async ({ silent = false } = {}) => {
      if (!identifier) return;
      if (!silent) setLoading(true);
      setError("");
      try {
        const res = await getApplicationResumeIntelligence(identifier);
        if (activeIdentifierRef.current !== identifier) return;
        if (res?.success) {
          setIntelData(res.data || null);
          if (res.permissions) {
            setPermissions(res.permissions);
          }
        }
      } catch (err) {
        if (activeIdentifierRef.current !== identifier) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load resume intelligence."
        );
      } finally {
        if (activeIdentifierRef.current === identifier && !silent) {
          setLoading(false);
        }
      }
    },
    [identifier]
  );

  useEffect(() => {
    fetchIntelligence();
  }, [fetchIntelligence]);

  // Poll automatically while background job is in an active transitional state
  useEffect(() => {
    const status = intelData?.overallStatus;
    if (
      !identifier ||
      !["queued", "extracting", "analyzing", "generating"].includes(status)
    ) {
      return undefined;
    }

    const timer = setInterval(() => {
      fetchIntelligence({ silent: true });
    }, 4500);

    return () => clearInterval(timer);
  }, [identifier, intelData?.overallStatus, fetchIntelligence]);

  const handleReviewDecision = async ({
    questionIds = [],
    reviewAll = false,
    decision,
  }) => {
    if (!identifier || actionLoading) return;
    setActionLoading(true);
    setError("");
    setFeedbackMessage("");
    try {
      const res = await reviewResumeIntelligenceQuestions(identifier, {
        questionSetId: intelData?.questionSet?.questionSetId || null,
        questionIds,
        reviewAll,
        decision,
      });
      if (res?.data) {
        setIntelData(res.data);
      }
      setFeedbackMessage(
        res?.message ||
          (decision === "approved"
            ? "Interview question(s) approved."
            : "Interview question(s) rejected.")
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update question review status."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateOrRetry = async ({ forceRegenerate = true } = {}) => {
    if (!identifier || actionLoading) return;
    setActionLoading(true);
    setError("");
    setFeedbackMessage("");
    try {
      const res = await regenerateApplicationResumeIntelligence(identifier, {
        forceRegenerate,
        waitForCompletion: true,
      });
      if (res?.data) {
        setIntelData(res.data);
      }
      setFeedbackMessage(
        res?.message || "Resume intelligence analysis updated."
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to regenerate resume intelligence."
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (!identifier) return null;

  const statusMeta = getResumeIntelligenceStatusMeta(
    intelData?.overallStatus || "no_resume_available"
  );
  const doc = intelData?.resumeDocument || null;
  const analysis = intelData?.analysis || null;
  const questionSet = intelData?.questionSet || null;
  const questions = questionSet?.questions || [];
  const job = intelData?.job || null;
  const approvedJd = analysis?.approvedJobDescription || null;
  const documentUrl = buildAuthorizedResumeDocumentUrl(
    intelData?.applicationId || identifier
  );

  return (
    <CandidateModalSection
      icon={<Sparkles size={17} />}
      title="Resume Intelligence & AI Interview Prep"
      subtitle="Evidence-backed resume extraction, approved Job Description alignment, and personalized Final Interview questions."
      headerAction={
        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid="resume-intelligence-status-badge"
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${statusMeta.tone}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusMeta.label}
          </span>
          {doc && (
            <button
              ref={viewerTriggerRef}
              type="button"
              onClick={() => setViewerOpen(true)}
              data-testid="open-resume-evidence-viewer-btn"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#042C51] shadow-xs transition hover:bg-slate-50"
            >
              <Eye size={13} />
              View Resume & Evidence
            </button>
          )}
          {permissions.canRegenerate && (
            <button
              type="button"
              disabled={actionLoading || loading}
              onClick={() =>
                handleRegenerateOrRetry({
                  forceRegenerate:
                    intelData?.overallStatus !== "failed" &&
                    intelData?.overallStatus !== "needs_review",
                })
              }
              data-testid="regenerate-resume-intelligence-btn"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#042C51]/20 bg-[#042C51]/5 px-2.5 py-1 text-[11px] font-semibold text-[#042C51] transition hover:bg-[#042C51]/10 disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCcw size={12} />
              )}
              {intelData?.overallStatus === "failed" ||
              intelData?.overallStatus === "needs_review"
                ? "Retry Processing"
                : "Regenerate Questions"}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-3" data-testid="candidate-resume-intelligence-section">
        {loading && !intelData ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <Loader2 size={15} className="animate-spin text-[#042C51]" />
            Loading Resume Intelligence & Job Description alignment...
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {feedbackMessage ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              {feedbackMessage}
            </span>
            <button
              type="button"
              onClick={() => setFeedbackMessage("")}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X size={13} />
            </button>
          </div>
        ) : null}

        {/* Top Summary Cards: Resume File + Approved JD + Question Set Summary */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* Card 1: Resume File Details */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Uploaded Resume Document
              </span>
              {doc?.resumeVersion ? (
                <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                  v{doc.resumeVersion}
                </span>
              ) : null}
            </div>
            {doc ? (
              <div className="mt-1.5 space-y-1">
                <p
                  className="truncate text-xs font-bold text-[#042C51]"
                  title={doc.originalFilename}
                >
                  {doc.originalFilename || "Resume Attachment"}
                </p>
                <p className="text-[11px] text-slate-600">
                  Type: <span className="font-semibold uppercase">{doc.detectedFileType || "Document"}</span>{" "}
                  • Size: <span className="font-semibold">{formatResumeFileSize(doc.fileSize)}</span>
                  {doc.segments?.length ? (
                    <> • {doc.segments.length} segments</>
                  ) : null}
                </p>
                {doc.extractionError ? (
                  <p className="text-[11px] font-medium text-amber-700">
                    {doc.extractionError}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">
                No resume document uploaded for this application.
              </p>
            )}
          </div>

          {/* Card 2: Approved Job Description Alignment */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Approved Job Description
              </span>
              {approvedJd ? (
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  {approvedJd.jd_code || `JD #${approvedJd.jd_id}`} (Rev {approvedJd.revision || 1})
                </span>
              ) : null}
            </div>
            {approvedJd ? (
              <div className="mt-1.5 space-y-1">
                <p className="truncate text-xs font-bold text-[#042C51]">
                  {approvedJd.position_title}
                </p>
                <p className="text-[11px] text-slate-600">
                  {approvedJd.requirements?.length || 0} approved requirements & competencies mapped
                </p>
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-amber-700">
                {job?.errorCode === "UNAPPROVED_JD" ||
                job?.errorCode === "JD_NOT_FOUND"
                  ? job.errorMessage
                  : "Awaiting approved Job Description resolution."}
              </p>
            )}
          </div>

          {/* Card 3: Question Set & Review Status */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                AI Interview Question Set
              </span>
              {questionSet ? (
                <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
                  Set v{questionSet.questionSetVersion}
                </span>
              ) : null}
            </div>
            {questionSet ? (
              <div className="mt-1.5 space-y-1">
                <p className="text-xs font-bold text-[#042C51]">
                  {questionSet.approvedCount} Approved / {questionSet.totalCount} Generated
                </p>
                <p className="text-[11px] text-slate-600">
                  {questionSet.pendingCount > 0
                    ? `${questionSet.pendingCount} pending HR review`
                    : "Ready for Final Interview Form"}
                  {questionSet.rejectedCount > 0
                    ? ` • ${questionSet.rejectedCount} rejected`
                    : ""}
                </p>
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">
                {statusMeta.description}
              </p>
            )}
          </div>
        </div>

        {/* Job Error / Needs Review Alert */}
        {job?.errorMessage &&
        ["failed", "needs_review"].includes(intelData?.overallStatus) ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-700" />
              <div className="space-y-1">
                <p className="font-bold">
                  {intelData?.overallStatus === "failed"
                    ? "Background Processing Notice"
                    : "Manual HR Review Required"}
                </p>
                <p>{job.errorMessage}</p>
                {job.validationErrors?.length > 0 ? (
                  <ul className="list-disc pl-4 text-[11px] text-amber-800">
                    {job.validationErrors.slice(0, 3).map((ve, idx) => (
                      <li key={idx}>{ve}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* Extracted Experience, Qualifications, Skills & Clarifications */}
        {analysis ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* Experience & Qualifications */}
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#042C51]">
                  <BriefcaseBusiness size={14} className="text-[#FF5C28]" />
                  Extracted Experience & Qualifications
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  Unverified Resume Claims
                </span>
              </div>
              <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                {[
                  ...(analysis.structuredExperience || []),
                  ...(analysis.education || []),
                  ...(analysis.qualifications || []),
                ]
                  .slice(0, 8)
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded border border-slate-100 bg-slate-50/70 px-2.5 py-1.5 text-xs text-slate-700"
                    >
                      <p className="font-medium text-slate-800">{item.value}</p>
                      {item.evidence?.[0] ? (
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          Evidence [{item.evidence[0].segment_id}]: &ldquo;
                          {item.evidence[0].quote}&rdquo;
                        </p>
                      ) : null}
                    </div>
                  ))}
                {(analysis.structuredExperience?.length || 0) +
                  (analysis.education?.length || 0) +
                  (analysis.qualifications?.length || 0) ===
                0 ? (
                  <p className="text-xs text-slate-500">
                    No structured experience entries extracted.
                  </p>
                ) : null}
              </div>
            </div>

            {/* Skills & Clarification Points */}
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#042C51]">
                  <BookOpen size={14} className="text-[#FF5C28]" />
                  Extracted Skills & Clarification Points
                </span>
              </div>
              {analysis.skills?.length > 0 ? (
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  {analysis.skills.slice(0, 14).map((sk, idx) => (
                    <span
                      key={idx}
                      title={
                        sk.evidence?.[0]
                          ? `[${sk.evidence[0].segment_id}] ${sk.evidence[0].quote}`
                          : sk.value
                      }
                      className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50/70 px-2 py-0.5 text-[11px] font-semibold text-[#042C51]"
                    >
                      {sk.value}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mb-2 text-xs text-slate-500">
                  No discrete skill tags extracted.
                </p>
              )}

              {analysis.uncertainties?.length > 0 ? (
                <div className="space-y-1 border-t border-slate-100 pt-2">
                  <p className="text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                    Items Requiring Interview Clarification
                  </p>
                  {analysis.uncertainties.slice(0, 4).map((unc, idx) => (
                    <p
                      key={idx}
                      className="flex items-start gap-1.5 text-[11px] text-amber-900"
                    >
                      <HelpCircle size={12} className="mt-0.5 shrink-0 text-amber-600" />
                      <span>{unc}</span>
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Generated Interview Questions & HR Approval Workspace */}
        {questions.length > 0 ? (
          <GeneratedQuestionsWorkspace
            key={String(intelData?.applicationId || identifier)}
            questions={questions}
            approvedJd={approvedJd}
            permissions={permissions}
            actionLoading={actionLoading}
            onReviewDecision={handleReviewDecision}
          />
        ) : !loading &&
          !["failed", "needs_review"].includes(intelData?.overallStatus) ? (
          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-600"
            data-testid="empty-ai-questions-state"
          >
            <span>
              {statusMeta.description ||
                "No AI interview questions have been generated for this application yet."}
            </span>
          </div>
        ) : null}

        {/* Document & Evidence Viewer Modal */}
        <ModalShell
          open={Boolean(viewerOpen && doc)}
          onClose={() => setViewerOpen(false)}
          title="Resume Document & Traceable Evidence Viewer"
          subtitle={
            doc
              ? `${doc.originalFilename || "Resume Attachment"} • SHA-256: ${
                  doc.fileSha256 ? `${doc.fileSha256.slice(0, 16)}...` : "N/A"
                }`
              : ""
          }
          icon={FileText}
          maxWidth="max-w-4xl"
          zIndex="z-[10050]"
          variant="navy"
          closeOnBackdrop={false}
          closeOnEscape={true}
          returnFocusFallbackRef={viewerTriggerRef}
          bodyClassName="p-0"
        >
          {doc ? (
            <div data-testid="resume-evidence-viewer-modal">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    {
                      id: "segments",
                      label: `Extracted Segments (${doc.segments?.length || 0})`,
                    },
                    { id: "structured", label: "Structured Resume Analysis" },
                    { id: "jd", label: "Approved JD Requirements" },
                    { id: "document", label: "Original Resume File" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setViewerTab(tab.id)}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                        viewerTab === tab.id
                          ? "bg-[#042C51] text-white"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {documentUrl ? (
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-[#042C51] hover:bg-slate-50"
                  >
                    Open Original Document in New Tab
                  </a>
                ) : null}
              </div>

              <div className="p-4">
                {viewerTab === "segments" && (
                  <div className="space-y-2.5">
                    {doc.segments?.length > 0 ? (
                      doc.segments.map((seg) => (
                        <div
                          key={seg.segment_id}
                          className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span className="rounded bg-[#042C51] px-2 py-0.5 text-[10px] font-bold text-white">
                              {seg.segment_id}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {seg.page_or_section}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-xs text-slate-800">
                            {seg.text}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">
                        {doc.extractionError ||
                          "No text segments were extracted from this document."}
                      </p>
                    )}
                  </div>
                )}

                {viewerTab === "structured" && (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                      <ShieldCheck size={14} className="mr-1 inline" />
                      {analysis?.verificationNotice ||
                        "Extracted facts represent unverified applicant resume claims until verified by HR."}
                    </div>
                    {analysis?.evidenceReferences?.length > 0 ? (
                      <div className="space-y-2">
                        {analysis.evidenceReferences.map((ref, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#042C51] uppercase">
                                {ref.fact_type}
                              </span>
                              <span className="font-bold text-slate-900">
                                {ref.fact_value}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-600">
                              Segment{" "}
                              <span className="font-semibold text-[#042C51]">
                                [{ref.segment_id}]
                              </span>
                              : &ldquo;{ref.quote}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        No structured evidence references available.
                      </p>
                    )}
                  </div>
                )}

                {viewerTab === "jd" && (
                  <div className="space-y-2">
                    {approvedJd?.requirements?.length > 0 ? (
                      approvedJd.requirements.map((req) => (
                        <div
                          key={req.requirement_id}
                          className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs"
                        >
                          <span className="mr-2 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            {req.requirement_id}
                          </span>
                          <span className="font-medium text-slate-800">
                            {req.text}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">
                        No approved Job Description requirements resolved.
                      </p>
                    )}
                  </div>
                )}

                {viewerTab === "document" && (
                  <div className="space-y-3">
                    {doc.detectedFileType === "pdf" && documentUrl ? (
                      <iframe
                        title="Original Resume PDF"
                        src={documentUrl}
                        className="h-[55vh] w-full rounded-lg border border-slate-200"
                      />
                    ) : (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
                        <p className="font-bold text-[#042C51]">
                          {doc.originalFilename}
                        </p>
                        <p className="mt-1">
                          Full extracted text preview is shown below. Use
                          &ldquo;Open Original Document in New Tab&rdquo; above
                          to download or inspect the raw file.
                        </p>
                        <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap rounded border border-slate-200 bg-white p-3 font-sans text-xs text-slate-800">
                          {doc.extractedText ||
                            "No extracted text preview available."}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </ModalShell>
      </div>
    </CandidateModalSection>
  );
}
