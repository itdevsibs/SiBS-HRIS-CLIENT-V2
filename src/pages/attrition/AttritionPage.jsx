import { useEffect, useRef, useState } from "react";
import { FileText, Search, Plus } from "lucide-react";

import Header from "../../components/layout/Header";
import AttritionModal from "../../components/modals/attrition/AttritionModal";
import StatusModal from "../../components/modals/StatusModal";
import AttritionTable from "../../components/tables/AttritionTable";
import ResignationTable from "../../components/tables/employees/EmployeeResignationTable";
import EmployeeAttritionTable from "../../components/tables/employees/EmployeeAttritionTable";

import { saveAttrition, updateAttrition } from "../../lib/axios/getAttrition";
import {
  getSupervisorResignations,
  getSupervisorAttritions,
  updateSupervisorResignation,
} from "../../lib/axios/getEmployee";

import { usePagination } from "../../services/context/PaginationContext";
import { useUser } from "../../services/context/UserContext";

import {
  formatDate,
  formatDateTime,
  getTodayDate,
} from "../../components/layout/FormatDateTime";

export default function AttritionPage() {
  const { user } = useUser();

  const { searchInput, setSearchInput, handleSearchKeyDown } =
    usePagination("attrition");

  const [activeTab, setActiveTab] = useState("Resignation");

  const [openForm, setOpenForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [resignations, setResignations] = useState([]);
  const [resignationLoading, setResignationLoading] = useState(false);

  const [attritions, setAttritions] = useState([]);
  const [attritionLoading, setAttritionLoading] = useState(false);

  const mainScrollRef = useRef(null);

  const [viewModal, setViewModal] = useState({
    open: false,
    data: null,
  });

  const initialForm = {
    employeeSibsId: "",
    employeeName: "",
    resignationType: "",
    attritionDate: getTodayDate(),
    lastWorkingDate: "",
    reason: "",
    otherReason: "",
    remarks: "",
    uploadedFile: null,
    uploadedFileName: "",
    existingUploadedFile: "",

    tlSibsId: "",
    tlFullName: "",
    tlIsApproved: 0,
    tlIsDeclined: 0,
    tlRemarks: "",

    omSibsId: "",
    omFullName: "",
    omIsApproved: 0,
    omIsDeclined: 0,
    omRemarks: "",

    somSibsId: "",
    somFullName: "",
    somIsApproved: 0,
    somIsDeclined: 0,
    somRemarks: "",

    hideTl: false,
  };

  const [form, setForm] = useState(initialForm);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const pageTitle = user?.role === "employee" ? "My Attrition" : "Attrition";

  const tabs = [
    {
      label: "Resignation",
      count: resignations.filter((item) => item.status === "Pending").length,
    },
    {
      label: "Attrition",
      count: attritions.filter((item) => {
        const isDeclined =
          Number(item.tlIsDeclined) === 1 ||
          Number(item.omIsDeclined) === 1 ||
          Number(item.somIsDeclined) === 1;

        const isFullyApproved =
          (item.hideTl || !item.tlSibsId || Number(item.tlIsApproved) === 1) &&
          (!item.omSibsId || Number(item.omIsApproved) === 1) &&
          (!item.somSibsId || Number(item.somIsApproved) === 1);

        return !isDeclined && !isFullyApproved;
      }).length,
    },
  ];

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "file"
          ? files?.[0] || null
          : type === "checkbox"
            ? checked
              ? 1
              : 0
            : value,
    }));
  };

  const resetForm = () => {
    setForm({
      ...initialForm,
      attritionDate: getTodayDate(),
    });

    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingId(null);
    setOpenForm(true);
  };

  const closeFormModal = () => {
    if (submitting) return;

    setOpenForm(false);
    resetForm();
  };

  const closeViewModal = () => {
    setViewModal({
      open: false,
      data: null,
    });
  };

  const handleOpenView = (item) => {
    setViewModal({
      open: true,
      data: item,
    });
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);

    setForm({
      employeeSibsId: item.sibsId || item.employeeSibsId || "",
      employeeName: item.employeeName || item.fullName || "",
      resignationType: item.resignationType || "",
      attritionDate: item.attritionDate
        ? new Date(item.attritionDate).toLocaleDateString("en-CA", {
            timeZone: "Asia/Manila",
          })
        : "",
      lastWorkingDate: item.lastWorkingDate
        ? new Date(item.lastWorkingDate).toLocaleDateString("en-CA", {
            timeZone: "Asia/Manila",
          })
        : "",
      reason: item.reason || "",
      otherReason: item.specifyOthers || item.otherReason || "",
      remarks: item.remarks || "",

      uploadedFile: null,
      uploadedFileName: item.uploadedFile || "",
      existingUploadedFile: item.uploadedFile || "",

      tlSibsId: item.tlSibsId || "",
      tlFullName: item.tlFullName || item.tlName || "",
      tlIsApproved: Number(item.tlIsApproved || 0),
      tlIsDeclined: Number(item.tlIsDeclined || 0),
      tlRemarks: item.tlRemarks || "",

      omSibsId: item.omSibsId || "",
      omFullName: item.omFullName || item.omName || "",
      omIsApproved: Number(item.omIsApproved || 0),
      omIsDeclined: Number(item.omIsDeclined || 0),
      omRemarks: item.omRemarks || "",

      somSibsId: item.somSibsId || "",
      somFullName: item.somFullName || item.somName || "",
      somIsApproved: Number(item.somIsApproved || 0),
      somIsDeclined: Number(item.somIsDeclined || 0),
      somRemarks: item.somRemarks || "",

      hideTl: !!item.hideTl,
    });

    setOpenForm(true);
  };

  const fetchResignations = async () => {
    try {
      setResignationLoading(true);

      const result = await getSupervisorResignations();

      if (!result?.success) {
        setResignations([]);
        return [];
      }

      const data = result.data || [];
      setResignations(data);

      return data;
    } catch (error) {
      console.error("Fetch resignations error:", error);
      setResignations([]);
      return [];
    } finally {
      setResignationLoading(false);
    }
  };

  const fetchAttritions = async () => {
    try {
      setAttritionLoading(true);

      const result = await getSupervisorAttritions();

      if (!result?.success) {
        setAttritions([]);
        return [];
      }

      const data = result.data || [];
      setAttritions(data);

      return data;
    } catch (error) {
      console.error("Fetch attritions error:", error);
      setAttritions([]);
      return [];
    } finally {
      setAttritionLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = editingId
        ? {
            employeeSibsId: form.employeeSibsId,

            tlIsApproved: Number(form.tlIsApproved ?? 0),
            tlIsDeclined: Number(form.tlIsDeclined ?? 0),
            tlRemarks: form.tlRemarks || "",

            omIsApproved: Number(form.omIsApproved ?? 0),
            omIsDeclined: Number(form.omIsDeclined ?? 0),
            omRemarks: form.omRemarks || "",

            somIsApproved: Number(form.somIsApproved ?? 0),
            somIsDeclined: Number(form.somIsDeclined ?? 0),
            somRemarks: form.somRemarks || "",
          }
        : {
            employeeSibsId: form.employeeSibsId,
            reason: form.reason,
            specifyOthers: form.reason === "Other" ? form.otherReason : null,
            uploadedFile: form.uploadedFile || null,
            attritionDate: form.attritionDate,
            lastWorkingDate: form.lastWorkingDate,
            remarks: form.remarks,
          };

      const result = editingId
        ? await updateAttrition(editingId, payload)
        : await saveAttrition(payload);

      if (!result?.success) {
        setStatusModal({
          open: true,
          type: "error",
          title: editingId ? "Update Failed" : "Submission Failed",
          message:
            result?.message ||
            (editingId
              ? "Failed to update attrition."
              : "Failed to submit attrition."),
        });
        return;
      }

      setOpenForm(false);
      resetForm();
      setReloadKey((prev) => prev + 1);

      await Promise.all([fetchAttritions(), fetchResignations()]);

      setStatusModal({
        open: true,
        type: "success",
        title: editingId ? "Attrition Updated" : "Attrition Submitted",
        message:
          result?.message ||
          (editingId
            ? "Your attrition request has been updated successfully."
            : "Your attrition request has been submitted successfully."),
      });
    } catch (error) {
      console.error("Failed to save attrition:", error);

      setStatusModal({
        open: true,
        type: "error",
        title: editingId ? "Update Failed" : "Submission Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          (editingId
            ? "Something went wrong while updating your attrition."
            : "Something went wrong while submitting your attrition."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSupervisor = async (payload) => {
    const result = await updateSupervisorResignation(payload);

    if (!result?.success) {
      throw result?.error || new Error(result?.message || "Update failed");
    }

    await Promise.all([fetchResignations(), fetchAttritions()]);
    setReloadKey((prev) => prev + 1);

    return result;
  };

  useEffect(() => {
    fetchAttritions();
    fetchResignations();
  }, []);

  useEffect(() => {
    if (activeTab === "Attrition") {
      fetchAttritions();
    }

    if (activeTab === "Resignation") {
      fetchResignations();
    }
  }, [activeTab]);

  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [activeTab]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainScrollRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="flex min-w-0 flex-col gap-6">
          <section className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sibs-primary-1 text-white shadow-sm">
                <FileText size={24} />
              </div>

              <div className="min-w-0">
                <h1 className="m-0 break-words text-[28px] font-bold leading-tight tracking-[-0.9px] text-sibs-primary-1 sm:text-[32px] xl:text-[38px]">
                  {pageTitle}
                </h1>

                <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                  View and manage attrition and resignation requests
                </p>
              </div>
            </div>

            {activeTab === "Attrition" && (
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
                <div className="relative w-full shrink-0 lg:w-80">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                  />

                  <input
                    type="text"
                    placeholder="Search attrition..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="h-11 w-full rounded-full border border-[#e6ecf2] bg-white px-4 pl-11 text-sm font-normal text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  <Plus size={17} />
                  Submit Attrition
                </button>
              </div>
            )}
          </section>

          <AttritionModal
            mode={editingId ? "edit" : "add"}
            open={openForm}
            onClose={closeFormModal}
            onSubmit={handleSubmit}
            form={form}
            onChange={handleChange}
            submitting={submitting}
          />

          <AttritionModal
            mode="view"
            open={viewModal.open}
            data={viewModal.data}
            onClose={closeViewModal}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
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

          <section className="min-w-0">
            <div className="relative grid w-full max-w-[420px] grid-cols-2 overflow-hidden rounded-full bg-[#f2f4f7] shadow-sm">
              <div
                className={`absolute bottom-0 top-0 w-1/2 rounded-full bg-sibs-primary-1 shadow-sm transition-all duration-300 ${
                  activeTab === "Attrition" ? "left-1/2" : "left-0"
                }`}
              />

              {tabs.map(({ label, count }) => {
                const isActive = activeTab === label;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setActiveTab(label)}
                    className={`relative z-[1] flex min-h-11 min-w-0 items-center justify-center gap-2 px-4 text-sm font-medium transition ${
                      isActive ? "text-white" : "text-[#344054]"
                    }`}
                  >
                    <span className="truncate">{label}</span>

                    {count > 0 && (
                      <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {activeTab === "Attrition" && (
            <section className="min-w-0 overflow-hidden rounded-xl bg-white shadow-sm">
              <AttritionTable
                reloadKey={reloadKey}
                onView={handleOpenView}
                onEdit={handleOpenEdit}
              />
            </section>
          )}

          {activeTab === "Resignation" && (
            <section className="min-w-0 overflow-hidden rounded-xl bg-white shadow-sm">
              <ResignationTable
                data={resignations}
                loading={resignationLoading}
                onUpdateSupervisor={handleUpdateSupervisor}
              />
            </section>
          )}

          {activeTab === "Attrition List" && (
            <section className="min-w-0 overflow-hidden rounded-xl bg-white shadow-sm">
              <EmployeeAttritionTable
                data={attritions}
                loading={attritionLoading}
              />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}