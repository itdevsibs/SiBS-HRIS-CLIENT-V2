import { useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Filter,
  FolderLock,
  GraduationCap,
  Grid,
  Heart,
  List,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserRoundPen,
  Users,
  X,
} from "lucide-react";

const EDUCATION_LEVEL_OPTIONS = [
  "Elementary",
  "Secondary",
  "Vocational",
  "College",
  "Graduate Studies",
];

const PIPELINE_STAGES = [
  "Sourcing",
  "Initial Screening",
  "Evaluation",
  "Final Interview",
  "Onboarding",
  "Completed",
];

function text(value) {
  return String(value ?? "").trim();
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return !["", "—", "-", "n/a", "null", "undefined"].includes(
    text(value).toLowerCase(),
  );
}

function toInputDate(value) {
  if (!value) return "";

  const rawValue = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return rawValue.slice(0, 10);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCurrentDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function SectionHeader({ title, subtitle, icon: Icon, isEditing, onEdit }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E9F0FC] text-[#042C51]">
              <Icon size={16} />
            </span>
          )}
          <h2 className="break-words text-sm font-black text-[#042C51]">
            {title}
          </h2>
        </div>
        <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-400">
          {subtitle ||
            "Official record values are shown from the existing employee data source."}
        </p>
      </div>

      {!isEditing && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#E6ECF2] bg-white px-3 text-[11px] font-black text-[#042C51] transition hover:bg-slate-50"
        >
          <Edit3 size={13} className="text-[#FF5C28]" />
          Edit Section
        </button>
      )}
    </div>
  );
}

function Panel({ title, accent = "orange", children, className = "" }) {
  const dotClass = accent === "navy" ? "bg-[#042C51]" : "bg-[#FF5C28]";

  return (
    <section
      className={`rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 transition hover:border-slate-300 ${className}`}
    >
      {title && (
        <h3 className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2.5 text-[11px] font-black uppercase tracking-wider text-[#042C51]">
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

function ReadField({ label, value, mono = false, className = "" }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 text-left ${className}`}>
      <span className="block text-[10px] font-bold uppercase tracking-wide text-[#8EA3BF]">
        {label}
      </span>

      <div className="flex min-h-[40px] items-center rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5 transition-colors duration-150">
        <span
          className={`block min-w-0 break-words text-xs font-semibold leading-normal ${
            hasValue(value) ? "text-[#101828]" : "text-[#98A2B3]"
          } ${mono ? "font-mono" : ""}`}
        >
          {hasValue(value) ? value : "—"}
        </span>
      </div>
    </div>
  );
}

function FieldControl({
  label,
  value,
  onChange,
  type = "text",
  options = [],
  required = false,
  rows = 3,
  placeholder = "",
  className = "",
}) {
  const common =
    "w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#101828] outline-none transition-all duration-150 placeholder:text-[#98A2B3] hover:border-[#C9D6E4] focus:border-[#042C51] focus:bg-white focus:ring-2 focus:ring-[#042C51]/10";

  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#8EA3BF]">
        {label} {required ? "*" : ""}
      </span>

      {type === "textarea" ? (
        <textarea
          rows={rows}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${common} min-h-[80px] resize-y px-3 py-2.5`}
        />
      ) : type === "select" ? (
        <select
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          className={`${common} h-10 cursor-pointer`}
        >
          <option value="">Choose option</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${common} h-10`}
        />
      )}
    </label>
  );
}

function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-[#F8FAFC] px-5 py-10 text-center">
      <p className="text-xs font-semibold text-slate-400">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 text-xs font-black text-[#042C51] hover:text-[#FF5C28]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function SaveBar({ label, onCancel, onSave }) {
  return (
    <div className="sticky bottom-3 z-40 mt-6 flex flex-col gap-3 rounded-xl border border-[#E6ECF2] bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        <span className="text-[11px] font-black text-[#042C51]">
          Modified draft: {label}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-8 flex-1 rounded-lg bg-slate-100 px-3 text-[11px] font-black text-[#667085] transition hover:bg-slate-200 sm:flex-none"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#042C51] px-4 text-[11px] font-black text-white transition hover:bg-[#063560] sm:flex-none"
        >
          <Save size={13} className="text-[#FF5C28]" />
          Save Changes
        </button>
      </div>
    </div>
  );
}

function CopyButton({ value, copyKey, copiedKey, onCopy }) {
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={() => onCopy(value, copyKey)}
      className="rounded-lg p-1.5 text-[#667085] hover:bg-white hover:text-[#042C51]"
      title="Copy value"
    >
      {copiedKey === copyKey ? (
        <Check size={15} className="text-emerald-600" />
      ) : (
        <Copy size={15} />
      )}
    </button>
  );
}

export function PersonalSection({
  employee,
  selectedSubTab,
  isEditing,
  onEdit,
  onChange,
  onSave,
  onCancel,
}) {
  const [copiedKey, setCopiedKey] = useState("");
  const [masked, setMasked] = useState({
    gsis: true,
    sss: true,
    phic: true,
    hdmf: true,
    tin: true,
  });

  function copyValue(value, key) {
    if (!value) return;
    navigator.clipboard?.writeText(String(value));
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(""), 1400);
  }

  function maskedValue(value, shouldMask) {
    const normalized = text(value);
    if (!normalized) return "—";
    if (!shouldMask) return normalized;
    const visible = normalized.slice(-4);
    return `${"•".repeat(Math.max(normalized.length - 4, 4))}${visible}`;
  }

  const titleBySubTab = {
    basic: "Basic Identity Information",
    contact: "Contact Information",
    address: "Registered Addresses & Work Environment",
    ids: "Government Registrations",
  };
  const title = titleBySubTab[selectedSubTab] || titleBySubTab.basic;

  return (
    <div>
      {selectedSubTab === "basic" && (
        isEditing ? (
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <FieldControl
              label="First Name"
              value={employee?.firstName}
              onChange={(value) => onChange("firstName", value)}
              required
            />
            <FieldControl
              label="Middle Name"
              value={employee?.middleName}
              onChange={(value) => onChange("middleName", value)}
            />
            <FieldControl
              label="Last Name"
              value={employee?.lastName}
              onChange={(value) => onChange("lastName", value)}
              required
            />
            <FieldControl
              label="Name Extension (Jr/III)"
              value={employee?.nameExtension}
              onChange={(value) => onChange("nameExtension", value)}
              placeholder="Jr., III"
            />
            <FieldControl
              label="Preferred Name"
              value={employee?.preferredName}
              onChange={(value) => onChange("preferredName", value)}
            />
            <FieldControl
              label="Birth Date"
              type="date"
              value={toInputDate(employee?.birthdate)}
              onChange={(value) => onChange("birthdate", value)}
              required
            />
            <FieldControl
              label="Place of Birth"
              value={employee?.placeOfBirth}
              onChange={(value) => onChange("placeOfBirth", value)}
            />
            <FieldControl
              label="Gender"
              type="select"
              options={["Male", "Female", "Non-binary", "Prefer not to say"]}
              value={employee?.gender}
              onChange={(value) => onChange("gender", value)}
            />
            <FieldControl
              label="Civil Status"
              type="select"
              options={["Single", "Married", "Separated", "Widowed"]}
              value={employee?.civilStatus}
              onChange={(value) => onChange("civilStatus", value)}
            />
            <FieldControl
              label="Citizenship"
              value={employee?.citizenship}
              onChange={(value) => onChange("citizenship", value)}
            />
            <FieldControl
              label="Blood Type"
              type="select"
              options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
              value={employee?.bloodType}
              onChange={(value) => onChange("bloodType", value)}
            />
            <FieldControl
              label="Height"
              value={employee?.height}
              onChange={(value) => onChange("height", value)}
              placeholder="178 cm"
            />
            <FieldControl
              label="Weight"
              value={employee?.weight}
              onChange={(value) => onChange("weight", value)}
              placeholder="74 kg"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <ReadField label="First Name" value={employee?.firstName} />
            <ReadField label="Middle Name" value={employee?.middleName} />
            <ReadField label="Last Name" value={employee?.lastName} />
            <ReadField label="Name Extension (Jr/III)" value={employee?.nameExtension} />
            <ReadField label="Preferred Name" value={employee?.preferredName} />
            <ReadField label="Birth Date" value={toInputDate(employee?.birthdate)} />
            <ReadField label="Place of Birth" value={employee?.placeOfBirth} />
            <ReadField label="Gender" value={employee?.gender} />
            <ReadField label="Civil Status" value={employee?.civilStatus} />
            <ReadField label="Citizenship" value={employee?.citizenship} />
            <ReadField label="Blood Type" value={employee?.bloodType} />
            <ReadField label="Height" value={employee?.height} />
            <ReadField label="Weight" value={employee?.weight} />
          </div>
        )
      )}

      {selectedSubTab === "contact" && (
        isEditing ? (
          <Panel title="Modify Contact Details">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FieldControl label="Email" type="email" value={employee?.email} onChange={(v) => onChange("email", v)} required />
              <FieldControl label="Mobile Number" value={employee?.contact} onChange={(v) => onChange("contact", v)} required />
              <FieldControl label="Telephone" value={employee?.telephone} onChange={(v) => onChange("telephone", v)} />
            </div>
          </Panel>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: "Corporate Email", value: employee?.email, icon: Mail, key: "email", tone: "bg-blue-50 text-blue-600" },
              { label: "Mobile Number", value: employee?.contact, icon: Phone, key: "mobile", tone: "bg-emerald-50 text-emerald-600" },
              { label: "Telephone", value: employee?.telephone, icon: Building2, key: "telephone", tone: "bg-orange-50 text-[#FF5C28]" },
            ].map((item) => (
              <Panel key={item.key}>
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}>
                    <item.icon size={19} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">{item.label}</p>
                    <p className="text-xs font-semibold text-[#52637A]">Primary contact channel</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F3F6FA] px-3 py-3">
                  <span className={`min-w-0 break-all text-sm font-extrabold ${hasValue(item.value) ? "text-[#344054]" : "italic text-[#98A2B3]"}`}>
                    {hasValue(item.value) ? item.value : "—"}
                  </span>
                  <CopyButton value={item.value} copyKey={item.key} copiedKey={copiedKey} onCopy={copyValue} />
                </div>
              </Panel>
            ))}
          </div>
        )
      )}

      {selectedSubTab === "address" && (
        isEditing ? (
          <Panel title="Update Address Details">
            <div className="space-y-4">
              <FieldControl label="Residential Address" type="textarea" rows={3} value={employee?.residentialAddress} onChange={(v) => onChange("residentialAddress", v)} required />
              <FieldControl label="Permanent Address" type="textarea" rows={3} value={employee?.permanentAddress} onChange={(v) => onChange("permanentAddress", v)} required />
              <FieldControl label="Work Setup" type="select" options={["Hybrid", "WFH", "On-site", "Onsite"]} value={employee?.workSetup} onChange={(v) => onChange("workSetup", v)} className="max-w-sm" />
            </div>
          </Panel>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {[
                ["Residential Address", employee?.residentialAddress, "orange"],
                ["Permanent Address", employee?.permanentAddress, "navy"],
              ].map(([label, value, accent]) => (
                <Panel key={label} title={label} accent={accent}>
                  <p className={`min-h-24 rounded-xl bg-[#F8FAFC] p-4 text-sm font-bold leading-6 ${hasValue(value) ? "text-[#344054]" : "italic text-[#98A2B3]"}`}>
                    {hasValue(value) ? value : "—"}
                  </p>
                </Panel>
              ))}
            </div>
            <Panel>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Building2 size={23} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#042C51]">Active Work Arrangement</h3>
                    <p className="mt-0.5 text-xs font-medium text-[#667085]">Current corporate work setup assignment.</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-[#E9F0FC] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
                  <span className="h-2 w-2 rounded-full bg-[#FF5C28]" />
                  {employee?.workSetup || "—"}
                </span>
              </div>
            </Panel>
          </div>
        )
      )}

      {selectedSubTab === "ids" && (
        isEditing ? (
          <Panel title="Modify Regulatory IDs">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldControl label="GSIS" value={employee?.gsis} onChange={(v) => onChange("gsis", v)} />
              <FieldControl label="SSS" value={employee?.sss} onChange={(v) => onChange("sss", v)} />
              <FieldControl label="PhilHealth" value={employee?.phic} onChange={(v) => onChange("phic", v)} />
              <FieldControl label="PAG-IBIG / HDMF" value={employee?.hdmf} onChange={(v) => onChange("hdmf", v)} />
              <FieldControl label="TIN" value={employee?.tin} onChange={(v) => onChange("tin", v)} className="md:col-span-2" />
            </div>
          </Panel>
        ) : (
          <Panel>
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold leading-5 text-amber-800">
              <Lock size={16} className="mt-0.5 shrink-0 text-amber-600" />
              Regulatory data is masked by default. Reveal or copy only when authorized.
            </div>
            <div className="divide-y divide-[#E6ECF2]">
              {[
                ["gsis", "GSIS", employee?.gsis],
                ["sss", "Social Security System (SSS)", employee?.sss],
                ["phic", "PhilHealth", employee?.phic],
                ["hdmf", "PAG-IBIG / HDMF", employee?.hdmf],
                ["tin", "Tax Identification Number (TIN)", employee?.tin],
              ].map(([key, label, value]) => (
                <div key={key} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">{label}</p>
                    <p className="mt-1 font-mono text-sm font-extrabold text-[#344054]">{maskedValue(value, masked[key])}</p>
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button type="button" onClick={() => setMasked((current) => ({ ...current, [key]: !current[key] }))} className="rounded-xl p-2 text-[#667085] hover:bg-[#F3F6FA] hover:text-[#042C51]" title={masked[key] ? "Reveal ID" : "Hide ID"}>
                      {masked[key] ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <CopyButton value={value} copyKey={key} copiedKey={copiedKey} onCopy={copyValue} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )
      )}

      {isEditing && <SaveBar label={title} onCancel={onCancel} onSave={onSave} />}
    </div>
  );
}

function calculateAge(value) {
  if (!value) return "—";
  const dateKey = toInputDate(value);
  const [year, month, day] = dateKey.split("-").map(Number);
  const birth = new Date(year, month - 1, day);
  if (Number.isNaN(birth.getTime())) return "—";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) age -= 1;
  return `${Math.max(age, 0)} yrs old`;
}

export function FamilySection({
  employee,
  selectedSubTab,
  isEditing,
  onEdit,
  onChange,
  onListChange,
  onSave,
  onCancel,
}) {
  const titleMap = {
    spouse: ["Spouse Information", "Official spouse and employment declarations.", Heart],
    parents: ["Parents Declaration", "Official father and mother details.", Users],
    children: ["Children Registered Records", "Dependent children records for benefits and tax allocations.", Sparkles],
    emergency: ["Emergency Contact Person", "Critical next-of-kin contact information.", ShieldAlert],
  };
  const [title, subtitle, Icon] = titleMap[selectedSubTab] || titleMap.spouse;
  const children = Array.isArray(employee?.children) ? employee.children : [];

  function updateChild(index, field, value) {
    onListChange(
      "children",
      children.map((child, childIndex) =>
        childIndex === index ? { ...child, [field]: value } : child,
      ),
    );
  }

  return (
    <div className="rounded-[20px] border border-[#D6E0EA] bg-white p-4 shadow-sm sm:p-6">
      <SectionHeader title={title} subtitle={subtitle} icon={Icon} isEditing={isEditing} onEdit={onEdit} />

      {selectedSubTab === "spouse" && (
        isEditing ? (
          <Panel title="Modify Spouse Details">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FieldControl label="Surname" value={employee?.spouseSurname} onChange={(v) => onChange("spouseSurname", v)} />
              <FieldControl label="First Name" value={employee?.spouseFirstName} onChange={(v) => onChange("spouseFirstName", v)} />
              <FieldControl label="Middle Name" value={employee?.spouseMiddleName} onChange={(v) => onChange("spouseMiddleName", v)} />
              <FieldControl label="Occupation" value={employee?.spouseOccupation} onChange={(v) => onChange("spouseOccupation", v)} />
              <FieldControl label="Employer / Business" value={employee?.spouseEmployer} onChange={(v) => onChange("spouseEmployer", v)} />
              <FieldControl label="Telephone" value={employee?.spouseTelephone} onChange={(v) => onChange("spouseTelephone", v)} />
              <FieldControl label="Business Address" type="textarea" value={employee?.spouseBusinessAddress} onChange={(v) => onChange("spouseBusinessAddress", v)} className="md:col-span-3" />
            </div>
          </Panel>
        ) : (
          <Panel>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              <ReadField label="Surname" value={employee?.spouseSurname} />
              <ReadField label="First Name" value={employee?.spouseFirstName} />
              <ReadField label="Middle Name" value={employee?.spouseMiddleName} />
              <ReadField label="Occupation" value={employee?.spouseOccupation} />
              <ReadField label="Employer / Business" value={employee?.spouseEmployer} />
              <ReadField label="Telephone" value={employee?.spouseTelephone} />
              <ReadField label="Business Address" value={employee?.spouseBusinessAddress} className="sm:col-span-2 lg:col-span-3" />
            </div>
          </Panel>
        )
      )}

      {selectedSubTab === "parents" && (
        isEditing ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel title="Father's Name Information" accent="navy">
              <div className="space-y-4">
                <FieldControl label="Surname" value={employee?.fatherSurname} onChange={(v) => onChange("fatherSurname", v)} />
                <FieldControl label="First Name" value={employee?.fatherFirstName} onChange={(v) => onChange("fatherFirstName", v)} />
                <FieldControl label="Middle Name" value={employee?.fatherMiddleName} onChange={(v) => onChange("fatherMiddleName", v)} />
              </div>
            </Panel>
            <Panel title="Mother's Maiden Name Information">
              <div className="space-y-4">
                <FieldControl label="Maiden Surname" value={employee?.motherMaidenSurname} onChange={(v) => onChange("motherMaidenSurname", v)} />
                <FieldControl label="First Name" value={employee?.motherFirstName} onChange={(v) => onChange("motherFirstName", v)} />
                <FieldControl label="Middle Name" value={employee?.motherMiddleName} onChange={(v) => onChange("motherMiddleName", v)} />
              </div>
            </Panel>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel title="Father's Details" accent="navy">
              <div className="space-y-5">
                <ReadField label="Surname" value={employee?.fatherSurname} />
                <ReadField label="First Name" value={employee?.fatherFirstName} />
                <ReadField label="Middle Name" value={employee?.fatherMiddleName} />
              </div>
            </Panel>
            <Panel title="Mother's Details (Maiden Name)">
              <div className="space-y-5">
                <ReadField label="Maiden Surname" value={employee?.motherMaidenSurname} />
                <ReadField label="First Name" value={employee?.motherFirstName} />
                <ReadField label="Middle Name" value={employee?.motherMiddleName} />
              </div>
            </Panel>
          </div>
        )
      )}

      {selectedSubTab === "children" && (
        isEditing ? (
          <Panel title={`Children Dependents (${children.length})`}>
            <div className="mb-4 flex justify-end">
              <button type="button" onClick={() => onListChange("children", [...children, { id: `child_${Date.now()}`, name: "", birthDate: "" }])} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white">
                <Plus size={14} /> Add Dependent
              </button>
            </div>
            {children.length === 0 ? (
              <EmptyState message="No children records. Add a dependent to begin." />
            ) : (
              <div className="space-y-4">
                {children.map((child, index) => (
                  <div key={child?.id || index} className="grid grid-cols-1 gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
                    <FieldControl label="Child's Full Name" value={child?.name} onChange={(v) => updateChild(index, "name", v)} required />
                    <FieldControl label="Birth Date" type="date" value={toInputDate(child?.birthDate)} onChange={(v) => updateChild(index, "birthDate", v)} required />
                    <button type="button" onClick={() => onListChange("children", children.filter((_, childIndex) => childIndex !== index))} className="flex h-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 px-3 text-red-600 hover:bg-red-100" title="Remove child">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        ) : (
          <Panel>
            {children.length === 0 ? (
              <EmptyState message="No children registered." actionLabel="Register a dependent child" onAction={onEdit} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E6ECF2] bg-[#F8FAFC] text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                      <th className="rounded-l-xl px-4 py-3">Child's Complete Name</th>
                      <th className="px-4 py-3">Birth Date</th>
                      <th className="rounded-r-xl px-4 py-3">Calculated Age</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6ECF2]">
                    {children.map((child, index) => (
                      <tr key={child?.id || index}>
                        <td className="px-4 py-4 font-extrabold text-[#344054]">{child?.name || "—"}</td>
                        <td className="px-4 py-4 font-semibold text-[#667085]">{formatDate(child?.birthDate)}</td>
                        <td className="px-4 py-4"><span className="rounded-full bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold text-[#042C51]">{calculateAge(child?.birthDate)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )
      )}

      {selectedSubTab === "emergency" && (
        isEditing ? (
          <Panel title="Modify Emergency Contact">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldControl label="Name" value={employee?.emergencyName} onChange={(v) => onChange("emergencyName", v)} required />
              <FieldControl label="Relationship" value={employee?.emergencyRelationship} onChange={(v) => onChange("emergencyRelationship", v)} required />
              <FieldControl label="Phone Number" value={employee?.emergencyPhone} onChange={(v) => onChange("emergencyPhone", v)} required />
              <FieldControl label="Email" type="email" value={employee?.emergencyEmail} onChange={(v) => onChange("emergencyEmail", v)} />
            </div>
          </Panel>
        ) : (
          <Panel className="max-w-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-red-100 bg-red-50 text-lg font-extrabold text-red-600">
                {text(employee?.emergencyName).slice(0, 2).toUpperCase() || "EC"}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-extrabold text-[#042C51]">{employee?.emergencyName || "—"}</h3>
                <span className="mt-1 inline-flex rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-red-700">{employee?.emergencyRelationship || "Emergency Contact"}</span>
                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#E6ECF2] pt-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#344054]"><Phone size={15} className="text-[#667085]" />{employee?.emergencyPhone || "—"}</div>
                  <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[#52637A]"><Mail size={15} className="shrink-0 text-[#667085]" /><span className="truncate">{employee?.emergencyEmail || "—"}</span></div>
                </div>
              </div>
            </div>
          </Panel>
        )
      )}

      {isEditing && <SaveBar label={title} onCancel={onCancel} onSave={onSave} />}
    </div>
  );
}

const RECORD_SCHEMAS = {
  education: {
    title: "Education Chronological Records",
    subtitle: "Comprehensive academic qualifications and school history.",
    icon: GraduationCap,
    listKey: "education",
    addLabel: "Add Education Record",
    empty: "No education records found.",
    newRecord: { level: "College", school: "", degree: "", from: "", to: "", highestLevel: "", yearGraduated: "", honors: "" },
    fields: [
      ["level", "Level", "select", EDUCATION_LEVEL_OPTIONS],
      ["school", "Name of School"],
      ["degree", "Degree / Course"],
      ["from", "From"],
      ["to", "To"],
      ["highestLevel", "Highest Level / Units Earned"],
      ["yearGraduated", "Year Graduated"],
      ["honors", "Honors Received"],
    ],
  },
  eligibility: {
    title: "Eligibility Chronological Records",
    subtitle: "Professional licenses, examination ratings, and validity records.",
    icon: BadgeCheck,
    listKey: "eligibility",
    addLabel: "Add Eligibility Record",
    empty: "No eligibility or license records found.",
    newRecord: { title: "", rating: "", examDate: "", examPlace: "", licenseNumber: "", validityDate: "" },
    fields: [
      ["title", "Eligibility / License"],
      ["rating", "Rating"],
      ["examDate", "Date of Exam / Conferment", "date"],
      ["examPlace", "Place of Exam / Conferment"],
      ["licenseNumber", "License Number"],
      ["validityDate", "Validity Date", "date"],
    ],
  },
  experience: {
    title: "Experience Chronological Records",
    subtitle: "Previous corporate engagements, roles, compensation, and duties.",
    icon: Briefcase,
    listKey: "experience",
    addLabel: "Add Experience Record",
    empty: "No work experience records found.",
    newRecord: { from: "", to: "", position: "", company: "", salary: "", salaryGrade: "", appointmentStatus: "", governmentService: "No", duties: "" },
    fields: [
      ["from", "From", "month"],
      ["to", "To", "month"],
      ["position", "Position Title"],
      ["company", "Company / Office"],
      ["salary", "Monthly Salary"],
      ["salaryGrade", "Salary / Job Grade"],
      ["appointmentStatus", "Status of Appointment"],
      ["governmentService", "Government Service Y/N", "select", ["Yes", "No"]],
      ["duties", "Duties", "textarea"],
    ],
  },
  training: {
    title: "Training Chronological Records",
    subtitle: "Learning and development programs, hours, and sponsors.",
    icon: Award,
    listKey: "trainings",
    addLabel: "Add Training Record",
    empty: "No training records found.",
    newRecord: { title: "", from: "", to: "", hours: "", type: "", conductedBy: "" },
    fields: [
      ["title", "Training Title"],
      ["from", "From", "date"],
      ["to", "To", "date"],
      ["hours", "Number of Hours"],
      ["type", "Type of LD"],
      ["conductedBy", "Conducted / Sponsored By"],
    ],
  },
  references: {
    title: "References Chronological Records",
    subtitle: "Professional and character references for background verification.",
    icon: UserCheck,
    listKey: "references",
    addLabel: "Add Reference",
    empty: "No references found.",
    newRecord: { name: "", address: "", telephone: "" },
    fields: [
      ["name", "Name"],
      ["address", "Address"],
      ["telephone", "Telephone Number"],
    ],
  },
};

function normalizeRecordValue(record, keys) {
  for (const key of keys) {
    if (hasValue(record?.[key])) return record[key];
  }
  return "";
}

function licenseStatus(value) {
  if (!value) return ["No Expiry", "bg-slate-50 text-slate-600 border-slate-200"];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return ["Review", "bg-amber-50 text-amber-700 border-amber-200"];
  const now = new Date();
  const soon = new Date();
  soon.setMonth(soon.getMonth() + 6);
  if (date < now) return ["Expired", "bg-red-50 text-red-700 border-red-200"];
  if (date <= soon) return ["Expiring Soon", "bg-amber-50 text-amber-700 border-amber-200"];
  return ["Valid", "bg-emerald-50 text-emerald-700 border-emerald-200"];
}

function GenericRecordEditor({ schema, records, onChange }) {
  function addRecord() {
    onChange([...records, { ...schema.newRecord, id: `${schema.listKey}_${Date.now()}` }]);
  }

  function updateRecord(index, field, value) {
    onChange(records.map((record, recordIndex) => recordIndex === index ? { ...record, [field]: value } : record));
  }

  function removeRecord(index) {
    onChange(records.filter((_, recordIndex) => recordIndex !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={addRecord} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white">
          <Plus size={14} /> {schema.addLabel}
        </button>
      </div>

      {records.length === 0 ? (
        <EmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={addRecord} />
      ) : (
        records.map((record, index) => (
          <Panel key={record?.id || index} title={`${schema.title.replace(" Chronological Records", "")} #${index + 1}`} accent={index % 2 ? "navy" : "orange"}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {schema.fields.map(([field, label, type = "text", options = []]) => (
                <FieldControl
                  key={field}
                  label={label}
                  type={type}
                  options={options}
                  value={type === "date" ? toInputDate(record?.[field]) : record?.[field]}
                  onChange={(value) => updateRecord(index, field, value)}
                  className={type === "textarea" ? "md:col-span-2 xl:col-span-3" : ""}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => removeRecord(index)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-extrabold text-red-600 hover:bg-red-100">
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </Panel>
        ))
      )}
    </div>
  );
}

export function TimelineSection({
  employee,
  activeSection,
  isEditing,
  onEdit,
  onListChange,
  onSave,
  onCancel,
}) {
  const schema = RECORD_SCHEMAS[activeSection] || RECORD_SCHEMAS.education;
  const records = Array.isArray(employee?.[schema.listKey]) ? employee[schema.listKey] : [];
  const [expanded, setExpanded] = useState({});

  return (
    <div className="rounded-[20px] border border-[#D6E0EA] bg-white p-4 shadow-sm sm:p-6">
      <SectionHeader title={schema.title} subtitle={schema.subtitle} icon={schema.icon} isEditing={isEditing} onEdit={onEdit} />

      {isEditing ? (
        <GenericRecordEditor schema={schema} records={records} onChange={(next) => onListChange(schema.listKey, next)} />
      ) : activeSection === "education" ? (
        <div className="relative ml-3 space-y-5 border-l-2 border-slate-200 pl-6">
          {records.length === 0 ? <EmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={onEdit} /> : records.map((record, index) => {
            const level = normalizeRecordValue(record, ["level"]);
            const school = normalizeRecordValue(record, ["school", "schoolName"]);
            const degree = normalizeRecordValue(record, ["degree", "degreeCourse"]);
            const honors = normalizeRecordValue(record, ["honors", "honorsReceived"]);
            return (
              <article key={record?.id || index} className="relative rounded-2xl border border-[#D6E0EA] bg-white p-5 shadow-sm">
                <span className="absolute -left-[33px] top-6 h-4 w-4 rounded-full border-4 border-white bg-[#042C51] shadow" />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">{level || "Education"}</span>
                      {honors && <span className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-[10px] font-extrabold text-[#FF5C28]"><Award size={12} />{honors}</span>}
                    </div>
                    <h3 className="mt-3 text-sm font-extrabold text-[#042C51]">{degree || "Academic Program"}</h3>
                    <p className="mt-1 text-xs font-bold text-[#52637A]">{school || "—"}</p>
                  </div>
                  <div className="rounded-xl bg-[#F3F6FA] px-3 py-2 text-[11px] font-extrabold text-[#344054]">{record?.from || "—"} — {record?.to || "Present"}</div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ReadField label="Highest Level / Units Earned" value={normalizeRecordValue(record, ["highestLevel", "highestLevelUnits"])} />
                  <ReadField label="Year Graduated" value={record?.yearGraduated} />
                </div>
              </article>
            );
          })}
        </div>
      ) : activeSection === "eligibility" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {records.length === 0 ? <div className="lg:col-span-2"><EmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={onEdit} /></div> : records.map((record, index) => {
            const [status, statusClass] = licenseStatus(record?.validityDate);
            return (
              <Panel key={record?.id || index}>
                <div className="flex items-start justify-between gap-3 border-b border-[#E6ECF2] pb-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-xs font-extrabold uppercase tracking-wide text-[#042C51]">{normalizeRecordValue(record, ["title", "eligibilityLicense"]) || "Eligibility / License"}</h3>
                    <p className="mt-1 font-mono text-[10px] text-[#667085]">License: {record?.licenseNumber || "—"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide ${statusClass}`}>{status}</span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ReadField label="Rating" value={record?.rating} />
                  <ReadField label="Validity Date" value={formatDate(record?.validityDate)} />
                  <ReadField label="Date of Exam / Conferment" value={formatDate(normalizeRecordValue(record, ["examDate", "dateOfExam"]))} />
                  <ReadField label="Place of Exam / Conferment" value={normalizeRecordValue(record, ["examPlace", "placeOfExam"])} />
                </div>
              </Panel>
            );
          })}
        </div>
      ) : activeSection === "experience" ? (
        <div className="relative ml-3 space-y-5 border-l-2 border-slate-200 pl-6">
          {records.length === 0 ? <EmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={onEdit} /> : records.map((record, index) => {
            const position = normalizeRecordValue(record, ["position", "positionTitle"]);
            const company = normalizeRecordValue(record, ["company", "companyOffice"]);
            const isOpen = expanded[index];
            return (
              <article key={record?.id || index} className="relative rounded-2xl border border-[#D6E0EA] bg-white p-5 shadow-sm">
                <span className="absolute -left-[33px] top-6 h-4 w-4 rounded-full border-4 border-white bg-indigo-600 shadow" />
                <div className="flex flex-col gap-3 border-b border-[#E6ECF2] pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#042C51]">{position || "—"}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#52637A]"><Building2 size={14} />{company || "—"}</p>
                  </div>
                  <span className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-[10px] font-extrabold text-indigo-700">{record?.from || "—"} — {record?.to || "Present"}</span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <ReadField label="Monthly Salary" value={normalizeRecordValue(record, ["salary", "monthlySalary"])} />
                  <ReadField label="Salary / Job Grade" value={normalizeRecordValue(record, ["salaryGrade", "salaryJobGrade"])} />
                  <ReadField label="Government Service" value={record?.governmentService} />
                </div>
                {record?.duties && (
                  <div className="mt-4 border-t border-[#E6ECF2] pt-3">
                    <button type="button" onClick={() => setExpanded((current) => ({ ...current, [index]: !current[index] }))} className="inline-flex items-center gap-2 text-[11px] font-extrabold text-[#042C51] hover:text-[#FF5C28]">
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isOpen ? "Collapse Duties" : "Expand Duties & Responsibilities"}
                    </button>
                    {isOpen && <p className="mt-3 rounded-xl bg-[#F8FAFC] p-4 text-xs font-medium leading-6 text-[#52637A]">{record.duties}</p>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : activeSection === "training" ? (
        <div className="space-y-5">
          {records.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Panel><p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">Total Programs</p><p className="mt-1 text-2xl font-extrabold text-[#042C51]">{records.length}</p></Panel>
              <Panel><p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">Total LD Hours</p><p className="mt-1 text-2xl font-extrabold text-[#FF5C28]">{records.reduce((sum, item) => sum + (Number(item?.hours || item?.hoursNumber) || 0), 0)}</p></Panel>
              <Panel><p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">Latest Training</p><p className="mt-1 truncate text-sm font-extrabold text-[#344054]">{normalizeRecordValue(records[0], ["title", "trainingTitle"]) || "—"}</p></Panel>
            </div>
          )}
          {records.length === 0 ? <EmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={onEdit} /> : records.map((record, index) => (
            <Panel key={record?.id || index}>
              <div className="flex flex-col gap-3 border-b border-[#E6ECF2] pb-3 sm:flex-row sm:items-start sm:justify-between">
                <div><h3 className="text-sm font-extrabold text-[#042C51]">{normalizeRecordValue(record, ["title", "trainingTitle"]) || "—"}</h3><p className="mt-1 text-xs font-semibold text-[#667085]">Conducted by <strong className="text-[#344054]">{record?.conductedBy || "—"}</strong></p></div>
                <div className="text-right"><span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-extrabold text-sky-700">{normalizeRecordValue(record, ["type", "typeOfLD"]) || "Learning & Development"}</span><p className="mt-2 font-mono text-[10px] font-bold text-[#667085]">{normalizeRecordValue(record, ["hours", "hoursNumber"]) || "0"} hours</p></div>
              </div>
              <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#F3F6FA] px-3 py-2 text-[11px] font-bold text-[#344054]"><CalendarDays size={14} className="text-[#FF5C28]" />{formatDate(record?.from)} to {formatDate(record?.to)}</p>
            </Panel>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {records.length === 0 ? <div className="lg:col-span-2"><EmptyState message={schema.empty} actionLabel={schema.addLabel} onAction={onEdit} /></div> : records.map((record, index) => (
            <Panel key={record?.id || index}>
              <h3 className="border-b border-[#E6ECF2] pb-3 text-sm font-extrabold text-[#042C51]">{record?.name || "—"}</h3>
              <div className="mt-4 space-y-3 text-xs text-[#52637A]"><p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" />{record?.address || "—"}</p><p className="flex items-center gap-2"><Phone size={14} />{normalizeRecordValue(record, ["telephone", "telephoneNumber"]) || "—"}</p></div>
            </Panel>
          ))}
        </div>
      )}

      {isEditing && <SaveBar label={schema.title} onCancel={onCancel} onSave={onSave} />}
    </div>
  );
}

function StringListEditor({ items, placeholder, addLabel, onChange }) {
  const [draft, setDraft] = useState("");

  function addItem(event) {
    event.preventDefault();
    const next = text(draft);
    if (!next || items.includes(next)) return;
    onChange([...items, next]);
    setDraft("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addItem} className="flex flex-col gap-2 sm:flex-row">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={placeholder} className="h-10 flex-1 rounded-xl border border-[#D0D5DD] bg-[#F8FAFC] px-3 text-xs font-semibold outline-none focus:border-[#042C51] focus:bg-white" />
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white"><Plus size={14} />{addLabel}</button>
      </form>
      <div className="flex flex-wrap gap-2 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
        {items.length === 0 ? <p className="text-xs font-semibold text-[#98A2B3]">No entries added.</p> : items.map((item, index) => (
          <span key={`${item}-${index}`} className="inline-flex max-w-full items-center gap-2 rounded-xl border border-[#D6E0EA] bg-white px-3 py-2 text-xs font-extrabold text-[#042C51]">
            <span className="break-words">{typeof item === "string" ? item : item?.name || "—"}</span>
            <button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="text-red-500"><X size={13} /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

export function SkillsSection({
  employee,
  selectedSubTab,
  isEditing,
  onEdit,
  onListChange,
  onSave,
  onCancel,
}) {
  const config = {
    skills: ["Skills Inventory", "Documented technical, soft-skill, and operational proficiencies.", Sparkles, "skills"],
    recognitions: ["Honors & Recognition", "Awards, distinctions, and employee achievements.", Award, "recognitions"],
    organizations: ["Professional Affiliations", "Associations, organizations, and active memberships.", Users, "organizations"],
  }[selectedSubTab] || ["Skills Inventory", "Documented proficiencies.", Sparkles, "skills"];
  const [title, subtitle, Icon, listKey] = config;
  const items = Array.isArray(employee?.[listKey]) ? employee[listKey] : [];

  return (
    <div className="rounded-[20px] border border-[#D6E0EA] bg-white p-4 shadow-sm sm:p-6">
      <SectionHeader title={title} subtitle={subtitle} icon={Icon} isEditing={isEditing} onEdit={onEdit} />

      {isEditing ? (
        <Panel title={`Manage ${title}`}>
          <StringListEditor items={items} placeholder={`Enter ${selectedSubTab === "skills" ? "a skill" : "a record"}...`} addLabel="Add Entry" onChange={(next) => onListChange(listKey, next)} />
        </Panel>
      ) : selectedSubTab === "skills" ? (
        <Panel title="Recognized Competencies">
          {items.length === 0 ? <EmptyState message="No skills logged yet." actionLabel="Add skills" onAction={onEdit} /> : (
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <span key={index} className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-[#E9F0FC] px-3.5 py-2 text-xs font-extrabold text-[#042C51] transition hover:bg-[#042C51] hover:text-white"><Star size={14} className="fill-[#FF5C28] text-[#FF5C28]" />{typeof item === "string" ? item : item?.name || "—"}</span>
              ))}
            </div>
          )}
        </Panel>
      ) : selectedSubTab === "recognitions" ? (
        <Panel>
          {items.length === 0 ? <EmptyState message="No recognition records logged." actionLabel="Add recognition" onAction={onEdit} /> : <div className="space-y-3">{items.map((item, index) => <div key={index} className="flex items-start gap-3 rounded-xl bg-[#F8FAFC] p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#FF5C28]"><Award size={16} /></span><p className="text-xs font-bold leading-6 text-[#344054]">{typeof item === "string" ? item : item?.name || "—"}</p></div>)}</div>}
        </Panel>
      ) : (
        <Panel>
          {items.length === 0 ? <EmptyState message="No organization memberships logged." actionLabel="Add organization" onAction={onEdit} /> : <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{items.map((item, index) => <div key={index} className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Users size={17} /></span><p className="text-xs font-extrabold text-[#344054]">{typeof item === "string" ? item : item?.name || "—"}</p></div>)}</div>}
        </Panel>
      )}

      {isEditing && <SaveBar label={title} onCancel={onCancel} onSave={onSave} />}
    </div>
  );
}

function ApplicationFieldGrid({ fields, employee, isEditing, onChange }) {
  if (isEditing) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map(([field, label, type = "text"]) => <FieldControl key={field} label={label} type={type} value={employee?.[field]} onChange={(value) => onChange(field, value)} className={type === "textarea" ? "md:col-span-2 xl:col-span-3" : ""} />)}
      </div>
    );
  }
  return <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">{fields.map(([field, label]) => <ReadField key={field} label={label} value={employee?.[field]} />)}</div>;
}

export function ApplicationSection({
  employee,
  selectedSubTab,
  isEditing,
  onEdit,
  onChange,
  onListChange,
  onSave,
  onCancel,
}) {
  const config = {
    overview: ["Recruitment & Application Overview", "Candidate sourcing and hiring deployment details.", Briefcase],
    pipeline: ["Recruitment Pipeline", "Current stage and visual application movement.", UserCheck],
    assessment: ["Assessment Results", "Testing scores, evaluations, and outcome status.", BadgeCheck],
    history: ["Status History", "Chronological application status and stage audit trail.", FileText],
  }[selectedSubTab] || ["Application", "Recruitment details.", Briefcase];
  const [title, subtitle, Icon] = config;
  const statusHistory = Array.isArray(employee?.statusHistory) ? employee.statusHistory : [];
  const currentStage = employee?.pipelineStage || "Sourcing";
  const currentIndex = Math.max(PIPELINE_STAGES.findIndex((stage) => stage === currentStage), 0);

  return (
    <div className="rounded-[20px] border border-[#D6E0EA] bg-white p-4 shadow-sm sm:p-6">
      <SectionHeader title={title} subtitle={subtitle} icon={Icon} isEditing={isEditing} onEdit={selectedSubTab === "history" ? null : onEdit} />

      {selectedSubTab === "overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel title="Sourcing Details">
            <ApplicationFieldGrid employee={employee} isEditing={isEditing} onChange={onChange} fields={[["appliedPosition", "Applied Position"], ["preferredAccount", "Preferred Account"], ["source", "Source"]]} />
          </Panel>
          <Panel title="Deployment & Hiring Status" accent="navy">
            <ApplicationFieldGrid employee={employee} isEditing={isEditing} onChange={onChange} fields={[["expectedSalary", "Expected Salary"], ["availability", "Availability"], ["recruiter", "Recruiter"]]} />
          </Panel>
        </div>
      )}

      {selectedSubTab === "pipeline" && (
        isEditing ? (
          <div className="space-y-5">
            <Panel title="Modify Pipeline State"><ApplicationFieldGrid employee={employee} isEditing onChange={onChange} fields={[["status", "Candidate Status"], ["pipelineStage", "Pipeline Stage"], ["prfMatchStatus", "PRF Match Status"], ["remarks", "Recruitment Remarks", "textarea"]]} /></Panel>
          </div>
        ) : (
          <Panel title="Active Recruitment Funnel Tracker">
            <div className="relative py-6">
              <div className="absolute left-8 right-8 top-[42px] hidden h-1 bg-slate-100 md:block" />
              <div className="relative grid grid-cols-2 gap-6 md:grid-cols-6">
                {PIPELINE_STAGES.map((stage, index) => {
                  const state = index < currentIndex ? "completed" : index === currentIndex ? "active" : "pending";
                  return (
                    <div key={stage} className="flex flex-col items-center text-center">
                      <span className={`z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-extrabold ${state === "completed" ? "border-emerald-500 bg-emerald-500 text-white" : state === "active" ? "border-[#042C51] bg-[#042C51] text-white ring-4 ring-[#E9F0FC]" : "border-slate-200 bg-white text-slate-400"}`}>{state === "completed" ? <CheckCircle2 size={18} /> : index + 1}</span>
                      <span className={`mt-2 max-w-[110px] text-[10px] font-extrabold ${state === "active" ? "text-[#042C51]" : "text-[#667085]"}`}>{stage}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 rounded-xl bg-[#F8FAFC] p-4 sm:grid-cols-2">
              <ReadField label="PRF Match Status" value={employee?.prfMatchStatus} />
              <ReadField label="Recruitment Remarks" value={employee?.remarks} />
            </div>
          </Panel>
        )
      )}

      {selectedSubTab === "assessment" && (
        isEditing ? (
          <Panel title="Modify Assessment Results"><ApplicationFieldGrid employee={employee} isEditing onChange={onChange} fields={[["assessmentStatus", "Assessment Status"], ["assessmentScore", "Assessment Score"], ["assessmentRemarks", "Evaluation Remarks", "textarea"]]} /></Panel>
        ) : (
          <Panel>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-[#D6E0EA] bg-[#F8FAFC] text-center">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">Weighted Score</p>
                <p className="mt-2 text-4xl font-extrabold text-[#042C51]">{employee?.assessmentScore || "—"}</p>
                <span className="mt-2 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">{employee?.assessmentStatus || "Pending"}</span>
              </div>
              <div className="rounded-xl border border-blue-100 bg-[#E9F0FC]/60 p-5"><p className="text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">Evaluation Summary Remarks</p><p className="mt-3 text-sm font-semibold leading-7 text-[#344054]">{employee?.assessmentRemarks || employee?.remarks || "No assessment remarks recorded."}</p><div className="mt-5 flex items-center gap-2 border-t border-blue-100 pt-4 text-xs font-semibold text-[#667085]"><UserCheck size={16} className="text-[#042C51]" />Verified assessment information</div></div>
            </div>
          </Panel>
        )
      )}

      {selectedSubTab === "history" && (
        <div className="space-y-4">
          {isEditing && (
            <div className="flex justify-end"><button type="button" onClick={() => onListChange("statusHistory", [...statusHistory, { id: `history_${Date.now()}`, date: "", status: "", stage: "", remarks: "" }])} className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white"><Plus size={14} />Add History Entry</button></div>
          )}
          {statusHistory.length === 0 ? <EmptyState message="No application status history recorded." actionLabel={isEditing ? "Add history entry" : undefined} onAction={isEditing ? () => onListChange("statusHistory", [{ id: `history_${Date.now()}`, date: "", status: "", stage: "", remarks: "" }]) : undefined} /> : isEditing ? statusHistory.map((entry, index) => (
            <Panel key={entry?.id || index} title={`Status Entry #${index + 1}`}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><FieldControl label="Date" type="date" value={toInputDate(entry?.date)} onChange={(value) => onListChange("statusHistory", statusHistory.map((item, itemIndex) => itemIndex === index ? { ...item, date: value } : item))} /><FieldControl label="Status" value={entry?.status} onChange={(value) => onListChange("statusHistory", statusHistory.map((item, itemIndex) => itemIndex === index ? { ...item, status: value } : item))} /><FieldControl label="Stage" value={entry?.stage} onChange={(value) => onListChange("statusHistory", statusHistory.map((item, itemIndex) => itemIndex === index ? { ...item, stage: value } : item))} /><FieldControl label="Remarks" type="textarea" value={entry?.remarks} onChange={(value) => onListChange("statusHistory", statusHistory.map((item, itemIndex) => itemIndex === index ? { ...item, remarks: value } : item))} /></div>
              <div className="mt-3 flex justify-end"><button type="button" onClick={() => onListChange("statusHistory", statusHistory.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-extrabold text-red-600"><Trash2 size={14} />Remove</button></div>
            </Panel>
          )) : (
            <div className="relative ml-3 space-y-5 border-l-2 border-slate-200 pl-6">{statusHistory.map((entry, index) => <article key={entry?.id || index} className="relative rounded-2xl border border-[#D6E0EA] bg-[#F8FAFC] p-4"><span className="absolute -left-[31px] top-5 h-3.5 w-3.5 rounded-full border-4 border-white bg-slate-300" /><div className="flex flex-col gap-2 border-b border-[#E6ECF2] pb-2 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-extrabold text-[#042C51]">{entry?.status || "—"}</span><span className="rounded bg-[#E9F0FC] px-2 py-1 text-[9px] font-extrabold text-[#042C51]">Stage: {entry?.stage || "—"}</span></div><span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#667085]"><CalendarDays size={13} />{formatDate(entry?.date)}</span></div><p className="mt-3 text-xs font-medium italic leading-6 text-[#52637A]">{entry?.remarks || "—"}</p></article>)}</div>
          )}
        </div>
      )}

      {isEditing && <SaveBar label={title} onCancel={onCancel} onSave={onSave} />}
    </div>
  );
}

function fileIcon(name) {
  const lower = text(name).toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.endsWith(".xlsx") || lower.endsWith(".csv")) return "XLS";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "DOC";
  return "FILE";
}

export function DocumentsSection({ employee, onDocumentsChange, onFeedback }) {
  const documents = Array.isArray(employee?.documents) ? employee.documents : [];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [layout, setLayout] = useState("table");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Certificate");

  const filtered = documents.filter((document) => {
    const query = search.toLowerCase();
    const searchMatch = text(document?.name).toLowerCase().includes(query) || text(document?.uploadedBy).toLowerCase().includes(query);
    const categoryMatch = category === "All" || document?.category === category;
    return searchMatch && categoryMatch;
  });

  function addDocument(event) {
    event.preventDefault();
    if (!text(newName)) return;
    const next = { id: `doc_${Date.now()}`, name: newName, category: newCategory, fileSize: "1.4 MB", uploadedAt: getCurrentDateKey(), uploadedBy: "Current HR User" };
    onDocumentsChange([next, ...documents]);
    setUploadOpen(false);
    setNewName("");
    onFeedback?.("Document added locally.", "success");
  }

  function removeDocument(document) {
    if (!window.confirm(`Delete ${document.name}?`)) return;
    onDocumentsChange(documents.filter((item) => item?.id !== document?.id));
    onFeedback?.("Document deleted locally.", "success");
  }

  return (
    <div className="rounded-[20px] border border-[#D6E0EA] bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 border-b border-[#E6ECF2] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E9F0FC] text-[#042C51]"><FolderLock size={18} /></span><h2 className="text-base font-extrabold text-[#042C51]">Document Vault Manager</h2></div><p className="mt-1 text-xs font-medium text-[#667085]">Store, filter, preview, and audit employee documents.</p></div>
        <button type="button" onClick={() => setUploadOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-extrabold text-white"><Upload size={15} className="text-[#FF5C28]" />Upload Document</button>
      </div>

      <button type="button" onClick={() => setUploadOpen(true)} className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#C8D3DF] bg-[#F8FAFC] px-5 py-8 text-center hover:border-[#042C51]/40 hover:bg-white"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E9F0FC] text-[#042C51]"><Upload size={22} /></span><span className="mt-3 text-sm font-extrabold text-[#042C51]">Drag and drop files here or click to upload</span><span className="mt-1 text-xs font-medium text-[#667085]">PDF, XLSX, DOCX, JPG up to 10 MB</span></button>

      <div className="my-5 flex flex-col gap-3 rounded-2xl border border-[#D6E0EA] bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents..." className="h-10 w-full rounded-xl border border-[#D6E0EA] bg-[#F8FAFC] pl-9 pr-3 text-xs font-semibold outline-none focus:bg-white" /></div>
        <div className="flex flex-wrap items-center gap-2"><Filter size={14} className="text-[#667085]" /><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-9 rounded-xl border border-[#D6E0EA] bg-[#F8FAFC] px-3 text-xs font-bold text-[#344054] outline-none"><option>All</option><option>Resume</option><option>Government ID</option><option>Contract</option><option>Certificate</option><option>Training Record</option><option>Other</option></select><span className="mx-1 h-6 w-px bg-[#D6E0EA]" /><button type="button" onClick={() => setLayout("table")} className={`rounded-lg p-2 ${layout === "table" ? "bg-[#E9F0FC] text-[#042C51]" : "text-[#98A2B3]"}`}><List size={16} /></button><button type="button" onClick={() => setLayout("grid")} className={`rounded-lg p-2 ${layout === "grid" ? "bg-[#E9F0FC] text-[#042C51]" : "text-[#98A2B3]"}`}><Grid size={16} /></button></div>
      </div>

      {filtered.length === 0 ? <EmptyState message="No matching documents found." /> : layout === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-[#D6E0EA]"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b border-[#D6E0EA] bg-[#F8FAFC] text-[10px] font-extrabold uppercase tracking-wide text-[#667085]"><th className="px-4 py-3">Document</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Size</th><th className="px-4 py-3">Uploaded By</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#E6ECF2]">{filtered.map((document, index) => <tr key={document?.id || index} className="hover:bg-[#F8FAFC]"><td className="px-4 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[10px] font-extrabold text-red-600">{fileIcon(document?.name)}</span><div><p className="max-w-xs truncate font-extrabold text-[#344054]">{document?.name}</p><p className="mt-0.5 text-[9px] text-[#667085]">Uploaded {formatDate(document?.uploadedAt)}</p></div></div></td><td className="px-4 py-4"><span className="rounded-full bg-[#E9F0FC] px-2.5 py-1 text-[9px] font-extrabold text-[#042C51]">{document?.category || "Other"}</span></td><td className="px-4 py-4 font-mono text-[#667085]">{document?.fileSize || "—"}</td><td className="px-4 py-4 font-semibold text-[#52637A]">{document?.uploadedBy || "—"}</td><td className="px-4 py-4"><div className="flex justify-end gap-1"><button type="button" onClick={() => setPreview(document)} className="rounded-lg p-2 text-[#667085] hover:bg-[#E9F0FC] hover:text-[#042C51]"><Eye size={15} /></button><button type="button" onClick={() => onFeedback?.(`Downloading ${document?.name}...`, "success")} className="rounded-lg p-2 text-[#667085] hover:bg-[#E9F0FC] hover:text-[#042C51]"><Download size={15} /></button><button type="button" onClick={() => removeDocument(document)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((document, index) => <article key={document?.id || index} className="rounded-2xl border border-[#D6E0EA] bg-white p-4"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[10px] font-extrabold text-red-600">{fileIcon(document?.name)}</span><div className="min-w-0 flex-1"><h3 className="truncate text-xs font-extrabold text-[#344054]">{document?.name}</h3><p className="mt-1 text-[9px] text-[#667085]">Uploaded {formatDate(document?.uploadedAt)}</p><span className="mt-2 inline-flex rounded-full bg-[#E9F0FC] px-2.5 py-1 text-[9px] font-extrabold text-[#042C51]">{document?.category || "Other"}</span></div></div><div className="mt-4 flex items-center justify-between border-t border-[#E6ECF2] pt-3"><span className="font-mono text-[10px] text-[#667085]">{document?.fileSize || "—"}</span><div className="flex gap-1"><button type="button" onClick={() => setPreview(document)} className="rounded-lg p-1.5 text-[#667085] hover:bg-[#E9F0FC]"><Eye size={14} /></button><button type="button" onClick={() => removeDocument(document)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button></div></div></article>)}</div>
      )}

      {uploadOpen && <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setUploadOpen(false)}><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-[#E6ECF2] pb-3"><h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">Configure Upload</h3><button type="button" onClick={() => setUploadOpen(false)} className="rounded-lg p-1 text-[#98A2B3] hover:bg-[#F8FAFC]"><X size={17} /></button></div><form onSubmit={addDocument} className="mt-4 space-y-4"><FieldControl label="File Name" value={newName} onChange={setNewName} required placeholder="employee-document.pdf" /><FieldControl label="Category" type="select" options={["Resume", "Government ID", "Contract", "Certificate", "Training Record", "Other"]} value={newCategory} onChange={setNewCategory} /><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setUploadOpen(false)} className="h-9 rounded-xl border border-[#D6E0EA] px-4 text-xs font-extrabold text-[#667085]">Cancel</button><button type="submit" className="h-9 rounded-xl bg-[#042C51] px-5 text-xs font-extrabold text-white">Add Document</button></div></form></div></div>}

      {preview && <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/70 p-4" onClick={() => setPreview(null)}><div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between bg-[#042C51] px-5 py-4 text-white"><div className="flex items-center gap-2"><FolderLock size={17} className="text-[#FF5C28]" /><h3 className="text-xs font-extrabold uppercase tracking-wide">Secure Document Preview</h3></div><button type="button" onClick={() => setPreview(null)} className="rounded-lg p-1 hover:bg-white/10"><X size={17} /></button></div><div className="space-y-4 p-6"><div className="flex items-start gap-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-xs font-extrabold text-red-600">{fileIcon(preview?.name)}</span><div className="min-w-0"><h4 className="truncate text-sm font-extrabold text-[#042C51]">{preview?.name}</h4><span className="mt-2 inline-flex rounded-full bg-[#E9F0FC] px-2.5 py-1 text-[9px] font-extrabold text-[#042C51]">{preview?.category}</span></div></div><div className="divide-y divide-[#E6ECF2] text-xs">{[["File Size", preview?.fileSize], ["Uploaded Date", formatDate(preview?.uploadedAt)], ["Uploaded By", preview?.uploadedBy]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3"><span className="font-semibold text-[#667085]">{label}</span><span className="text-right font-extrabold text-[#344054]">{value || "—"}</span></div>)}</div><div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold leading-5 text-amber-800"><ShieldCheck size={16} className="mt-0.5 shrink-0" />Downloads should be recorded by the backend audit trail when connected.</div></div></div></div>}
    </div>
  );
}

export function NotesSection({ employee, onCommitNote, onFeedback }) {
  const existingHistory = Array.isArray(employee?.notesHistory) ? employee.notesHistory : [];
  const seedHistory = existingHistory.length > 0 ? existingHistory : employee?.notes ? [{ id: "current_note", content: employee.notes, date: employee?.updatedAt || employee?.updated_at || "", author: employee?.updatedBy || "HR Administrator" }] : [];
  const [history, setHistory] = useState(seedHistory);
  const [draft, setDraft] = useState("");

  function saveNote(event) {
    event.preventDefault();
    if (!text(draft)) {
      onFeedback?.("Write a note before saving.", "error");
      return;
    }
    const note = { id: `note_${Date.now()}`, content: draft.trim(), date: new Date().toISOString(), author: "Current HR User" };
    const nextHistory = [note, ...history];
    setHistory(nextHistory);
    setDraft("");
    onCommitNote?.(note.content, nextHistory);
    onFeedback?.("Private note logged locally.", "success");
  }

  function removeNote(id) {
    if (!window.confirm("Remove this private note?")) return;
    const nextHistory = history.filter((item) => item.id !== id);
    setHistory(nextHistory);
    onCommitNote?.(nextHistory[0]?.content || "", nextHistory);
    onFeedback?.("Private note deleted locally.", "success");
  }

  return (
    <div className="rounded-[20px] border border-[#D6E0EA] bg-white p-4 shadow-sm sm:p-6">
      <SectionHeader title="Private Operational Notes" subtitle="Confidential administrative notes visible only to authorized HR users." icon={FileText} />
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs leading-5 text-red-800"><Lock size={18} className="mt-0.5 shrink-0 text-red-600" /><div><p className="font-extrabold uppercase tracking-wide">Restricted HR information</p><p className="mt-1 font-medium">Keep employee notes factual, work-related, and limited to authorized administrative use.</p></div></div>
      <Panel title="Compose New Administrative Note">
        <form onSubmit={saveNote} className="space-y-3"><textarea rows={5} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Document a private administrative note..." className="w-full resize-y rounded-xl border border-[#D0D5DD] bg-[#F8FAFC] p-3.5 text-xs font-semibold leading-6 outline-none focus:border-[#042C51] focus:bg-white" /><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span className="text-[10px] font-medium text-[#667085]">The entry will be timestamped under the current HR user.</span><button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#042C51] px-5 text-xs font-extrabold text-white"><Save size={14} className="text-[#FF5C28]" />Log Internal Note</button></div></form>
      </Panel>
      <div className="mt-6 space-y-4"><h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">Confidential History ({history.length})</h3>{history.length === 0 ? <EmptyState message="No private notes logged." /> : history.map((note) => <article key={note.id} className="group relative rounded-2xl border border-[#D6E0EA] bg-white p-5"><div className="flex flex-col gap-1 border-b border-[#E6ECF2] pb-3 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-center gap-2 text-xs font-extrabold text-[#042C51]"><User size={14} className="text-[#667085]" />{note.author || "HR User"}</span><span className="flex items-center gap-1.5 font-mono text-[10px] text-[#667085]"><CalendarDays size={13} />{formatDate(note.date)}</span></div><p className="mt-4 whitespace-pre-wrap text-xs font-semibold leading-6 text-[#52637A]">{note.content}</p><button type="button" onClick={() => removeNote(note.id)} className="absolute bottom-4 right-4 rounded-lg p-1.5 text-red-500 opacity-0 hover:bg-red-50 group-hover:opacity-100" title="Delete note"><Trash2 size={14} /></button></article>)}</div>
    </div>
  );
}
