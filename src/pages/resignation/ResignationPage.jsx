import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  FileText,
  CalendarDays,
  Clock3,
  RefreshCw,
  Search,
  User,
} from "lucide-react";
import { PageHeaderHero, TableEmptyRow, StatusBadge } from "@/components/ui";
// Sidebar provided by root layout
import Header from "../../components/layout/Header";
import ResignationModal from "../../components/modals/resignation/ResignationModal";
import { getMyResignations } from "../../lib/axios/getResignation";
import StatusModal from "../../components/modals/StatusModal";
import {
  formatDate,
  formatDateTime,
} from "@/components/layout/FormatDateTime";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

function FileTypeIcon({ filename }) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";

  const config = {
    doc: { label: "W", color: "bg-blue-600" },
    docx: { label: "W", color: "bg-blue-600" },
    xls: { label: "X", color: "bg-green-600" },
    xlsx: { label: "X", color: "bg-green-600" },
    csv: { label: "X", color: "bg-green-600" },
    pdf: { label: "PDF", color: "bg-red-600" },
    jpg: { label: "IMG", color: "bg-purple-600" },
    jpeg: { label: "IMG", color: "bg-purple-600" },
    png: { label: "IMG", color: "bg-purple-600" },
    gif: { label: "IMG", color: "bg-purple-600" },
    webp: { label: "IMG", color: "bg-purple-600" },
    svg: { label: "IMG", color: "bg-purple-600" },
  };

  const file = config[ext] || { label: "FILE", color: "bg-gray-600" };

  return (
    <div className="relative h-12 w-10 shrink-0">
      <div className="absolute inset-0 rounded-md border-2 border-gray-300 bg-white" />
      <div className="absolute right-0 top-0 h-3 w-3 border-l-2 border-b-2 border-gray-300 bg-gray-100" />
      <div className="absolute left-1 top-1/2 h-[2px] w-6 -translate-y-1/2 bg-gray-300" />
      <div className="absolute left-1 top-[60%] h-[2px] w-5 bg-gray-300" />

      <div
        className={`absolute -left-2 bottom-1 rounded-md px-2 py-1 text-[10px] font-bold text-white shadow ${file.color}`}
      >
        {file.label}
      </div>
    </div>
  );
}

function UploadedFileCell({ filename, fileUrl }) {
  if (!filename || !fileUrl) {
    return <span className="text-sm text-gray-400">N/A</span>;
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-w-[320px] items-center gap-3 rounded-lg p-1 transition hover:bg-gray-50"
      title={`Open ${filename}`}
    >
      <FileTypeIcon filename={filename} />

      <span className="truncate text-sm text-gray-700 hover:text-[var(--sibs-primary-1)]">
        {filename}
      </span>
    </a>
  );
}

export default function ResignationPage() {
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [search, setSearch] = useState("");

  const [resignations, setResignations] = useState([]);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const loadResignations = async () => {
    try {
      setLoading(true);
      const result = await getMyResignations();

      if (!result?.success) {
        setResignations([]);
        return;
      }

      setResignations(result.data || []);
    } catch (error) {
      console.error("Failed to load resignations:", error);
      setResignations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResignations();
  }, []);

  const filteredResignations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return resignations;

    return resignations.filter((item) =>
      [
        item.id,
        item.reason,
        item.specifyOthers,
        item.uploadedFile,
        item.status,
        item.resignationDate,
        item.lastWorkingDate,
        item.createdAt,
        item.sibsId,
        item.supervisorSibsId,
        item.supervisorName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [resignations, search]);

  const getStatusClasses = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "declined":
      case "rejected":
        return "bg-red-100 text-red-700";
      case "pending":
      default:
        return "bg-amber-100 text-amber-700";
    }
  };


  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-5">
          <PageHeaderHero
            kicker="Core HR View"
            title="My Resignation Requests"
            description="View and manage your personal resignation requests and clearance status."
            actions={
              <>
                <button
                  type="button"
                  onClick={loadResignations}
                  disabled={loading}
                  title="Refresh Resignations"
                  className="sibs-btn-icon"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      loading ? "animate-spin text-sibs-orange" : ""
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setOpenForm(true)}
                  className="sibs-btn-primary"
                >
                  <Plus className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
                  Submit Resignation
                </button>
              </>
            }
          />

        <ResignationModal
          open={openForm}
          onClose={() => setOpenForm(false)}
          onSuccess={loadResignations}
          setStatusModal={setStatusModal}
        />

        <StatusModal
          open={statusModal.open}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          onClose={() =>
            setStatusModal({
              open: false,
              type: "success",
              title: "",
              message: "",
            })
          }
        />

        <section className="sibs-profile-tab-panel sibs-page-card-in sibs-card overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm font-jakarta" style={{ animationDelay: "180ms", animationFillMode: "both" }}>
          <div className="border-b border-[#E6ECF2] p-4 sm:p-5 2xl:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
                  My Resignation List
                </h2>

                <p className="mt-1 sibs-text-xs font-semibold text-[#667085]">
                  Your submitted personal resignation requests and status tracking.
                </p>
              </div>

              <div className="relative w-full md:w-[320px]">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Search resignation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] pl-10 pr-4 sibs-text-xs font-medium outline-none transition focus:border-[var(--sibs-primary-1)] focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="overflow-auto sibs-scrollbar max-h-[580px]">
            <table className="w-full min-w-[1450px] border-collapse bg-white text-left">
              <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                <tr className="border-b border-[#E6ECF2]">
                  <th className="sibs-data-table-th px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">ID</th>
                  <th className="sibs-data-table-th px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">Resignation Date</th>
                  <th className="sibs-data-table-th px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">Last Working Date</th>
                  <th className="sibs-data-table-th px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">Reason</th>
                  <th className="sibs-data-table-th px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">Specify Others</th>
                  <th className="sibs-data-table-th px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">Supervisor</th>
                  <th className="sibs-data-table-th px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">Uploaded File</th>
                  <th className="sibs-data-table-th px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">Submitted At</th>
                  <th className="sibs-data-table-th px-3 2xl:px-4 py-2 2xl:py-2.5 text-center sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-6 text-center sibs-text-xs font-semibold text-[#667085]">
                      Loading...
                    </td>
                  </tr>
                ) : filteredResignations.length === 0 ? (
                  <TableEmptyRow
                    colSpan={9}
                    title="No resignation records found"
                    description="Adjust search query or submit a new resignation request."
                  />
                ) : (
                  filteredResignations.map((item) => {
                    const fileUrl =
                      item.uploadedFile && item.sibsId
                        ? `${API_BASE_URL}/api/resignation/file/${item.sibsId}/${item.uploadedFile}`
                        : "";

                    return (
                      <tr
                        key={item.id}
                        className="sibs-data-table-row border-t border-[#EEF2F6] transition-colors hover:bg-[#FFF8F5]"
                      >
                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-extrabold text-[#FF5C28] tabular-nums">
                          {item.id}
                        </td>

                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-semibold text-[#344054]">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays
                              size={14}
                              className="text-slate-400"
                            />
                            <span>{formatDate(item.resignationDate)}</span>
                          </div>
                        </td>

                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-semibold text-[#344054]">
                          {formatDate(item.lastWorkingDate)}
                        </td>

                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-semibold text-[#344054]">{item.reason || "N/A"}</td>

                        <td className="max-w-[240px] px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-semibold text-[#344054]">
                          <p className="truncate">
                            {item.specifyOthers || "N/A"}
                          </p>
                        </td>

                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-semibold text-[#344054]">
                          <div className="flex min-w-[220px] items-center gap-1.5">
                            <User size={14} className="text-slate-400" />
                            <span className="truncate">
                              {item.supervisorName ||
                                item.supervisorSibsId ||
                                "N/A"}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs">
                          <UploadedFileCell
                            filename={item.uploadedFile}
                            fileUrl={fileUrl}
                          />
                        </td>

                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-semibold text-[#52637A]">
                          <div className="flex items-center gap-1.5">
                            <Clock3
                              size={14}
                              className="text-slate-400"
                            />
                            <span>{formatDateTime(item.createdAt)}</span>
                          </div>
                        </td>

                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-center">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}