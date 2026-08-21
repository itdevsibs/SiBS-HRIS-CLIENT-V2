import { useState } from "react";
import {
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRoundPen,
} from "lucide-react";

import {
  cleanText,
  hasValue,
  toInputDate,
} from "../../../../lib/utils/employees/employeeProfileHelpers.js";
import ProfileSectionHeader from "../shared/ProfileSectionHeader.jsx";
import ProfilePanel from "../shared/ProfilePanel.jsx";
import { ProfileFieldControl, ProfileReadField } from "../shared/ProfileFields.jsx";
import ProfileCopyButton from "../shared/ProfileCopyButton.jsx";
import ProfileSaveBar from "../shared/ProfileSaveBar.jsx";

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
    const normalized = cleanText(value);
    if (!normalized) return "—";
    if (!shouldMask) return normalized;
    const visible = normalized.slice(-4);
    return `${"•".repeat(Math.max(normalized.length - 4, 4))}${visible}`;
  }

  const sectionConfigBySubTab = {
    basic: [
      "Basic Identity Information",
      "Legal identity and demographic fields from the employee profile.",
      UserRoundPen,
    ],
    contact: [
      "Contact Information",
      "Primary phone, email, and corporate contact channels.",
      Phone,
    ],
    address: [
      "Registered Addresses & Work Environment",
      "Residential, permanent, and work arrangement records.",
      MapPin,
    ],
    ids: [
      "Government Registrations",
      "Masked regulatory identifiers for authorized profile review.",
      ShieldCheck,
    ],
  };
  const [title, subtitle, Icon] =
    sectionConfigBySubTab[selectedSubTab] || sectionConfigBySubTab.basic;

  return (
    <div className="space-y-4">
      <ProfileSectionHeader
        title={title}
        subtitle={subtitle}
        icon={Icon}
        isEditing={isEditing}
        onEdit={onEdit}
      />

      {selectedSubTab === "basic" && (
        isEditing ? (
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileFieldControl
              label="First Name"
              disabled
              value={employee?.firstName}
              onChange={(value) => onChange("firstName", value)}
              required
            />
            <ProfileFieldControl
              label="Middle Name"
              disabled
              value={employee?.middleName}
              onChange={(value) => onChange("middleName", value)}
            />
            <ProfileFieldControl
              label="Last Name"
              disabled
              value={employee?.lastName}
              onChange={(value) => onChange("lastName", value)}
              required
            />
            <ProfileFieldControl
              label="Name Extension (Jr/III)"
              disabled
              value={employee?.nameExtension}
              onChange={(value) => onChange("nameExtension", value)}
              placeholder="Jr., III"
            />
            <ProfileFieldControl
              label="Preferred Name"
              value={employee?.preferredName}
              onChange={(value) => onChange("preferredName", value)}
            />
            <ProfileFieldControl
              label="Birth Date"
              type="date"
              value={toInputDate(employee?.birthdate)}
              onChange={(value) => onChange("birthdate", value)}
              required
            />
            <ProfileFieldControl
              label="Place of Birth"
              value={employee?.placeOfBirth}
              onChange={(value) => onChange("placeOfBirth", value)}
            />
            <ProfileFieldControl
              label="Gender"
              type="select"
              options={["Male", "Female", "Non-binary", "Prefer not to say"]}
              value={employee?.gender}
              onChange={(value) => onChange("gender", value)}
            />
            <ProfileFieldControl
              label="Civil Status"
              type="select"
              options={["Single", "Married", "Separated", "Widowed"]}
              value={employee?.civilStatus}
              onChange={(value) => onChange("civilStatus", value)}
            />
            <ProfileFieldControl
              label="Citizenship"
              value={employee?.citizenship}
              onChange={(value) => onChange("citizenship", value)}
            />
            <ProfileFieldControl
              label="Blood Type"
              type="select"
              options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
              value={employee?.bloodType}
              onChange={(value) => onChange("bloodType", value)}
            />
            <ProfileFieldControl
              label="Height"
              value={employee?.height}
              onChange={(value) => onChange("height", value)}
              placeholder="178 cm"
            />
            <ProfileFieldControl
              label="Weight"
              value={employee?.weight}
              onChange={(value) => onChange("weight", value)}
              placeholder="74 kg"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileReadField label="First Name" value={employee?.firstName} />
            <ProfileReadField label="Middle Name" value={employee?.middleName} />
            <ProfileReadField label="Last Name" value={employee?.lastName} />
            <ProfileReadField label="Name Extension (Jr/III)" value={employee?.nameExtension} />
            <ProfileReadField label="Preferred Name" value={employee?.preferredName} />
            <ProfileReadField label="Birth Date" value={toInputDate(employee?.birthdate)} />
            <ProfileReadField label="Place of Birth" value={employee?.placeOfBirth} />
            <ProfileReadField label="Gender" value={employee?.gender} />
            <ProfileReadField label="Civil Status" value={employee?.civilStatus} />
            <ProfileReadField label="Citizenship" value={employee?.citizenship} />
            <ProfileReadField label="Blood Type" value={employee?.bloodType} />
            <ProfileReadField label="Height" value={employee?.height} />
            <ProfileReadField label="Weight" value={employee?.weight} />
          </div>
        )
      )}

      {selectedSubTab === "contact" && (
        isEditing ? (
          <ProfilePanel title="Modify Contact Details">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ProfileFieldControl label="Email" type="email" value={employee?.email} onChange={(v) => onChange("email", v)} required />
              <ProfileFieldControl label="Mobile Number" value={employee?.contact} onChange={(v) => onChange("contact", v)} required />
              <ProfileFieldControl label="Telephone" value={employee?.telephone} onChange={(v) => onChange("telephone", v)} />
            </div>
          </ProfilePanel>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {[
              { label: "Corporate Email", value: employee?.email, icon: Mail, key: "email", tone: "bg-blue-50 text-blue-600" },
              { label: "Mobile Number", value: employee?.contact, icon: Phone, key: "mobile", tone: "bg-emerald-50 text-emerald-600" },
              { label: "Telephone", value: employee?.telephone, icon: Building2, key: "telephone", tone: "bg-orange-50 text-[#FF5C28]" },
            ].map((item) => (
              <ProfilePanel key={item.key} className="p-3.5 2xl:p-4">
                <div className="flex items-center gap-2.5 2xl:gap-3">
                  <span className={`flex h-8.5 w-8.5 2xl:h-10 2xl:w-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
                    <item.icon size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="sibs-text-micro font-extrabold uppercase tracking-wide text-[#667085]">{item.label}</p>
                    <p className="sibs-text-micro font-semibold text-[#8A98B8]">Primary contact channel</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-[#F3F6FA] px-3 py-2.5">
                  <span className={`min-w-0 break-all font-mono text-[11px] 2xl:text-xs font-extrabold ${hasValue(item.value) ? "text-[#042C51]" : "italic text-[#98A2B3]"}`}>
                    {hasValue(item.value) ? item.value : "—"}
                  </span>
                  <ProfileCopyButton value={item.value} copyKey={item.key} copiedKey={copiedKey} onCopy={copyValue} />
                </div>
              </ProfilePanel>
            ))}
          </div>
        )
      )}

      {selectedSubTab === "address" && (
        isEditing ? (
          <ProfilePanel title="Update Address Details">
            <div className="space-y-3">
              <ProfileFieldControl label="Residential Address" type="textarea" rows={2} value={employee?.residentialAddress} onChange={(v) => onChange("residentialAddress", v)} required />
              <ProfileFieldControl label="Permanent Address" type="textarea" rows={2} value={employee?.permanentAddress} onChange={(v) => onChange("permanentAddress", v)} required />
              <ProfileFieldControl label="Work Setup" type="select" options={["Hybrid", "WFH", "On-site", "Onsite"]} value={employee?.workSetup} onChange={(v) => onChange("workSetup", v)} className="max-w-sm" />
            </div>
          </ProfilePanel>
        ) : (
          <div className="space-y-3.5 2xl:space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["Residential Address", employee?.residentialAddress, "orange"],
                ["Permanent Address", employee?.permanentAddress, "navy"],
              ].map(([label, value, accent]) => (
                <ProfilePanel key={label} title={label} accent={accent} className="p-3.5 2xl:p-4">
                  <p className={`min-h-16 2xl:min-h-20 rounded-xl bg-[#F8FAFC] p-3 sibs-text-xs font-semibold leading-relaxed ${hasValue(value) ? "text-[#042C51]" : "italic text-[#98A2B3]"}`}>
                    {hasValue(value) ? value : "—"}
                  </p>
                </ProfilePanel>
              ))}
            </div>
            <ProfilePanel className="p-3.5 2xl:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 2xl:h-10 2xl:w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Building2 size={19} />
                  </span>
                  <div>
                    <h3 className="sibs-text-xs 2xl:sibs-text-sm font-extrabold text-[#042C51]">Active Work Arrangement</h3>
                    <p className="sibs-text-micro font-semibold text-[#667085]">Current corporate work setup assignment.</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-[#E9F0FC] px-3 py-1.5 sibs-text-micro font-extrabold uppercase tracking-wide text-[#042C51]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C28]" />
                  {employee?.workSetup || "—"}
                </span>
              </div>
            </ProfilePanel>
          </div>
        )
      )}

      {selectedSubTab === "ids" && (
        isEditing ? (
          <ProfilePanel title="Modify Regulatory IDs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ProfileFieldControl label="GSIS" value={employee?.gsis} onChange={(v) => onChange("gsis", v)} />
              <ProfileFieldControl label="SSS" value={employee?.sss} onChange={(v) => onChange("sss", v)} />
              <ProfileFieldControl label="PhilHealth" value={employee?.phic} onChange={(v) => onChange("phic", v)} />
              <ProfileFieldControl label="PAG-IBIG / HDMF" value={employee?.hdmf} onChange={(v) => onChange("hdmf", v)} />
              <ProfileFieldControl label="TIN" value={employee?.tin} onChange={(v) => onChange("tin", v)} className="sm:col-span-2" />
            </div>
          </ProfilePanel>
        ) : (
          <ProfilePanel className="p-3.5 2xl:p-4">
            <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5 sibs-text-micro font-semibold leading-relaxed text-amber-800">
              <Lock size={15} className="mt-0.5 shrink-0 text-amber-600" />
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
                <div key={key} className="flex flex-col gap-2 py-2.5 2xl:py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="sibs-text-micro font-extrabold uppercase tracking-wide text-[#667085]">{label}</p>
                    <p className="mt-0.5 font-mono sibs-text-xs font-extrabold text-[#042C51]">{maskedValue(value, masked[key])}</p>
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button type="button" onClick={() => setMasked((current) => ({ ...current, [key]: !current[key] }))} className="rounded-lg p-1.5 text-[#667085] hover:bg-[#F3F6FA] hover:text-[#042C51]" title={masked[key] ? "Reveal ID" : "Hide ID"}>
                      {masked[key] ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <ProfileCopyButton value={value} copyKey={key} copiedKey={copiedKey} onCopy={copyValue} />
                  </div>
                </div>
              ))}
            </div>
          </ProfilePanel>
        )
      )}

      {isEditing && <ProfileSaveBar label={title} onCancel={onCancel} onSave={onSave} />}
    </div>
  );
}

