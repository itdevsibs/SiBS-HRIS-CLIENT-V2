import React from "react";

const STATUS_CONFIGS = {
  // Success / Active / Approved
  approved: {
    className: "sibs-badge-success",
    dotClassName: "bg-emerald-500",
    label: "Approved",
  },
  active: {
    className: "sibs-badge-success",
    dotClassName: "bg-emerald-500",
    label: "Active",
  },
  "on-time": {
    className: "sibs-badge-success",
    dotClassName: "bg-emerald-500",
    label: "On-Time",
  },
  "full shift": {
    className: "sibs-badge-success",
    dotClassName: "bg-emerald-500",
    label: "Full Shift",
  },
  accepted: {
    className: "sibs-badge-success",
    dotClassName: "bg-emerald-500",
    label: "Accepted",
  },
  "on track": {
    className: "sibs-badge-success",
    dotClassName: "bg-emerald-500",
    label: "On Track",
  },
  addressed: {
    className: "sibs-badge-success",
    dotClassName: "bg-emerald-500",
    label: "Addressed",
  },
  resolved: {
    className: "sibs-badge-success",
    dotClassName: "bg-emerald-500",
    label: "Resolved",
  },

  // Warning / Pending / Review
  pending: {
    className: "sibs-badge-warning",
    dotClassName: "bg-amber-500",
    label: "Pending",
  },
  open: {
    className: "sibs-badge-warning",
    dotClassName: "bg-amber-500",
    label: "Open",
  },
  current: {
    className: "sibs-badge-warning",
    dotClassName: "bg-amber-500",
    label: "Current",
  },
  "for review": {
    className: "sibs-badge-warning",
    dotClassName: "bg-amber-500",
    label: "For Review",
  },
  "for approval": {
    className: "sibs-badge-warning",
    dotClassName: "bg-amber-500",
    label: "For Approval",
  },
  "early logout": {
    className: "sibs-badge-warning",
    dotClassName: "bg-amber-500",
    label: "Early Logout",
  },
  "early-out": {
    className: "sibs-badge-warning",
    dotClassName: "bg-amber-500",
    label: "Early Logout",
  },
  "incomplete requirements": {
    className: "sibs-badge-warning",
    dotClassName: "bg-amber-500",
    label: "Incomplete",
  },
  "at risk": {
    className: "sibs-badge-warning",
    dotClassName: "bg-amber-500",
    label: "At Risk",
  },
  "medium risk": {
    className: "sibs-badge-warning",
    dotClassName: "bg-amber-500",
    label: "Medium",
  },

  // Danger / Rejected / Declined / Late
  rejected: {
    className: "sibs-badge-danger",
    dotClassName: "bg-rose-500",
    label: "Rejected",
  },
  declined: {
    className: "sibs-badge-danger",
    dotClassName: "bg-rose-500",
    label: "Declined",
  },
  late: {
    className: "sibs-badge-danger",
    dotClassName: "bg-rose-500",
    label: "Late",
  },
  "late clock-in": {
    className: "sibs-badge-danger",
    dotClassName: "bg-rose-500",
    label: "Late Clock-in",
  },
  resigned: {
    className: "sibs-badge-danger",
    dotClassName: "bg-rose-500",
    label: "Resigned",
  },
  "drop off": {
    className: "sibs-badge-danger",
    dotClassName: "bg-rose-500",
    label: "Drop Off",
  },
  delayed: {
    className: "sibs-badge-danger",
    dotClassName: "bg-rose-500",
    label: "Delayed",
  },
  "high risk": {
    className: "sibs-badge-danger",
    dotClassName: "bg-rose-500",
    label: "High",
  },

  // Neutral / Draft / Scheduled
  draft: {
    className: "sibs-badge-neutral",
    dotClassName: "bg-slate-500",
    label: "Draft",
  },
  scheduled: {
    className: "sibs-badge-neutral",
    dotClassName: "bg-slate-500",
    label: "Scheduled",
  },
  "none risk": {
    className: "sibs-badge-neutral",
    dotClassName: "bg-slate-500",
    label: "None",
  },
  "no clock-in": {
    className: "sibs-badge-neutral",
    dotClassName: "bg-slate-400",
    label: "No Clock-in",
  },
  "no clock-out": {
    className: "sibs-badge-neutral",
    dotClassName: "bg-slate-400",
    label: "No Clock-out",
  },

  // Info / Blue
  scheduled_interview: {
    className: "sibs-badge-info",
    dotClassName: "bg-blue-600",
    label: "Interview Scheduled",
  },
  "low risk": {
    className: "sibs-badge-info",
    dotClassName: "bg-blue-600",
    label: "Low",
  },
};

export default function StatusBadge({
  status = "Pending",
  showDot = true,
  className = "",
  prefix = "",
}) {
  const normalizedKey = String(status || "Pending")
    .trim()
    .toLowerCase();

  const config =
    STATUS_CONFIGS[normalizedKey] || {
      className: "sibs-badge-neutral",
      dotClassName: "bg-slate-500",
      label: status,
    };

  return (
    <span className={`${config.className} ${className}`.trim()}>
      {showDot && (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dotClassName}`}
          aria-hidden="true"
        />
      )}
      {prefix}{config.label}
    </span>
  );
}
