import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/layout/Header";
import { useCandidatePipeline } from "../../services/context/CandidatePipelineContext";

import {
  Search,
  UserCheck,
  BriefcaseBusiness,
  ShieldCheck,
  Filter,
  CalendarDays,
  ClipboardCheck,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  roleOptions,
  accountOptions,
} from "../../lib/utils/candidatePipeline/candidatePipelineConstants";

import DashboardMetric from "../../components/layout/common/DashboardMetric";
import MoveStageModal from "../../components/modals/candidatePipeline/MoveStageModal";
import ScheduleInterviewModal from "../../components/modals/candidatePipeline/ScheduleInterviewModal";
import AssessmentModal from "../../components/modals/candidatePipeline/AssessmentModal";
import DropOffModal from "../../components/modals/candidatePipeline/DropOffModal";
import OfferDetailsModal from "../../components/modals/candidatePipeline/OfferDetailsModal";
import CandidatePipelineModal from "../../components/modals/candidatePipeline/CandidatePipelineModal";
import PipelineCardsBoard from "../../components/recruitment/candidatePipeline/PipelineCardBoard";
import InterviewCalendar from "../../components/recruitment/candidatePipeline/InterviewCalendar";

export default function CandidatePipelinePage() {
  const {
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    accountFilter,
    setAccountFilter,
    activeStage,
    setActiveStage,
    pageView,
    setPageView,

    selectedCandidate,
    setSelectedCandidate,

    moveCandidate,
    moveForm,
    setMoveForm,

    scheduleCandidate,
    scheduleForm,
    setScheduleForm,

    assessmentCandidate,
    assessmentForm,
    setAssessmentForm,

    dropOffCandidate,
    dropOffForm,
    setDropOffForm,

    offerCandidate,
    offerForm,
    setOfferForm,

    filteredCandidates,
    stageVisibleCandidates,
    stageCounts,
    metrics,

    handleResetSampleData,

    handleUpdatePrfStatus,

    handleOpenMoveModal,
    handleCloseMoveModal,
    handleSubmitMove,

    handleOpenScheduleInterview,
    handleCloseScheduleInterview,
    handleSubmitScheduleInterview,
    handleCancelInterview,
    handleCompleteInterview,
    handleSaveInterviewNotes,

    handleOpenAssessmentModal,
    handleCloseAssessmentModal,
    handleSendAssessmentEmail,
    handleSubmitAssessment,

    handleOpenDropOffModal,
    handleCloseDropOffModal,
    handleSubmitDropOff,

    handleCloseOfferModal,
    handleSubmitOfferDetails,
    handleUpdateOfferApproval,
    handleSendOfferEmail,
    handleOfferDecision,
  } = useCandidatePipeline();

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <ClipboardCheck size={14} />
                Recruitment
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Candidate Pipeline
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Track candidates from Initial Screening to Accepted. Final role,
                hiring requirement, and account are assigned during the offer
                stage.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setPageView("pipeline")}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-90 ${
                  pageView === "pipeline"
                    ? "bg-[var(--sibs-primary-1)] text-white"
                    : "border border-[#D6DEE8] bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
                }`}
              >
                <SlidersHorizontal size={18} />
                Pipeline View
              </button>

              <button
                type="button"
                onClick={() => setPageView("calendar")}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-90 ${
                  pageView === "calendar"
                    ? "bg-[var(--sibs-primary-1)] text-white"
                    : "border border-[#D6DEE8] bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
                }`}
              >
                <CalendarDays size={18} />
                Calendar View
              </button>

              <button
                type="button"
                onClick={handleResetSampleData}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md"
              >
                <RotateCcw size={18} />
                Reset Sample Data
              </button>
            </div>
          </div>

          <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-bold text-[#101828]">
              Pipeline Summary
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <DashboardMetric
                label="Initial Screening"
                value={metrics.initialScreening}
                icon={UserCheck}
                description="PRF reviewed"
              />
              <DashboardMetric
                label="Online Assessment"
                value={metrics.onlineAssessment}
                icon={ClipboardCheck}
                description="Assessment stage"
              />
              <DashboardMetric
                label="Interview Scheduled"
                value={metrics.interviewScheduled}
                icon={CalendarDays}
                description="Calendar booked"
              />
              <DashboardMetric
                label="Interviewed"
                value={metrics.interviewed}
                icon={ShieldCheck}
                description="Interview done"
              />
              <DashboardMetric
                label="Offered"
                value={metrics.offered}
                icon={BriefcaseBusiness}
                description="Offer processing"
              />
              <DashboardMetric
                label="Accepted"
                value={metrics.accepted}
                icon={UserCheck}
                description="Converted"
                valueClassName="text-emerald-600"
              />
            </div>
          </section>

          {pageView === "pipeline" && (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
                <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_220px_220px_auto] xl:items-end">
                    <div>
                      <label className="mb-1 block text-sm font-bold text-[#101828]">
                        Search
                      </label>

                      <div className="relative">
                        <Search
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                        />

                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search candidate, PRF, assessment, role, account..."
                          className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-[#101828]">
                        Role
                      </label>

                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-[#101828]">
                        Account
                      </label>

                      <select
                        value={accountFilter}
                        onChange={(e) => setAccountFilter(e.target.value)}
                        className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                      >
                        {accountOptions.map((account) => (
                          <option key={account} value={account}>
                            {account}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setRoleFilter("All Roles");
                        setAccountFilter("All Accounts");
                      }}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm"
                    >
                      <Filter size={17} />
                      Clear
                    </button>
                  </div>
                </div>
              </section>

              <PipelineCardsBoard
                candidates={stageVisibleCandidates}
                stageCounts={stageCounts}
                activeStage={activeStage}
                setActiveStage={setActiveStage}
                onViewCandidate={(candidate) => setSelectedCandidate(candidate)}
                onOpenMoveModal={handleOpenMoveModal}
                onOpenAssessmentModal={handleOpenAssessmentModal}
                onOpenScheduleModal={handleOpenScheduleInterview}
                onCancelInterview={handleCancelInterview}
                onCompleteInterview={handleCompleteInterview}
              />
            </div>
          )}

          {pageView === "calendar" && (
            <InterviewCalendar
              candidates={filteredCandidates}
              onViewCandidate={(candidate) => setSelectedCandidate(candidate)}
            />
          )}
        </div>
      </main>

      <CandidatePipelineModal
        open={!!selectedCandidate}
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onUpdatePrfStatus={handleUpdatePrfStatus}
        onOpenScheduleModal={handleOpenScheduleInterview}
        onOpenMoveModal={handleOpenMoveModal}
        onOpenAssessmentModal={handleOpenAssessmentModal}
        onOpenDropOffModal={handleOpenDropOffModal}
        onCompleteInterview={handleCompleteInterview}
        onSendAssessmentEmail={handleSendAssessmentEmail}
        onCancelInterview={handleCancelInterview}
        onUpdateOfferApproval={handleUpdateOfferApproval}
        onSendOfferEmail={handleSendOfferEmail}
        onOfferDecision={handleOfferDecision}
        onSaveInterviewNotes={handleSaveInterviewNotes}
      />

      <MoveStageModal
        open={!!moveCandidate}
        candidate={moveCandidate}
        form={moveForm}
        setForm={setMoveForm}
        onClose={handleCloseMoveModal}
        onSubmit={handleSubmitMove}
      />

      <ScheduleInterviewModal
        open={!!scheduleCandidate}
        candidate={scheduleCandidate}
        form={scheduleForm}
        setForm={setScheduleForm}
        onClose={handleCloseScheduleInterview}
        onSubmit={handleSubmitScheduleInterview}
      />

      <AssessmentModal
        open={!!assessmentCandidate}
        candidate={assessmentCandidate}
        form={assessmentForm}
        setForm={setAssessmentForm}
        onClose={handleCloseAssessmentModal}
        onSubmit={handleSubmitAssessment}
        onSendEmail={handleSendAssessmentEmail}
      />

      <OfferDetailsModal
        open={!!offerCandidate}
        candidate={offerCandidate}
        form={offerForm}
        setForm={setOfferForm}
        onClose={handleCloseOfferModal}
        onSubmit={handleSubmitOfferDetails}
      />

      <DropOffModal
        open={!!dropOffCandidate}
        candidate={dropOffCandidate}
        form={dropOffForm}
        setForm={setDropOffForm}
        onClose={handleCloseDropOffModal}
        onSubmit={handleSubmitDropOff}
      />
    </div>
  );
}
