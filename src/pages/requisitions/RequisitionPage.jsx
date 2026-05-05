import { useMemo, useState } from "react";
import { Plus, Search, MapPin, ChevronRight } from "lucide-react";
// Sidebar provided by root layout
import Header from "../../components/layout/Header";
import RequisitionModal from "../../components/modals/requisitions/RequisitionModal";

export default function RequisitionPage() {
  const [search, setSearch] = useState("");
  const [openAddModal, setOpenAddModal] = useState(false);

  const requisitions = [
    {
      id: "REQ-20260401-001",
      title: "Web Developer",
      department: "Software Development",
      positions: 2,
      location: "TBD",
      status: "Approved",
      createdBy: "Dem Labus",
      date: "Apr 01, 2026",
    },
  ];

  const filteredRequisitions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return requisitions;

    return requisitions.filter((req) =>
      [req.id, req.title, req.department, req.status, req.createdBy]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [requisitions, search]);

  const stats = {
    all: requisitions.length,
    draft: 0,
    pending: 0,
    approved: requisitions.filter((r) => r.status === "Approved").length,
    rejected: 0,
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--sibs-tertiary-10)]">
      <Header />

      <main className="overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-sibs-primary-1">
              Job Requisitions
            </h1>
            <p className="text-sm text-gray-500">
              Manage job requisition requests and approvals
            </p>
          </div>

          <button
            onClick={() => setOpenAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--sibs-primary-1)] px-4 py-2 text-white transition hover:opacity-90"
          >
            <Plus size={16} />
            New Requisition
          </button>
        </div>

        <div className="mb-6 grid grid-cols-5 gap-4">
          <StatCard title="All" value={stats.all} />
          <StatCard title="Draft" value={stats.draft} />
          <StatCard title="Pending" value={stats.pending} />
          <StatCard title="Approved" value={stats.approved} />
          <StatCard title="Rejected" value={stats.rejected} />
        </div>

        <div className="mb-6 flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="relative flex-1">
            <Search
              className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by title or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border py-2 pr-3 pl-10"
            />
          </div>

          <select className="rounded-lg border px-3 py-2">
            <option>All Statuses</option>
          </select>

          <select className="rounded-lg border px-3 py-2">
            <option>All Departments</option>
          </select>

          <button className="rounded-lg bg-[var(--sibs-primary-1)] px-4 py-2 text-white transition hover:opacity-90">
            Filter
          </button>
        </div>

        <div className="space-y-4">
          {filteredRequisitions.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div>
                <h2 className="text-lg font-semibold">{req.title}</h2>

                <p className="mt-1 text-sm text-gray-500">
                  {req.id} • {req.department} • {req.positions} positions
                </p>

                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <MapPin size={14} />
                  {req.location}
                </div>

                <p className="mt-2 text-xs text-gray-400">
                  Created by {req.createdBy} on {req.date}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-600">
                  {req.status}
                </span>

                <ChevronRight className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </main>

      <RequisitionModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onSuccess={() => {
          // refresh requisition list here later if needed
        }}
      />
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}
