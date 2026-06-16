import React, { useEffect, useRef, useState } from "react";
import Header from "../../components/layout/Header";
import { useHiringNeeds } from "../../services/context/HiringNeedsContext";

import HiringNeedsStats from "../../components/recruitment/HiringNeeds/HiringNeedsStats";
import HiringNeedsFilters from "../../components/recruitment/HiringNeeds/HiringNeedsFilters";
import HiringNeedsTable from "../../components/recruitment/HiringNeeds/HiringNeedsTable";

import ViewHiringNeedsModal from "../../components/modals/hiringNeeds/ViewHiringNeedsModal";
import AddHiringNeedsModal from "../../components/modals/hiringNeeds/AddHiringNeedsModal";
import StatusModal from "../../components/modals/StatusModal";
import { ClipboardList, Plus } from "lucide-react";

export default function HiringNeedsPage() {
  const mainRef = useRef(null);
  const { fetchList, fetchJobDescriptions } = useHiringNeeds();

  const [selectedItem, setSelectedItem] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    fetchList();
    fetchJobDescriptions();
  }, [fetchList, fetchJobDescriptions]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">

          {/* 1. Page Header */}
          <div className="sibs-page-header-in flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                <ClipboardList size={14} />
                Recruitment
              </div>
              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Hiring Needs Intake
              </h1>
              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Create, review, and manage Personnel Requisition Forms.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5"
            >
              <Plus size={18} /> New Personnel Requisition
            </button>
          </div>

          {/* 2. Stats & Charts */}
          <HiringNeedsStats />

          {/* 3. Filter & Table */}
          <section className="sibs-profile-tab-panel overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm" style={{ animationDelay: '180ms' }}    >
            <HiringNeedsFilters />
            <HiringNeedsTable onView={setSelectedItem} />
          </section>

          {/* 4. Footer Note */}
          <section className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-5" style={{ animationDelay: '480ms' }}>
            <h3 className="text-sm font-bold text-sibs-primary-1">Hiring Needs Process Note</h3>
            <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
              This module tracks Personnel Requisition Forms (PRF). Once a PRF is Approved, it
              becomes an active hiring need that can be linked to Job Descriptions and Candidates.
            </p>
          </section>

        </div>
      </main>

      <AddHiringNeedsModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onStatus={setStatusModal}
      />

      <ViewHiringNeedsModal
        open={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        onClose={() => setStatusModal((prev) => ({ ...prev, open: false }))}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
}