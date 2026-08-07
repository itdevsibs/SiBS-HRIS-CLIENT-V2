import { getSurveyStatusLabel, getResponseSourceLabel } from "@/lib/utils/candidateExperience/index.js";

export function formatExperienceDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export function surveyStatusTone(status) {
  return {
    submitted: "border-emerald-200 bg-emerald-50 text-emerald-700",
    opened: "border-blue-200 bg-blue-50 text-blue-700",
    sent: "border-cyan-200 bg-cyan-50 text-cyan-700",
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    expired: "border-slate-200 bg-slate-100 text-slate-600",
    not_sent: "border-slate-200 bg-slate-50 text-slate-500",
  }[status] || "border-slate-200 bg-slate-50 text-slate-500";
}

export function outcomeTone(outcome) {
  return outcome === "Drop-off"
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function sourceTone(source) {
  return source === "candidate_survey"
    ? "border-blue-200 bg-blue-50 text-[#042C51]"
    : source === "ta_manual"
      ? "border-orange-200 bg-orange-50 text-[#C2410C]"
      : "border-slate-200 bg-slate-50 text-slate-500";
}

export function SurveyStatusBadge({ status }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${surveyStatusTone(status)}`}>{getSurveyStatusLabel(status)}</span>;
}

export function OutcomeBadge({ outcome }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${outcomeTone(outcome)}`}>{outcome}</span>;
}

export function ResponseSourceBadge({ source }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${sourceTone(source)}`}>{getResponseSourceLabel(source)}</span>;
}

export function RatingStars({ rating = 0, size = 14 }) {
  const numeric = Number(rating || 0);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${numeric} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= numeric ? "text-amber-400" : "text-slate-200"} style={{ fontSize: size }}>★</span>
      ))}
    </span>
  );
}
