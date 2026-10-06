import React, { createContext, useContext, useMemo } from "react";
import { CheckCircle2, MessageSquareText, PencilLine } from "lucide-react";

import SibsLogo from "../../../../../assets/SiBS_Logo.svg";
import { formatDate, getTodayDate } from "../../../FormatDateTime";
import { SelectDropdown, DatePicker, StatusBadge } from "../../../../ui";

const RecordInfoRevisionContext = createContext(null);

function normalizeToDateInputValue(value) {
  if (!value) return "";
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}



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

  locationOptions = [],

  approvalPage = false,

  revisionMode = false,

  onOpenRevision,

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

      "effectivityDate",

      "effectivity_date",

    ]) ||

    (revisionMode ? getTodayDate() : "");



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



  const location = getFirstManualValue(item, [

    "location",

    "site",

    "siteName",

    "site_name",

  ]);



  const workSetup = getFirstManualValue(item, [

    "locationWorkSetup",

    "location_work_setup",

    "workSetup",

    "work_setup",

  ]);



  const draftLocationWorkSetup =

    recordInfoDraft.locationWorkSetup ||

    recordInfoDraft.location_work_setup ||

    "";



  const locationWorkSetup =

    draftLocationWorkSetup ||

    (location &&

    workSetup &&

    !workSetup.toLowerCase().includes(location.toLowerCase())

      ? `${location} (${workSetup})`

      : workSetup || location || "—");



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

  const handleOpenRevision = onOpenRevision
    ? () => onOpenRevision(item, "recordInformation")
    : null;

  return (

    <RecordInfoRevisionContext.Provider value={handleOpenRevision}>

    <div

      className={`jd-manual-header-wrapper w-full pb-1 ${

        approvalPage

          ? "selection:bg-amber-100 selection:text-sibs-navy"

          : ""

      }`}

    >

      {/* Dedicated mobile/tablet layout */}

      <div className="jd-manual-header-mobile overflow-hidden border-2 border-black bg-white text-black lg:hidden print:hidden">

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

            label="LOCATION / WORK SETUP:"

            value={recordInfoDraft.locationWorkSetup || locationWorkSetup || ""}

            displayValue={locationWorkSetup}

            inputType={revisionMode ? "select" : "text"}

            revisionMode={revisionMode}

            options={locationOptions}

            editable={editingRecordInfo && revisionMode}

            comments={getRecordFieldComments?.(locationWorkSetup)}

            onChange={(value) => onChange?.("locationWorkSetup", value)}

            variant="manualFooter"

            className="border-b-2 border-r-2 border-black"

          />



          <RecordInfoDocumentCell

            label="PREPARED FOR:"

            value={

              recordInfoDraft.accountId ||

              recordInfoDraft.preparedForId ||

              preparedFor ||

              ""

            }

            displayValue={preparedFor}

            inputType="select"

            revisionMode={revisionMode}

            options={accountOptions}

            editable={editingRecordInfo}

            comments={getRecordFieldComments?.(preparedFor)}

            onChange={(value) =>

              onChange?.("accountId", value)

            }

            variant="manualFooter"

            className="border-b-2 border-black"

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

          />



          <RecordInfoDocumentCell

            label="APPROVED BY:"

            value={approvedBy}

            editable={false}

            comments={getRecordFieldComments?.(approvedBy)}

            variant="manualFooter"

            className="col-span-2 border-t-2 border-black"

          />



        </div>

      </div>



      {/* Original desktop/Paged.js/print layout */}

      <div className="jd-manual-header-desktop hidden overflow-x-auto lg:block print:block">

        <div
          className="jd-manual-header-grid grid min-w-[920px] overflow-hidden border-2 border-black bg-white text-black print:min-w-0"
          style={{ gridTemplateColumns: "210px minmax(0, 1fr)" }}
        >

          <div className="jd-manual-header-logo-column flex min-h-[320px] flex-col items-center justify-center border-r-2 border-black px-4 py-4 text-center">

            <img

              src={SibsLogo}

              alt="SiBS Logo"

              className="jd-manual-header-logo h-auto w-full max-w-[180px] object-contain"

            />



            <p className="jd-manual-issuance mt-12 w-full text-center text-base font-medium text-black">

              Manual Issuance #1

            </p>

          </div>



          <div className="min-w-0">

            <div
              className="jd-manual-header-main-row jd-manual-title-row grid border-b-2 border-black"
              style={{ gridTemplateColumns: "minmax(0, 1fr) 185px" }}
            >

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



            <div
              className="jd-manual-header-main-row jd-manual-document-title-row grid border-b-2 border-black"
              style={{ gridTemplateColumns: "minmax(0, 1fr) 185px" }}
            >

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



            <div
              className="jd-manual-header-footer-row grid"
              style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
            >

              <RecordInfoDocumentCell

                label="LOCATION / WORK SETUP:"

                value={recordInfoDraft.locationWorkSetup || locationWorkSetup || ""}

                displayValue={locationWorkSetup}

                inputType={revisionMode ? "select" : "text"}

                revisionMode={revisionMode}

                options={locationOptions}

                editable={editingRecordInfo && revisionMode}

                comments={getRecordFieldComments?.(locationWorkSetup)}

                onChange={(value) => onChange?.("locationWorkSetup", value)}

                variant="manualFooter"

                className="border-r-2 border-black"

              />



              <RecordInfoDocumentCell

                label="PREPARED FOR:"

                value={

                  recordInfoDraft.accountId ||

                  recordInfoDraft.preparedForId ||

                  preparedFor ||

                  ""

                }

                displayValue={preparedFor}

                inputType="select"

                revisionMode={revisionMode}

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

              />



              <RecordInfoDocumentCell

                label="APPROVED BY:"

                value={approvedBy}

                editable={false}

                comments={getRecordFieldComments?.(approvedBy)}

                variant="manualFooter"

                className="col-span-4 border-t-2 border-black"

              />



            </div>

          </div>

        </div>

      </div>

    </div>

    </RecordInfoRevisionContext.Provider>

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

  revisionMode = false,

}) {

  const onOpenRevision = useContext(RecordInfoRevisionContext);

  const finalDisplayValue = displayValue || value || "—";

  const hasComments = Array.isArray(comments) && comments.length > 0;

  const firstComment = comments?.[0];
  const hasActiveComment = hasComments && comments.some(
    (comment) => Boolean(comment?.__revisionUiActive),
  );
  const allCommentsAddressed = hasComments && comments.every(
    (comment) => Boolean(comment?.__revisionUiAddressed),
  );



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

      ? "text-lg font-extrabold leading-7 tracking-[-0.01em] text-sibs-navy sm:text-[22px] sm:leading-8"

      : variant === "primary"

        ? "mt-3 text-sm font-extrabold leading-6 text-sibs-text-secondary sm:text-[15px]"

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

                    : "mt-2 text-sm font-extrabold leading-6 text-sibs-text-secondary";



  const labelColorClass =

    isManualVariant

      ? hasActiveComment

        ? "text-orange-700"

        : allCommentsAddressed

          ? "text-emerald-700"

          : hasComments

            ? "text-amber-700"

            : "text-black"

      : hasActiveComment

        ? "text-orange-700"

        : allCommentsAddressed

          ? "text-emerald-700"

          : hasComments

            ? "text-amber-700"

            : "text-sibs-text-secondary";



  const cellBgClass = hasActiveComment
    ? "bg-orange-50/80 ring-2 ring-inset ring-orange-300 z-10"
    : allCommentsAddressed
      ? "bg-emerald-50/45"
      : hasComments
        ? "bg-amber-50/70"
        : "bg-transparent";



  return (

    <div

      tabIndex={hasComments ? 0 : undefined}

      className={`record-info-${variant} jd-touch-comment-target group relative text-left transition ${cellBgClass} ${cellSizeClass} ${className}`}

    >

      <div className="flex w-full items-start justify-between gap-2 text-left">

        <p

          className={`min-w-0 break-words text-left text-[10px] font-extrabold uppercase leading-4 tracking-wide ${labelColorClass}`}

        >

          {label}

        </p>

        {hasComments && (
          <span
            title={
              allCommentsAddressed
                ? "Reviewer comment addressed"
                : hasActiveComment
                  ? "Selected reviewer comment"
                  : `${comments.length} reviewer comment${comments.length === 1 ? "" : "s"}`
            }
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase ${
              allCommentsAddressed
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : hasActiveComment
                  ? "border-orange-300 bg-orange-100 text-orange-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {allCommentsAddressed ? (
              <CheckCircle2 size={10} />
            ) : (
              <MessageSquareText size={10} />
            )}
            {hasActiveComment ? "Selected" : comments.length}
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
          <div
            className={`w-full ${
              variant === "title" || variant === "manualDocumentTitle"
                ? "mt-3 sm:mt-4"
                : isManualVariant
                  ? "!mt-1.5"
                  : "mt-3"
            }`}
          >
            <SelectDropdown
              value={value || ""}
              placeholder={revisionMode ? "—" : `Select ${label}`}
              hideLabel={true}
              options={
                value && !options.some((opt) => String(opt?.value ?? opt) === String(value))
                  ? [{ value: String(value), label: displayValue || String(value) }, ...options]
                  : options
              }
              onChange={(selectedValue) => onChange?.(selectedValue)}
              buttonClassName={`w-full text-left font-bold text-sibs-navy ${
                variant === "title" || variant === "manualDocumentTitle"
                  ? "sm:h-12 sm:text-base rounded-lg border border-sibs-border px-3.5"
                  : isManualVariant
                    ? "!h-9 !rounded-md !text-xs !border-sibs-border px-2"
                    : "h-11 rounded-lg border border-sibs-border px-3.5 text-sm"
              }`}
            />
          </div>

        ) : inputType === "date" ? (
          <div className="w-full min-w-0">
            <DatePicker
              value={normalizeToDateInputValue(value)}
              onChange={(nextValue) => onChange?.(nextValue)}
              placeholder={`Select ${label.toLowerCase()}`}
              buttonClassName={`w-full text-left font-bold text-sibs-navy ${
                variant === "title" || variant === "manualDocumentTitle"
                  ? "mt-3 sm:h-12 sm:text-base rounded-lg border border-sibs-border px-3.5"
                  : isManualVariant
                    ? "!mt-1.5 !h-9 !rounded-md !text-xs !border-sibs-border px-2"
                    : "mt-3 h-11 rounded-lg border border-sibs-border px-3.5 text-sm"
              }`}
            />
          </div>
        ) : (
          <input
            type={inputType}
            value={value || ""}
            onChange={(event) => onChange?.(event.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            className={`mt-3 h-11 w-full min-w-0 rounded-lg border border-sibs-border bg-white px-3.5 text-left text-sm font-bold text-sibs-navy outline-none transition placeholder:font-medium placeholder:text-sibs-tertiary-5 focus:border-sibs-orange focus:ring-4 focus:ring-sibs-orange/10 ${
              variant === "title" || variant === "manualDocumentTitle"
                ? "sm:h-12 sm:text-base"
                : isManualVariant
                  ? "!mt-1.5 !h-9 !rounded-md !text-xs"
                  : ""
            }`}
          />
        )

      ) : variant === "title" ? (

        <div className="relative mt-4 w-full pl-4 text-left">

          <span className="absolute bottom-1 left-0 top-1 w-[3px] rounded-full bg-sibs-primary-1" />



          <p

            title={finalDisplayValue}

            className={`block w-full min-w-0 break-words text-left ${valueTextClass} ${

              hasActiveComment
                ? "text-orange-900"
                : allCommentsAddressed
                  ? "text-emerald-800"
                  : hasComments
                    ? "text-amber-800"
                    : ""

            } ${valueClassName}`}

          >

            {finalDisplayValue}

          </p>

        </div>

      ) : (

        <p

          title={finalDisplayValue}

          className={`block w-full min-w-0 break-words text-left ${valueTextClass} ${

            hasActiveComment
              ? "text-orange-900"
              : allCommentsAddressed
                ? "text-emerald-800"
                : hasComments
                  ? "text-amber-800"
                  : ""

          } ${valueClassName}`}

        >

          {finalDisplayValue}

        </p>

      )}



      {hasComments && (

        <div
          className={`jd-touch-comment-popover pointer-events-none absolute left-3 right-3 top-[calc(100%-4px)] z-50 translate-y-1 rounded-xl border bg-white p-3 opacity-0 shadow-lg ring-1 ring-black/5 transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-2 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-2 group-focus-within:opacity-100 ${
            allCommentsAddressed
              ? "border-emerald-200"
              : hasActiveComment
                ? "border-orange-300"
                : "border-amber-200"
          }`}
        >

          <div className="mb-1 flex items-center justify-between gap-2">

            <p
              className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide ${
                allCommentsAddressed ? "text-emerald-700" : "text-orange-700"
              }`}
            >
              {allCommentsAddressed ? (
                <CheckCircle2 size={11} />
              ) : (
                <MessageSquareText size={11} />
              )}
              Reviewer Comment
            </p>

            <StatusBadge
              status={
                allCommentsAddressed
                  ? "Addressed"
                  : hasActiveComment
                    ? "Current"
                    : firstComment?.status || "Open"
              }
              className="shrink-0 whitespace-nowrap text-[9px] px-2 py-0.5"
            />

          </div>

          <p
            className={`text-xs font-semibold leading-5 ${
              allCommentsAddressed ? "text-emerald-800" : "text-orange-800"
            }`}
          >
            {firstComment?.comment || "No revision comment provided."}
          </p>

          {onOpenRevision && (
            <div className="mt-2.5 border-t border-amber-200/60 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenRevision();
                }}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-2.5 py-1.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-orange-700 active:scale-95"
              >
                <PencilLine size={13} />
                Revise Record Information
              </button>
            </div>
          )}

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
