import StatusFilterTabs from "@/components/ui/StatusFilterTabs";
import { PageHeaderHero } from "@/components/ui";
import { useNHO } from "./NHOContext";
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Clock,
} from "lucide-react";

function NHORoleHeader({
  subTab,
  onSubTabChange,
  sectionHeader,
  onOpenStandalonePortal,
}) {
  const {
    role,
    setRole,
    toast,
  } = useNHO();

  const rolesList = [
    { id: "TA", label: "Talent Acquisition (TA)" },
    { id: "Applicant", label: "Applicant Portal" },
    { id: "IT", label: "IT Operations" },
    { id: "QDS", label: "QDS", hidden: true },
    { id: "Trainer", label: "Trainer", hidden: true },
    { id: "WFM", label: "Workforce Planning (WFM)" },
    { id: "HR", label: "HR Operations" },
  ];

  return (
    <div className="relative z-20 mb-3.5 sm:mb-4 2xl:mb-5 font-jakarta">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`mb-3 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold shadow-xs ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : toast.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-sky-200 bg-sky-50 text-sky-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : toast.type === "error" ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          ) : (
            <Info className="h-4 w-4 shrink-0 text-sky-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Role PageHeaderHero */}
      <PageHeaderHero
        kicker={sectionHeader.badge || "Recruitment Operations"}
        title={sectionHeader.title || "NHO Management"}
        description={sectionHeader.description}
        actions={
          <div className="flex max-w-full flex-wrap items-center gap-2">
            {/* Standalone Employee View */}
            {onOpenStandalonePortal && (
              <button
                type="button"
                onClick={onOpenStandalonePortal}
                className="sibs-btn-primary h-8.5 px-3 text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                title="Open clean standalone public portal without staff sidebar and header"
              >
                <span>Standalone Employee View</span>
                <ExternalLink size={12} />
              </button>
            )}
          </div>
        }
      />

      {/* Workflow Navigation Card (Role Switcher & Subtabs) */}
      <section className="overflow-visible rounded-xl border border-sibs-border bg-white shadow-xs mt-3.5 sm:mt-4 2xl:mt-5">
        {/* Workflow Role Switcher Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-2.5 bg-sibs-surface">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="sibs-text-micro font-extrabold text-sibs-muted uppercase tracking-wider mr-1">
              View As Portal:
            </span>
            {rolesList
              .filter((r) => !r.hidden)
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    role === r.id
                      ? "bg-sibs-navy text-white shadow-xs"
                      : "bg-white text-sibs-navy hover:text-sibs-orange border border-sibs-border hover:bg-sibs-surface"
                  }`}
                >
                  <span>
                    {r.id === "Applicant" ? "Applicant / Employee Portal" : r.label}
                  </span>
                  {r.id === "Applicant" && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                        role === "Applicant"
                          ? "bg-sibs-orange text-white"
                          : "bg-orange-50 text-sibs-orange border border-orange-200"
                      }`}
                    >
                      Uploads &amp; Quiz
                    </span>
                  )}
                </button>
              ))}
          </div>

          <div className="sibs-text-xs text-sibs-muted font-semibold hidden lg:block">
            {role === "Applicant"
              ? "Testing temporary access, file submissions, agreements & orientation quiz"
              : "Operating recruitment, verification and provisioning workflows"}
          </div>
        </div>

        {/* Role-Specific Subtabs */}
        {subTab && onSubTabChange && (
          <div className="border-t border-sibs-border">
            <StatusFilterTabs
              tabs={
                role === "TA"
                  ? [
                      { id: "dashboard", label: "NHO Management", icon: Sparkles },
                      { id: "attendance", label: "NHO Attendance (Today)", icon: Clock },
                      { id: "handoffs", label: "NHO Handoffs", icon: CheckCircle },
                    ]
                  : role === "Applicant"
                  ? [
                      { id: "overview", label: "My NHO Overview", icon: Sparkles },
                      { id: "majors", label: "Major Requirements", icon: CheckCircle },
                      { id: "orientation", label: "SiBS Orientation", icon: Sparkles },
                      { id: "agreements", label: "Essential Agreements", icon: CheckCircle },
                      { id: "requirements", label: "Non-Major Requirements", icon: CheckCircle },
                      { id: "profile", label: "Personal Information", icon: Sparkles },
                      { id: "login-sim", label: "Temporary Access Demo", icon: Sparkles },
                    ]
                  : role === "IT"
                  ? [
                      { id: "queue", label: "ID Creation Requests", icon: Clock },
                      { id: "details", label: "Request Details & Editing", icon: CheckCircle },
                      { id: "provisioning", label: "Manual Kronos Provisioning", icon: Sparkles },
                    ]
                  : role === "WFM"
                  ? [
                      { id: "queue", label: "Production Seating Queue", icon: Clock },
                      { id: "assignment", label: "Seat Assignment Form", icon: CheckCircle },
                    ]
                  : [
                      { id: "handoffs", label: "NHO Handoffs", icon: Sparkles },
                      { id: "review", label: "Handoff Review & Acceptance", icon: CheckCircle },
                      { id: "pending-reqs", label: "Pending Requirements (14-Day)", icon: Clock },
                    ]
              }
              activeValue={subTab}
              onChange={onSubTabChange}
              layoutId="nhoSubTabIndicator"
            />
          </div>
        )}
      </section>

    </div>
  );
}

export default NHORoleHeader;
