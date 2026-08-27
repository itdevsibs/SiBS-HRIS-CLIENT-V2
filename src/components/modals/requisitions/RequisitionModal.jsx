import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  getDepartments,
  getHiringManagers,
  submitRequisition,
} from "@/lib/axios/getRequisition";

export default function RequisitionModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    jobTitle: "",
    department: "",
    hiringManager: "",
    positionRank: "",
    employmentType: "",
    officeLocation: "",
    workSetup: "",
    headcount: 1,
    startDate: "",
    businessJustification: "",
    jobDescription: "",
    responsibilities: "",
    requiredQualifications: "",
    preferredQualifications: "",
  });

  const [showJobDetails, setShowJobDetails] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [hiringManagers, setHiringManagers] = useState([]);

  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingHiringManagers, setLoadingHiringManagers] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    fetchDepartments();
    fetchHiringManagers();

    const handleEscape = (e) => {
      if (e.key === "Escape" && !submitLoading) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, submitLoading, onClose]);

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const result = await getDepartments();
      if (!result?.success) {
        setDepartments([]);
        return;
      }
      setDepartments(result.data || []);
    } catch (error) {
      console.error("Fetch departments error:", error);
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchHiringManagers = async () => {
    try {
      setLoadingHiringManagers(true);
      const result = await getHiringManagers();
      if (result?.success) {
        setHiringManagers(result.data || []);
      } else {
        setHiringManagers([]);
      }
    } catch (error) {
      console.error("Fetch hiring managers error:", error);
      setHiringManagers([]);
    } finally {
      setLoadingHiringManagers(false);
    }
  };

  const filteredHiringManagers = useMemo(() => {
    if (!form.department) return hiringManagers;

    return hiringManagers.filter(
      (manager) => String(manager.departmentId) === String(form.department)
    );
  }, [hiringManagers, form.department]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "department") {
        next.hiringManager = "";
      }

      return next;
    });
  };

  const resetForm = () => {
    setForm({
      jobTitle: "",
      department: "",
      hiringManager: "",
      positionRank: "",
      employmentType: "",
      officeLocation: "",
      workSetup: "",
      headcount: 1,
      startDate: "",
      businessJustification: "",
      jobDescription: "",
      responsibilities: "",
      requiredQualifications: "",
      preferredQualifications: "",
    });
    setShowJobDetails(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitLoading(true);

      const result = await submitRequisition(form);

      if (!result?.success) {
        alert(result?.message || "Failed to submit requisition");
        return;
      }

      alert(result.message || "Requisition submitted successfully");
      resetForm();
      onClose?.();
      onSuccess?.();
    } catch (error) {
      console.error("Submit requisition error:", error);
      alert("Failed to submit requisition");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[120] flex items-center justify-center p-2 font-jakarta sm:p-4"
      onClick={() => !submitLoading && onClose?.()}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="sibs-modal-pop-in flex max-h-[90dvh] w-full max-w-5xl 2xl:max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl font-jakarta"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="min-w-0">
            <h2 className="truncate text-base sm:text-lg 2xl:text-xl font-extrabold text-white">
              Create Job Requisition
            </h2>
            <p className="mt-0.5 truncate sibs-text-xs font-semibold text-white/75">
              Fill in the requisition details and submit for approval
            </p>
          </div>

          <button
            type="button"
            onClick={() => !submitLoading && onClose?.()}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 2xl:p-6 sibs-scrollbar space-y-6">
            <Section title="Basic Information">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Job Title *"
                  name="jobTitle"
                  value={form.jobTitle}
                  onChange={handleChange}
                  full
                />

                <SearchableSelect
                  label="Department *"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  options={departments.map((dept) => ({
                    value: dept.id_department,
                    label: `${dept.name_department || ""}`.toUpperCase(),
                  }))}
                  placeholder={
                    loadingDepartments
                      ? "Loading Department..."
                      : "Search Department"
                  }
                  disabled={loadingDepartments}
                />

                <SearchableSelect
                  label="Hiring Manager *"
                  name="hiringManager"
                  value={form.hiringManager}
                  onChange={handleChange}
                  options={filteredHiringManagers.map((manager) => ({
                    value: manager.sibsId,
                    label: `${manager.fullName || ""}`.toUpperCase(),
                  }))}
                  placeholder={
                    loadingHiringManagers
                      ? "Loading Hiring Manager..."
                      : "Search Hiring Manager"
                  }
                  disabled={loadingHiringManagers}
                />

                <Select
                  label="Position Rank *"
                  name="positionRank"
                  value={form.positionRank}
                  onChange={handleChange}
                  options={[
                    { value: "rank-and-file", label: "Rank and File" },
                    { value: "supervisor", label: "Supervisor" },
                    { value: "manager", label: "Manager" },
                    { value: "senior-manager", label: "Senior Manager" },
                  ]}
                />

                <Select
                  label="Employment Type *"
                  name="employmentType"
                  value={form.employmentType}
                  onChange={handleChange}
                  options={[
                    { value: "regular", label: "Regular" },
                    { value: "probationary", label: "Probationary" },
                    { value: "contractual", label: "Contractual" },
                    { value: "project-based", label: "Project Based" },
                  ]}
                />

                <Select
                  label="Office Location *"
                  name="officeLocation"
                  value={form.officeLocation}
                  onChange={handleChange}
                  options={[
                    { value: "Tagum", label: "Tagum" },
                    { value: "Davao", label: "Davao" },
                    { value: "Mabini", label: "Mabini" },
                  ]}
                />

                <Select
                  label="Work Setup *"
                  name="workSetup"
                  value={form.workSetup}
                  onChange={handleChange}
                  options={[
                    { value: "Onsite", label: "Onsite" },
                    { value: "WFH", label: "WFH" },
                  ]}
                />

                <Input
                  label="Total Headcount Needed *"
                  type="number"
                  name="headcount"
                  value={form.headcount}
                  onChange={handleChange}
                />

                <Input
                  label="Target Start Date *"
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                />
              </div>
            </Section>

            <div className="rounded-xl border p-4">
              <div
                onClick={() => setShowJobDetails((prev) => !prev)}
                className="flex cursor-pointer select-none items-center justify-between rounded p-2 hover:bg-gray-50"
              >
                <div>
                  <h2 className="font-semibold">Job Details</h2>
                  <p className="text-sm text-gray-500">
                    Generate a first draft for the fields below using the Job
                    Title and Position Rank.
                  </p>
                </div>

                <span className="text-sm text-gray-400">
                  {showJobDetails ? "Hide ▲" : "Add ▼"}
                </span>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  showJobDetails
                    ? "mt-4 max-h-[2000px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-4">
                  <Textarea
                    label="Business Justification *"
                    name="businessJustification"
                    value={form.businessJustification}
                    onChange={handleChange}
                    helper="Explain why this position needs to be filled"
                  />

                  <Textarea
                    label="Job Description *"
                    name="jobDescription"
                    value={form.jobDescription}
                    onChange={handleChange}
                  />

                  <Textarea
                    label="Key Responsibilities *"
                    name="responsibilities"
                    value={form.responsibilities}
                    onChange={handleChange}
                  />

                  <Textarea
                    label="Required Qualifications *"
                    name="requiredQualifications"
                    value={form.requiredQualifications}
                    onChange={handleChange}
                  />

                  <Textarea
                    label="Preferred Qualifications"
                    name="preferredQualifications"
                    value={form.preferredQualifications}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 2xl:py-3.5 sm:px-6">
            <button
              type="button"
              onClick={() => !submitLoading && onClose?.()}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitLoading}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] active:scale-[0.98] disabled:opacity-50"
            >
              {submitLoading ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="mb-3 text-xs 2xl:text-sm font-extrabold uppercase tracking-wide text-[#042C51]">{title}</h2>
      {children}
    </div>
  );
}

function Input({ label, name, onChange, type = "text", full, value }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#042C51] outline-none transition focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10"
      />
    </div>
  );
}

function Select({
  label,
  name,
  onChange,
  value,
  options = [],
  placeholder = "Select",
  disabled = false,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#042C51] outline-none transition focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:bg-[#EEF2F6] disabled:text-[#98A2B3]"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SearchableSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "SEARCH",
  disabled = false,
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  const filteredOptions = options.filter((option) =>
    option.label.toUpperCase().includes(search.toUpperCase())
  );

  const handleSelect = (optionValue) => {
    onChange({
      target: {
        name,
        value: optionValue,
      },
    });

    const selected = options.find(
      (option) => String(option.value) === String(optionValue)
    );

    setSearch(selected?.label || "");
    setOpen(false);
  };

  useEffect(() => {
    if (selectedOption) {
      setSearch(selectedOption.label);
    } else {
      setSearch("");
    }
  }, [selectedOption]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);

        if (selectedOption) {
          setSearch(selectedOption.label);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedOption]);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">{label}</label>

      <input
        type="text"
        name={`${name}_search`}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value.toUpperCase());
          setOpen(true);

          onChange({
            target: {
              name,
              value: "",
            },
          });
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className="h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:bg-[#EEF2F6] disabled:text-[#98A2B3]"
      />

      {open && !disabled && (
        <div className="sibs-dropdown-pop-in absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[#D7DEE8] bg-white p-1 shadow-lg sibs-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className="block w-full rounded-lg px-3 py-2 text-left sibs-text-xs font-semibold text-[#042C51] hover:bg-[#F8FAFC]"
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 sibs-text-xs font-semibold text-[#98A2B3]">
              NO RESULTS FOUND
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Textarea({ label, name, onChange, helper, value }) {
  return (
    <div>
      <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] p-3 sibs-text-xs font-semibold text-[#042C51] outline-none transition focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10"
      />
      {helper && <p className="mt-1 text-[10px] font-medium text-[#98A2B3]">{helper}</p>}
    </div>
  );
}
