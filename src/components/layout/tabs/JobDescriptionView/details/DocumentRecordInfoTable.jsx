import React from "react";

import SibsLogo from "../../../../../assets/SiBS_Logo.svg";
import { formatDate } from "../../../FormatDateTime";

function getFirstManualValue(source = {}, keys = []) {
  for (const key of keys) {
    const directValue = source?.[key];
    const rawValue = source?.raw?.[key];
    const value = directValue || rawValue;

    if (String(value || "").trim()) {
      return String(value).trim();
    }
  }

  return "";
}

function formatManualRevisionNumber(value = "") {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) return "—";

  if (/^\d+$/.test(cleanValue)) {
    return cleanValue.padStart(3, "0");
  }

  return cleanValue.toUpperCase();
}

function DocumentRecordInfoTable({
  item = {},
  recordInfoDraft = {},
  editingRecordInfo = false,
  getRecordFieldComments,
  onChange,
  accountOptions = [],
}) {
  const manualTitle =
    getFirstManualValue(item, [
      "manualTitle",
      "manual_title",
    ]) || "MASTER OPERATING MANUAL";

  const documentTitle =
    recordInfoDraft.documentTitle ||
    getFirstManualValue(item, [
      "documentTitle",
      "document_title",
    ]) ||
    "—";

  const documentCode =
    recordInfoDraft.jdCode ||
    getFirstManualValue(item, [
      "jdCode",
      "jd_code",
      "documentCode",
      "document_code",
    ]) ||
    "—";

  const revisionNumber = formatManualRevisionNumber(
    recordInfoDraft.currentVersion ||
      getFirstManualValue(item, [
        "currentVersion",
        "current_version",
        "revisionNo",
        "revision_no",
      ]),
  );

  const effectiveDate =
    recordInfoDraft.effectiveDate ||
    getFirstManualValue(item, [
      "effectiveDate",
      "effective_date",
    ]);

  const lastReviewed =
    recordInfoDraft.lastUpdated ||
    getFirstManualValue(item, [
      "lastUpdated",
      "last_updated",
      "updatedAt",
      "updated_at",
    ]);

  const preparedFor =
    recordInfoDraft.preparedFor ||
    getFirstManualValue(item, [
      "preparedFor",
      "prepared_for",
      "account",
      "accountName",
      "account_name",
    ]) ||
    "—";

  const preparedBy =
    recordInfoDraft.createdBy ||
    getFirstManualValue(item, [
      "createdBy",
      "created_by",
      "requestedBy",
      "requested_by",
      "preparedBy",
      "prepared_by",
    ]) ||
    "—";

  const reviewedBy =
    getFirstManualValue(item, [
      "reviewedBy",
      "reviewed_by",
      "reviewerName",
      "reviewer_name",
      "owner",
      "ownerName",
      "owner_name",
    ]) || "—";

  const approvedBy =
    getFirstManualValue(item, [
      "approverName",
      "approver_name",
      "approvedByName",
      "approved_by_name",
      "approvedBy",
      "approved_by",
    ]) || "—";

  return (
    <div className="jd-manual-header-wrapper w-full pb-1">
      {/* Dedicated mobile/tablet layout */}
      <div className="jd-manual-header-mobile overflow-hidden border-2 border-black bg-white text-black">
        <div className="jd-manual-mobile-logo-section flex flex-col items-center justify-center border-b-2 border-black px-4 py-5 text-center">
          <img
            src={SibsLogo}
            alt="SiBS Logo"
            className="jd-manual-mobile-logo h-auto w-full max-w-[230px] object-contain"
          />

          <p className="mt-4 text-sm font-bold text-black">
            Manual Issuance #1
          </p>
        </div>

        <RecordInfoDocumentCell
          label="MANUAL TITLE:"
          value={manualTitle}
          editable={false}
          comments={getRecordFieldComments?.(manualTitle)}
          variant="manualHero"
          className="jd-manual-mobile-full-row border-b-2 border-black"
        />

        <RecordInfoDocumentCell
          label="DOCUMENT TITLE:"
          value={recordInfoDraft.documentTitle || ""}
          displayValue={documentTitle}
          editable={editingRecordInfo}
          comments={getRecordFieldComments?.(documentTitle)}
          onChange={(value) => onChange?.("documentTitle", value)}
          variant="manualDocumentTitle"
          className="jd-manual-mobile-full-row border-b-2 border-black"
        />

        <div className="jd-manual-mobile-pair grid grid-cols-2 border-b-2 border-black">
          <RecordInfoDocumentCell
            label="DOCUMENT CODE"
            value={documentCode}
            editable={false}
            comments={getRecordFieldComments?.(documentCode)}
            variant="manualMeta"
            className="border-r-2 border-black"
          />

          <RecordInfoDocumentCell
            label="REVISION NUMBER"
            value={revisionNumber}
            editable={false}
            comments={getRecordFieldComments?.(revisionNumber)}
            variant="manualMeta"
          />
        </div>

        <div className="jd-manual-mobile-pair grid grid-cols-2 border-b-2 border-black">
          <RecordInfoDocumentCell
            label="EFFECTIVITY DATE"
            value={effectiveDate}
            displayValue={formatDate(effectiveDate)}
            inputType="date"
            editable={editingRecordInfo}
            comments={getRecordFieldComments?.(
              formatDate(effectiveDate),
            )}
            onChange={(value) =>
              onChange?.("effectiveDate", value)
            }
            variant="manualMeta"
            className="border-r-2 border-black"
          />

          <RecordInfoDocumentCell
            label="DATE OF LAST REVIEW"
            value={lastReviewed}
            displayValue={formatDate(lastReviewed)}
            inputType="date"
            editable={false}
            comments={getRecordFieldComments?.(
              formatDate(lastReviewed),
            )}
            variant="manualMeta"
          />
        </div>

        <div className="jd-manual-mobile-signatories grid grid-cols-2">
          <RecordInfoDocumentCell
            label="PREPARED FOR:"
            value={
              recordInfoDraft.accountId ||
              recordInfoDraft.preparedForId ||
              ""
            }
            displayValue={preparedFor}
            inputType="select"
            options={accountOptions}
            editable={editingRecordInfo}
            comments={getRecordFieldComments?.(preparedFor)}
            onChange={(value) =>
              onChange?.("accountId", value)
            }
            variant="manualFooter"
            className="border-b-2 border-r-2 border-black"
          />

          <RecordInfoDocumentCell
            label="PREPARED BY:"
            value={preparedBy}
            editable={false}
            comments={getRecordFieldComments?.(preparedBy)}
            variant="manualFooter"
            className="border-b-2 border-black"
          />

          <RecordInfoDocumentCell
            label="REVIEWED BY:"
            value={reviewedBy}
            editable={false}
            comments={getRecordFieldComments?.(reviewedBy)}
            variant="manualFooter"
            className="border-r-2 border-black"
          />

          <RecordInfoDocumentCell
            label="APPROVED BY:"
            value={approvedBy}
            editable={false}
            comments={getRecordFieldComments?.(approvedBy)}
            variant="manualFooter"
          />
        </div>
      </div>

      {/* Original desktop/Paged.js/print layout */}
      <div className="jd-manual-header-desktop overflow-x-auto">
        <div className="jd-manual-header-grid grid min-w-[920px] grid-cols-[210px_minmax(0,1fr)] overflow-hidden border-2 border-black bg-white text-black print:min-w-0">
          <div className="jd-manual-header-logo-column flex min-h-[256px] flex-col items-center justify-center border-r-2 border-black px-4 py-4 text-center">
            <img
              src={SibsLogo}
              alt="SiBS Logo"
              className="jd-manual-header-logo h-auto w-full max-w-[180px] object-contain"
            />

            <p className="jd-manual-issuance mt-12 text-base font-medium text-black">
              Manual Issuance #1
            </p>
          </div>

          <div className="min-w-0">
            <div className="jd-manual-header-main-row jd-manual-title-row grid grid-cols-[minmax(0,1fr)_185px] border-b-2 border-black">
              <RecordInfoDocumentCell
                label="MANUAL TITLE:"
                value={manualTitle}
                editable={false}
                comments={getRecordFieldComments?.(manualTitle)}
                variant="manualHero"
                className="min-h-[96px] border-r-2 border-black"
              />

              <div className="jd-manual-header-meta-pair jd-manual-title-meta-pair grid grid-rows-2">
                <RecordInfoDocumentCell
                  label="DOCUMENT CODE"
                  value={documentCode}
                  editable={false}
                  comments={getRecordFieldComments?.(documentCode)}
                  variant="manualMeta"
                  className="border-b-2 border-black"
                />

                <RecordInfoDocumentCell
                  label="REVISION NUMBER"
                  value={revisionNumber}
                  editable={false}
                  comments={getRecordFieldComments?.(revisionNumber)}
                  variant="manualMeta"
                />
              </div>
            </div>

            <div className="jd-manual-header-main-row jd-manual-document-title-row grid grid-cols-[minmax(0,1fr)_185px] border-b-2 border-black">
              <RecordInfoDocumentCell
                label="DOCUMENT TITLE:"
                value={recordInfoDraft.documentTitle || ""}
                displayValue={documentTitle}
                editable={editingRecordInfo}
                comments={getRecordFieldComments?.(documentTitle)}
                onChange={(value) =>
                  onChange?.("documentTitle", value)
                }
                variant="manualDocumentTitle"
                className="min-h-[96px] border-r-2 border-black"
              />

              <div className="jd-manual-header-meta-pair jd-manual-document-title-meta-pair grid grid-rows-2">
                <RecordInfoDocumentCell
                  label="EFFECTIVITY DATE"
                  value={effectiveDate}
                  displayValue={formatDate(effectiveDate)}
                  inputType="date"
                  editable={editingRecordInfo}
                  comments={getRecordFieldComments?.(
                    formatDate(effectiveDate),
                  )}
                  onChange={(value) =>
                    onChange?.("effectiveDate", value)
                  }
                  variant="manualMeta"
                  className="border-b-2 border-black"
                />

                <RecordInfoDocumentCell
                  label="DATE OF LAST REVIEW"
                  value={lastReviewed}
                  displayValue={formatDate(lastReviewed)}
                  inputType="date"
                  editable={false}
                  comments={getRecordFieldComments?.(
                    formatDate(lastReviewed),
                  )}
                  variant="manualMeta"
                />
              </div>
            </div>

            <div className="jd-manual-header-footer-row grid grid-cols-4">
              <RecordInfoDocumentCell
                label="PREPARED FOR:"
                value={
                  recordInfoDraft.accountId ||
                  recordInfoDraft.preparedForId ||
                  ""
                }
                displayValue={preparedFor}
                inputType="select"
                options={accountOptions}
                editable={editingRecordInfo}
                comments={getRecordFieldComments?.(preparedFor)}
                onChange={(value) =>
                  onChange?.("accountId", value)
                }
                variant="manualFooter"
                className="border-r-2 border-black"
              />

              <RecordInfoDocumentCell
                label="PREPARED BY:"
                value={preparedBy}
                editable={false}
                comments={getRecordFieldComments?.(preparedBy)}
                variant="manualFooter"
                className="border-r-2 border-black"
              />

              <RecordInfoDocumentCell
                label="REVIEWED BY:"
                value={reviewedBy}
                editable={false}
                comments={getRecordFieldComments?.(reviewedBy)}
                variant="manualFooter"
                className="border-r-2 border-black"
              />

              <RecordInfoDocumentCell
                label="APPROVED BY:"
                value={approvedBy}
                editable={false}
                comments={getRecordFieldComments?.(approvedBy)}
                variant="manualFooter"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecordInfoDocumentCell({
  label,
  value,
  displayValue,
  editable = false,
  inputType = "text",
  options = [],
  comments = [],
  onChange,
  className = "",
  valueClassName = "",
  variant = "default",
}) {
  const finalDisplayValue = displayValue || value || "—";
  const hasComments = Array.isArray(comments) && comments.length > 0;
  const firstComment = comments?.[0];

  const isManualVariant = String(variant || "").startsWith("manual");

  const cellSizeClass =
    variant === "title"
      ? "min-h-[124px] px-5 py-5 text-left sm:px-6 sm:py-6"
      : variant === "primary"
        ? "min-h-[104px] px-4 py-4 text-left sm:px-5 sm:py-5"
        : variant === "manualHero"
          ? "flex min-h-[126px] flex-col items-start justify-center px-3 py-3 text-left sm:px-4 sm:py-4"
          : variant === "manualDocumentTitle"
            ? "flex min-h-[134px] flex-col items-start justify-center px-3 py-3 text-left sm:px-4 sm:py-4"
            : variant === "manualMeta"
              ? "flex min-h-[62px] flex-col items-start justify-center px-2.5 py-2 text-left"
              : variant === "manualFooter"
                ? "flex min-h-[82px] flex-col items-start justify-start px-2.5 py-2 text-left"
                : variant === "manualTitle"
                  ? "flex min-h-[90px] flex-col items-start justify-center p-3 text-left sm:p-4"
                  : variant === "manual"
                    ? "flex min-h-0 flex-col items-start justify-center p-2 text-left"
                    : "min-h-[82px] px-4 py-3.5 text-left sm:px-5 sm:py-4";

  const valueTextClass =
    variant === "title"
      ? "text-lg font-extrabold leading-7 tracking-[-0.01em] text-[#101828] sm:text-[22px] sm:leading-8"
      : variant === "primary"
        ? "mt-3 text-sm font-extrabold leading-6 text-[#344054] sm:text-[15px]"
        : variant === "manualHero"
          ? "mt-3 block w-full text-left text-[22px] font-extrabold uppercase leading-7 tracking-tight text-black"
          : variant === "manualDocumentTitle"
            ? "mt-3 block w-full text-left text-[20px] font-extrabold uppercase leading-8 tracking-tight text-black"
            : variant === "manualMeta"
              ? "mt-2 block w-full text-left text-[12px] font-medium uppercase leading-5 text-black"
              : variant === "manualFooter"
                ? "mt-3 block w-full text-left text-[12px] font-medium uppercase leading-5 text-black"
                : variant === "manualTitle"
                  ? "mt-1 block w-full truncate whitespace-normal text-left text-lg font-bold uppercase leading-6 tracking-tight text-black"
                  : variant === "manual"
                    ? "mt-1 block w-full text-left text-xs font-bold uppercase text-black"
                    : "mt-2 text-sm font-extrabold leading-6 text-[#344054]";

  const labelColorClass =
    isManualVariant
      ? hasComments
        ? "text-amber-700"
        : "text-black"
      : hasComments
        ? "text-amber-700"
        : "text-[#315F8C]";

  const cellBgClass = hasComments ? "bg-amber-50" : "bg-transparent";

  return (
    <div
      tabIndex={hasComments ? 0 : undefined}
      className={`record-info-${variant} jd-touch-comment-target group relative text-left transition selection:bg-[#FFF3B8] selection:text-[#101828] ${cellBgClass} ${cellSizeClass} ${className}`}
    >
      <div className="flex w-full items-start justify-between gap-2 text-left">
        <p
          className={`min-w-0 break-words text-left text-[10px] font-extrabold uppercase leading-4 tracking-wide ${labelColorClass}`}
        >
          {label}
        </p>

        {hasComments && (
          <span className="shrink-0 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
            Needs revision
          </span>
        )}
      </div>

      {editable ? (
        inputType === "segmented" ? (
          <SegmentedOptionToggle
            value={value || "No"}
            options={options}
            onChange={onChange}
          />
        ) : inputType === "select" ? (
          <select
            value={value || ""}
            onChange={(event) => onChange?.(event.target.value)}
            className={`mt-3 h-11 w-full min-w-0 rounded-lg border border-[#C9D8E8] bg-white px-3.5 text-left text-sm font-bold text-[#1D2939] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${
              variant === "title" || variant === "manualDocumentTitle"
                ? "sm:h-12 sm:text-base"
                : isManualVariant
                  ? "!mt-2 !h-9 !rounded-md !text-xs"
                  : ""
            }`}
          >
            <option value="">Select {label}</option>

            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={inputType}
            value={value || ""}
            onChange={(event) => onChange?.(event.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            className={`mt-3 h-11 w-full min-w-0 rounded-lg border border-[#C9D8E8] bg-white px-3.5 text-left text-sm font-bold text-[#1D2939] outline-none transition placeholder:font-medium placeholder:text-[#90A4B7] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${
              variant === "title" || variant === "manualDocumentTitle"
                ? "sm:h-12 sm:text-base"
                : isManualVariant
                  ? "!mt-2 !h-9 !rounded-md !text-xs"
                  : ""
            }`}
          />
        )
      ) : variant === "title" ? (
        <div className="relative mt-4 w-full pl-4 text-left">
          <span className="absolute bottom-1 left-0 top-1 w-[3px] rounded-full bg-[#0D4676]" />

          <p
            title={finalDisplayValue}
            className={`block w-full min-w-0 break-words text-left ${valueTextClass} ${
              hasComments ? "text-amber-800" : ""
            } ${valueClassName}`}
          >
            {finalDisplayValue}
          </p>
        </div>
      ) : (
        <p
          title={finalDisplayValue}
          className={`block w-full min-w-0 break-words text-left ${valueTextClass} ${
            hasComments ? "text-amber-800" : ""
          } ${valueClassName}`}
        >
          {finalDisplayValue}
        </p>
      )}

      {hasComments && (
        <div className="jd-touch-comment-popover pointer-events-none absolute left-3 right-3 top-[calc(100%-4px)] z-50 translate-y-1 rounded-xl border border-orange-100 bg-white p-3 opacity-0 shadow-lg ring-1 ring-black/5 transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-2 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-2 group-focus-within:opacity-100">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-orange-700">
              Reviewer Comment
            </p>

            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-700">
              {firstComment?.status || "Open"}
            </span>
          </div>

          <p className="text-xs font-semibold leading-5 text-orange-800">
            {firstComment?.comment || "No revision comment provided."}
          </p>
        </div>
      )}
    </div>
  );
}

function SegmentedOptionToggle({ value = "", options = [], onChange }) {
  const safeOptions = Array.isArray(options) && options.length > 0
    ? options
    : [
        { value: "Yes", label: "Yes" },
        { value: "No", label: "No" },
      ];

  const selectedIndex = Math.max(
    safeOptions.findIndex(
      (option) =>
        String(option.value || "").toLowerCase() ===
        String(value || "").toLowerCase(),
    ),
    0,
  );

  return (
    <div className="sibs-profile-tab-panel mt-3 h-11 w-full min-w-0 overflow-hidden rounded-xl border border-sibs-tertiary-9 bg-white p-1 shadow-sm">
      <div
        className="relative grid h-full"
        style={{
          gridTemplateColumns: `repeat(${safeOptions.length}, minmax(0, 1fr))`,
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-0 rounded-[10px] bg-sibs-primary-1 shadow-sm transition-transform duration-200 ease-out will-change-transform"
          style={{
            width: `${100 / safeOptions.length}%`,
            transform: `translateX(${selectedIndex * 100}%)`,
          }}
        />

        {safeOptions.map((option) => {
          const isSelected =
            String(value || "").toLowerCase() ===
            String(option.value || "").toLowerCase();

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange?.(option.value)}
              aria-pressed={isSelected}
              className={`relative z-10 inline-flex h-full items-center justify-center rounded-[10px] px-3 text-sm font-extrabold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sibs-primary-1/10 active:scale-[0.98] ${
                isSelected
                  ? "text-white"
                  : "text-sibs-primary-1 hover:bg-sibs-tertiary-10/70 hover:text-sibs-primary-1"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export {
  RecordInfoDocumentCell,
  SegmentedOptionToggle,
};

export default DocumentRecordInfoTable;
