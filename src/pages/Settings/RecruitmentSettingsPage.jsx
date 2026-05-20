import React, { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  ClipboardCheck,
  FileText,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  XCircle,
  GripVertical,
  Save,
  RotateCcw,
  Copy,
  CalendarDays,
  Mail,
  UserCheck,
} from "lucide-react";

const defaultFinalInterviewFields = [
  {
    id: 1,
    label: "Candidate Name",
    type: "Short Text",
    required: true,
    section: "Candidate Information",
    enabled: true,
  },
  {
    id: 2,
    label: "Position Applied",
    type: "Short Text",
    required: true,
    section: "Candidate Information",
    enabled: true,
  },
  {
    id: 3,
    label: "Communication Skills",
    type: "Rating",
    required: true,
    section: "Interview Assessment",
    enabled: true,
  },
  {
    id: 4,
    label: "Technical / Role Fit",
    type: "Rating",
    required: true,
    section: "Interview Assessment",
    enabled: true,
  },
  {
    id: 5,
    label: "Culture Fit",
    type: "Rating",
    required: true,
    section: "Interview Assessment",
    enabled: true,
  },
  {
    id: 6,
    label: "Final Recommendation",
    type: "Dropdown",
    required: true,
    section: "Final Decision",
    enabled: true,
  },
  {
    id: 7,
    label: "Interview Remarks",
    type: "Paragraph",
    required: false,
    section: "Final Decision",
    enabled: true,
  },
];

const recruitmentTabs = [
  "Final Interview Form",
  "Pipeline Settings",
  "Assessment Settings",
  "Email Templates",
  "Approval Rules",
];

const fieldTypes = [
  "Short Text",
  "Paragraph",
  "Dropdown",
  "Rating",
  "Date",
  "Number",
  "Checkbox",
];

const pipelineStages = [
  "Initial Screening",
  "Online Assessment",
  "Interview Scheduled",
  "Interviewed",
  "Offered",
  "Accepted",
  "Drop-off",
];

function SettingsMetric({ label, value, description, icon: Icon, valueClassName = "text-sibs-primary-1" }) {
  return (
    <div className="h-[126px] rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex h-full items-center justify-between gap-4">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate whitespace-nowrap text-xs font-bold uppercase leading-none tracking-wide text-sibs-tertiary-5">
            {label}
          </p>

          <p className={`mt-4 truncate text-3xl font-extrabold leading-none ${valueClassName}`}>
            {value}
          </p>

          <p className="mt-2 truncate whitespace-nowrap text-xs font-semibold leading-none text-sibs-tertiary-5">
            {description}
          </p>
        </div>

        {Icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ active, children }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${
        active
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-red-100 bg-red-50 text-red-600"
      }`}
    >
      {children}
    </span>
  );
}

export default function RecruitmentSettingsPage() {
  const [activeTab, setActiveTab] = useState("Final Interview Form");
  const [search, setSearch] = useState("");
  const [formName, setFormName] = useState("Final Interview Assessment Form");
  const [formStatus, setFormStatus] = useState("Active");
  const [passingScore, setPassingScore] = useState("80");
  const [fields, setFields] = useState(defaultFinalInterviewFields);

  const [newField, setNewField] = useState({
    label: "",
    type: "Short Text",
    section: "Interview Assessment",
    required: false,
  });

  const filteredFields = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return fields.filter((field) => {
      if (!keyword) return true;

      return (
        field.label.toLowerCase().includes(keyword) ||
        field.type.toLowerCase().includes(keyword) ||
        field.section.toLowerCase().includes(keyword)
      );
    });
  }, [fields, search]);

  const enabledFields = fields.filter((field) => field.enabled).length;
  const requiredFields = fields.filter((field) => field.required).length;

  function handleAddField() {
    if (!newField.label.trim()) return;

    setFields((prev) => [
      ...prev,
      {
        id: Date.now(),
        label: newField.label.trim(),
        type: newField.type,
        section: newField.section,
        required: newField.required,
        enabled: true,
      },
    ]);

    setNewField({
      label: "",
      type: "Short Text",
      section: "Interview Assessment",
      required: false,
    });
  }

  function handleToggleField(id, key) {
    setFields((prev) =>
      prev.map((field) =>
        field.id === id
          ? {
              ...field,
              [key]: !field[key],
            }
          : field,
      ),
    );
  }

  function handleDeleteField(id) {
    setFields((prev) => prev.filter((field) => field.id !== id));
  }

  function handleResetFields() {
    setFields(defaultFinalInterviewFields);
    setFormName("Final Interview Assessment Form");
    setFormStatus("Active");
    setPassingScore("80");
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <Settings size={14} />
                Recruitment Setup
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Recruitment Settings
              </h1>

              <p className="mt-1 max-w-5xl text-sm font-medium leading-6 text-sibs-tertiary-5">
                Configure recruitment forms, final interview scoring, pipeline stages,
                email templates, approvals, and candidate workflow rules.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleResetFields}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md"
              >
                <RotateCcw size={18} />
                Reset
              </button>

              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md"
              >
                <Eye size={18} />
                Preview Form
              </button>

              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95"
              >
                <Save size={18} />
                Save Settings
              </button>
            </div>
          </div>

          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-bold text-[#101828]">
              Recruitment Configuration Summary
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <SettingsMetric
                label="Active Forms"
                value="4"
                description="Recruitment forms"
                icon={FileText}
              />

              <SettingsMetric
                label="Interview Fields"
                value={fields.length}
                description={`${enabledFields} enabled fields`}
                icon={ClipboardCheck}
              />

              <SettingsMetric
                label="Required Fields"
                value={requiredFields}
                description="Must be answered"
                icon={CheckCircle2}
                valueClassName="text-emerald-600"
              />

              <SettingsMetric
                label="Pipeline Stages"
                value={pipelineStages.length}
                description="Configured flow"
                icon={SlidersHorizontal}
              />

              <SettingsMetric
                label="Passing Score"
                value={`${passingScore}%`}
                description="Final interview"
                icon={UserCheck}
                valueClassName="text-blue-600"
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
            <div className="border-b border-[#E6ECF2] bg-white px-4 py-3 sm:px-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[#101828]">
                    Settings Modules
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                    Manage recruitment workflows and form setup from one place.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {recruitmentTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-xs font-extrabold transition ${
                        activeTab === tab
                          ? "border-sibs-primary-1 bg-sibs-primary-1 text-white shadow-sm"
                          : "border-[#D6DEE8] bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeTab === "Final Interview Form" && (
              <div className="grid grid-cols-1 gap-5 bg-[#F5F7FA] p-4 xl:grid-cols-[420px_1fr]">
                <div className="space-y-5">
                  <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-extrabold text-[#101828]">
                          Form Details
                        </h3>
                        <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                          Set the active final interview form used when clicking
                          Start Interview from Candidate Pipeline.
                        </p>
                      </div>

                      <StatusPill active={formStatus === "Active"}>
                        {formStatus}
                      </StatusPill>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-bold text-[#101828]">
                          Form Name
                        </label>
                        <input
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-bold text-[#101828]">
                            Status
                          </label>
                          <select
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value)}
                            className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                          >
                            <option>Active</option>
                            <option>Draft</option>
                            <option>Archived</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-bold text-[#101828]">
                            Passing Score
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={passingScore}
                              onChange={(e) => setPassingScore(e.target.value)}
                              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pr-10 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-sibs-tertiary-5">
                              %
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-bold text-[#101828]">
                          Description
                        </label>
                        <textarea
                          rows={4}
                          defaultValue="Final interview assessment used by recruiters, operations managers, and approvers to evaluate candidate readiness."
                          className="w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold leading-6 text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                    <h3 className="text-base font-extrabold text-[#101828]">
                      Add Form Field
                    </h3>
                    <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                      Add custom questions for the final interview form.
                    </p>

                    <div className="mt-5 space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-bold text-[#101828]">
                          Field Label
                        </label>
                        <input
                          value={newField.label}
                          onChange={(e) =>
                            setNewField((prev) => ({
                              ...prev,
                              label: e.target.value,
                            }))
                          }
                          placeholder="Example: Attendance Reliability"
                          className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-bold text-[#101828]">
                            Field Type
                          </label>
                          <select
                            value={newField.type}
                            onChange={(e) =>
                              setNewField((prev) => ({
                                ...prev,
                                type: e.target.value,
                              }))
                            }
                            className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                          >
                            {fieldTypes.map((type) => (
                              <option key={type}>{type}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-bold text-[#101828]">
                            Section
                          </label>
                          <select
                            value={newField.section}
                            onChange={(e) =>
                              setNewField((prev) => ({
                                ...prev,
                                section: e.target.value,
                              }))
                            }
                            className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                          >
                            <option>Candidate Information</option>
                            <option>Interview Assessment</option>
                            <option>Final Decision</option>
                            <option>Operations Review</option>
                          </select>
                        </div>
                      </div>

                      <label className="flex items-center gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
                        <input
                          type="checkbox"
                          checked={newField.required}
                          onChange={(e) =>
                            setNewField((prev) => ({
                              ...prev,
                              required: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 accent-sibs-primary-1"
                        />
                        <span className="text-sm font-bold text-[#344054]">
                          Required field
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={handleAddField}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95"
                      >
                        <Plus size={18} />
                        Add Field
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                      <div>
                        <h3 className="text-base font-extrabold text-[#101828]">
                          Final Interview Form Builder
                        </h3>
                        <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                          Configure fields, required status, and visibility.
                        </p>
                      </div>

                      <div className="relative w-full xl:w-[380px]">
                        <Search
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                        />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search fields..."
                          className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-10 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                        />
                      </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-xl border border-[#E6ECF2]">
                      <div className="grid grid-cols-[44px_1.3fr_160px_180px_120px_120px] bg-[#F8FAFC] px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                        <div />
                        <div>Field Label</div>
                        <div>Type</div>
                        <div>Section</div>
                        <div>Required</div>
                        <div className="text-right">Actions</div>
                      </div>

                      <div className="divide-y divide-[#EEF2F6] bg-white">
                        {filteredFields.map((field) => (
                          <div
                            key={field.id}
                            className="grid grid-cols-[44px_1.3fr_160px_180px_120px_120px] items-center px-4 py-4 text-sm transition hover:bg-[#F8FAFC]"
                          >
                            <div className="text-sibs-tertiary-5">
                              <GripVertical size={18} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-extrabold text-[#101828]">
                                {field.label}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                                {field.enabled ? "Visible in form" : "Hidden from form"}
                              </p>
                            </div>

                            <div className="font-bold text-[#344054]">
                              {field.type}
                            </div>

                            <div className="font-bold text-[#344054]">
                              {field.section}
                            </div>

                            <div>
                              <button
                                type="button"
                                onClick={() => handleToggleField(field.id, "required")}
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${
                                  field.required
                                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                    : "border-gray-200 bg-gray-50 text-gray-600"
                                }`}
                              >
                                {field.required ? "Required" : "Optional"}
                              </button>
                            </div>

                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleField(field.id, "enabled")}
                                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                                  field.enabled
                                    ? "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                                }`}
                                title={field.enabled ? "Disable field" : "Enable field"}
                              >
                                {field.enabled ? (
                                  <CheckCircle2 size={16} />
                                ) : (
                                  <XCircle size={16} />
                                )}
                              </button>

                              <button
                                type="button"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                                title="Edit field"
                              >
                                <Edit3 size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteField(field.id)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                                title="Delete field"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}

                        {!filteredFields.length && (
                          <div className="px-4 py-10 text-center">
                            <p className="text-sm font-extrabold text-sibs-tertiary-5">
                              No fields found.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-[#101828]">
                          Form Launch Rules
                        </h3>
                        <CalendarDays size={18} className="text-sibs-tertiary-5" />
                      </div>

                      <div className="mt-4 space-y-3">
                        {[
                          "Open from Candidate Pipeline Start Interview button",
                          "Require candidate ID and application ID in URL",
                          "Auto-save interview draft before final submission",
                          "Lock form after final recommendation is submitted",
                        ].map((rule) => (
                          <label
                            key={rule}
                            className="flex items-start gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3"
                          >
                            <input
                              type="checkbox"
                              defaultChecked
                              className="mt-0.5 h-4 w-4 accent-sibs-primary-1"
                            />
                            <span className="text-sm font-bold leading-5 text-[#344054]">
                              {rule}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-[#101828]">
                          Related Recruitment Settings
                        </h3>
                        <BriefcaseBusiness
                          size={18}
                          className="text-sibs-tertiary-5"
                        />
                      </div>

                      <div className="mt-4 space-y-3">
                        {[
                          {
                            title: "Candidate Pipeline",
                            desc: "Controls stage movement and interview start action.",
                          },
                          {
                            title: "Offers Page",
                            desc: "Controls approval visibility and offer movement.",
                          },
                          {
                            title: "Available Positions",
                            desc: "Controls public form and talent pool position list.",
                          },
                          {
                            title: "Email Templates",
                            desc: "Controls assessment and offer email messages.",
                          },
                        ].map((item) => (
                          <div
                            key={item.title}
                            className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                          >
                            <p className="text-sm font-extrabold text-[#101828]">
                              {item.title}
                            </p>
                            <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                              {item.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== "Final Interview Form" && (
              <div className="bg-[#F5F7FA] p-4">
                <div className="rounded-2xl border border-[#E6ECF2] bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
                    {activeTab === "Pipeline Settings" && (
                      <SlidersHorizontal size={24} />
                    )}
                    {activeTab === "Assessment Settings" && (
                      <ClipboardCheck size={24} />
                    )}
                    {activeTab === "Email Templates" && <Mail size={24} />}
                    {activeTab === "Approval Rules" && <UserCheck size={24} />}
                  </div>

                  <h3 className="mt-4 text-lg font-extrabold text-[#101828]">
                    {activeTab}
                  </h3>
                  <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-sibs-tertiary-5">
                    This section is ready for setup. You can add configuration
                    tables, forms, and rules here while keeping the same page
                    structure and theme.
                  </p>

                  <button
                    type="button"
                    className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95"
                  >
                    <Plus size={18} />
                    Add Setting
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#101828]">
                  Interview Form Link
                </h3>
                <Copy size={18} className="text-sibs-tertiary-5" />
              </div>

              <p className="mt-2 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                Used by the Start Interview button in Candidate Pipeline.
              </p>

              <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-xs font-bold text-sibs-primary-1">
                /recruitment/final-interview-form
              </div>
            </div>

            <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <h3 className="text-base font-extrabold text-[#101828]">
                Required URL Parameters
              </h3>

              <div className="mt-4 space-y-2">
                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
                  candidateId
                </div>
                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
                  candidateApplicationId
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <h3 className="text-base font-extrabold text-[#101828]">
                Recommended Next Setup
              </h3>

              <div className="mt-4 space-y-2">
                <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-sibs-primary-1">
                  Create final interview save logic.
                </p>
                <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-sibs-primary-1">
                  Connect interview result to Candidate Pipeline.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}