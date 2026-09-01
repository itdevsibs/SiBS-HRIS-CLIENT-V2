import { useMemo, useState } from "react";
import Header from "../../../components/layout/Header";
import CandidateExperienceHeader from "../../../components/recruitment/candidateExperience/CandidateExperienceHeader.jsx";
import CandidateExperienceSummary from "../../../components/recruitment/candidateExperience/CandidateExperienceSummary.jsx";
import CandidateExperienceAnalytics from "../../../components/recruitment/candidateExperience/CandidateExperienceAnalytics.jsx";
import CandidateExperienceFilters from "../../../components/recruitment/candidateExperience/CandidateExperienceFilters.jsx";
import CandidateExperienceTable from "../../../components/recruitment/candidateExperience/CandidateExperienceTable.jsx";
import CandidateExperienceDetailsModal from "../../../components/modals/candidateExperience/CandidateExperienceDetailsModal.jsx";
import { AddExperienceModal } from "../../../components/modals/candidateExperience/CandidateExperienceModal.jsx";
import { useCandidateExperience } from "../../../hooks/candidateExperience/useCandidateExperience.js";
import { filterCandidateExperienceRecords, getCandidateExperienceMetrics } from "../../../lib/utils/candidateExperience/index.js";

const emptyFilters = { search: "", outcome: "All", surveyStatus: "All", responseSource: "All", rating: "All" };

export default function CandidateExperiencePage() {
  const { records, candidateOptions, loading, candidateLoading, error, dataMode, refresh, saveManual } = useCandidateExperience();
  const [filters, setFilters] = useState(emptyFilters);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const filteredRecords = useMemo(() => filterCandidateExperienceRecords(records, filters), [records, filters]);
  const metrics = useMemo(() => getCandidateExperienceMetrics(records), [records]);

  function exportCsv() {
    const headers = ["Candidate", "Email", "Role", "Account", "Outcome", "Final Stage", "Survey Status", "Response Source", "Rating", "Category", "Date"];
    const rows = filteredRecords.map((record) => [record.candidateName, record.candidateEmail, record.roleTitle, record.account, record.outcome, record.finalStage, record.surveyStatus, record.responseSource || "", record.experienceRating || "", record.feedbackCategory || "", record.surveySubmittedAt || record.dateRecorded || ""]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `candidate-experience-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  async function handleManualSave(payload) {
    const response = await saveManual(payload);
    if (!response?.success) return response;
    setManualOpen(false);
    setSelectedRecord(response.data);
    setNotice(response.warning || "Manual candidate experience entry saved.");
    return response;
  }

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-3.5 sm:space-y-4 2xl:space-y-5">
          <CandidateExperienceHeader
            onAddManual={() => setManualOpen(true)}
            onRefresh={refresh}
            refreshing={loading}
            onExport={exportCsv}
          />

          {notice ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 2xl:py-3 sibs-text-xs font-semibold text-[#042C51]">
              {notice}
              <button
                type="button"
                onClick={() => setNotice("")}
                className="ml-2 font-black underline"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 2xl:py-3 sibs-text-xs font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          {dataMode === "local-fallback" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 2xl:py-3 sibs-text-xs font-semibold text-amber-800">
              Candidate Experience backend is not connected yet. Existing/manual records are currently using the frontend recruitment store; public survey responses still require the backend endpoint.
            </div>
          ) : null}

          <CandidateExperienceSummary metrics={metrics} />

          <CandidateExperienceAnalytics records={records} metrics={metrics} />

          <section
            className="sibs-page-card-in overflow-hidden rounded-xl 2xl:rounded-2xl border border-sibs-border bg-white shadow-sm font-jakarta"
            style={{ animationDelay: "240ms", animationFillMode: "both" }}
          >
            <header className="border-b border-sibs-border bg-white p-4 sm:p-5 2xl:p-6 font-jakarta">
              <div>
                <h2 className="sibs-card-title">
                  Candidate Experience Records
                </h2>
                <p className="sibs-card-subtitle">
                  Select a row or mobile card to open the complete recruitment journey and survey details.
                </p>
              </div>

              <div className="relative z-[90] mt-3.5 2xl:mt-4 overflow-visible">
                <CandidateExperienceFilters
                  filters={filters}
                  onChange={(key, value) =>
                    setFilters((current) => ({ ...current, [key]: value }))
                  }
                  onClear={() => setFilters(emptyFilters)}
                  count={filteredRecords.length}
                />
              </div>
            </header>

            <div className="min-h-0 flex-1 p-4 sm:p-5 2xl:p-6 font-jakarta">
              {loading ? (
                <div className="rounded-xl border border-dashed border-[#D6DEE8] bg-[#F8FAFC] p-10 text-center text-xs font-bold text-[#667085]">
                  Loading Candidate Experience records...
                </div>
              ) : (
                <CandidateExperienceTable
                  records={filteredRecords}
                  onSelect={setSelectedRecord}
                />
              )}
            </div>
          </section>
        </div>
      </main>

      <AddExperienceModal
        open={manualOpen}
        candidates={candidateOptions}
        candidatesLoading={candidateLoading}
        onClose={() => setManualOpen(false)}
        onSave={handleManualSave}
      />

      <CandidateExperienceDetailsModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
