import React from "react";
import { PencilLine, SquarePen } from "lucide-react";

import { normalizeJdStatus } from "../../../../lib/utils/NormalizeJDStatus";
import DesiredCompetenciesViewTable from "../../../tables/jobDescription/DesiredCompetenciesViewTable";
import {
  detailsResponsiveAuditStyles,
} from "./details/detailsStyles";
import useJobDescriptionDetailsController from "../../../../hooks/jobDescription/useJobDescriptionDetailsController";
import DetailArticleSection from "./details/DetailArticleSection";
import DocumentRecordInfoTable from "./details/DocumentRecordInfoTable";
import PreferredPersonalityTypeSection from "./details/PreferredPersonalityTypeSection";
import RevisionCommentModal from "./details/RevisionCommentModal";

const Details = ({
  onOpenRevision,
  hasEditedChanges = false,
  onEditedChange,
  editedChangeDetails = [],
  setEditedChangeDetails,
  onRevisionDraftChange,
  approvalPage = false,
}) => {
  const {
    canManageJdDetails,
    cancelEditSection,
    cancelRecordInfoEdit,
    closeCommentModal,
    commentModal,
    competencyDrafts,
    disableCommentBecauseEdited,
    disableEditBecauseCommented,
    editableContent,
    editingDraft,
    editingRecordInfo,
    editingSection,
    getCommentDisabledTitle,
    getEditDisabledTitle,
    getRecordFieldComments,
    getSectionComments,
    handleCompetenciesChange,
    handleRecordInfoChange,
    isCompactDocumentView,
    isPagedPreviewLoading,
    item,
    openSectionComment,
    mobilePagedOutputRef,
    pagedOutputRef,
    pagedPreviewScale,
    pagedPreviewViewportRef,
    pagedSourceRef,
    recordDropdownOptions,
    recordInfoDraft,
    saveEditSection,
    saveRecordInfoEdit,
    saveRevisionComment,
    setCommentModal,
    setEditingDraft,
    setEditingRecordInfo,
    startEditSection,
  } = useJobDescriptionDetailsController({
    hasEditedChanges,
    onEditedChange,
    editedChangeDetails,
    setEditedChangeDetails,
    onRevisionDraftChange,
    approvalPage,
  });

  return (
    <article
      ref={
        approvalPage
          ? undefined
          : pagedPreviewViewportRef
      }
      style={
        approvalPage
          ? undefined
          : {
              "--jd-page-scale":
                pagedPreviewScale,
            }
      }
      className={
        approvalPage
          ? "jd-details-document mx-auto w-full max-w-[1100px] space-y-6 overflow-visible bg-white py-5 text-[#1D2939] shadow-[0_18px_55px_rgba(15,23,42,0.14)] sm:space-y-8 sm:py-7 sm:shadow-[0_24px_70px_rgba(15,23,42,0.18)] lg:min-h-[1056px] lg:py-8 print:shadow-none"
          : "jd-details-document jd-details-paged-preview mx-auto w-full text-[#1D2939]"
      }
    >
      <style>{detailsResponsiveAuditStyles}</style>

      {!approvalPage &&
        isPagedPreviewLoading && (
          <div className="jd-paged-loading">
            Preparing document pages...
          </div>
        )}

      <div
        ref={pagedSourceRef}
        className={
          approvalPage
            ? ""
            : "jd-paged-source space-y-8 bg-white"
        }
        aria-hidden={!approvalPage}
      >
      {normalizeJdStatus(item.jdStatus) === "For Revision" && (
        <section data-print-hide className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-amber-700">
                Revision Required
              </h3>

              <p className="mt-2 text-sm font-medium leading-6 text-amber-700/90">
                This job description needs revision before it can be treated as
                sourcing-ready.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenRevision?.(item)}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700 md:w-auto"
            >
              <PencilLine size={16} />
              Revise Job Description
            </button>
          </div>
        </section>
      )}

      <section className="relative isolate overflow-visible bg-white pb-6 sm:pb-8">
        {(approvalPage && canManageJdDetails) ||
        getSectionComments("recordInformation").length > 0 ? (
          <div
            data-print-hide
            className="jd-details-section-header mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {getSectionComments("recordInformation").length > 0 && (
                <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-700">
                  {getSectionComments("recordInformation").length} record
                  information comment
                  {getSectionComments("recordInformation").length > 1
                    ? "s"
                    : ""}
                </span>
              )}
            </div>

            {approvalPage && canManageJdDetails && (
              <div className="jd-mobile-actions-row flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                {!editingRecordInfo ? (
                  <>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        if (disableEditBecauseCommented) return;
                        setEditingRecordInfo(true);
                      }}
                      disabled={disableEditBecauseCommented}
                      title={getEditDisabledTitle(
                        "Edit manual record information.",
                      )}
                      className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition sm:flex-none ${
                        disableEditBecauseCommented
                          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                          : "border-[#D7DEE8] bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <SquarePen size={14} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() =>
                        openSectionComment(
                          "recordInformation",
                          "Manual Record Information",
                        )
                      }
                      disabled={disableCommentBecauseEdited}
                      title={getCommentDisabledTitle(
                        "Add a record-information revision comment.",
                      )}
                      className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition sm:flex-none ${
                        disableCommentBecauseEdited
                          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                          : "border-blue-100 bg-blue-50 text-sibs-primary-1 hover:bg-blue-100"
                      }`}
                    >
                      <PencilLine size={14} />
                      Add Comment
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={cancelRecordInfoEdit}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-3 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] sm:flex-none"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={saveRecordInfoEdit}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-sibs-primary-1 px-3 text-xs font-extrabold text-white transition hover:opacity-90 sm:flex-none"
                    >
                      Save
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : null}

        <div
          className={
            approvalPage
              ? ""
              : "jd-paged-running-header"
          }
        >
          <DocumentRecordInfoTable
            item={item}
            recordInfoDraft={recordInfoDraft}
            editingRecordInfo={editingRecordInfo}
            getRecordFieldComments={getRecordFieldComments}
            onChange={handleRecordInfoChange}
            accountOptions={recordDropdownOptions.accounts}
          />
        </div>
      </section>

      <section className="jd-paged-document-body space-y-7">
        <DetailArticleSection
          sectionKey="description"
          title="Position Overview"
          value={editableContent.description}
          emptyText="No Position Overview provided."
          comments={getSectionComments("description")}
          onAddComment={openSectionComment}
          isEditing={editingSection === "description"}
          editingDraft={editingDraft}
          setEditingDraft={setEditingDraft}
          onStartEdit={startEditSection}
          onCancelEdit={cancelEditSection}
          onSaveEdit={saveEditSection}
          disableEdit={disableEditBecauseCommented}
          disableComment={disableCommentBecauseEdited}
          canManageJdDetails={canManageJdDetails}
          approvalPage={approvalPage}
        />

        <DetailArticleSection
          sectionKey="responsibilities"
          title="Duties & Responsibilities"
          value={editableContent.responsibilities}
          emptyText="No responsibilities provided."
          comments={getSectionComments("responsibilities")}
          onAddComment={openSectionComment}
          isEditing={editingSection === "responsibilities"}
          editingDraft={editingDraft}
          setEditingDraft={setEditingDraft}
          onStartEdit={startEditSection}
          onCancelEdit={cancelEditSection}
          onSaveEdit={saveEditSection}
          disableEdit={disableEditBecauseCommented}
          disableComment={disableCommentBecauseEdited}
          canManageJdDetails={canManageJdDetails}
          approvalPage={approvalPage}
        />

        <DetailArticleSection
          sectionKey="qualifications"
          title="Qualifications & Characteristics"
          value={editableContent.qualifications}
          emptyText="No qualifications provided."
          comments={getSectionComments("qualifications")}
          onAddComment={openSectionComment}
          isEditing={editingSection === "qualifications"}
          editingDraft={editingDraft}
          setEditingDraft={setEditingDraft}
          onStartEdit={startEditSection}
          onCancelEdit={cancelEditSection}
          onSaveEdit={saveEditSection}
          disableEdit={disableEditBecauseCommented}
          disableComment={disableCommentBecauseEdited}
          canManageJdDetails={canManageJdDetails}
          approvalPage={approvalPage}
        />

        <PreferredPersonalityTypeSection
          value={editableContent.personalityType}
          comments={getSectionComments("personalityType")}
          approvalPage={approvalPage}
          canManageJdDetails={canManageJdDetails}
          disableEdit={disableEditBecauseCommented}
          disableComment={disableCommentBecauseEdited}
          isEditing={editingSection === "personalityType"}
          editingDraft={editingDraft}
          setEditingDraft={setEditingDraft}
          onStartEdit={() => startEditSection("personalityType")}
          onCancelEdit={cancelEditSection}
          onSaveEdit={() => saveEditSection("personalityType")}
          onAddComment={(options = {}) =>
            openSectionComment(
              "personalityType",
              "Preferred Personality Type",
              options,
            )
          }
        />

        <div className="jd-competencies-mobile-fix">
          <DesiredCompetenciesViewTable
            competencies={competencyDrafts}
            comments={getSectionComments("competencies")}
            onAddComment={openSectionComment}
            disableEdit={disableEditBecauseCommented}
            disableComment={disableCommentBecauseEdited}
            canManageActions={approvalPage && canManageJdDetails}
            onEditedChange={onEditedChange}
            onCompetenciesChange={handleCompetenciesChange}
          />
        </div>
      </section>



      </div>

      {!approvalPage && (
        <>
          <div
            ref={pagedOutputRef}
            className={`jd-paged-output jd-desktop-paged-output ${
              !isCompactDocumentView &&
              isPagedPreviewLoading
                ? "pointer-events-none opacity-0"
                : "opacity-100"
            }`}
          />

          <div
            ref={mobilePagedOutputRef}
            className={`jd-mobile-paged-output ${
              isCompactDocumentView &&
              isPagedPreviewLoading
                ? "pointer-events-none opacity-0"
                : "opacity-100"
            }`}
          />
        </>
      )}

      <RevisionCommentModal
        approvalPage={approvalPage}
        commentModal={commentModal}
        setCommentModal={setCommentModal}
        onClose={closeCommentModal}
        onSave={saveRevisionComment}
      />
    </article>
  );
};

export default Details;
