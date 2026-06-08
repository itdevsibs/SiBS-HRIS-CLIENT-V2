import { ExternalLink, Download, Upload, Plus, UsersRound } from "lucide-react";

import Header from "../../../components/layout/Header";
import { useTalentPool } from "../../../services/context/TalentPoolContext";

import TalentPoolStats from "../../../components/recruitment/talentPool/TalentPoolStats";
import TalentPoolFilters from "../../../components/recruitment/talentPool/TalentPoolFilters";
import TalentPoolTable from "../../../components/recruitment/talentPool/TalentPoolTable";

import AddCandidateModal from "../../../components/modals/talentPool/AddCandidateModal";
import CandidateProfileModal from "../../../components/modals/talentPool/CandidateProfileModal";
import UpdateStatusModal from "../../../components/modals/talentPool/UpdateStatusModal";
import MoveToPipeLineModal from "../../../components/modals/talentPool/MoveToPipeLineModal";

export default function TalentPoolPage() {
  const { uploadInputRef, openPublicForm, openAddCandidateModal } =
    useTalentPool();

  function handleDownloadLeadTemplate() {
    const csv =
      "candidateId,firstName,middleName,lastName,suffix,nickname,email,phoneNumber1,phoneNumber2,dateOfBirth,physicalAddress,openPosition,applyingLocation,hearAboutUs,referredBy,employeeId,workExperience,educationalAttainment,skillsLanguage,status,availability,remarks\n,Ana,,Santos,,Ana,ana.santos@email.com,09171234567,,1999-04-14,Davao City,Customer Service Representative,Davao Site,Social Media Ads,N/A,N/A,Has work Experience (at least 6 months relevant work experience),Tertiary (College Level or College Degree Holder),English Chat,New Applicant,Available,Imported sample lead";

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "talent-pool-leads-template.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <UsersRound size={14} />
                Recruitment
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Talent Pool / Candidate Database
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Store reusable candidate master profiles, import leads from CSV,
                and move qualified candidates to the pipeline.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={openPublicForm}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              >
                <ExternalLink size={18} />
                Public Form
              </button>

              <button
                type="button"
                onClick={handleDownloadLeadTemplate}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              >
                <Download size={18} />
                CSV Template
              </button>

              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              >
                <Upload size={18} />
                Upload CSV Leads
              </button>

              <input
                ref={uploadInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
              />

              <button
                type="button"
                onClick={openAddCandidateModal}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
              >
                <Plus size={18} />
                Add Candidate
              </button>
            </div>
          </div>

          <TalentPoolStats />

          <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
            <TalentPoolFilters />
            <TalentPoolTable />
          </section>

          <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="text-sm font-bold text-sibs-primary-1">
              Talent Pool Design Note
            </h3>

            <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
              Talent Pool is the candidate master profile source. Move to
              Pipeline creates the first candidate application under Initial
              Screening.
            </p>
          </section>
        </div>
      </main>

      <AddCandidateModal />
      <CandidateProfileModal />
      <UpdateStatusModal />
      <MoveToPipeLineModal />
    </div>
  );
}
