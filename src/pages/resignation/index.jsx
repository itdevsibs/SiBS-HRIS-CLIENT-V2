import { useEffect, useMemo, useState } from "react";
import { Plus, FileText, CalendarDays, Clock3, Search, User } from "lucide-react";
// Sidebar provided by root layout
import Header from "../../components/layout/Header";
import ResignationModal from "../../components/modals/resignation/ResignationModal";
import { getMyResignations, saveResignation } from "../../lib/axios/getResignation";
import StatusModal from "../../components/modals/StatusModal";
import ResignationTable from "../../components/tables/ResignationTable";
import {
  getTodayDate,
  formatDate,
  formatDateTime,
} from "@/components/layout/FormatDateTime";

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
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [resignations, setResignations] = useState([]);
  const [form, setForm] = useState({
    resignationDate: getTodayDate(),
    lastWorkingDate: "",
    reason: "",
    otherReason: "",
    remarks: "",
    uploadedFile: null,
  });

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

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "file" ? files?.[0] || null : value,
    }));
  };

  const resetForm = () => {
    setForm({
      resignationDate: getTodayDate(),
      lastWorkingDate: "",
      reason: "",
      otherReason: "",
      remarks: "",
      uploadedFile: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await saveResignation({
        reason: form.reason,
        specifyOthers: form.reason === "Other" ? form.otherReason : null,
        uploadedFile: form.uploadedFile || null,
        resignationDate: form.resignationDate,
        lastWorkingDate: form.lastWorkingDate,
        remarks: form.remarks,
      });

      if (!result?.success) {
        setStatusModal({
          open: true,
          type: "error",
          title: "Submission Failed",
          message: result?.message || "Failed to submit resignation.",
        });
        return;
      }

      setOpenForm(false);
      resetForm();
      await loadResignations();

      setStatusModal({
        open: true,
        type: "success",
        title: "Resignation Submitted",
        message:
          result?.message ||
          "Your resignation request has been submitted successfully.",
      });
    } catch (error) {
      console.error("Failed to submit resignation:", error);

      setStatusModal({
        open: true,
        type: "error",
        title: "Submission Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong while submitting your resignation.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--sibs-tertiary-10)]">
      <Header />

      <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText size={28} className="text-sibs-primary-1" />
                <h1 className="text-4xl font-bold text-sibs-primary-1">
                  Resignation
                </h1>
              </div>

              <p className="text-sm text-sibs-tertiary-5">
                View and manage your resignation requests
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpenForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            >
              <Plus size={18} />
              Submit Resignation
            </button>
          </div>

          <ResignationModal
            open={openForm}
            onClose={() => setOpenForm(false)}
            onSubmit={handleSubmit}
            form={form}
            onChange={handleChange}
            submitting={submitting}
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

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-[#E6ECF2] px-6 py-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-sibs-primary-1">
                    My Resignation List
                  </h2>

                  <p className="text-sm text-sibs-tertiary-5">
                    Your submitted resignation requests
                  </p>
                </div>

                <div className="relative w-full md:w-[320px]">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                  />

                  <input
                    type="text"
                    placeholder="Search resignation..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-[#D7DEE8] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--sibs-primary-1)]"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[1450px] text-sm">
                <thead className="sticky top-0 z-10 bg-gray-100">
                  <tr>
                    <th className="p-4 text-left">ID</th>
                    <th className="p-4 text-left">Resignation Date</th>
                    <th className="p-4 text-left">Last Working Date</th>
                    <th className="p-4 text-left">Reason</th>
                    <th className="p-4 text-left">Specify Others</th>
                    <th className="p-4 text-left">Supervisor</th>
                    <th className="p-4 text-left">Uploaded File</th>
                    <th className="p-4 text-left">Submitted At</th>
                    <th className="p-4 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="p-6 text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredResignations.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-6 text-center">
                        No resignation records found
                      </td>
                    </tr>
                  ) : (
                    filteredResignations.map((item) => {
                      const fileUrl =
                        item.uploadedFile && item.sibsId
                          ? `${process.env.NEXT_PUBLIC_API_URL}/api/resignation/file/${item.sibsId}/${item.uploadedFile}`
                          : "";

                      return (
                        <tr
                          key={item.id}
                          className="border-t transition-colors hover:bg-gray-50"
                        >
                          <td className="p-4 font-medium text-sibs-primary-1">
                            {item.id}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <CalendarDays
                                size={16}
                                className="text-sibs-tertiary-5"
                              />
                              <span>{formatDate(item.resignationDate)}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            {formatDate(item.lastWorkingDate)}
                          </td>

                          <td className="p-4">{item.reason || "N/A"}</td>

                          <td className="max-w-[240px] p-4">
                            <p className="truncate">
                              {item.specifyOthers || "N/A"}
                            </p>
                          </td>

                          <td className="p-4">
                            <div className="flex min-w-[220px] items-center gap-2">
                              <User
                                size={16}
                                className="text-sibs-tertiary-5"
                              />
                              <span className="truncate">
                                {item.supervisorName ||
                                  item.supervisorSibsId ||
                                  "N/A"}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <UploadedFileCell
                              filename={item.uploadedFile}
                              fileUrl={fileUrl}
                            />
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Clock3
                                size={16}
                                className="text-sibs-tertiary-5"
                              />
                              <span>{formatDateTime(item.createdAt)}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                item.status,
                              )}`}
                            >
                              {item.status}
                            </span>
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