import { useDemoAuth } from "@/lib/utils/journey/hrisRoleAdapter";
import { useState, useMemo, useCallback } from "react";
import MetricCard, { MetricGrid } from "@/components/ui/MetricCard";
import SelectDropdown from "@/components/ui/SelectDropdown";
import StatusBadge from "@/components/ui/StatusBadge";
import AssignTrainingActivityModal from "./AssignTrainingActivityModal";
import TraineeMaterialSubmissionModal from "./TraineeMaterialSubmissionModal";
import {
  addCalendarDays,
  trainingDateBounds,
  dateWithinBounds,
  clampTrainingDate,
  clampCalendarMonth,
  moveCalendarMonth,
  calendarMonthCells,
  trainerForTask,
  trainersForDay,
  phaseOwnerForDay,
  canCreateTrainingAssignment,
} from "../traineeCalendarUtils";
import { useJourney } from "../JourneyContext";
import {
  BookOpen,
  CheckCircle2,
  Award,
  TrendingUp,
  User,
  ChevronRight,
  Layers,
  Eye,
  ChevronLeft,
  Target,
} from "lucide-react";

function TraineeDashboardView({ onSwitchModule }) {
  const { user } = useDemoAuth();
  const isEmployee = user?.role === "Employee";
  const {
    journeys,
    assignments,
    progress,
    assessments,
    assessmentGrades,
    attendance,
    submitAssignment,
    addTrainingAssignment,
    simulatedCurrentDate,
    setSelectedJourney,
  } = useJourney();

  const [selectedEmpId, setSelectedEmpId] = useState(() => {
    return journeys[0]?.sibsEmployeeId || journeys[0]?.id || "SIBS-2901";
  });
  const [requestedTrainingDate, setTrainingDate] = useState(
    simulatedCurrentDate || "2026-10-14"
  );
  const [requestedCalendarMonth, setCalendarMonth] = useState(null);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [taskFilter, setTaskFilter] = useState("All");
  const [calendarView, setCalendarView] = useState("week");
  const [activeMaterialModal, setActiveMaterialModal] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(null);

  const ownJourney = isEmployee
    ? journeys.find(
        (j) =>
          j.sibsEmployeeId === user?.journeyEmployeeId ||
          j.id === user?.journeyEmployeeId ||
          (user?.email && j.email?.toLowerCase() === user.email.toLowerCase())
      )
    : null;
  const currentJourney = isEmployee
    ? ownJourney
    : journeys.find(
        (j) => j.sibsEmployeeId === selectedEmpId || j.id === selectedEmpId
      ) || journeys[0];

  const empKey = currentJourney?.sibsEmployeeId || currentJourney?.id || "";
  const journeyStartDate =
    currentJourney?.startDate || currentJourney?.hireDate || "";
  const dateBounds = trainingDateBounds(journeyStartDate, simulatedCurrentDate);
  const trainingDate = clampTrainingDate(requestedTrainingDate, dateBounds);
  const calendarMonth = clampCalendarMonth(
    requestedCalendarMonth || trainingDate.slice(0, 7),
    dateBounds
  );
  const monthCells = calendarMonthCells(calendarMonth);

  const pickTrainingDate = (date) => {
    if (!dateWithinBounds(date, dateBounds)) return;
    setTrainingDate(date);
    setCalendarMonth(date.slice(0, 7));
    setTaskFilter("All");
  };

  const changeMonth = (offset) => {
    const next = moveCalendarMonth(calendarMonth, offset);
    if (
      next >= dateBounds.min.slice(0, 7) &&
      next <= dateBounds.max.slice(0, 7)
    ) {
      setCalendarMonth(next);
    }
  };

  const dayOffset = (dateStr, numDays) => {
    return addCalendarDays(dateStr, numDays);
  };

  const dateLabel = (dStr) => {
    if (!dStr) return "—";
    return new Date(dStr + "T12:00:00Z").toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  const weekOf = (dateStr) => {
    const d = new Date(dateStr + "T12:00:00Z");
    const mon = dayOffset(dateStr, -((d.getUTCDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => dayOffset(mon, i));
  };

  const weekCalendarDates = weekOf(trainingDate);
  const calendarDates = calendarView === "week" ? weekCalendarDates : monthCells;

  const changeCalendarPage = (offset) => {
    if (calendarView === "month") {
      changeMonth(offset);
      return;
    }
    pickTrainingDate(
      clampTrainingDate(addCalendarDays(trainingDate, offset * 7), dateBounds)
    );
  };

  const cannotGoPrevious =
    calendarView === "month"
      ? calendarMonth <= dateBounds.min.slice(0, 7)
      : weekCalendarDates[0] <= dateBounds.min;
  const cannotGoNext =
    calendarView === "month"
      ? calendarMonth >= dateBounds.max.slice(0, 7)
      : weekCalendarDates[6] >= dateBounds.max;

  const getAttendanceAt = useCallback(
    (dateStr) => {
      if (dateStr > simulatedCurrentDate) return "Upcoming";
      if (!journeyStartDate || dateStr < journeyStartDate) return "Not scheduled";
      const weekday = new Date(dateStr + "T12:00:00Z").getUTCDay();
      if (weekday === 0 || weekday === 6) return "Rest day";
      const match = attendance.find(
        (a) =>
          (a.emp === empKey || a.emp === currentJourney?.id) && a.date === dateStr
      );
      return match?.status || "Unrecorded";
    },
    [simulatedCurrentDate, journeyStartDate, attendance, empKey, currentJourney?.id]
  );

  const traineeAssignments = useMemo(
    () =>
      assignments.filter(
        (a) => a.emp === empKey || a.emp === currentJourney?.id
      ),
    [assignments, empKey, currentJourney?.id]
  );

  const selectedDayAssignments = useMemo(
    () => traineeAssignments.filter((a) => a.date === trainingDate),
    [traineeAssignments, trainingDate]
  );

  const dayTrainer = trainersForDay(
    selectedDayAssignments,
    currentJourney?.trainerName
  );
  const phaseContact = phaseOwnerForDay(
    journeyStartDate,
    trainingDate,
    currentJourney?.trainerName,
    currentJourney?.tl
  );
  const canAddActivity = canCreateTrainingAssignment(
    user?.role,
    user?.trainerName,
    currentJourney?.trainerName,
    trainingDate,
    dateBounds,
    simulatedCurrentDate,
    currentJourney?.finalOutcome
  );

  const availableTrainers = useMemo(
    () =>
      Array.from(
        new Set(journeys.map((j) => j.trainerName).filter((name) => Boolean(name)))
      ),
    [journeys]
  );

  const materialRows = useMemo(
    () => selectedDayAssignments.filter((a) => a.type === "Material"),
    [selectedDayAssignments]
  );

  const futureAssignedDates = useMemo(
    () =>
      Array.from(
        new Set(
          traineeAssignments
            .filter(
              (a) => a.date > trainingDate && dateWithinBounds(a.date, dateBounds)
            )
            .map((a) => a.date)
        )
      ).sort(),
    [traineeAssignments, trainingDate, dateBounds]
  );
  const nextAssignedDate = futureAssignedDates[0] || null;

  const getSubmission = (item) => {
    return progress.find(
      (p) =>
        (p.emp === empKey || p.emp === currentJourney?.id) &&
        p.assignmentId === item.id
    );
  };

  const getStatus = (item) => {
    return getSubmission(item)?.status || "Not started";
  };

  const readableStatus = (status) =>
    status === "Submitted"
      ? "Awaiting trainer review"
      : status === "Revision requested"
      ? "Needs revision"
      : status;

  const statusExplanation = (status) =>
    status === "Verified"
      ? "Trainer confirmed this activity."
      : status === "Submitted"
      ? "Submitted and waiting for trainer verification."
      : status === "Revision requested"
      ? "Review trainer feedback and resubmit."
      : status === "In progress"
      ? "Work started but not submitted."
      : "This activity has not been submitted yet.";

  const filterMatches = (item) => {
    const st = getStatus(item);
    if (taskFilter === "All") return true;
    if (taskFilter === "To do")
      return ["Not started", "In progress", "Revision requested"].includes(st);
    if (taskFilter === "For review") return st === "Submitted";
    if (taskFilter === "Verified") return st === "Verified";
    return true;
  };

  const weekDays = weekOf(trainingDate);
  const weekMaterials = useMemo(
    () =>
      weekDays.flatMap((day) =>
        traineeAssignments.filter(
          (a) => a.date === day && a.type === "Material"
        )
      ),
    [traineeAssignments, weekDays]
  );

  const weekSubmitted = weekMaterials.filter((a) =>
    ["Submitted", "Verified"].includes(getStatus(a))
  ).length;
  const weekVerified = weekMaterials.filter(
    (a) => getStatus(a) === "Verified"
  ).length;
  const weekRevision = weekMaterials.filter(
    (a) => getStatus(a) === "Revision requested"
  ).length;
  const weekPct = weekMaterials.length
    ? Math.round((100 * weekSubmitted) / weekMaterials.length)
    : null;

  const daySubmitted = materialRows.filter((a) =>
    ["Submitted", "Verified"].includes(getStatus(a))
  ).length;
  const dayVerified = materialRows.filter(
    (a) => getStatus(a) === "Verified"
  ).length;
  const dayPct = materialRows.length
    ? Math.round((100 * daySubmitted) / materialRows.length)
    : null;

  const dailyNeedsRevision = selectedDayAssignments.filter(
    (a) => getStatus(a) === "Revision requested"
  );
  const dailyToDo = selectedDayAssignments.filter((a) =>
    ["Not started", "In progress"].includes(getStatus(a))
  );
  const dailyForReview = selectedDayAssignments.filter(
    (a) => getStatus(a) === "Submitted"
  );
  const dailyVerified = selectedDayAssignments.filter(
    (a) => getStatus(a) === "Verified"
  );
  const nextAction = dailyNeedsRevision[0] || dailyToDo[0] || null;

  const recent14Days = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) =>
      dayOffset(simulatedCurrentDate, -i)
    ).filter((dStr) => {
      if (!journeyStartDate || dStr < journeyStartDate) return false;
      const w = new Date(dStr + "T12:00:00Z").getUTCDay();
      return w !== 0 && w !== 6;
    });
  }, [simulatedCurrentDate, journeyStartDate]);

  const {
    attPresent,
    attLate,
    attAbsent,
    attExcused,
    attMissing,
    attRecorded,
    attRate,
    attCoverage,
  } = useMemo(() => {
    let p = 0,
      l = 0,
      ab = 0,
      ex = 0,
      m = 0;
    recent14Days.forEach((dStr) => {
      const st = getAttendanceAt(dStr);
      if (st === "Present") p++;
      else if (st === "Late") l++;
      else if (st === "Absent") ab++;
      else if (st === "Excused") ex++;
      else m++;
    });
    const rec = p + l + ab + ex;
    const rate = rec ? Math.round(((p + l) / rec) * 100) : null;
    const cov = recent14Days.length
      ? Math.round((rec / recent14Days.length) * 100)
      : null;
    return {
      attPresent: p,
      attLate: l,
      attAbsent: ab,
      attExcused: ex,
      attMissing: m,
      attRecorded: rec,
      attRate: rate,
      attCoverage: cov,
    };
  }, [recent14Days, getAttendanceAt]);

  const {
    assessmentResults,
    gradedItems,
    passedItems,
    overallAvg,
    fstAvg,
    pstAvg,
    ungradedCount,
    latestGradedDate,
  } = useMemo(() => {
    const published = assessments.filter(
      (a) =>
        a.status === "Published" &&
        (a.account === "All accounts" || a.account === currentJourney?.account)
    );
    const traineeGrades = assessmentGrades.filter(
      (g) => g.emp === empKey || g.emp === currentJourney?.id
    );
    const results = published.map((a) => {
      const grade = traineeGrades.find((g) => g.assessmentId === a.id);
      const pct = grade ? Math.round((100 * grade.score) / a.max) : null;
      const passed = grade ? grade.score >= a.passing : false;
      return { a, grade, pct, passed };
    });
    const graded = results.filter((x) => x.pct !== null);
    const passed = graded.filter((x) => x.passed);
    const avg = graded.length
      ? Math.round(
          graded.reduce((acc, x) => acc + (x.pct || 0), 0) / graded.length
        )
      : null;
    const fst = results.filter((x) => x.a.phase === "FST");
    const fstG = fst.filter((x) => x.pct !== null);
    const fstA = fstG.length
      ? Math.round(fstG.reduce((acc, x) => acc + (x.pct || 0), 0) / fstG.length)
      : null;
    const pst = results.filter((x) => x.a.phase === "PST");
    const pstG = pst.filter((x) => x.pct !== null);
    const pstA = pstG.length
      ? Math.round(pstG.reduce((acc, x) => acc + (x.pct || 0), 0) / pstG.length)
      : null;
    const ungr = results.length - graded.length;
    const latestG =
      traineeGrades
        .filter((g) => results.some((r) => r.a.id === g.assessmentId))
        .map((g) => g.date)
        .filter(Boolean)
        .sort()
        .at(-1) || null;

    return {
      assessmentResults: results,
      gradedItems: graded,
      passedItems: passed,
      overallAvg: avg,
      fstAvg: fstA,
      pstAvg: pstA,
      ungradedCount: ungr,
      latestGradedDate: latestG,
    };
  }, [assessments, assessmentGrades, empKey, currentJourney?.account, currentJourney?.id]);

  const handleSaveActivity = (activityData) => {
    addTrainingAssignment({
      emp: empKey,
      date: trainingDate,
      ...activityData,
    });
    setIsAddingAssignment(false);
    setShowSuccessToast("Training activity added to the selected day.");
    setTimeout(() => setShowSuccessToast(null), 3000);
  };

  const handleSubmitMaterial = (note) => {
    if (!activeMaterialModal) return;
    submitAssignment(activeMaterialModal.id, empKey, note);
    setShowSuccessToast(
      `Submitted "${activeMaterialModal.title}" for trainer review!`
    );
    setActiveMaterialModal(null);
    setTimeout(() => setShowSuccessToast(null), 3000);
  };

  const selectedAttendance = getAttendanceAt(trainingDate);

  if (!currentJourney) {
    return (
      <div className="p-6 rounded-xl bg-white border border-sibs-border text-slate-600 font-jakarta">
        No Employee Journey is linked to your demo profile.
      </div>
    );
  }

  return (
    <div className="space-y-3.5 sm:space-y-4 2xl:space-y-5 font-jakarta">
      {/* 1. Header Card with Top Orange Gradient Accent */}
      <section
        className="sibs-page-card-in relative overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-sm"
        style={{ animationDelay: "60ms", animationFillMode: "both" }}
      >
        <span className="sibs-top-accent" aria-hidden="true" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-sibs-blue-tint px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-sibs-navy">
                <span className="h-1.5 w-1.5 rounded-full bg-sibs-orange" />
                Trainee Learning &amp; Progress • Day {currentJourney.daysElapsed} of 90
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sibs-border bg-sibs-surface px-2.5 py-0.5 sibs-text-micro font-bold text-slate-700">
                <span>Selected day attendance:</span>
                <StatusBadge
                  status={
                    selectedAttendance === "Unrecorded"
                      ? "Pending"
                      : selectedAttendance
                  }
                />
              </span>
            </div>
            <h2 className="sibs-section-title">
              Good to see you, {currentJourney.fullName.split(" ")[0]}!
            </h2>
            <p className="text-xs text-sibs-muted max-w-3xl leading-normal">
              Track your daily learning materials, FST &amp; PST module grades,
              curriculum progress, and trainer verification status.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-sibs-muted">
              <span>
                <strong className="text-sibs-navy font-bold">
                  General training contact:
                </strong>{" "}
                {currentJourney.trainerName || "Not assigned"}
              </span>
              <span className="text-slate-300">•</span>
              <span>
                <strong className="text-sibs-navy font-bold">Account:</strong>{" "}
                {currentJourney.account}
              </span>
              <span className="text-slate-300">•</span>
              <span>
                <strong className="text-sibs-navy font-bold">Site:</strong>{" "}
                {currentJourney.siteLocation}
              </span>
            </div>
            <p className="pt-1 sibs-text-xs text-sibs-muted">
              Demo as-of date:{" "}
              <strong className="text-sibs-navy font-bold">
                {dateLabel(simulatedCurrentDate)}
              </strong>{" "}
              · Training calendar selection:{" "}
              <strong className="text-sibs-navy font-bold">
                {dateLabel(trainingDate)}
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            {!isEmployee && (
              <SelectDropdown
                label="Viewing employee"
                value={selectedEmpId}
                options={journeys.map((journey) => ({
                  value: journey.sibsEmployeeId || journey.id,
                  label: `${journey.fullName} (${journey.sibsEmployeeId || journey.kronosId || "No ID"})`,
                }))}
                clearable={false}
                onChange={(employeeId) => {
                  setSelectedEmpId(employeeId);
                  setCalendarMonth(null);
                  setTrainingDate(simulatedCurrentDate);
                  setTaskFilter("All");
                }}
                className="w-full sm:w-64"
              />
            )}

            <button
              type="button"
              onClick={() => setSelectedJourney(currentJourney)}
              className="sibs-btn-secondary gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-sibs-orange" />
              <span>View Full Training &amp; Journey Record</span>
            </button>

            {!isEmployee && onSwitchModule && (
              <button
                type="button"
                onClick={() => onSwitchModule("New Hire Orientation (NHO)")}
                className="sibs-btn-secondary shrink-0 gap-1.5"
              >
                <Layers className="w-4 h-4 text-sibs-orange" />
                <span>Back to NHO</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Success Notification Banner */}
      {showSuccessToast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{showSuccessToast}</span>
          </div>
        </div>
      )}

      {/* 2. My Training on Selected Day */}
      <section
        aria-label="My training on the selected day"
        className="sibs-page-card-in rounded-xl border border-sibs-border bg-white shadow-xs overflow-hidden"
        style={{ animationDelay: "140ms", animationFillMode: "both" }}
      >
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="sibs-section-title">My Training</h2>
              <p className="mt-1 text-sm font-semibold text-sibs-navy">
                {dateLabel(trainingDate)}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {selectedDayAssignments.length
                  ? `${selectedDayAssignments.length} scheduled activities · ${dailyNeedsRevision.length + dailyToDo.length} need action · ${dailyForReview.length} awaiting review · ${dailyVerified.length} verified`
                  : "No training activities scheduled for this date. This is not a failed or incomplete training day."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {nextAction && (
                <a
                  href="#trainee-daily-work"
                  className="sibs-btn-primary gap-1.5"
                >
                  View task <ChevronRight className="w-4 h-4" />
                </a>
              )}
              {nextAssignedDate && (
                <button
                  type="button"
                  onClick={() => pickTrainingDate(nextAssignedDate)}
                  className="sibs-btn-secondary"
                >
                  Next assigned day: {dateLabel(nextAssignedDate)}
                </button>
              )}
              {!nextAction &&
                !nextAssignedDate &&
                selectedDayAssignments.length === 0 && (
                  <span className="rounded-xl bg-sibs-surface border border-sibs-border px-3.5 py-2 text-xs font-medium text-slate-600">
                    No upcoming activities recorded in this training window.
                  </span>
                )}
            </div>
          </div>

          {nextAction && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sibs-surface p-3.5 border border-sibs-border">
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sibs-orange">
                  {getStatus(nextAction) === "Revision requested"
                    ? "Action needed · trainer requested changes"
                    : "Next training task"}
                </span>
                <p className="text-sm font-bold text-sibs-navy mt-0.5">
                  {nextAction.title}
                </p>
                <p className="text-xs text-sibs-muted mt-0.5">
                  {nextAction.type === "Material"
                    ? "Learning material"
                    : "Training module"}{" "}
                  ·{" "}
                  {nextAction.trainer
                    ? `Assigned trainer: ${nextAction.trainer}`
                    : `General contact: ${currentJourney.trainerName || "Not assigned"}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTaskFilter("All");
                  setActiveMaterialModal(nextAction);
                }}
                className="sibs-btn-secondary"
              >
                {getStatus(nextAction) === "Revision requested"
                  ? "Review feedback & resubmit"
                  : "Open activity"}
              </button>
            </div>
          )}

          {!nextAction && dailyForReview.length > 0 && (
            <p className="rounded-xl bg-sibs-surface border border-sibs-border p-3 text-xs text-sibs-navy font-medium">
              Your activities for this date have been submitted.{" "}
              {dailyForReview.length}{" "}
              {dailyForReview.length === 1 ? "activity is" : "activities are"}{" "}
              awaiting trainer verification.
            </p>
          )}
        </div>
      </section>

      {/* 3. Published FST/PST Score Summary Cards */}
      <section
        className="sibs-page-card-in rounded-xl border border-sibs-border bg-white p-4 sm:p-5 shadow-xs"
        aria-label="Published FST and PST score summary"
        style={{ animationDelay: "200ms", animationFillMode: "both" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-sibs-border">
          <div>
            <h2 className="sibs-section-title">My Training Scores</h2>
            <p className="text-xs text-sibs-muted mt-0.5">
              Current published results
              {latestGradedDate
                ? ` · Latest grade: ${dateLabel(latestGradedDate)}`
                : ""}{" "}
              · Read-only. Scores do not change when selecting an earlier
              calendar date.
            </p>
          </div>
          <a
            href="#trainee-assessment-details"
            className="text-xs font-bold text-sibs-orange hover:underline flex items-center gap-1"
          >
            <span>View detailed results</span>
            <span>↓</span>
          </a>
        </div>
        <MetricGrid columns={4}>
          <MetricCard
            label="Average assessment score"
            value={overallAvg === null ? "Not scored" : `${overallAvg}%`}
            description={`${gradedItems.length} graded assessments`}
            icon={Award}
            tone="navy"
          />
          <MetricCard
            label="Fundamental Skills (FST)"
            value={fstAvg === null ? "Not scored" : `${fstAvg}%`}
            description={`${gradedItems.filter((x) => x.a.phase === "FST").length} scored FST items`}
            icon={BookOpen}
            tone="navy"
          />
          <MetricCard
            label="Product Skills (PST)"
            value={pstAvg === null ? "Not scored" : `${pstAvg}%`}
            description={`${gradedItems.filter((x) => x.a.phase === "PST").length} scored PST items`}
            icon={Target}
            tone="orange"
          />
          <MetricCard
            label="Passed / graded assessments"
            value={`${passedItems.length} / ${gradedItems.length}`}
            description="Only graded assessments count"
            icon={CheckCircle2}
            tone="green"
          />
        </MetricGrid>
        <p className="text-xs text-sibs-muted mt-3 pt-2.5 border-t border-sibs-border">
          {ungradedCount > 0
            ? `${ungradedCount} published assessment${ungradedCount === 1 ? " has" : "s have"} not been scored yet. `
            : ""}
          These grades are separate from independent QA, attendance, and Day
          30/60/90 checkpoint results.
        </p>
      </section>

      {/* 4. Training Calendar (Week & Month views) */}
      <section
        className="sibs-page-card-in bg-white rounded-xl border border-sibs-border shadow-xs p-4 sm:p-5 space-y-4"
        aria-label="Training calendar with week and month layouts"
        style={{ animationDelay: "260ms", animationFillMode: "both" }}
      >
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-sibs-border pb-3">
          <div>
            <h2 className="sibs-section-title">My Training Calendar</h2>
            <p className="text-xs text-sibs-muted mt-1">
              Choose a date to see scheduled work and recorded attendance. Switch
              to Month for the full calendar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex items-center rounded-xl border border-sibs-border-subtle p-1 bg-sibs-surface"
              role="group"
              aria-label="Calendar layout"
            >
              {["week", "month"].map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setCalendarView(view)}
                  aria-pressed={calendarView === view}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${calendarView === view ? "bg-sibs-navy text-white shadow-xs" : "text-slate-600 hover:bg-white"}`}
                >
                  {view === "week" ? "Week" : "Month"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => changeCalendarPage(-1)}
              disabled={cannotGoPrevious}
              aria-label={
                calendarView === "week"
                  ? "Previous training week"
                  : "Previous calendar month"
              }
              className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-sibs-border-subtle bg-white hover:bg-sibs-surface text-sibs-navy shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="min-w-[130px] text-center sibs-section-title">
              {calendarView === "month"
                ? new Date(`${calendarMonth}-01T12:00:00Z`).toLocaleDateString(
                    "en-US",
                    { month: "long", year: "numeric", timeZone: "UTC" }
                  )
                : `${dateLabel(weekCalendarDates[0])} – ${dateLabel(weekCalendarDates[6])}`}
            </span>
            <button
              type="button"
              onClick={() => changeCalendarPage(1)}
              disabled={cannotGoNext}
              aria-label={
                calendarView === "week"
                  ? "Next training week"
                  : "Next calendar month"
              }
              className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-sibs-border-subtle bg-white hover:bg-sibs-surface text-sibs-navy shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <label className="flex items-center gap-2 border border-sibs-border-subtle rounded-xl px-2.5 py-1.5 text-xs text-sibs-muted bg-white shadow-xs">
              Date
              <input
                type="date"
                value={trainingDate}
                min={dateBounds.min}
                max={dateBounds.max}
                onChange={(e) => pickTrainingDate(e.target.value)}
                aria-label="Choose training date"
                className="bg-transparent text-xs font-semibold text-sibs-navy outline-none cursor-pointer"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                pickTrainingDate(
                  clampTrainingDate(simulatedCurrentDate, dateBounds)
                )
              }
              className="rounded-xl border border-sibs-border-subtle bg-white px-3 py-2 text-xs font-bold text-sibs-navy hover:bg-sibs-surface shadow-xs transition-colors"
            >
              Go to demo as-of date
            </button>
          </div>
        </div>

        {!dateBounds.linked && (
          <p className="text-xs rounded-xl p-3 bg-amber-50 text-amber-800 border border-amber-200">
            A confirmed employee start date is needed to display the full 90-day
            schedule. Only the demo date is available.
          </p>
        )}

        <div
          className="hidden sm:grid grid-cols-7 gap-1.5"
          aria-hidden="true"
        >
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <span
              key={day}
              className="py-1 text-center text-[10px] font-extrabold text-sibs-muted uppercase"
            >
              {day}
            </span>
          ))}
        </div>

        <div
          className="overflow-x-auto pb-2"
          aria-label="Select a calendar day"
        >
          <div
            className={
              calendarView === "week"
                ? "flex gap-2 sm:grid sm:grid-cols-7 sm:gap-1.5"
                : "grid grid-cols-7 gap-1.5 min-w-[640px] sm:min-w-0"
            }
          >
            {calendarDates.map((date, index) => {
              if (!date) {
                return (
                  <div
                    key={`blank-${index}`}
                    className="min-w-0"
                    aria-hidden="true"
                  />
                );
              }
              const within = dateWithinBounds(date, dateBounds);
              const dayItems = within
                ? traineeAssignments.filter((a) => a.date === date)
                : [];
              const trainers = trainersForDay(
                dayItems,
                currentJourney.trainerName
              );
              const hasActivities = dayItems.length > 0;
              const att = within
                ? getAttendanceAt(date)
                : "Outside training period";
              const mats = dayItems.filter((a) => a.type === "Material").length;
              const selected = date === trainingDate;
              return (
                <button
                  key={date}
                  type="button"
                  disabled={!within}
                  onClick={() => pickTrainingDate(date)}
                  aria-pressed={selected}
                  aria-label={`${date}: ${mats} materials; ${att}; ${hasActivities ? `training contact ${trainers.names.join(" / ") || "not assigned"}` : "no trainer-led tasks scheduled"}`}
                  className={`${calendarView === "week" ? "w-[125px] shrink-0 sm:w-auto" : "min-w-0"} min-h-[82px] sm:min-h-[106px] rounded-xl border p-2 text-left flex flex-col gap-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sibs-navy ${selected ? "bg-orange-50/70 border-2 border-sibs-orange ring-1 ring-sibs-orange/20 shadow-xs" : within && hasActivities ? "bg-blue-50/40 border-blue-200 hover:bg-blue-50 hover:border-blue-300" : within ? "bg-sibs-surface border-sibs-border hover:bg-white hover:border-sibs-border-subtle" : "bg-slate-50/60 border-dashed border-slate-200 opacity-50 cursor-not-allowed"}`}
                >
                  <span className="text-xs sm:sibs-section-title">
                    <span className="sm:hidden mr-1 text-[10px] text-sibs-muted">
                      {new Date(date + "T12:00:00Z").toLocaleDateString(
                        "en-US",
                        { weekday: "short", timeZone: "UTC" }
                      )}
                    </span>
                    {Number(date.slice(-2))}
                    {date === simulatedCurrentDate && (
                      <span className="text-sibs-orange font-extrabold"> •</span>
                    )}
                  </span>
                  {within ? (
                    <>
                      <span className="text-[9px] sm:text-[10px] leading-tight text-slate-600">
                        {mats} material{mats === 1 ? "" : "s"}
                      </span>
                      {hasActivities && (
                        <span className="hidden sm:block text-[9px] text-sibs-navy font-bold leading-tight break-words">
                          {trainers.explicit ? "Task trainer: " : "Contact: "}
                          {trainers.names.join(" / ") || "Not assigned"}
                        </span>
                      )}
                      <span className="self-start">
                        <StatusBadge
                          status={att === "Unrecorded" ? "Pending" : att}
                        />
                      </span>
                    </>
                  ) : (
                    <span className="text-[9px] text-sibs-muted">—</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <p className="sibs-text-xs text-sibs-muted">
          Orange border = selected date · Orange dot = demo as-of date · Soft
          blue = scheduled activities · Attendance is based on recorded
          shifts; missing records are not absences.
        </p>
      </section>

      {/* 5. Selected-day Trainers and Phase Owner Card */}
      <section
        className="sibs-page-card-in rounded-xl border border-sibs-border bg-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs"
        aria-label="Selected-day trainers and phase owner"
        style={{ animationDelay: "320ms", animationFillMode: "both" }}
      >
        <div className="flex gap-3 items-center min-w-0">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 text-sibs-navy flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-sibs-navy" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-sibs-muted">
              Training contact · {dateLabel(trainingDate)}
            </p>
            <h3 className="text-base font-extrabold text-sibs-navy mt-0.5">
              {selectedDayAssignments.length === 0
                ? "No trainer-led tasks scheduled"
                : dayTrainer.names.join(" / ") || "Trainer not assigned"}
            </h3>
            <p className="text-xs text-sibs-muted mt-0.5">
              {selectedDayAssignments.length} scheduled activities ·{" "}
              {selectedDayAssignments.length === 0
                ? `General training contact: ${currentJourney.trainerName || "Not assigned"}`
                : dayTrainer.explicit
                ? "Each activity has an assigned trainer"
                : "General training contact shown where a task-specific trainer is not recorded"}
            </p>
          </div>
        </div>
        <div className="bg-sibs-surface border border-sibs-border rounded-xl px-3.5 py-2.5 text-xs text-slate-600 shadow-xs">
          <span className="block text-sibs-muted sibs-text-micro font-bold uppercase tracking-wider">
            Phase owner / support contact
          </span>
          <strong className="block text-sibs-navy mt-0.5 text-sm">
            {phaseContact.owner || "Not assigned"}
          </strong>
          <span className="text-[10px] text-sibs-muted font-medium">
            {phaseContact.phase}
          </span>
        </div>
      </section>

      {/* Action button to assign training activity */}
      {canAddActivity && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsAddingAssignment(true)}
            className="sibs-btn-primary"
          >
            + Assign training activity
          </button>
        </div>
      )}

      {/* 6. Assigned Learning Materials Section */}
      <div
        id="trainee-daily-work"
        className="w-full scroll-mt-24"
        aria-label="Selected day learning materials"
      >
        <div className="bg-white rounded-xl border border-sibs-border shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sibs-border pb-3">
            <div>
              <h2 className="sibs-section-title">
                Assigned Learning Materials ({trainingDate})
              </h2>
              <p className="text-xs text-sibs-muted">
                Read materials, complete tasks, and submit for trainer
                verification.
              </p>
            </div>
            {/* Filter Tabs */}
            <div
              className="flex items-center gap-1 bg-sibs-surface border border-sibs-border-subtle p-1 rounded-xl flex-wrap"
              role="group"
              aria-label="Learning material status filter"
            >
              {["All", "To do", "For review", "Verified"].map((f) => (
                <button
                  key={f}
                  onClick={() => setTaskFilter(f)}
                  aria-pressed={taskFilter === f}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${taskFilter === f ? "bg-sibs-navy text-white shadow-xs" : "text-slate-600 hover:text-sibs-navy hover:bg-white"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Itemized Materials Table / List */}
          {materialRows.filter(filterMatches).length === 0 ? (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                {materialRows.length
                  ? `No materials match “${taskFilter}”.`
                  : "No learning materials scheduled for this day."}
              </p>
              <p className="text-xs text-sibs-muted">
                {materialRows.length
                  ? "Try viewing all statuses."
                  : "Nothing to submit for this date."}
              </p>
              {materialRows.length > 0 && taskFilter !== "All" && (
                <button
                  type="button"
                  className="text-xs font-bold text-sibs-navy hover:underline"
                  onClick={() => setTaskFilter("All")}
                >
                  Show all materials
                </button>
              )}
              {materialRows.length === 0 && nextAssignedDate && (
                <button
                  type="button"
                  className="text-xs font-bold text-sibs-navy hover:underline"
                  onClick={() => pickTrainingDate(nextAssignedDate)}
                >
                  Go to next assigned day: {dateLabel(nextAssignedDate)}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {materialRows.filter(filterMatches).map((item) => {
                const sub = getSubmission(item);
                const st = getStatus(item);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-sibs-border bg-white hover:border-sibs-border-subtle transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-sibs-muted uppercase tracking-wider">
                          {item.category || "General"}
                        </span>
                        <StatusBadge status={st} />
                        {item.priority === "High" && (
                          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            High Priority
                          </span>
                        )}
                      </div>

                      <h3 className="sibs-section-title">{item.title}</h3>
                      <p className="text-xs text-slate-600 leading-normal">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-3 sibs-text-xs text-sibs-muted pt-1">
                        <span>
                          {item.trainer
                            ? "Assigned trainer"
                            : "General training contact"}
                          :{" "}
                          <strong className="text-sibs-navy">
                            {trainerForTask(item, currentJourney.trainerName) ||
                              "Not assigned"}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>Assigned by: {item.owner || "Not recorded"}</span>
                        <span>•</span>
                        <span>Duration: {item.duration}</span>
                      </div>

                      <p className="sibs-text-xs text-slate-500 mt-1 italic">
                        {statusExplanation(st)}
                      </p>
                      {sub?.feedback && (
                        <div className="mt-2 p-2.5 rounded-lg border border-blue-200 bg-blue-50 text-xs text-sibs-navy">
                          <strong className="block text-[10px] uppercase font-bold text-sibs-navy">
                            Trainer Feedback:
                          </strong>
                          <p className="mt-0.5">{sub.feedback}</p>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveMaterialModal(item);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-xs ${st === "Verified" ? "bg-white border border-sibs-border-subtle text-sibs-navy hover:bg-sibs-surface" : "bg-sibs-orange hover:bg-sibs-button-hover text-white"}`}
                      >
                        {st === "Verified"
                          ? "View verified activity"
                          : st === "Submitted"
                          ? "View submission"
                          : !isEmployee
                          ? "View details"
                          : st === "Revision requested"
                          ? "Review feedback & resubmit"
                          : "Open activity & submit"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 7. Progress & Attendance Metrics */}
      <section
        className="sibs-page-card-in space-y-2"
        aria-label="Training progress and recorded attendance"
        style={{ animationDelay: "380ms", animationFillMode: "both" }}
      >
        <div>
          <h2 className="sibs-section-title">My Progress &amp; Attendance</h2>
          <p className="text-xs text-sibs-muted mt-1">
            Submission totals are not the same as trainer verification.
            Attendance figures use recorded days only.
          </p>
        </div>

        {/* 3 Compact SiBS HRIS Metric Cards with Design Token Fills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {/* Metric 1: Selected Day Materials */}
          <div className="flex min-h-[86px] sm:min-h-[92px] flex-col justify-between rounded-xl border border-sibs-border bg-white p-3 sm:p-3.5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 truncate">
                Day Materials Submitted
              </span>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-1">
              <div className="flex items-baseline justify-between">
                <div className="text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight text-sibs-navy">
                  {materialRows.length ? (
                    <>
                      {daySubmitted}{" "}
                      <span className="text-sm font-semibold text-slate-400">
                        / {materialRows.length}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm">Not scheduled</span>
                  )}
                </div>
                <span className="text-xs font-bold text-amber-700">
                  {dayPct === null ? "N/A" : `${dayPct}%`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-sibs-orange rounded-full"
                  style={{ width: `${dayPct ?? 0}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between sibs-text-micro font-medium text-sibs-muted">
                <span>{dayVerified} verified by trainer</span>
                <span>
                  {materialRows.length
                    ? `${materialRows.length - daySubmitted} not submitted`
                    : "No materials assigned"}
                </span>
              </div>
            </div>
          </div>

          {/* Metric 2: Weekly Progress */}
          <div className="flex min-h-[86px] sm:min-h-[92px] flex-col justify-between rounded-xl border border-sibs-border bg-white p-3 sm:p-3.5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sibs-navy truncate">
                This Week's Materials Submitted
              </span>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-1">
              <div className="flex items-baseline justify-between">
                <div className="text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight text-sibs-navy">
                  {weekMaterials.length ? (
                    <>
                      {weekSubmitted}{" "}
                      <span className="text-sm font-semibold text-slate-400">
                        / {weekMaterials.length}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm">Not scheduled</span>
                  )}
                </div>
                <span className="text-xs font-bold text-sibs-navy">
                  {weekPct === null ? "N/A" : `${weekPct}%`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-sibs-navy rounded-full"
                  style={{ width: `${weekPct ?? 0}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between sibs-text-micro font-medium text-sibs-muted">
                <span>
                  {weekMaterials.length
                    ? `${weekVerified} verified · ${dateLabel(weekDays[0])}–${dateLabel(weekDays[6])}`
                    : "No materials scheduled this week"}
                </span>
                {weekRevision > 0 ? (
                  <span className="text-rose-600 font-bold">
                    {weekRevision} revision needed
                  </span>
                ) : (
                  <span>0 revisions</span>
                )}
              </div>
            </div>
          </div>

          {/* Metric 3: Attendance Summary */}
          <div className="flex min-h-[86px] sm:min-h-[92px] flex-col justify-between rounded-xl border border-sibs-border bg-white p-3 sm:p-3.5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 truncate">
                Attendance · Last 14 Days
              </span>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-1">
              <div className="flex items-baseline justify-between">
                <div className="text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight text-sibs-navy">
                  {attPresent + attLate}{" "}
                  <span className="text-xs font-medium text-slate-400">
                    / {attRecorded} recorded days
                  </span>
                </div>
                <span className="text-xs font-bold text-sibs-navy">
                  {attRate === null ? "N/A" : `${attRate}%`} recorded attendance
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${attRate ?? 0}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 sibs-text-xs font-semibold text-sibs-muted">
                <span>
                  Record coverage:{" "}
                  {attCoverage === null ? "N/A" : `${attCoverage}%`} (
                  {attRecorded} of {recent14Days.length} expected workdays)
                </span>
                <span>{attMissing} unrecorded</span>
              </div>
              <p className="mt-1 sibs-text-xs text-sibs-muted">
                {attLate} late · {attAbsent} absent · {attExcused} excused.
                Missing time records are not counted as absences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Detailed FST & PST Assessment Results Section */}
      <section
        id="trainee-assessment-details"
        className="sibs-page-card-in bg-white rounded-xl border border-sibs-border shadow-xs p-4 sm:p-5 space-y-4 scroll-mt-24"
        style={{ animationDelay: "440ms", animationFillMode: "both" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sibs-border pb-3">
          <div>
            <h2 className="sibs-section-title">
              Detailed FST &amp; PST Assessment Results
            </h2>
            <p className="text-xs text-sibs-muted mt-0.5">
              All published assessments, including those not yet scored. Only
              graded assessments count toward averages and the passed/graded
              total. Separate from independent QA and coaching evidence.
            </p>
          </div>
          <span className="text-[10px] font-bold text-sibs-muted uppercase tracking-wider bg-sibs-surface border border-sibs-border px-2.5 py-1 rounded-lg">
            Read-only
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "FST · Days 1–14", avg: fstAvg },
            { label: "PST · Days 15–28", avg: pstAvg },
          ].map(({ label, avg }) => (
            <div
              key={label}
              className="bg-sibs-surface border border-sibs-border rounded-xl p-3.5 shadow-xs"
            >
              <div className="flex justify-between items-center gap-2 text-xs">
                <strong className="text-sibs-navy">{label}</strong>
                <span className="font-bold text-sibs-navy">
                  {avg === null ? "Not scored" : `${avg}%`}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden mt-2">
                <div
                  className="h-full bg-sibs-orange rounded-full"
                  style={{ width: `${avg ?? 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {assessmentResults.length === 0 ? (
          <p className="rounded-xl p-4 bg-sibs-surface border border-sibs-border text-xs text-sibs-muted">
            No published FST/PST assessments for this account.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assessmentResults.map(({ a, grade, pct, passed }) => (
              <article
                key={a.id}
                className="border border-sibs-border bg-white rounded-xl p-3.5 space-y-1.5 shadow-xs hover:border-sibs-border-subtle transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold text-sibs-muted">
                    {a.phase} · {a.skill}
                  </span>
                  <StatusBadge
                    status={
                      pct === null
                        ? "Pending"
                        : passed
                        ? "Passed"
                        : "Below target"
                    }
                  />
                </div>
                <strong className="text-xs block text-sibs-navy">
                  {a.title}
                </strong>
                <div className="flex justify-between gap-2 text-xs text-sibs-muted">
                  <span>
                    Score:{" "}
                    <strong className="text-sibs-navy">
                      {grade ? grade.score : "—"}
                    </strong>{" "}
                    / {a.max}
                  </span>
                  <span>Passing: {a.passing}</span>
                </div>
                {grade && (
                  <p className="text-[10px] text-sibs-muted pt-0.5">
                    Graded by {grade.grader} · {dateLabel(grade.date)}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 9. Standalone Modal Shell Dialogs */}
      <AssignTrainingActivityModal
        isOpen={isAddingAssignment && canAddActivity}
        onClose={() => setIsAddingAssignment(false)}
        trainingDate={trainingDate}
        availableTrainers={availableTrainers}
        defaultTrainer={
          user?.role === "Trainer"
            ? user.trainerName || ""
            : currentJourney.trainerName || ""
        }
        userRole={user?.role}
        userName={user?.name || "Demo staff"}
        onSave={handleSaveActivity}
      />

      <TraineeMaterialSubmissionModal
        isOpen={Boolean(activeMaterialModal)}
        onClose={() => setActiveMaterialModal(null)}
        activity={activeMaterialModal}
        submission={
          activeMaterialModal ? getSubmission(activeMaterialModal) : null
        }
        status={
          activeMaterialModal ? getStatus(activeMaterialModal) : "Not started"
        }
        readableStatus={
          activeMaterialModal
            ? readableStatus(getStatus(activeMaterialModal))
            : "Not started"
        }
        statusExplanation={
          activeMaterialModal
            ? statusExplanation(getStatus(activeMaterialModal))
            : ""
        }
        isEmployee={isEmployee}
        simulatedCurrentDate={simulatedCurrentDate}
        assignedTrainerName={
          activeMaterialModal
            ? trainerForTask(activeMaterialModal, currentJourney.trainerName)
            : ""
        }
        onSubmit={handleSubmitMaterial}
      />
    </div>
  );
}

export default TraineeDashboardView;
