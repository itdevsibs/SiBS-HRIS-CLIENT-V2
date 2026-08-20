import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  BriefcaseBusiness,
  Building2,
  LockKeyhole,
  MapPin,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from "lucide-react";

function cleanText(value = "") {
  return String(value ?? "").trim();
}

function getInitialImpactData(impact = {}) {
  const jobDescription = impact?.jobDescription || {};
  const summary = impact?.summary || {};

  const linkedPositions = Array.isArray(impact?.linkedPositions)
    ? impact.linkedPositions
    : Array.isArray(impact?.linked_positions)
      ? impact.linked_positions
      : [];

  const linkedRequisitions = Array.isArray(impact?.linkedRequisitions)
    ? impact.linkedRequisitions
    : Array.isArray(impact?.linked_requisitions)
      ? impact.linked_requisitions
      : [];

  return {
    jobDescription,
    summary,
    linkedPositions,
    linkedRequisitions,
  };
}

function getDisplayJdCode(jobDescription = {}) {
  return cleanText(jobDescription.jdCode || jobDescription.jd_code || "");
}

function getDisplayRevision(jobDescription = {}) {
  const revision =
    jobDescription.currentVersion ||
    jobDescription.current_version ||
    jobDescription.revisionNo ||
    jobDescription.revision_no ||
    "";

  if (!revision) {
    return "";
  }

  const text = String(revision).trim();

  if (/^v/i.test(text)) {
    return text;
  }

  return `v${text}`;
}

function getDisplayRoleTitle(jobDescription = {}) {
  return cleanText(
    jobDescription.roleTitle ||
      jobDescription.role_title ||
      jobDescription.title ||
      jobDescription.documentTitle ||
      jobDescription.document_title ||
      "Job Description",
  );
}

function getDisplayAccount(jobDescription = {}) {
  return cleanText(
    jobDescription.accountName ||
      jobDescription.account_name ||
      jobDescription.account ||
      "",
  );
}

function getDisplayDepartment(jobDescription = {}) {
  return cleanText(
    jobDescription.departmentName ||
      jobDescription.department_name ||
      jobDescription.department ||
      "",
  );
}

function getLinkedRequirement(jobDescription = {}) {
  return cleanText(
    jobDescription.linkedHiringRequirement ||
      jobDescription.linked_hiring_requirement ||
      "",
  );
}

function getPositionReference(position = {}) {
  return cleanText(
    position.positionId || position.position_id || position.id || "",
  );
}

function getPositionTitle(position = {}) {
  return cleanText(
    position.positionTitle ||
      position.position_title ||
      position.requisitionRoleTitle ||
      position.requisition_role_title ||
      "Available Position",
  );
}

function getPositionAccount(position = {}) {
  return cleanText(position.accountName || position.account_name || "");
}

function getPositionDepartment(position = {}) {
  return cleanText(
    position.department ||
      position.departmentName ||
      position.department_name ||
      "",
  );
}

function getPositionLocation(position = {}) {
  return cleanText(position.locationSite || position.location_site || "");
}

function getPositionStatus(position = {}) {
  return cleanText(
    position.status ||
      position.hiringNeedApprovalStatus ||
      position.hiring_need_approval_status ||
      "",
  );
}

function getPositionOpenSlots(position = {}) {
  const value = Number(position.openSlots ?? position.open_slots ?? 0);

  return Number.isFinite(value) ? value : 0;
}

function getPositionRequestType(position = {}) {
  return cleanText(position.requestType || position.request_type || "");
}

function getRequisitionReference(requisition = {}) {
  const explicitCode = cleanText(
    requisition.requisitionCode ||
      requisition.requisition_code ||
      requisition.code ||
      "",
  );

  if (explicitCode) {
    return explicitCode;
  }

  const id = requisition.id;

  if (!id) {
    return "REQ";
  }

  return `REQ-${String(id).padStart(3, "0")}`;
}

function getRequisitionTitle(requisition = {}) {
  return cleanText(
    requisition.roleTitle || requisition.role_title || "Hiring Requisition",
  );
}

function getRequisitionDepartment(requisition = {}) {
  return cleanText(
    requisition.departmentName || requisition.department_name || "",
  );
}

function getRequisitionAccount(requisition = {}) {
  return cleanText(requisition.accountName || requisition.account_name || "");
}

function getRequisitionLocation(requisition = {}) {
  return cleanText(requisition.locationSite || requisition.location_site || "");
}

function getRequisitionStatus(requisition = {}) {
  return cleanText(
    requisition.approvalStatus || requisition.approval_status || "",
  );
}

function getRequisitionHeadcount(requisition = {}) {
  const value = Number(
    requisition.requiredHeadcount ??
      requisition.required_headcount ??
      requisition.approvedRequirement ??
      requisition.approved_requirement ??
      0,
  );

  return Number.isFinite(value) ? value : 0;
}

function getRequisitionRequestType(requisition = {}) {
  return cleanText(requisition.requestType || requisition.request_type || "");
}

function getStatusLabel(value = "") {
  const status = cleanText(value);

  if (!status) {
    return "";
  }

  return status;
}

function formatDependencyCount(positionCount = 0, openSlots = 0) {
  const cleanPositionCount = Number(positionCount || 0);

  const cleanOpenSlots = Number(openSlots || 0);

  return `${cleanPositionCount} Position${
    cleanPositionCount === 1 ? "" : "s"
  } (${cleanOpenSlots} Total Open Slot${cleanOpenSlots === 1 ? "" : "s"})`;
}

function DependencyRow({
  reference,
  title,
  tag,
  department,
  account,
  location,
  openSlots,
  status,
}) {
  return (
    <div className="flex min-h-[70px] items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {reference ? (
            <span className="inline-flex rounded bg-slate-100 px-2 py-1 font-mono text-[12px] font-bold text-slate-600">
              {reference}
            </span>
          ) : null}

          <p className="min-w-0 text-[13px] font-bold text-[#062f56]">
            {title}
          </p>

          {tag ? (
            <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-1 text-[10px] font-semibold text-purple-600">
              {tag}
            </span>
          ) : null}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
          {department || account ? (
            <span className="inline-flex items-center gap-1">
              <Building2
                size={12}
                strokeWidth={1.8}
                className="text-slate-400"
              />

              <span>{[department, account].filter(Boolean).join(" • ")}</span>
            </span>
          ) : null}

          {location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} strokeWidth={1.8} className="text-slate-400" />

              <span>{location}</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-[132px] flex-col items-end gap-1">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
          <Users size={13} strokeWidth={1.8} />
          {openSlots} Open Slot
          {Number(openSlots) === 1 ? "" : "s"}
        </span>

        {status ? (
          <span className="text-[9px] font-medium text-slate-400">
            {status}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function DeleteJobDescriptionModal({
  open = false,
  loading = false,
  deleting = false,
  impact = null,
  onClose,
  onArchiveInstead,
  onPermanentDelete,
}) {
  const [ackPermanent, setAckPermanent] = useState(false);
  const [ackDependencies, setAckDependencies] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    if (!open) {
      setAckPermanent(false);
      setAckDependencies(false);
      setConfirmation("");
      return;
    }

    setAckPermanent(false);
    setAckDependencies(false);
    setConfirmation("");
  }, [open, impact?.jobDescription?.id]);

  const { jobDescription, summary, linkedPositions, linkedRequisitions } =
    useMemo(() => getInitialImpactData(impact), [impact]);

  const jdCode = getDisplayJdCode(jobDescription);

  const normalizedConfirmation = confirmation.trim().toUpperCase();

  const normalizedJdCode = jdCode.trim().toUpperCase();

  const confirmationValid =
    normalizedConfirmation === "DELETE" ||
    Boolean(normalizedJdCode && normalizedConfirmation === normalizedJdCode);

  const canPermanentlyDelete =
    ackPermanent &&
    ackDependencies &&
    confirmationValid &&
    !deleting &&
    !loading;

  const linkedPositionCount = Number(
    summary.linkedPositionCount ??
      summary.linked_position_count ??
      linkedPositions.length ??
      0,
  );

  const linkedOpenSlots = Number(
    summary.linkedOpenSlots ??
      summary.linked_open_slots ??
      linkedRequisitions.reduce(
        (total, item) => total + getRequisitionHeadcount(item),
        0,
      ) ??
      0,
  );

  const linkedRequisitionCount = Number(
    summary.linkedRequisitionCount ??
      summary.linked_requisition_count ??
      linkedRequisitions.length ??
      0,
  );

  const displayDependencies = useMemo(() => {
    const rows = [];

    linkedPositions.forEach((position) => {
      rows.push({
        key: `position-${position.id}`,

        reference: getPositionReference(position),

        title: getPositionTitle(position),

        tag: getPositionRequestType(position),

        department: getPositionDepartment(position),

        account: getPositionAccount(position),

        location: getPositionLocation(position),

        openSlots: getPositionOpenSlots(position),

        status: getStatusLabel(getPositionStatus(position)),
      });
    });

    linkedRequisitions.forEach((requisition) => {
      const requisitionId = requisition.id;

      const hasMatchingPosition = linkedPositions.some(
        (position) =>
          Number(position.hiringNeedId || position.hiring_need_id || 0) ===
          Number(requisitionId || 0),
      );

      if (hasMatchingPosition) {
        return;
      }

      rows.push({
        key: `requisition-${requisition.id}`,

        reference: getRequisitionReference(requisition),

        title: getRequisitionTitle(requisition),

        tag: getRequisitionRequestType(requisition),

        department: getRequisitionDepartment(requisition),

        account: getRequisitionAccount(requisition),

        location: getRequisitionLocation(requisition),

        openSlots: getRequisitionHeadcount(requisition),

        status: getStatusLabel(getRequisitionStatus(requisition)),
      });
    });

    return rows;
  }, [linkedPositions, linkedRequisitions]);

  if (!open) {
    return null;
  }

  function handleClose() {
    if (deleting) {
      return;
    }

    onClose?.();
  }

  function handleArchiveInstead() {
    if (deleting || loading) {
      return;
    }

    onArchiveInstead?.();
  }

  function handlePermanentDelete() {
    if (!canPermanentlyDelete) {
      return;
    }

    onPermanentDelete?.({
      confirmation: confirmation.trim(),

      acknowledgePermanentDeletion: ackPermanent,

      acknowledgeLinkedRecords: ackDependencies,
    });
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#082d50]/90 px-4 py-5 backdrop-blur-[1px]">
      <div
        className="flex max-h-[calc(100vh-40px)] w-full max-w-[690px] flex-col overflow-hidden rounded-[17px] border-white/70 bg-white shadow-[0_30px_90px_rgba(3,32,60,0.45)]"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {/* ======================================
            RED HEADER
        ====================================== */}
        <div className="relative shrink-0 bg-gradient-to-r from-[#f50000] via-[#ef0017] to-[#db0037] px-6 py-6 text-white">
          <button
            type="button"
            onClick={handleClose}
            disabled={deleting}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close permanent deletion modal"
          >
            <X size={22} />
          </button>

          <div className="flex items-start gap-4 pr-10">
            <div className="flex h-[43px] w-[43px] shrink-0 items-center justify-center rounded-[14px] border border-white/35 bg-white/10">
              <ShieldAlert size={22} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <div className="mb-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300/60 bg-red-900/30 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.01em] text-white">
                  <AlertTriangle size={11} fill="currentColor" />
                  STRICT DELETION SAFEGUARD
                </span>
              </div>

              <h2 className="text-[20px] font-extrabold leading-tight tracking-[-0.03em]">
                Permanent Job Description Deletion
              </h2>

              <p className="mt-1 text-[12px] font-medium leading-5 text-white/95">
                Review linked available positions and verify safety confirmation
                before proceeding.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================
            SCROLLABLE BODY
        ====================================== */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-white">
          {loading ? (
            <div className="flex min-h-[480px] items-center justify-center px-6">
              <div className="text-center">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-red-500" />

                <p className="mt-4 text-sm font-semibold text-slate-600">
                  Checking linked Job Description records...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5 px-6 py-6">
              {/* ==================================
                  TARGET JOB DESCRIPTION
              ================================== */}
              <section className="rounded-xl border border-slate-200 bg-[#f8fbff] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.03em] text-slate-400">
                      Target Job Description Record
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-[16px] font-extrabold text-[#07365f]">
                        {getDisplayRoleTitle(jobDescription)}
                      </h3>

                      {jdCode ? (
                        <span className="rounded border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] font-extrabold text-slate-500">
                          {jdCode}
                        </span>
                      ) : null}

                      {getDisplayRevision(jobDescription) ? (
                        <span className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-500">
                          {getDisplayRevision(jobDescription)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {getDisplayDepartment(jobDescription) ? (
                    <span className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                      {getDisplayDepartment(jobDescription)}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-200 pt-3 text-[11px] text-slate-500 sm:grid-cols-2">
                  <div>
                    <span className="font-bold text-slate-600">Account:</span>{" "}
                    {getDisplayAccount(jobDescription) || "—"}
                  </div>

                  <div className="sm:text-right">
                    <span className="font-bold text-slate-600">
                      Linked Req:
                    </span>{" "}
                    {getLinkedRequirement(jobDescription) || "—"}
                  </div>
                </div>
              </section>

              {/* ==================================
                  LINKED DEPENDENCIES
              ================================== */}
              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness
                      size={16}
                      strokeWidth={1.9}
                      className="text-[#ff5a1f]"
                    />

                    <h3 className="text-[14px] font-extrabold uppercase tracking-[-0.01em] text-[#07365f]">
                      Linked Available Positions & Requisitions
                    </h3>
                  </div>

                  <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-extrabold text-red-600">
                    {formatDependencyCount(
                      linkedPositionCount,
                      linkedOpenSlots,
                    )}
                  </span>
                </div>

                <div className="rounded-xl border border-red-200 bg-[#fff6f6] px-4 py-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={16}
                      strokeWidth={2}
                      className="mt-0.5 shrink-0 text-red-500"
                    />

                    <p className="text-[11px] leading-[1.65] text-[#a43e3e]">
                      <span className="font-extrabold text-[#9d2727]">
                        Active Hiring Dependency Alert:
                      </span>{" "}
                      Deleting this Job Description will permanently remove the
                      JD while preserving the linked Available Positions and
                      Hiring Needs. These records will be disconnected from this
                      Job Description and marked as{" "}
                      <strong>Unlinked from JD</strong> until another approved
                      Job Description is assigned.
                    </p>
                  </div>
                </div>

                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {displayDependencies.length > 0 ? (
                    displayDependencies.map((row) => (
                      <DependencyRow
                        key={row.key}
                        reference={row.reference}
                        title={row.title}
                        tag={row.tag}
                        department={row.department}
                        account={row.account}
                        location={row.location}
                        openSlots={row.openSlots}
                        status={row.status}
                      />
                    ))
                  ) : (
                    <div className="px-4 py-5 text-center text-[12px] text-slate-500">
                      No active linked positions or requisitions were found.
                    </div>
                  )}
                </div>
              </section>

              {/* ==================================
                  SAFE ALTERNATIVE
              ================================== */}
              <section className="rounded-xl border border-amber-300 bg-[#fffaf0] px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Archive
                        size={16}
                        strokeWidth={1.9}
                        className="text-amber-600"
                      />

                      <h3 className="text-[12px] font-extrabold text-amber-900">
                        Safe Alternative: Archive this Job Description
                      </h3>
                    </div>

                    <p className="mt-1 text-[10px] leading-4 text-amber-700">
                      Archiving hides the JD from active intake dropdowns while
                      safely preserving revision audit logs and position
                      connections.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleArchiveInstead}
                    disabled={deleting}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-400 bg-white px-4 py-2 text-[12px] font-bold text-amber-800 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Archive size={14} strokeWidth={1.9} />
                    Archive Instead
                  </button>
                </div>
              </section>

              {/* ==================================
                  ACKNOWLEDGEMENTS
              ================================== */}
              <section className="rounded-xl border border-red-200 bg-[#fffafa] px-4 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <LockKeyhole
                    size={15}
                    strokeWidth={1.9}
                    className="text-red-500"
                  />

                  <h3 className="text-[12px] font-extrabold uppercase text-[#5b2020]">
                    Mandatory Safety Acknowledgements
                  </h3>
                </div>

                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={ackPermanent}
                    onChange={(event) => setAckPermanent(event.target.checked)}
                    disabled={deleting}
                    className="mt-[2px] h-4 w-4 rounded border-slate-300 accent-red-600"
                  />

                  <span className="text-[11px] leading-[1.6] text-slate-600">
                    I understand that this action is{" "}
                    <strong>permanent and irreversible.</strong> The Job
                    Description, revision records, competencies, and revision
                    comments will be permanently removed from their active
                    tables. A deletion audit snapshot will be retained for
                    historical tracking.
                  </span>
                </label>

                <label className="mt-3 flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={ackDependencies}
                    onChange={(event) =>
                      setAckDependencies(event.target.checked)
                    }
                    disabled={deleting}
                    className="mt-[2px] h-4 w-4 rounded border-slate-300 accent-red-600"
                  />

                  <span className="text-[11px] leading-[1.6] text-slate-600">
                    I acknowledge that{" "}
                    <strong>
                      {linkedPositionCount} linked Available Position
                      {linkedPositionCount === 1 ? "" : "s"}
                    </strong>{" "}
                    and{" "}
                    <strong>
                      {linkedRequisitionCount} linked Hiring Need
                      {linkedRequisitionCount === 1 ? "" : "s"}
                    </strong>{" "}
                    will remain in the system but will be disconnected from this
                    Job Description and marked as{" "}
                    <strong className="text-red-600">Unlinked from JD</strong>.
                  </span>
                </label>
              </section>

              {/* ==================================
                  TEXT CONFIRMATION
              ================================== */}
              <section>
                <label
                  htmlFor="jd-permanent-delete-confirmation"
                  className="block text-[11px] font-semibold text-slate-600"
                >
                  To confirm deletion, type{" "}
                  <strong className="text-red-600">DELETE</strong>
                  {jdCode ? (
                    <>
                      {" "}
                      or <strong className="text-red-600">{jdCode}</strong>
                    </>
                  ) : null}{" "}
                  below:
                </label>

                <input
                  id="jd-permanent-delete-confirmation"
                  type="text"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  disabled={deleting}
                  autoComplete="off"
                  placeholder={
                    jdCode
                      ? `Type 'DELETE' or '${jdCode}' to confirm`
                      : "Type 'DELETE' to confirm"
                  }
                  className={[
                    "mt-2 h-[38px] w-full rounded-xl border bg-white px-4 text-[12px] text-slate-700 outline-none transition",
                    confirmation && !confirmationValid
                      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-red-400 focus:ring-2 focus:ring-red-100",
                  ].join(" ")}
                />

                {confirmation && !confirmationValid ? (
                  <p className="mt-1.5 text-[10px] font-medium text-red-500">
                    Enter DELETE or the exact Job Description code.
                  </p>
                ) : null}
              </section>
            </div>
          )}
        </div>

        {/* ======================================
            FIXED FOOTER
        ====================================== */}
        <div className="shrink-0 border-t border-slate-200 bg-[#f8fbff] px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
              <ShieldAlert
                size={13}
                strokeWidth={1.8}
                className="text-slate-400"
              />
              Strict Safeguard Enabled
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={deleting}
                className="h-[38px] rounded-xl border border-slate-300 bg-white px-5 text-[12px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePermanentDelete}
                disabled={!canPermanentlyDelete}
                className={[
                  "inline-flex h-[38px] min-w-[275px] items-center justify-center gap-2 rounded-xl border px-5 text-[12px] font-extrabold shadow-sm transition",
                  canPermanentlyDelete
                    ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
                    : "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-400",
                ].join(" ")}
              >
                {deleting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Permanently Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} strokeWidth={1.8} />
                    Permanently Delete Job Description
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
