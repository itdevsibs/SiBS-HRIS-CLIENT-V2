import React from "react";
import { Archive, CheckCircle, Clock, Send } from "lucide-react";

const statusStyles = {
  "New Lead": "border-blue-200 bg-blue-50 text-blue-700",
  Contacted: "border-amber-200 bg-amber-50 text-amber-700",
  "Application Link Sent": "border-purple-200 bg-purple-50 text-purple-700",
  "Converted to Applicant": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Moved to Talent Pool Archive": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Not Interested": "border-slate-200 bg-slate-100 text-slate-600",
  "On Hold": "border-orange-200 bg-orange-50 text-orange-700",
};

function getStatusIcon(status) {
  if (status === "Converted to Applicant") return CheckCircle;
  if (status === "Moved to Talent Pool Archive") return Archive;
  if (status === "Application Link Sent") return Send;
  if (status === "Contacted") return Clock;
  return null;
}

export default function ApplicantLeadStatusBadge({ status }) {
  const Icon = getStatusIcon(status);

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[9px] 2xl:text-[10px] font-extrabold uppercase tracking-wide ${
        statusStyles[status] || statusStyles["New Lead"]
      }`}
    >
      {Icon ? (
        <Icon size={11} strokeWidth={2.5} />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {status}
    </span>
  );
}
