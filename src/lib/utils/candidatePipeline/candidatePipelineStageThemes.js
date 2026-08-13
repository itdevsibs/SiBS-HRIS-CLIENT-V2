const DEFAULT_STAGE_THEME = {
  phase: "review",
  accent: "bg-sibs-primary-1",
  borderActive: "border-sibs-primary-1/50 shadow-md",
  badge: "bg-sibs-primary-1 text-white",
  hoverBg: "hover:bg-sibs-tertiary-10/45",
  activeHeaderBg: "bg-sibs-tertiary-10/65",
  pill: "border-sibs-tertiary-9 bg-sibs-tertiary-10 text-sibs-primary-1",
  header: "border-[#D7DEE8] bg-white",
};

const ACTIVE_STAGE_THEME = {
  phase: "active",
  accent: "bg-blue-500",
  borderActive: "border-blue-500/60 shadow-md",
  badge: "bg-blue-700 text-white",
  hoverBg: "hover:bg-blue-50/50",
  activeHeaderBg: "bg-blue-50/70",
  pill: "border-blue-100 bg-blue-50 text-blue-700",
  header: "border-blue-100 bg-[#F5F8FF]",
};

const SUCCESS_STAGE_THEME = {
  phase: "success",
  accent: "bg-emerald-500",
  borderActive: "border-emerald-500/60 shadow-md",
  badge: "bg-emerald-700 text-white",
  hoverBg: "hover:bg-emerald-50/50",
  activeHeaderBg: "bg-emerald-50/70",
  pill: "border-emerald-100 bg-emerald-50 text-emerald-700",
  header: "border-emerald-100 bg-[#F3FBF7]",
};

const PENDING_STAGE_THEME = {
  phase: "pending",
  accent: "bg-amber-500",
  borderActive: "border-amber-500/60 shadow-md",
  badge: "bg-amber-700 text-white",
  hoverBg: "hover:bg-amber-50/50",
  activeHeaderBg: "bg-amber-50/70",
  pill: "border-amber-100 bg-amber-50 text-amber-700",
  header: "border-amber-100 bg-[#FFFBEB]",
};

const HANDOFF_STAGE_THEME = {
  phase: "handoff",
  accent: "bg-teal-500",
  borderActive: "border-teal-500/60 shadow-md",
  badge: "bg-teal-700 text-white",
  hoverBg: "hover:bg-teal-50/50",
  activeHeaderBg: "bg-teal-50/70",
  pill: "border-teal-100 bg-teal-50 text-teal-700",
  header: "border-teal-100 bg-[#F0FCFC]",
};

const NEGATIVE_STAGE_THEME = {
  phase: "negative",
  accent: "bg-red-500",
  borderActive: "border-red-500/60 shadow-md",
  badge: "bg-red-700 text-white",
  hoverBg: "hover:bg-red-50/50",
  activeHeaderBg: "bg-red-50/70",
  pill: "border-red-100 bg-red-50 text-sibs-primary-1",
  header: "border-red-100 bg-[#FFF7F7]",
};

const PIPELINE_STAGE_THEMES = {
  "Initial Screening": DEFAULT_STAGE_THEME,
  "Online Assessment": ACTIVE_STAGE_THEME,
  "Assessment Fit": SUCCESS_STAGE_THEME,
  "Interview Scheduled": ACTIVE_STAGE_THEME,
  Interviewed: SUCCESS_STAGE_THEME,
  Offered: PENDING_STAGE_THEME,
  Accepted: SUCCESS_STAGE_THEME,
  "For NHO": HANDOFF_STAGE_THEME,
  "Drop-off": NEGATIVE_STAGE_THEME,
  "Drop-offs": NEGATIVE_STAGE_THEME,
};

export function getPipelineStageTheme(stage = "") {
  return PIPELINE_STAGE_THEMES[String(stage || "").trim()] || DEFAULT_STAGE_THEME;
}

export function getPipelineStageClass(stage = "") {
  return getPipelineStageTheme(stage).pill;
}
