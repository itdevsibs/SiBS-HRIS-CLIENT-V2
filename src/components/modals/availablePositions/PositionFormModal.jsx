import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileCheck2,
  Link2,
  Loader2,
  Pencil,
  RotateCcw,
  Save,
  Settings2,
  X,
  XCircle,
} from "lucide-react";

import { LOCATION_SITE_OPTIONS } from "@/lib/utils/availablePositions/availablePositionsConstants";
import { cleanText } from "@/lib/utils/availablePositions/availablePositionsHelpers";
import { formatAvailablePositionId } from "@/lib/utils/availablePositions/availablePositionId";
import DropdownField from "@/components/recruitment/availablePositions/DropdownField";
import RichTextEditor from "@/components/modals/jobDescription/RichTextEditor";
import { formatDate } from "@/components/layout/FormatDateTime";

const INPUT_CLASS =
  "h-8.5 2xl:h-10 w-full rounded-lg 2xl:rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 focus:border-[#FF5C28] focus:ring-2 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:border-[#E4E7EC] disabled:bg-[#F2F4F7] disabled:text-[#98A2B3] disabled:hover:border-[#E4E7EC]";

const TEXTAREA_CLASS =
  "min-h-24 w-full resize-none rounded-lg 2xl:rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2 sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 focus:border-[#FF5C28] focus:ring-2 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:border-[#E4E7EC] disabled:bg-[#F2F4F7] disabled:text-[#98A2B3] disabled:hover:border-[#E4E7EC]";

function normalizeText(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeApprovalStatus(value = "") {
  const status = normalizeText(value);

  if (!status) return "";
  if (status === "pending") return "For Approval";
  if (status === "for review") return "For Approval";
  if (status === "for approval") return "For Approval";
  if (status === "approved") return "Approved";

  if (status === "rejected" || status === "declined") {
    return "Rejected";
  }

  return String(value || "").trim();
}

function normalizeJdLinkStatus(value = "") {
  const status = normalizeText(value);

  if (!status) {
    return "Linked";
  }

  if (
    status === "unlinked from jd" ||
    status === "unlinked from job description" ||
    status === "unlinked from job descriptions" ||
    status === "unlinked"
  ) {
    return "Unlinked from JD";
  }

  return String(value || "").trim();
}

function getPositionApprovalStatus(position = {}, form = {}) {
  const raw = position?.raw || {};

  return normalizeApprovalStatus(
    form?.approvalStatus ||
      form?.approval_status ||
      form?.recruitmentSettingsStatus ||
      form?.recruitment_settings_status ||
      position?.approvalStatus ||
      position?.approval_status ||
      position?.recruitmentSettingsStatus ||
      position?.recruitment_settings_status ||
      raw?.approvalStatus ||
      raw?.approval_status ||
      raw?.recruitmentSettingsStatus ||
      raw?.recruitment_settings_status ||
      "",
  );
}

function getPositionApprovalRequestId(position = {}, form = {}) {
  const raw = position?.raw || {};

  return cleanText(
    form?.approvalRequestId ||
      form?.approval_request_id ||
      form?.requestId ||
      form?.request_id ||
      position?.approvalRequestId ||
      position?.approval_request_id ||
      position?.requestId ||
      position?.request_id ||
      raw?.approvalRequestId ||
      raw?.approval_request_id ||
      "",
  );
}

function getPositionJdLinkStatus(position = {}, form = {}) {
  const raw = position?.raw || {};

  return normalizeJdLinkStatus(
    form?.jdLinkStatus ||
      form?.jd_link_status ||
      position?.jdLinkStatus ||
      position?.jd_link_status ||
      raw?.jdLinkStatus ||
      raw?.jd_link_status ||
      "",
  );
}

function getPositionId(position = {}, form = {}) {
  const rawPositionId =
    position?.positionId ||
    position?.position_id ||
    form?.positionId ||
    form?.position_id ||
    "";

  const recordId = position?.id || form?.id || "";

  return formatAvailablePositionId(rawPositionId, recordId);
}

function getPositionLastUpdated(position = {}, form = {}) {
  return (
    position?.updatedAt ||
    position?.updated_at ||
    position?.createdAt ||
    position?.created_at ||
    form?.updatedAt ||
    form?.updated_at ||
    form?.createdAt ||
    form?.created_at ||
    null
  );
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
      {children}

      {required ? <span className="ml-0.5 text-[#FF5C28]">*</span> : null}
    </label>
  );
}

function PositionFormSection({ title, subtitle, icon: Icon, children }) {
  return (
    <section className="rounded-xl 2xl:rounded-2xl border border-[#DCE6F1] bg-white p-3.5 sm:p-4 2xl:p-5 shadow-[0_8px_24px_rgba(4,44,81,0.04)] font-jakarta">
      <div className="mb-3 2xl:mb-4 flex items-start gap-2.5 border-b border-[#EEF2F6] pb-2.5 2xl:pb-3">
        {Icon ? <Icon className="mt-0.5 h-3.5 w-3.5 2xl:h-4 2xl:w-4 shrink-0 text-[#FF5C28]" /> : null}

        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-[#042C51]">
            {title}
          </h3>

          {subtitle ? (
            <p className="mt-0.5 text-[10px] sm:text-xs font-semibold leading-relaxed text-[#667085]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {children}
    </section>
  );
}

function htmlToPlainText(value) {
  const source = String(value || "").trim();

  if (!source) {
    return "";
  }

  if (!/<\/?[a-z][\s\S]*>/i.test(source)) {
    return source;
  }

  if (typeof document !== "undefined") {
    const container = document.createElement("div");

    container.innerHTML = source;

    return String(container.textContent || container.innerText || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return source
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function PositionFormModal({
  open,
  mode,
  form,
  setForm,
  onClose,
  onSubmit,
  onReset,
  meta,
  approvedJdPositions = [],
  isSaving,
  position = null,
  canApproveAvailablePositions = false,
  onApproveRequest,
  onRejectRequest,
}) {
  const isEditMode = mode === "edit";

  const modalBodyRef = useRef(null);
  const originalFormRef = useRef(null);

  const [editEnabled, setEditEnabled] = useState(false);

  const [openedAsUnlinked, setOpenedAsUnlinked] = useState(false);

  const [relinkJdSelected, setRelinkJdSelected] = useState(false);

  const approvalStatus = useMemo(
    () => getPositionApprovalStatus(position || {}, form || {}),
    [position, form],
  );

  const approvalRequestId = useMemo(
    () => getPositionApprovalRequestId(position || {}, form || {}),
    [position, form],
  );

  const liveJdLinkStatus = useMemo(
    () => getPositionJdLinkStatus(position || {}, form || {}),
    [position, form],
  );

  const isRelinkMode = isEditMode && openedAsUnlinked;

  const isViewMode = isEditMode && !isRelinkMode && !editEnabled;

  const fieldsDisabled = Boolean(
    isSaving || isViewMode || isRelinkMode,
  );

  const jdSelectorDisabled = Boolean(isSaving || (isViewMode && !isRelinkMode));

  const displayPositionId = useMemo(() => {
    if (!isEditMode) {
      return "New Position";
    }

    return getPositionId(position || {}, form || {});
  }, [isEditMode, position, form]);

  const lastUpdated = useMemo(() => {
    if (!isEditMode) {
      return new Date();
    }

    return getPositionLastUpdated(position || {}, form || {});
  }, [isEditMode, position, form]);

  const isForApproval = approvalStatus === "For Approval";

  const isApproved = approvalStatus === "Approved";

  const isRejected = approvalStatus === "Rejected";

  const showApprovalActions = isEditMode && isViewMode && isForApproval;

  const showEditButton = isEditMode && isViewMode && !isForApproval;

  const approvalActionsDisabled = Boolean(
    isSaving || !canApproveAvailablePositions || !approvalRequestId,
  );

  useEffect(() => {
    if (!open) {
      setEditEnabled(false);
      setOpenedAsUnlinked(false);
      setRelinkJdSelected(false);
      originalFormRef.current = null;
      return;
    }

    const openingStatus = getPositionJdLinkStatus(position || {}, form || {});

    const openingIsUnlinked =
      normalizeText(openingStatus) === "unlinked from jd";

    setOpenedAsUnlinked(openingIsUnlinked);

    setRelinkJdSelected(false);

    if (isEditMode) {
      setEditEnabled(false);

      originalFormRef.current = {
        ...form,
      };

      return;
    }

    setEditEnabled(true);
    originalFormRef.current = null;
  }, [
    open,
    isEditMode,
    position?.id,
    position?.positionId,
    position?.position_id,
    form?.id,
  ]);

  const statusDropdownOptions = useMemo(
    () =>
      (Array.isArray(meta?.statusOptions) ? meta.statusOptions : []).map(
        (status) => ({
          id: status,
          value: status,
          label: status,
        }),
      ),
    [meta?.statusOptions],
  );

  const locationDropdownOptions = useMemo(
    () =>
      LOCATION_SITE_OPTIONS.map((location) => ({
        id: location,
        value: location,
        label: location,
      })),
    [],
  );

  const departmentDropdownOptions = useMemo(
    () =>
      (Array.isArray(meta?.departments) ? meta.departments : [])
        .filter(Boolean)
        .map((department) => ({
          id:
            department.departmentId ||
            department.id ||
            department.departmentName,

          value: department.departmentId || department.id || "",

          label:
            department.departmentName ||
            department.name ||
            "Unnamed Department",

          searchText: [
            department.departmentId,
            department.departmentName,
            department.name,
          ]
            .filter(Boolean)
            .join(" "),

          raw: department,
        })),
    [meta?.departments],
  );

  const accountDropdownOptions = useMemo(() => {
    const accounts = Array.isArray(meta?.accounts) ? meta.accounts : [];

    return accounts
      .filter((account) => {
        if (!form?.departmentId) {
          return false;
        }

        return String(account.departmentId || "") === String(form.departmentId);
      })
      .map((account) => ({
        id: account.accountId || account.id || account.accountName,

        value: account.accountId || account.id || "",

        label: account.accountName || account.name || "Unnamed Account",

        description: account.accountGhlName || account.account_ghl_name || "",

        searchText: [
          account.accountId,
          account.accountName,
          account.accountGhlName,
          account.departmentId,
        ]
          .filter(Boolean)
          .join(" "),

        raw: account,
      }));
  }, [form?.departmentId, meta?.accounts]);

  const approvedJdDropdownOptions = useMemo(() => {
    const clearOption = {
      id: "__clear_jd__",
      value: "__clear_jd__",
      label: "—",
      description: "",
      searchText: "clear empty none remove selection",
      raw: {
        clearSelection: true,
      },
    };

    const jdOptions = approvedJdPositions
      .map((jd) => {
        const roleTitle =
          jd.roleTitle ||
          jd.role_title ||
          jd.title ||
          jd.documentTitle ||
          jd.document_title ||
          "";

        if (!cleanText(roleTitle)) {
          return null;
        }

        const jdCode = jd.jdCode || jd.jd_code || "";

        const documentTitle = jd.documentTitle || jd.document_title || "";

        const department =
          jd.department || jd.departmentName || jd.department_name || "";

        const account =
          jd.account ||
          jd.accountName ||
          jd.account_name ||
          jd.preparedFor ||
          jd.prepared_for ||
          "";

        return {
          id: jd.id || jd.rawId || jd.raw_id || roleTitle,

          value: roleTitle,

          label: `${roleTitle}${jdCode ? ` (${jdCode})` : ""}`,

          description: [documentTitle, department, account]
            .filter(Boolean)
            .join(" • "),

          searchText: [roleTitle, jdCode, documentTitle, department, account]
            .filter(Boolean)
            .join(" "),

          raw: jd,
        };
      })
      .filter(Boolean);

    return [clearOption, ...jdOptions];
  }, [approvedJdPositions]);

  if (!open) {
    return null;
  }

  function updateField(field, value) {
    if (fieldsDisabled) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleEnableEdit() {
    if (isSaving || isRelinkMode) {
      return;
    }

    originalFormRef.current = {
      ...form,
    };

    setEditEnabled(true);
  }

  function handleCancelEdit() {
    if (isSaving) {
      return;
    }

    if (originalFormRef.current) {
      setForm({
        ...originalFormRef.current,
      });
    }

    setEditEnabled(false);
  }

  function clearSelectedJd() {
    setRelinkJdSelected(false);

    setForm((previous) => ({
      ...previous,

      jdId: "",
      jd_id: "",

      jdCode: "",
      jd_code: "",

      documentTitle: "",
      document_title: "",

      /*
       * Keep the existing Available Position title.
       * Only remove the selected JD connection.
       */
      positionTitle:
        originalFormRef.current?.positionTitle ||
        originalFormRef.current?.position_title ||
        previous.positionTitle ||
        previous.position_title ||
        "",

      /*
       * Preserve the current position's organizational
       * mapping when clearing a mistaken JD selection.
       */
      departmentId:
        originalFormRef.current?.departmentId ||
        originalFormRef.current?.department_id ||
        previous.departmentId ||
        previous.department_id ||
        "",

      department:
        originalFormRef.current?.department ||
        originalFormRef.current?.departmentName ||
        originalFormRef.current?.department_name ||
        previous.department ||
        "",

      accountId:
        originalFormRef.current?.accountId ||
        originalFormRef.current?.account_id ||
        previous.accountId ||
        previous.account_id ||
        "",

      accountName:
        originalFormRef.current?.accountName ||
        originalFormRef.current?.account_name ||
        previous.accountName ||
        previous.account_name ||
        "",

      accountGhlName:
        originalFormRef.current?.accountGhlName ||
        originalFormRef.current?.account_ghl_name ||
        previous.accountGhlName ||
        previous.account_ghl_name ||
        "",

      description:
        originalFormRef.current?.description || previous.description || "",

      descriptionPlainText:
        originalFormRef.current?.descriptionPlainText ||
        previous.descriptionPlainText ||
        "",

      preferredSkills:
        originalFormRef.current?.preferredSkills ||
        originalFormRef.current?.preferred_skills ||
        previous.preferredSkills ||
        previous.preferred_skills ||
        "",

      jdLinkStatus: isRelinkMode
        ? "Unlinked from JD"
        : previous.jdLinkStatus || previous.jd_link_status || "Linked",

      jd_link_status: isRelinkMode
        ? "Unlinked from JD"
        : previous.jd_link_status || previous.jdLinkStatus || "Linked",
    }));
  }

  function handleApprovedJdPositionChange(positionTitle, selectedOption) {
    if (isSaving) {
      return;
    }

    if (isViewMode && !isRelinkMode) {
      return;
    }

    if (
      selectedOption?.raw?.clearSelection ||
      selectedOption?.value === "__clear_jd__"
    ) {
      clearSelectedJd();
      return;
    }

    const selectedJd = selectedOption?.raw;

    if (!selectedJd) {
      clearSelectedJd();
      return;
    }

    const jdId = selectedJd.id || selectedJd.rawId || selectedJd.raw_id || "";

    const jdCode = selectedJd.jdCode || selectedJd.jd_code || "";

    const documentTitle =
      selectedJd.documentTitle ||
      selectedJd.document_title ||
      selectedJd.raw?.documentTitle ||
      selectedJd.raw?.document_title ||
      selectedJd.title ||
      selectedJd.roleTitle ||
      selectedJd.role_title ||
      positionTitle ||
      "";

    const departmentId =
      selectedJd.departmentId ||
      selectedJd.department_id ||
      selectedJd.raw?.departmentId ||
      selectedJd.raw?.department_id ||
      "";

    const department =
      selectedJd.department ||
      selectedJd.departmentName ||
      selectedJd.department_name ||
      selectedJd.raw?.department ||
      selectedJd.raw?.departmentName ||
      selectedJd.raw?.department_name ||
      "";

    const description =
      selectedJd.description ||
      selectedJd.positionOverview ||
      selectedJd.position_overview ||
      selectedJd.raw?.description ||
      selectedJd.raw?.positionOverview ||
      selectedJd.raw?.position_overview ||
      "";

    const preferredSkillsSource =
      selectedJd.qualifications ||
      selectedJd.preferredSkills ||
      selectedJd.preferred_skills ||
      selectedJd.raw?.qualifications ||
      selectedJd.raw?.preferredSkills ||
      selectedJd.raw?.preferred_skills ||
      "";

    const selectedPositionTitle =
      selectedJd.roleTitle ||
      selectedJd.role_title ||
      selectedJd.documentTitle ||
      selectedJd.document_title ||
      positionTitle ||
      "";

    setForm((previous) => ({
      ...previous,

      jdId,
      jd_id: jdId,

      jdCode,
      jd_code: jdCode,

      documentTitle,
      document_title: documentTitle,

      positionTitle: selectedPositionTitle,

      departmentId,
      department,

      accountId: "",
      accountName: "",
      accountGhlName: "",

      description: description || "",

      descriptionPlainText: htmlToPlainText(description || ""),

      preferredSkills: htmlToPlainText(preferredSkillsSource),

      jdLinkStatus: isRelinkMode
        ? "Unlinked from JD"
        : previous.jdLinkStatus || previous.jd_link_status || "Linked",

      jd_link_status: isRelinkMode
        ? "Unlinked from JD"
        : previous.jd_link_status || previous.jdLinkStatus || "Linked",
    }));

    if (isRelinkMode) {
      setRelinkJdSelected(Boolean(jdId));
    }
  }

  function handleDepartmentChange(departmentId, selectedOption) {
    if (fieldsDisabled) {
      return;
    }

    const department = selectedOption?.raw;

    setForm((previous) => ({
      ...previous,

      departmentId,

      department:
        department?.departmentName ||
        department?.name ||
        selectedOption?.label ||
        "",

      accountId: "",
      accountName: "",
      accountGhlName: "",
    }));
  }

  function handleAccountChange(accountId, selectedOption) {
    if (fieldsDisabled) {
      return;
    }

    const account = selectedOption?.raw;

    setForm((previous) => ({
      ...previous,

      accountId,

      accountName:
        account?.accountName || account?.name || selectedOption?.label || "",

      accountGhlName:
        account?.accountGhlName ||
        account?.account_ghl_name ||
        selectedOption?.description ||
        "",
    }));
  }

  function handleFormSubmit(event) {
    if (isRelinkMode && !relinkJdSelected) {
      event.preventDefault();
      return;
    }

    if (isEditMode && !isRelinkMode && !editEnabled) {
      event.preventDefault();
      return;
    }

    onSubmit?.(event);
  }

  function handleApprove() {
    if (approvalActionsDisabled) {
      return;
    }

    onApproveRequest?.(position || form);
  }

  function handleReject() {
    if (approvalActionsDisabled) {
      return;
    }

    onRejectRequest?.(position || form);
  }

  const approvedJdSelector = (
    <DropdownField
      label="Select Job Description"
      required
      value={
        isRelinkMode
          ? relinkJdSelected
            ? form.positionTitle
            : ""
          : form.positionTitle
      }
      displayValue={
        isRelinkMode
          ? relinkJdSelected
            ? form.positionTitle
            : ""
          : form.positionTitle
      }
      onChange={handleApprovedJdPositionChange}
      options={approvedJdDropdownOptions}
      placeholder={
        isRelinkMode
          ? "Select a new approved Job Description"
          : "Select approved job description"
      }
      searchPlaceholder="Search approved job description..."
      emptyMessage="No other approved Job Descriptions found."
      disabled={jdSelectorDisabled}
      searchable
      excludeSelectedOption={false}
      excludedOptionId=""
      boundaryRef={modalBodyRef}
      maxMenuHeight={260}
      zIndex="z-[190]"
      className={
        isRelinkMode
          ? "w-full [&>div]:!border-[#FF8A5B] [&>div]:hover:!border-[#FF8A5B] [&>div]:focus-within:!border-[#FF8A5B]"
          : ""
      }
    />
  );

  return (
    <div className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[10000] flex h-dvh items-center justify-center p-2 sm:p-4 font-jakarta bg-[#042C51]/60">
      <form
        id="available-position-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="available-position-modal-title"
        onSubmit={handleFormSubmit}
        onClick={(event) => event.stopPropagation()}
        className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-5xl 2xl:max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-[#F7F9FC] shadow-2xl font-jakarta"
      >
        <header className="shrink-0 bg-[#042C51] px-4 py-3 text-white sm:px-5 2xl:px-6 2xl:py-3.5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 2xl:gap-3">
              <div className="flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#FF5C28]">
                <BriefcaseBusiness className="h-4 w-4 text-[#FF5C28]" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex h-4.5 2xl:h-5 items-center rounded bg-[#FF5C28] px-2 text-[8.5px] font-extrabold uppercase leading-none text-white">
                    Position Dictionary
                  </span>

                  <span className="inline-flex h-4.5 2xl:h-5 items-center rounded border border-white/15 bg-white/10 px-2 text-[8.5px] font-extrabold uppercase leading-none text-slate-200">
                    {isRelinkMode
                      ? "Relink Required"
                      : isViewMode
                        ? "View Mode"
                        : isEditMode
                          ? "Edit Mode"
                          : "New Registration"}
                  </span>

                  {isRelinkMode && isForApproval ? (
                    <span className="inline-flex h-4.5 2xl:h-5 items-center rounded border border-amber-300/50 bg-amber-400/20 px-2 text-[8.5px] font-extrabold leading-none text-amber-200">
                      Pending HR Approval
                    </span>
                  ) : null}

                  {!isRelinkMode && isViewMode && isForApproval ? (
                    <span className="inline-flex h-4.5 2xl:h-5 items-center rounded border border-amber-300/50 bg-amber-400/20 px-2 text-[8.5px] font-extrabold leading-none text-amber-200">
                      Pending HR Approval
                    </span>
                  ) : null}

                  {!isRelinkMode && isViewMode && isApproved ? (
                    <span className="inline-flex h-4.5 2xl:h-5 items-center rounded border border-emerald-400/40 bg-emerald-500/20 px-2 text-[8.5px] font-extrabold leading-none text-emerald-200">
                      Approved
                    </span>
                  ) : null}

                  {!isRelinkMode && isViewMode && isRejected ? (
                    <span className="inline-flex h-4.5 2xl:h-5 items-center rounded border border-red-400/40 bg-red-500/20 px-2 text-[8.5px] font-extrabold leading-none text-red-200">
                      Rejected
                    </span>
                  ) : null}

                  {isRelinkMode ? (
                    <span className="inline-flex h-4.5 2xl:h-5 items-center rounded border border-amber-400/40 bg-amber-500/20 px-2 text-[8.5px] font-extrabold leading-none text-amber-200">
                      Unlinked from JD
                    </span>
                  ) : null}
                </div>

                <h2
                  id="available-position-modal-title"
                  className="mt-0.5 truncate text-sm sm:text-base 2xl:text-lg font-extrabold leading-tight text-white"
                >
                  {isRelinkMode
                    ? "Relink Available Position"
                    : isViewMode
                      ? "Available Position Details"
                      : isEditMode
                        ? "Edit Available Position"
                        : "Register Available Position"}
                </h2>

                <p className="mt-0.5 truncate text-[10px] sm:text-xs font-semibold leading-4 text-slate-300">
                  {isRelinkMode
                    ? "This position is disconnected from its Job Description. Select a new approved Job Description before continuing."
                    : isViewMode
                      ? "Review the linked Job Description, organizational mapping, and applicant visibility settings."
                      : "Link an approved JD, confirm the organizational mapping, and manage applicant visibility."}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {isRelinkMode ? (
                <button
                  type="submit"
                  disabled={isSaving || !relinkJdSelected}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E95324] disabled:cursor-not-allowed disabled:bg-[#6D7785] disabled:text-white/60 disabled:shadow-none active:scale-[0.98]"
                >
                  {isSaving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Link2 size={13} />
                  )}

                  {isSaving ? "Relinking..." : "Relink Job Description"}
                </button>
              ) : (
                <>
                  {showApprovalActions ? (
                    <>
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={approvalActionsDisabled}
                        className="inline-flex h-8.5 2xl:h-10 min-w-[92px] items-center justify-center gap-1.5 rounded-lg bg-[#00A878] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#00976D] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                      >
                        <CheckCircle2 size={14} strokeWidth={2} />
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={approvalActionsDisabled}
                        className="inline-flex h-8.5 2xl:h-10 min-w-[82px] items-center justify-center gap-1.5 rounded-lg bg-[#F00046] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#D9003F] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                      >
                        <XCircle size={14} strokeWidth={2} />
                        Reject
                      </button>
                    </>
                  ) : null}

                  {showEditButton ? (
                    <button
                      type="button"
                      onClick={handleEnableEdit}
                      disabled={isSaving}
                      className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E95324] disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
                    >
                      <Pencil size={13} />
                      Edit Position
                    </button>
                  ) : null}

                  {!isViewMode ? (
                    <>
                      {isEditMode ? (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                        >
                          <X size={13} />
                          Cancel Edit
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={onReset}
                        disabled={isSaving}
                        className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                      >
                        <RotateCcw size={13} />
                        Reset
                      </button>

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E95324] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
                      >
                        {isSaving ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Save size={13} />
                        )}

                        {isSaving
                          ? "Saving..."
                          : isEditMode
                            ? "Update Position"
                            : "Save Position"}
                      </button>
                    </>
                  ) : null}
                </>
              )}

              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                aria-label="Close Available Position modal"
                className="sibs-modal-close-btn"
                title="Close"
              >
                <X size={17} strokeWidth={2} />
              </button>
            </div>
          </div>
        </header>

        <div
          ref={modalBodyRef}
          data-dropdown-boundary="true"
          className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F7F9FC] p-3 sm:p-4 2xl:p-5"
        >
          <div className="space-y-4">
            <PositionFormSection
              title="Approved JD Link"
              subtitle={
                isRelinkMode
                  ? "This position no longer has a valid Job Description. Select a new approved Job Description to restore the link."
                  : "Select an approved Job Description and retain its canonical document identifiers."
              }
              icon={FileCheck2}
            >
              {isRelinkMode ? (
                <section className="mb-3 rounded-xl border border-[#F5B942] bg-[#FFF9EE] p-3 sm:p-3.5">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-[#FFF0C7] text-[#D97706]">
                      <AlertTriangle size={15} strokeWidth={2.2} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-extrabold text-[#7A3B12]">
                        New Job Description Required
                      </h3>

                      <p className="mt-0.5 text-[10px] sm:text-xs font-semibold leading-relaxed text-[#A15C24]">
                        This position was preserved when its Job Description was
                        removed. Select a new approved Job Description to restore
                        the link without changing its approval status or position
                        details.
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 w-full rounded-xl border border-[#FF8A5B] bg-white p-2 sm:p-2.5 shadow-[0_0_0_3px_rgba(255,92,40,0.08)]">
                    {approvedJdSelector}
                  </div>
                </section>
              ) : (
                <div className="mb-3">{approvedJdSelector}</div>
              )}

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

                <div>
                  <FieldLabel>JD ID</FieldLabel>

                  <input
                    value={form.jdId || form.jd_id || ""}
                    readOnly
                    disabled={fieldsDisabled}
                    className={INPUT_CLASS}
                    placeholder="Approved JD database ID"
                  />
                </div>

                <div>
                  <FieldLabel>JD Code</FieldLabel>

                  <input
                    value={form.jdCode || form.jd_code || ""}
                    readOnly
                    disabled={fieldsDisabled}
                    className={INPUT_CLASS}
                    placeholder="Approved JD code"
                  />
                </div>

                <div>
                  <FieldLabel required>Position Title</FieldLabel>

                  <input
                    value={form.positionTitle || ""}
                    onChange={(event) =>
                      updateField("positionTitle", event.target.value)
                    }
                    disabled={fieldsDisabled}
                    className={INPUT_CLASS}
                    placeholder="Canonical position title"
                  />
                </div>

                <div className="lg:col-span-3">
                  <FieldLabel>Document Title</FieldLabel>

                  <input
                    value={form.documentTitle || form.document_title || ""}
                    readOnly
                    disabled={fieldsDisabled}
                    className={INPUT_CLASS}
                    placeholder="Approved JD document title"
                  />
                </div>
              </div>
            </PositionFormSection>

            <PositionFormSection
              title="Organizational Mapping"
              subtitle="Map the position to a database department, account, and applicant-facing site."
              icon={Building2}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DropdownField
                  label="Department"
                  required
                  value={form.departmentId}
                  displayValue={form.department}
                  onChange={handleDepartmentChange}
                  options={departmentDropdownOptions}
                  placeholder="Select department"
                  searchPlaceholder="Search departments..."
                  emptyMessage="No departments found."
                  disabled={fieldsDisabled}
                  searchable
                  boundaryRef={modalBodyRef}
                  zIndex="z-[180]"
                />

                <DropdownField
                  label="Account"
                  required
                  value={form.accountId}
                  displayValue={form.accountName}
                  onChange={handleAccountChange}
                  options={accountDropdownOptions}
                  placeholder={
                    form.departmentId
                      ? "Select account"
                      : "Select department first"
                  }
                  searchPlaceholder="Search accounts..."
                  emptyMessage="No accounts found for this department."
                  disabled={fieldsDisabled || !form.departmentId}
                  searchable
                  boundaryRef={modalBodyRef}
                  zIndex="z-[170]"
                />

                <div>
                  <FieldLabel>Account GHL Name</FieldLabel>

                  <input
                    value={form.accountGhlName || ""}
                    onChange={(event) =>
                      updateField("accountGhlName", event.target.value)
                    }
                    disabled={fieldsDisabled}
                    className={INPUT_CLASS}
                    placeholder="Account GHL name"
                  />
                </div>

                <DropdownField
                  label="Location / Site"
                  required
                  value={form.locationSite}
                  onChange={(value) => updateField("locationSite", value)}
                  options={locationDropdownOptions}
                  placeholder="Select location / site"
                  disabled={fieldsDisabled}
                  boundaryRef={modalBodyRef}
                  zIndex="z-[160]"
                />
              </div>
            </PositionFormSection>

            <PositionFormSection
              title="Position Information"
              subtitle="Maintain the role description, searchable skills, status, and internal remarks."
              icon={Settings2}
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FieldLabel>Description</FieldLabel>

                  <div
                    aria-disabled={fieldsDisabled}
                    className={
                      fieldsDisabled
                        ? "pointer-events-none select-none opacity-60"
                        : ""
                    }
                  >
                    <RichTextEditor
                      id="available-position-description"
                      value={form.description || ""}
                      onChange={(html, plainText) => {
                        if (fieldsDisabled) {
                          return;
                        }

                        setForm((previous) => ({
                          ...previous,

                          description: html,

                          descriptionPlainText: plainText,
                        }));
                      }}
                      placeholder="Describe the position and its operational purpose."
                      minHeight={120}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>Preferred Skills</FieldLabel>

                  <textarea
                    rows={3}
                    value={form.preferredSkills || ""}
                    onChange={(event) =>
                      updateField("preferredSkills", event.target.value)
                    }
                    disabled={fieldsDisabled}
                    placeholder="Separate skills with commas, semicolons, or new lines."
                    className={TEXTAREA_CLASS}
                  />
                </div>

                <DropdownField
                  label="Status"
                  required
                  value={form.status}
                  onChange={(value) => updateField("status", value)}
                  options={statusDropdownOptions}
                  placeholder="Select status"
                  disabled={fieldsDisabled}
                  boundaryRef={modalBodyRef}
                  zIndex="z-[150]"
                />

                <div>
                  <FieldLabel>Remarks</FieldLabel>

                  <textarea
                    rows={3}
                    value={form.remarks || ""}
                    onChange={(event) =>
                      updateField("remarks", event.target.value)
                    }
                    disabled={fieldsDisabled}
                    placeholder="Internal notes only."
                    className={`${TEXTAREA_CLASS} min-h-10`}
                  />
                </div>
              </div>
            </PositionFormSection>
          </div>
        </div>

        <footer className="shrink-0 border-t border-[#DCE6F1] bg-white px-4 py-3 sm:px-5 2xl:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 text-[10px] 2xl:text-[11px] font-semibold text-[#667085]">
              <span>
                Position ID:{" "}
                <span className="font-extrabold text-[#042C51] font-mono">
                  {displayPositionId}
                </span>
              </span>

              <span className="mx-1.5">•</span>

              <span>
                Last Updated:{" "}
                <span className="font-extrabold text-[#042C51]">
                  {lastUpdated ? formatDate(lastUpdated) : "—"}
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center rounded-lg border border-[#DCE6F1] bg-[#F2F6FA] px-4 sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#BFCFDE] hover:bg-[#EAF0F6] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
