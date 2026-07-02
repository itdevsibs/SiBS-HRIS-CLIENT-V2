import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Loader2,
  MapPin,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useHiringNeeds } from "../../../services/context/HiringNeedsContext";
import { useUser } from "../../../services/context/UserContext";

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeStatus(status) {
  if (!status) return "For Approval";

  const value = String(status).trim();
  const lowerValue = value.toLowerCase();

  if (
    lowerValue === "pending" ||
    lowerValue === "for validation" ||
    lowerValue === "under review" ||
    lowerValue === "for approval"
  ) {
    return "For Approval";
  }

  if (lowerValue === "approved") return "Approved";

  if (
    lowerValue === "rejected" ||
    lowerValue === "declined" ||
    lowerValue === "not approved"
  ) {
    return "Not Approved";
  }

  return value;
}

function getStatusClass(status) {
  switch (normalizeStatus(status)) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Not Approved":
      return "border-red-200 bg-red-50 text-red-700";
    case "For Approval":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getApprovalIcon(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "Approved") {
    return <CheckCircle2 size={17} className="text-emerald-600" />;
  }

  if (normalized === "Not Approved") {
    return <XCircle size={17} className="text-red-600" />;
  }

  return <Clock size={17} className="text-amber-500" />;
}

function getUserRoleText(user) {
  return [
    user?.role,
    user?.roleName,
    user?.role_name,
    user?.userRole,
    user?.user_role,
    user?.adminRole,
    user?.admin_role,
    user?.accessRole,
    user?.access_role,
    user?.department,
    user?.account,
    user?.position,
    user?.designation,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/[_-]/g, " ")
    .toLowerCase();
}

function hasHrAdminAccess(user) {
  const roleText = getUserRoleText(user);
  const adminLevel = Number(
    user?.admin_level ??
      user?.adminLevel ??
      user?.admin_access ??
      user?.adminAccess ??
      user?.is_admin ??
      user?.isAdmin ??
      0,
  );

  const hasExplicitHrAdminRole =
    roleText.includes("hr admin") ||
    roleText.includes("human resources admin") ||
    roleText.includes("recruitment admin") ||
    roleText.includes("talent acquisition admin");

  const isHrAdminByDepartment =
    adminLevel >= 1 &&
    (roleText.includes("hr") ||
      roleText.includes("human resources") ||
      roleText.includes("recruitment") ||
      roleText.includes("talent acquisition"));

  const isSuperAdmin =
    roleText.includes("super admin") ||
    roleText.includes("administrator") ||
    adminLevel === 2;

  return hasExplicitHrAdminRole || isHrAdminByDepartment || isSuperAdmin;
}

function InfoItem({ label, value, icon: Icon, className = "" }) {
  return (
    <div
      className={`group min-w-0 rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-4 transition hover:border-[#C9D7E8] hover:bg-white ${className}`}
    >
      <div className="mb-2 flex items-center gap-2">
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EAF2FB] text-sibs-primary-1">
            <Icon size={14} />
          </span>
        )}

        <p className="min-w-0 break-words text-[11px] font-extrabold uppercase leading-4 tracking-wide text-[#215789]">
          {label}
        </p>
      </div>

      <p className="break-words text-sm font-bold leading-6 text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

function DetailSection({ title, subtitle, children }) {
  return (
    <section className="sibs-page-card-in rounded-3xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 min-w-0">
        <h3 className="break-words text-base font-extrabold text-[#101828]">
          {title}
        </h3>

        {subtitle && (
          <p className="mt-1 break-words text-sm font-semibold leading-6 text-sibs-tertiary-5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function ChecklistItem({ step, isLast = false }) {
  const isDone = Boolean(step.done);
  const isRejected = step.status === "Not Approved";

  return (
    <div className="relative flex gap-3">
      {!isLast && (
        <span className="absolute left-[15px] top-8 h-[calc(100%-12px)] w-px bg-[#D9E2EC]" />
      )}

      <div
        className={`relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
          isDone
            ? isRejected
              ? "border-red-200 bg-red-50"
              : "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        {isDone ? (
          isRejected ? (
            <XCircle size={16} className="text-red-600" />
          ) : (
            <CheckCircle2 size={16} className="text-emerald-600" />
          )
        ) : (
          <Clock size={16} className="text-amber-500" />
        )}
      </div>

      <div className="min-w-0 rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 flex-1">
        <p className="break-words text-sm font-extrabold leading-5 text-[#101828]">
          {step.label}
        </p>

        <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
          Date: {formatDate(step.date)}
        </p>
      </div>
    </div>
  );
}

function SummaryMetric({ label, value, icon: Icon, tone = "blue" }) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-blue-100 bg-blue-50 text-sibs-primary-1";

  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 ${toneClass}`}
    >
      {Icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70">
          <Icon size={18} />
        </span>
      )}

      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-wide opacity-80">
          {label}
        </p>
        <p className="mt-0.5 break-words text-lg font-extrabold leading-tight">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function ApprovalRuleNote() {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-primary-1">
          <ClipboardCheck size={18} />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-sibs-primary-1">
            Approval Rule
          </h3>

          <p className="mt-1 text-sm font-semibold leading-6 text-sibs-primary-1/80">
            This personnel requisition must be approved by HR Admin before it
            can be used for hiring execution and weekly hiring planning.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ViewHiringNeedsModal({
  open,
  item,
  onClose,
  onStatus,
}) {
  const { user } = useUser();
  const { approveHiringNeedRequest } = useHiringNeeds();

  const [remarks, setRemarks] = useState("");
  const [submittingAction, setSubmittingAction] = useState("");

  const status = normalizeStatus(item?.approvalStatus);

  const canApprove = useMemo(
    () => hasHrAdminAccess(user) && status === "For Approval",
    [user, status],
  );

  useEffect(() => {
    if (open) {
      setRemarks("");
      setSubmittingAction("");
    }
  }, [open, item?.id]);

  if (!open || !item) return null;

  const jobDescriptionDisplay =
    item.jobDescriptionText ||
    item.jobDescriptionTitle ||
    item.jobDescriptionName ||
    item.documentTitle ||
    item.jdTitle ||
    item.jobDescriptionId ||
    "";

  const hasJobDescription = Boolean(jobDescriptionDisplay);

  const checklist = [
    {
      label: "Personnel requisition submitted",
      done: true,
      date: item.createdAt || item.dateNeeded,
    },
    {
      label: hasJobDescription
        ? "Job Description selected"
        : "Job Description not selected",
      done: hasJobDescription,
      date: item.createdAt || item.dateNeeded,
    },
    {
      label: "Subject for approval",
      done: true,
      date: item.createdAt || item.dateNeeded,
    },
    {
      label:
        status === "Approved"
          ? "Approved"
          : status === "Not Approved"
            ? "Not Approved"
            : "Waiting for approval decision",
      done: status === "Approved" || status === "Not Approved",
      date: item.approvalDate,
      status,
    },
  ];

  async function handleApprovalAction(nextStatus) {
    if (isSubmitting) return;

    if (nextStatus === "Not Approved" && !String(remarks || "").trim()) {
      onStatus?.({
        type: "error",
        title: "Remarks Required",
        message: "Please enter approval remarks before marking this request as not approved.",
      });
      return;
    }

    setSubmittingAction(nextStatus);

    try {
      await approveHiringNeedRequest({
        item,
        status: nextStatus,
        remarks,
      });

      onStatus?.({
        type: "success",
        title: nextStatus === "Approved" ? "Approved" : "Not Approved",
        message:
          nextStatus === "Approved"
            ? "Personnel requisition approved successfully."
            : "Personnel requisition marked as not approved.",
      });

      onClose?.();
    } catch (error) {
      onStatus?.({
        type: "error",
        title: "Approval Failed",
        message:
          error?.message || "Unable to update personnel requisition approval.",
      });
    } finally {
      setSubmittingAction("");
    }
  }

  const isSubmitting = Boolean(submittingAction);

  return (
    <div
      className="sibs-modal-backdrop-in fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-3 py-3 sm:px-4 sm:py-4"
      onClick={isSubmitting ? undefined : onClose}
    >
      <div
        className="sibs-modal-pop-in flex max-h-[94dvh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] bg-white px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="mt-3 break-words text-xl font-extrabold tracking-tight text-sibs-primary-1 sm:text-2xl">
              Personnel Requisition
            </h2>

            <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
              Review all request information and complete the HR Admin approval decision.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_410px]">
            <div className="min-w-0 space-y-5">
              <section className="sibs-page-card-in overflow-hidden rounded-3xl border border-[#E6ECF2] bg-white shadow-sm">
                <div className="bg-gradient-to-br from-white via-white to-[#F3F8FF] p-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-[#215789]">
                        Position Title
                      </p>

                      <h3 className="mt-2 break-words text-2xl font-extrabold leading-tight text-[#101828] sm:text-3xl">
                        {item.positionTitle || "—"}
                      </h3>

                      <p className="mt-2 break-words text-sm font-bold leading-6 text-sibs-tertiary-5">
                        {item.departmentAccount || "—"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold ${getStatusClass(
                            status,
                          )}`}
                        >
                          {getApprovalIcon(status)}
                          {status}
                        </span>

                        <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-sibs-primary-1">
                          <MapPin size={14} />
                          {item.locationSite || "—"}
                        </span>

                        
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      <SummaryMetric
                        label="Headcount"
                        value={item.headcount}
                        icon={Users}
                      />

                      <SummaryMetric
                        label="Date Needed"
                        value={formatDate(item.dateNeeded)}
                        icon={CalendarDays}
                        tone="amber"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <DetailSection
                title="Position Details"
                subtitle="Position, role alignment, job description, site, and reason for hiring."
              >
                <InfoItem label="Position Title" value={item.positionTitle} />

                <InfoItem
                  label="Department / Account"
                  value={item.departmentAccount}
                />

                <InfoItem
                  label="Job Description"
                  value={jobDescriptionDisplay || "Not selected"}
                  icon={FileText}
                  className="md:col-span-2"
                />

                <InfoItem
                  label="Reason for Hiring"
                  value={item.reasonForHiring}
                />

                <InfoItem
                  label="Assignment"
                  value={
                    item.assignment === "Other"
                      ? item.assignmentOther || "Other"
                      : item.assignment
                  }
                />

                <InfoItem label="Location / Site" value={item.locationSite} />
              </DetailSection>

              <DetailSection
                title="Request Details"
                subtitle="Submitted request information and staffing requirement."
              >
                <InfoItem label="Headcount" value={item.headcount} icon={Users} />

                <InfoItem
                  label="Date Needed"
                  value={formatDate(item.dateNeeded)}
                  icon={CalendarDays}
                />

                <InfoItem label="Prepared By" value={item.preparedBy} />

                <InfoItem
                  label="Submitted Date"
                  value={formatDate(item.createdAt)}
                />
              </DetailSection>

              <DetailSection
                title="Approval Details"
                subtitle="Current approval information and recorded decision details."
              >
                <InfoItem label="Approval Status" value={status} />

                <InfoItem
                  label="Approval Date"
                  value={formatDate(item.approvalDate)}
                />

                <InfoItem label="Approved By" value={item.approvedBy} />

                <InfoItem
                  label="Approval Remarks"
                  value={item.approvalRemarks}
                  className="md:col-span-2"
                />
              </DetailSection>
            </div>

            <aside className="min-w-0 space-y-5 xl:sticky xl:top-0 xl:self-start">
              <section className="sibs-page-card-in overflow-hidden rounded-3xl border border-[#E6ECF2] bg-white shadow-sm">
                <div className="border-b border-[#E6ECF2] bg-gradient-to-br from-white to-[#F8FAFC] px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#215789]">
                        Approval Decision
                      </p>

                      <h3 className="mt-1 break-words text-base font-extrabold text-[#101828]">
                        HR Admin Review
                      </h3>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold ${getStatusClass(
                        status,
                      )}`}
                    >
                      {getApprovalIcon(status)}
                      {status}
                    </span>
                  </div>
                </div>

                <div className="space-y-5 px-5 py-5">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#101828]">
                      Approval Timeline
                    </h4>

                    <div className="mt-4 space-y-3">
                      {checklist.map((step, index) => (
                        <ChecklistItem
                          key={step.label}
                          step={step}
                          isLast={index === checklist.length - 1}
                        />
                      ))}
                    </div>
                  </div>

                  {status === "For Approval" && (
                    <div
                      className={`rounded-3xl border p-4 ${
                        canApprove
                          ? "border-emerald-100 bg-emerald-50"
                          : "border-amber-100 bg-amber-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            canApprove
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          <ShieldCheck size={19} />
                        </div>

                        <div className="min-w-0">
                          <h3
                            className={`text-sm font-extrabold ${
                              canApprove ? "text-emerald-800" : "text-amber-800"
                            }`}
                          >
                            {canApprove ? "Ready for Decision" : "Approval Restricted"}
                          </h3>

                          <p
                            className={`mt-1 text-sm font-semibold leading-6 ${
                              canApprove ? "text-emerald-700" : "text-amber-700"
                            }`}
                          >
                            {canApprove
                              ? "Review the PRF details, add remarks if needed, then choose an approval decision."
                              : "Only HR Admin can approve this personnel requisition."}
                          </p>
                        </div>
                      </div>

                      {canApprove && (
                        <div className="mt-4">
                          <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
                            Approval Remarks
                            <span className="ml-1 normal-case tracking-normal text-emerald-700/80">
                              Optional for approval, required for Not Approved
                            </span>
                          </label>

                          <textarea
                            value={remarks}
                            onChange={(event) => setRemarks(event.target.value)}
                            disabled={isSubmitting}
                            rows={6}
                            placeholder="Enter remarks..."
                            className="w-full resize-none rounded-2xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7]"
                          />

                          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleApprovalAction("Not Approved")}
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-extrabold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {submittingAction === "Not Approved" ? (
                                <Loader2 size={17} className="animate-spin" />
                              ) : (
                                <XCircle size={17} />
                              )}
                              Not Approved
                            </button>

                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleApprovalAction("Approved")}
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {submittingAction === "Approved" ? (
                                <Loader2 size={17} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={17} />
                              )}
                              Approve
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {status !== "For Approval" && (
                    <div
                      className={`rounded-3xl border p-4 ${
                        status === "Approved"
                          ? "border-emerald-100 bg-emerald-50"
                          : status === "Not Approved"
                            ? "border-red-100 bg-red-50"
                            : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getApprovalIcon(status)}</div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-extrabold text-[#101828]">
                            Request status: {status}
                          </h3>
                          <p className="mt-1 text-sm font-semibold leading-6 text-[#475467]">
                            The decision details remain visible in the Approval Details section.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <ApprovalRuleNote />
                </div>
              </section>
            </aside>
          </div>
        </div>

        <div className="border-t border-[#E6ECF2] bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-sibs-tertiary-5">
              {status === "For Approval"
                ? canApprove
                  ? "Decision buttons are available in the HR Admin Review panel."
                  : "Waiting for HR Admin approval."
                : `Request status: ${status}`}
            </p>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#D0D5DD] bg-white px-6 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
