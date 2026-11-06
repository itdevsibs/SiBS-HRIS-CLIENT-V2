import PaginationTable from "@/services/pagination/PaginationTable";
import { useState, useMemo } from "react";
import { useNHO } from "../NHOContext";
import {
  Users,
  CheckCircle,
  AlertCircle,
  Clock,

  FileCheck,
  Server,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { MetricCard, MetricGrid, SearchInput, SelectDropdown } from "@/components/ui";
import NHOSendCredentialsModal from "./NHOSendCredentialsModal";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "ready_it", label: "Ready for IT Endorsement" },
  { value: "pending_attendance", label: "Pending Attendance" },
  { value: "pending_majors", label: "Pending Majors" },
  { value: "no_show", label: "No Show" },
  { value: "awaiting_hr", label: "Awaiting HR Acceptance" },
];

function NHOTADashboard({
  onOpenAttendanceModal,
  onOpenDetails,
  onOpenEndorsement,
}) {
  const { applicants, setSelectedApplicantId, checkITEndorsementEligibility } = useNHO();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sendCredentialsApplicant, setSendCredentialsApplicant] = useState(null);

  const metrics = useMemo(() => {
    const totalScheduled = applicants.length;
    const pendingAttendance = applicants.filter((a) => a.attendance === "Pending").length;
    const pendingMajorVerification = applicants.filter(
      (a) => a.attendance === "Show" && a.documents.filter((d) => d.isMajor && d.status === "Verified").length < 4
    ).length;
    const pendingOrientationOrAgreements = applicants.filter(
      (a) =>
        a.attendance === "Show" &&
        (a.orientationStatus !== "Completed" ||
          a.documents.filter((d) => d.isEssentialAgreement && d.status === "Verified").length < 3)
    ).length;
    const readyForIT = applicants.filter((a) => !a.itEndorsed && checkITEndorsementEligibility(a).isEligible).length;
    const awaitingIT = applicants.filter((a) => a.itEndorsed && a.itRequestStatus !== "Completed").length;
    const pendingHRAcceptance = applicants.filter(
      (a) => a.handoffStatus === "Pending HR Acceptance" || a.handoffStatus === "Resubmitted"
    ).length;

    return {
      totalScheduled,
      pendingAttendance,
      pendingMajorVerification,
      pendingOrientationOrAgreements,
      readyForIT,
      awaitingIT,
      pendingHRAcceptance,
    };
  }, [applicants, checkITEndorsementEligibility]);

  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      const matchesSearch =
        app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicantNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.account.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (statusFilter === "ready_it") {
        return !app.itEndorsed && checkITEndorsementEligibility(app).isEligible;
      }
      if (statusFilter === "pending_attendance") {
        return app.attendance === "Pending";
      }
      if (statusFilter === "pending_majors") {
        return app.attendance === "Show" && app.documents.filter((d) => d.isMajor && d.status === "Verified").length < 4;
      }
      if (statusFilter === "no_show") {
        return app.attendance === "No Show";
      }
      if (statusFilter === "awaiting_hr") {
        return app.handoffStatus === "Pending HR Acceptance" || app.handoffStatus === "Resubmitted";
      }
      return true;
    });
  }, [applicants, searchQuery, statusFilter, checkITEndorsementEligibility]);

  return (
    <div className="min-w-0 space-y-3.5 sm:space-y-4 2xl:space-y-5 font-jakarta">
      {/* 7 Responsive High-Density KPI Cards */}
      <MetricGrid columns={7}>
        <MetricCard
          label="Scheduled"
          value={metrics.totalScheduled}
          description="Active orientation cohort"
          tone="navy"
          icon={Users}
          delay={0}
        />
        <MetricCard
          label="Pending Attendance"
          value={metrics.pendingAttendance}
          description="Awaiting attendance tagging"
          tone="amber"
          icon={Clock}
          delay={50}
        />
        <MetricCard
          label="Pending Majors"
          value={metrics.pendingMajorVerification}
          description="Physical document clearance"
          tone="orange"
          icon={FileCheck}
          delay={100}
        />
        <MetricCard
          label="Pending Orientation"
          value={metrics.pendingOrientationOrAgreements}
          description="Quiz & essential agreements"
          tone="amber"
          icon={AlertCircle}
          delay={150}
        />
        <MetricCard
          label="Ready for IT"
          value={metrics.readyForIT}
          description="Eligibility criteria completed"
          tone="green"
          icon={CheckCircle}
          delay={200}
        />
        <MetricCard
          label="Awaiting IT"
          value={metrics.awaitingIT}
          description="Kronos ID provisioning"
          tone="indigo"
          icon={Server}
          delay={250}
        />
        <MetricCard
          label="Awaiting HR"
          value={metrics.pendingHRAcceptance}
          description="Final handoff review"
          tone="purple"
          icon={ShieldCheck}
          delay={300}
        />
      </MetricGrid>

      {/* Main NHO Candidate Records Section */}
      <section
        className="sibs-page-card-in min-w-0 space-y-4 rounded-2xl border border-sibs-border bg-white p-4 sm:p-5 shadow-xs"
        style={{ animationDelay: "360ms", animationFillMode: "both" }}
      >
        <div>
          <h2 className="sibs-card-title">
            NHO Candidate Records
          </h2>
          <p className="sibs-card-subtitle mt-1">
            Manage candidates scheduled for New Hire Orientation, their attendance, document clearance, and handoff progress.
          </p>
        </div>

        {/* Global Standard Filter Bar */}
        <div className="relative z-[90] overflow-visible">
          <PaginationTable
            filterLayout="ta-inline"
            showFilterPanel={false}
            showFilterHeader={false}
            showPagination={false}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by candidate name, applicant ID, position, or account..."
            className="border-0 bg-transparent p-0 shadow-none"
            clearFilterLabel="Clear"
            hasActiveFilters={searchQuery.trim() !== "" || statusFilter !== "all"}
            onClearFilters={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            dropdownFilters={[{
              key: "status",
              label: "Status",
              value: statusFilter,
              onChange: (value) => setStatusFilter(value || "all"),
              options: STATUS_FILTER_OPTIONS,
              includeAll: false,
              placeholder: "All Statuses",
              searchable: false,
            }]}
          />
        </div>

        {/* Dense Table Shell */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-sibs-border px-4 py-2.5 bg-sibs-surface">
            <div className="flex items-center gap-2 sibs-text-xs font-bold text-sibs-navy">
              <Users className="h-4 w-4 text-sibs-orange" />
              <span>NHO Cohort</span>
              <span className="rounded-full bg-sibs-navy px-2 py-0.5 text-[10px] font-extrabold text-white">
                {filteredApplicants.length}
              </span>
            </div>
            <span className="sibs-text-micro font-semibold text-sibs-muted">
              {filteredApplicants.length} of {applicants.length} records
            </span>
          </div>

          <div className="min-w-0">
            <table className="w-full table-fixed border-collapse text-left sibs-text-xs [&_td]:break-words">
              <colgroup>{[12, 13, 8, 9, 6, 10, 7, 9, 8, 18].map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
              <thead className="sibs-data-table-head sticky top-0 z-10 bg-sibs-surface">
                <tr className="sibs-data-table-head-row">
                  <th className="sibs-data-table-th !whitespace-normal py-3 px-4">NHO Candidate</th>
                  <th className="sibs-data-table-th !whitespace-normal py-3 px-3">Position &amp; Account</th>
                  <th className="sibs-data-table-th !whitespace-normal py-3 px-3">NHO Date</th>
                  <th className="sibs-data-table-th !whitespace-normal py-3 px-3">Attendance</th>
                  <th className="sibs-data-table-th !whitespace-normal py-3 px-3">4 Majors</th>
                  <th className="sibs-data-table-th !whitespace-normal py-3 px-3">Orientation &amp; Quiz</th>
                  <th className="sibs-data-table-th !whitespace-normal py-3 px-3">3 Agreements</th>
                  <th className="sibs-data-table-th !whitespace-normal py-3 px-3">IT Endorsement</th>
                  <th className="sibs-data-table-th !whitespace-normal py-3 px-3">Handoff</th>
                  <th className="sibs-data-table-th !whitespace-normal py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sibs-border sibs-text-xs font-semibold text-sibs-navy">
                {filteredApplicants.map((app) => {
                  const verifiedMajorsCount = app.documents.filter(
                    (d) => d.isMajor && d.status === "Verified"
                  ).length;
                  const verifiedAgreementsCount = app.documents.filter(
                    (d) => d.isEssentialAgreement && d.status === "Verified"
                  ).length;
                  const { isEligible } = checkITEndorsementEligibility(app);

                  return (
                    <tr
                      key={app.id}
                      className="sibs-data-table-row" tabIndex={0} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setSelectedApplicantId(app.id); onOpenDetails(app); } }}
                      onClick={() => {
                        setSelectedApplicantId(app.id);
                        onOpenDetails(app);
                      }}
                    >
                      {/* Candidate Identity */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-sibs-navy">
                          {app.fullName}
                        </div>
                        <div className="sibs-text-micro text-sibs-muted font-medium">
                          {app.applicantNumber} • {app.cluster}
                        </div>
                      </td>

                      {/* Position & Account */}
                      <td className="py-3 px-2">
                        <div className="font-semibold text-slate-800">{app.position}</div>
                        <div className="sibs-text-micro text-sibs-muted">{app.account}</div>
                      </td>

                      {/* NHO Date */}
                      <td className="py-3 px-2">
                        <div className="font-bold text-slate-800 tabular-nums">{app.scheduledNhoDate}</div>
                        <div className="sibs-text-micro text-sibs-muted">
                          Notice: {app.invitationSentDate}
                        </div>
                      </td>

                      {/* Attendance */}
                      <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-start gap-1.5 min-w-0">
                          <span
                            className={
                              app.attendance === "Show"
                                ? "sibs-badge-success"
                                : app.attendance === "No Show"
                                ? "sibs-badge-danger"
                                : "sibs-badge-warning"
                            }
                          >
                            {app.attendance}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApplicantId(app.id);
                              onOpenAttendanceModal(app);
                            }}
                            className={
                              app.attendance === "Pending"
                                ? "sibs-btn-primary h-6.5 px-2 text-[10px] font-bold"
                                : "sibs-btn-secondary h-6.5 px-2 text-[10px] font-bold"
                            }
                            aria-label={`${app.attendance === "Pending" ? "Tag" : "Edit"} NHO attendance for ${app.fullName}`}
                            title={app.attendance === "Pending" ? "Record Show or No Show" : "Update attendance"}
                          >
                            {app.attendance === "Pending" ? "Tag Attendance" : "Edit Attendance"}
                          </button>
                        </div>
                      </td>

                      {/* 4 Majors */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              verifiedMajorsCount === 4 ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          <span className="font-bold text-sibs-navy tabular-nums">
                            {verifiedMajorsCount}/4
                          </span>
                          <span className="sibs-text-micro text-sibs-muted">
                            ({app.physicalClearance})
                          </span>
                        </div>
                      </td>

                      {/* Orientation & Quiz */}
                      <td className="py-3 px-2">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={
                              app.orientationStatus === "Completed"
                                ? "sibs-badge-success"
                                : app.orientationStatus === "In Progress"
                                ? "sibs-badge-info"
                                : "sibs-badge-neutral"
                            }
                          >
                            {app.orientationStatus}
                          </span>
                          {app.orientationStatus === "Completed" && (
                            <span className="sibs-text-micro font-bold text-sibs-muted bg-sibs-surface px-1.5 py-0.5 rounded border border-sibs-border tabular-nums">
                              Score: {app.orientationQuizScore ?? 6}/{app.orientationQuizTotal ?? 6} ({app.orientationQuizPercentage ?? 100}%)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3 Essential Agreements */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              verifiedAgreementsCount === 3 ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          <span className="font-bold text-sibs-navy tabular-nums">
                            {verifiedAgreementsCount}/3
                          </span>
                        </div>
                      </td>

                      {/* IT Endorsement */}
                      <td className="py-3 px-2">
                        {app.itEndorsed ? (
                          <span
                            className={
                              app.itRequestStatus === "Completed"
                                ? "sibs-badge-success"
                                : "sibs-badge-info"
                            }
                          >
                            {app.itRequestStatus === "Completed"
                              ? `Kronos: ${app.officialKronosId}`
                              : "Endorsed (IT Queue)"}
                          </span>
                        ) : isEligible ? (
                          <span className="sibs-badge-success max-w-full whitespace-normal">Ready to Endorse</span>
                        ) : (
                          <span className="sibs-text-micro text-sibs-muted font-medium">Incomplete</span>
                        )}
                      </td>

                      {/* Handoff Status */}
                      <td className="py-3 px-2">
                        <span
                          className={
                            app.handoffStatus === "Accepted"
                              ? "sibs-badge-success"
                              : app.handoffStatus === "Returned for Correction"
                              ? "sibs-badge-danger"
                              : app.handoffStatus === "Pending HR Acceptance" ||
                                app.handoffStatus === "Resubmitted"
                              ? "sibs-badge-info"
                              : "text-sibs-faint sibs-text-micro"
                          }
                        >
                          {app.handoffStatus === "Not Ready" ? "—" : app.handoffStatus}
                        </span>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {app.attendance === "Show" && !isEligible && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApplicantId(app.id);
                                onOpenDetails(app, "majors");
                              }}
                              className="sibs-btn-secondary whitespace-nowrap shrink-0 h-7.5 px-2.5 text-xs font-bold cursor-pointer"
                            >
                              Review Docs ({verifiedMajorsCount}/4)
                            </button>
                          )}

                          {app.attendance === "No Show" && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApplicantId(app.id);
                                onOpenAttendanceModal(app);
                              }}
                              className="sibs-btn-danger whitespace-nowrap shrink-0 h-7.5 px-2.5 text-xs font-bold cursor-pointer"
                            >
                              Follow-Up / Reschedule
                            </button>
                          )}

                          {!app.itEndorsed && isEligible && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApplicantId(app.id);
                                onOpenEndorsement(app);
                              }}
                              className="sibs-btn-primary whitespace-nowrap shrink-0 h-7.5 px-2.5 text-xs font-bold cursor-pointer !bg-emerald-600 hover:!bg-emerald-700"
                            >
                              Endorse to IT
                            </button>
                          )}

                          {app.attendance === "Show" && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApplicantId(app.id);
                                setSendCredentialsApplicant(app);
                              }}
                              className="sibs-btn-secondary whitespace-nowrap shrink-0 h-7.5 px-2.5 text-xs font-bold gap-1 cursor-pointer"
                              title="Re-send Temporary Access Link & Credentials (Show only)"
                            >
                              <Mail className="w-3.5 h-3.5 text-sibs-orange" />
                              <span>Access Link</span>
                            </button>
                          )}

                          
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredApplicants.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-xs font-medium text-sibs-muted">
                      No NHO records match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Send Credentials Modal */}
      {sendCredentialsApplicant && (
        <NHOSendCredentialsModal
          applicant={sendCredentialsApplicant}
          isOpen={Boolean(sendCredentialsApplicant)}
          onClose={() => setSendCredentialsApplicant(null)}
        />
      )}
    </div>
  );
}

export default NHOTADashboard;
