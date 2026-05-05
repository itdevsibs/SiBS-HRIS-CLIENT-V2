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
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={() => !submitLoading && onClose?.()}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-sibs-primary-1">
              Create Job Requisition
            </h2>
            <p className="text-sm text-gray-500">
              Fill in the requisition details and submit for approval
            </p>
          </div>

          <button
            type="button"
            onClick={() => !submitLoading && onClose?.()}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-sibs-primary-1"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[85vh] overflow-y-auto p-6">
          <div className="space-y-8">
            <Section title="Basic Information">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => !submitLoading && onClose?.()}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitLoading}
                className="rounded-lg bg-[var(--sibs-primary-1)] px-4 py-2 text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {submitLoading ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Input({ label, name, onChange, type = "text", full, value }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="text-sm">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border px-3 py-2"
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
      <label className="text-sm">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
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
      <label className="text-sm">{label}</label>

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
        className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
      />

      {open && !disabled && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-white shadow">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className="block w-full px-3 py-2 text-left hover:bg-gray-100"
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
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
      <label className="text-sm">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="mt-1 w-full rounded-lg border px-3 py-2"
      />
      {helper && <p className="mt-1 text-xs text-gray-400">{helper}</p>}
    </div>
  );
}