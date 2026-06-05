import {
  Eye,
  ClipboardList,
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  Phone,
  FileText,
} from "lucide-react";

import {
  isPreviewableAttachment,
  openDataUrlInNewTab,
} from "../../../lib/utils/talentPool/talentPoolHelpers";

export function FieldLabel({ children }) {
  return (
    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
      {children}
    </label>
  );
}

export function DetailRow({ label, value, stacked = false }) {
  if (stacked) {
    return (
      <div className="border-b border-[#E6ECF2] py-3 last:border-b-0">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
          {label}
        </p>

        <p className="mt-1 whitespace-pre-line break-words text-sm font-bold leading-6 text-[#344054]">
          {value || "—"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[130px_minmax(0,1fr)] items-start gap-4 border-b border-[#E6ECF2] py-3 last:border-b-0">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {label}
      </p>

      <p className="min-w-0 whitespace-pre-line break-words text-right text-sm font-bold leading-6 text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

export function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sibs-primary-1/10 text-sibs-primary-1">
          <Icon size={18} />
        </div>
      )}

      <div className="min-w-0">
        <h3 className="text-base font-extrabold text-[#101828]">{title}</h3>

        {description && (
          <p className="mt-1 text-sm font-semibold leading-5 text-sibs-primary-1/80">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export function InfoTile({
  label,
  value,
  description,
  icon: Icon,
  accent = false,
  className = "",
}) {
  return (
    <div
      className={`rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 transition hover:border-[#C9D6E4] ${className}`}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              accent
                ? "bg-sibs-primary-1 text-white"
                : "bg-white text-sibs-primary-1"
            }`}
          >
            <Icon size={16} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-extrabold leading-6 text-[#101828]">
            {value || "—"}
          </p>

          {description && (
            <p className="mt-1 break-words text-xs font-semibold leading-5 text-sibs-tertiary-5">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function StatusTile({ label, value }) {
  const normalizedValue = String(value || "").trim();
  const isYes = normalizedValue.toLowerCase() === "yes";

  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {label}
      </p>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="truncate text-sm font-extrabold text-[#101828]">
          {normalizedValue || "—"}
        </p>

        {normalizedValue && normalizedValue !== "—" && (
          <span
            className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${
              isYes
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            {isYes ? "Ready" : "Review"}
          </span>
        )}
      </div>
    </div>
  );
}

export function ReferenceCard({ reference, index }) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
        Reference {index + 1}
      </p>

      <p className="mt-2 truncate text-sm font-extrabold text-[#101828]">
        {reference?.name || "—"}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-sibs-primary-1">
        {reference?.phone || "No phone provided"}
      </p>
    </div>
  );
}

export function ExperienceCard({ experience, index, formatCurrency }) {
  const title =
    experience?.role || experience?.industry || `Experience ${index + 1}`;

  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
            Experience {index + 1}
          </p>

          <p className="mt-1 truncate text-sm font-extrabold text-[#101828]">
            {title}
          </p>

          <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
            {experience?.company || "Company not provided"}
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          {experience?.years ? `${experience.years} year(s)` : "No duration"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Industry
          </p>
          <p className="mt-1 text-sm font-bold text-[#344054]">
            {experience?.industry || "—"}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Compensation
          </p>
          <p className="mt-1 text-sm font-bold text-[#344054]">
            {experience?.monthlyCompensation
              ? formatCurrency(experience.monthlyCompensation)
              : "—"}
          </p>
        </div>

        <div className="sm:col-span-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
            Reason for Leaving
          </p>
          <p className="mt-1 text-sm font-bold leading-6 text-[#344054]">
            {experience?.reasonForLeaving || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TimelineSectionHeader({
  step,
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sibs-primary-1 text-sm font-extrabold text-white">
        {step}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={17} className="shrink-0 text-sibs-primary-1" />}
          <h3 className="text-sm font-extrabold text-[#101828]">{title}</h3>
        </div>

        {description && (
          <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export function ViewableFileRow({
  label,
  fileName,
  fileUrl,
  fileType,
  audio = false,
}) {
  const hasFile = Boolean(fileName);
  const canOpen = Boolean(fileUrl);
  const canPreview = audio || isPreviewableAttachment(fileType, fileName);

  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-bold text-[#344054]">
            {hasFile ? fileName : "No file uploaded"}
          </p>

          {hasFile && !canOpen && (
            <p className="mt-1 text-xs font-semibold text-amber-700">
              File name is saved, but the actual file is not available for
              preview.
            </p>
          )}
        </div>

        {hasFile && canOpen && (
          <button
            type="button"
            onClick={() => openDataUrlInNewTab(fileUrl, fileName)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm"
          >
            <Eye size={16} />
            {canPreview ? "View" : "Open"}
          </button>
        )}
      </div>

      {audio && canOpen && (
        <audio controls src={fileUrl} className="mt-4 w-full">
          Your browser does not support the audio player.
        </audio>
      )}
    </div>
  );
}

export function MultiCheckGroup({
  options,
  value,
  onChange,
  columns = "md:grid-cols-2",
}) {
  const selected = Array.isArray(value) ? value : [];

  function toggle(option) {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
      return;
    }

    onChange([...selected, option]);
  }

  return (
    <div className={`grid grid-cols-1 gap-2 ${columns}`}>
      {options.map((option) => (
        <label
          key={option}
          className="flex items-center gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#344054] transition hover:border-[#C9D6E4] hover:bg-white"
        >
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => toggle(option)}
            className="h-4 w-4"
          />
          {option}
        </label>
      ))}
    </div>
  );
}

export const sectionIcons = {
  ClipboardList,
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  Phone,
  FileText,
};
