/* eslint-disable no-unused-vars */
import { useDemoAuth } from "@/lib/utils/journey/hrisRoleAdapter";
import { useState } from "react";
import MetricCard, { MetricGrid } from "@/components/ui/MetricCard";
import SelectDropdown from "@/components/ui/SelectDropdown";
import { addCalendarDays, trainingDateBounds, dateWithinBounds, clampTrainingDate, clampCalendarMonth, moveCalendarMonth, calendarMonthCells, trainerForTask, trainersForDay, phaseOwnerForDay, canCreateTrainingAssignment } from "../traineeCalendarUtils";
import { useJourney } from "../JourneyContext";
import {
  BookOpen,
  CheckCircle2,
  Award,
  TrendingUp,
  User,
  Send,
  ChevronRight,
  Layers,
  Eye,
  ChevronLeft,
  Target,
  X
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
    phaseTrainingScores,
    attendance,
    submitAssignment,
    addTrainingAssignment,
    verifyAssignment,
    simulatedCurrentDate,
    setSelectedJourney
  } = useJourney();
  const [selectedEmpId, setSelectedEmpId] = useState(() => {
    return journeys[0]?.sibsEmployeeId || journeys[0]?.id || "SIBS-2901";
  });
  const [requestedTrainingDate, setTrainingDate] = useState(simulatedCurrentDate || "2026-10-14");
  const [requestedCalendarMonth, setCalendarMonth] = useState(null);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [newActivity, setNewActivity] = useState({ type: "Material", title: "", details: "", duration: "20 min", priority: "Normal", trainer: "" });
  const [taskFilter, setTaskFilter] = useState("All");
  const [calendarView, setCalendarView] = useState("week");
  const [activeMaterialModal, setActiveMaterialModal] = useState(null);
  const [submissionNote, setSubmissionNote] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(null);
  const ownJourney = isEmployee ? journeys.find((j) => j.sibsEmployeeId === user?.journeyEmployeeId || j.id === user?.journeyEmployeeId || user?.email && j.email?.toLowerCase() === user.email.toLowerCase()) : null;
  const currentJourney = isEmployee ? ownJourney : journeys.find((j) => j.sibsEmployeeId === selectedEmpId || j.id === selectedEmpId) || journeys[0];
  if (!currentJourney) return <div className="p-6 rounded-xl bg-white border border-sibs-border text-slate-600">No Employee Journey is linked to your demo profile.</div>;
  const empKey = currentJourney.sibsEmployeeId || currentJourney.id;
  const journeyStartDate = currentJourney.startDate || currentJourney.hireDate;
  const dateBounds = trainingDateBounds(journeyStartDate, simulatedCurrentDate);
  const trainingDate = clampTrainingDate(requestedTrainingDate, dateBounds);
  const calendarMonth = clampCalendarMonth(requestedCalendarMonth || trainingDate.slice(0, 7), dateBounds);
  const monthCells = calendarMonthCells(calendarMonth);
  const pickTrainingDate = (date) => {
    if (!dateWithinBounds(date, dateBounds)) return;
    setTrainingDate(date);
    setCalendarMonth(date.slice(0, 7));
    setTaskFilter("All");
  };
  const changeMonth = (offset) => {
    const next = moveCalendarMonth(calendarMonth, offset);
    if (next >= dateBounds.min.slice(0, 7) && next <= dateBounds.max.slice(0, 7)) setCalendarMonth(next);
  };
  const dayOffset = (dateStr, numDays) => {
    return addCalendarDays(dateStr, numDays);
  };
  const dateLabel = (dStr) => {
    if (!dStr) return "\u2014";
    return (/* @__PURE__ */ new Date(dStr + "T12:00:00Z")).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  };
  const weekOf = (dateStr) => {
    const d = /* @__PURE__ */ new Date(dateStr + "T12:00:00Z");
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
    pickTrainingDate(clampTrainingDate(addCalendarDays(trainingDate, offset * 7), dateBounds));
  };
  const cannotGoPrevious = calendarView === "month" ? calendarMonth <= dateBounds.min.slice(0, 7) : weekCalendarDates[0] <= dateBounds.min;
  const cannotGoNext = calendarView === "month" ? calendarMonth >= dateBounds.max.slice(0, 7) : weekCalendarDates[6] >= dateBounds.max;
  const getAttendanceAt = (dateStr) => {
    if (dateStr > simulatedCurrentDate) return "Upcoming";
    if (!journeyStartDate || dateStr < journeyStartDate) return "Not scheduled";
    const weekday = (/* @__PURE__ */ new Date(dateStr + "T12:00:00Z")).getUTCDay();
    if (weekday === 0 || weekday === 6) return "Rest day";
    const match = attendance.find((a) => (a.emp === empKey || a.emp === currentJourney.id) && a.date === dateStr);
    return match?.status || "Unrecorded";
  };
  const attendanceTone = (status) => {
    switch (status) {
      case "Present":
        return "sibs-tone-green-bg sibs-tone-green-text border sibs-tone-green-border";
      case "Late":
        return "sibs-tone-amber-bg sibs-tone-amber-text border sibs-tone-amber-border";
      case "Absent":
        return "sibs-tone-red-bg sibs-tone-red-text border sibs-tone-red-border";
      case "Excused":
        return "sibs-tone-blue-bg sibs-tone-blue-text border sibs-tone-blue-border";
      default:
        return "bg-sibs-surface text-slate-600 border border-sibs-border";
    }
  };
  const traineeAssignments = assignments.filter((a) => a.emp === empKey || a.emp === currentJourney?.id);
  const selectedDayAssignments = traineeAssignments.filter((a) => a.date === trainingDate);
  const dayTrainer = trainersForDay(selectedDayAssignments, currentJourney.trainerName);
  const phaseContact = phaseOwnerForDay(journeyStartDate, trainingDate, currentJourney.trainerName, currentJourney.tl);
  const canAddActivity = canCreateTrainingAssignment(user?.role, user?.trainerName, currentJourney.trainerName, trainingDate, dateBounds, simulatedCurrentDate, currentJourney.finalOutcome);
  const availableTrainers = Array.from(new Set(journeys.map((j) => j.trainerName).filter((name) => !!name)));
  const chooseTrainer = () => newActivity.trainer || (user?.role === "Trainer" ? user.trainerName || "" : currentJourney.trainerName || "");
  const materialRows = selectedDayAssignments.filter((a) => a.type === "Material");
  const futureAssignedDates = Array.from(new Set(traineeAssignments.filter((a) => a.date > trainingDate && dateWithinBounds(a.date, dateBounds)).map((a) => a.date))).sort();
  const nextAssignedDate = futureAssignedDates[0] || null;
  const getSubmission = (item) => {
    return progress.find((p) => (p.emp === empKey || p.emp === currentJourney.id) && p.assignmentId === item.id);
  };
  const getStatus = (item) => {
    return getSubmission(item)?.status || "Not started";
  };
  const readableStatus = (status) => status === "Submitted" ? "Awaiting trainer review" : status === "Revision requested" ? "Needs revision" : status;
  const statusExplanation = (status) => status === "Verified" ? "Trainer confirmed this activity." : status === "Submitted" ? "Submitted and waiting for trainer verification." : status === "Revision requested" ? "Review trainer feedback and resubmit." : status === "In progress" ? "Work started but not submitted." : "This activity has not been submitted yet.";
  const getTone = (status) => {
    switch (status) {
      case "Verified":
        return "sibs-tone-green-bg sibs-tone-green-text border sibs-tone-green-border";
      case "Submitted":
        return "sibs-tone-blue-bg sibs-tone-blue-text border sibs-tone-blue-border";
      case "Revision requested":
        return "sibs-tone-red-bg sibs-tone-red-text border sibs-tone-red-border";
      case "In progress":
        return "sibs-tone-amber-bg sibs-tone-amber-text border sibs-tone-amber-border";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };
  const filterMatches = (item) => {
    const st = getStatus(item);
    if (taskFilter === "All") return true;
    if (taskFilter === "To do") return ["Not started", "In progress", "Revision requested"].includes(st);
    if (taskFilter === "For review") return st === "Submitted";
    if (taskFilter === "Verified") return st === "Verified";
    return true;
  };
  const weekDays = weekOf(trainingDate);
  const weekMaterials = weekDays.flatMap((day) => traineeAssignments.filter((a) => a.date === day && a.type === "Material"));
  const weekSubmitted = weekMaterials.filter((a) => ["Submitted", "Verified"].includes(getStatus(a))).length;
  const weekVerified = weekMaterials.filter((a) => getStatus(a) === "Verified").length;
  const weekRevision = weekMaterials.filter((a) => getStatus(a) === "Revision requested").length;
  const weekPct = weekMaterials.length ? Math.round(100 * weekSubmitted / weekMaterials.length) : null;
  const daySubmitted = materialRows.filter((a) => ["Submitted", "Verified"].includes(getStatus(a))).length;
  const dayVerified = materialRows.filter((a) => getStatus(a) === "Verified").length;
  const dayPct = materialRows.length ? Math.round(100 * daySubmitted / materialRows.length) : null;
  const dailyNeedsRevision = selectedDayAssignments.filter((a) => getStatus(a) === "Revision requested");
  const dailyToDo = selectedDayAssignments.filter((a) => ["Not started", "In progress"].includes(getStatus(a)));
  const dailyForReview = selectedDayAssignments.filter((a) => getStatus(a) === "Submitted");
  const dailyVerified = selectedDayAssignments.filter((a) => getStatus(a) === "Verified");
  const nextAction = dailyNeedsRevision[0] || dailyToDo[0] || null;
  const traineeAttendance = attendance.filter((a) => a.emp === empKey || a.emp === currentJourney?.id);
  const recent14Days = Array.from({ length: 14 }, (_, i) => dayOffset(simulatedCurrentDate, -i)).filter((dStr) => {
    if (!journeyStartDate || dStr < journeyStartDate) return false;
    const w = (/* @__PURE__ */ new Date(dStr + "T12:00:00Z")).getUTCDay();
    return w !== 0 && w !== 6;
  });
  let attPresent = 0, attLate = 0, attAbsent = 0, attExcused = 0, attMissing = 0;
  recent14Days.forEach((dStr) => {
    const st = getAttendanceAt(dStr);
    if (st === "Present") attPresent++;
    else if (st === "Late") attLate++;
    else if (st === "Absent") attAbsent++;
    else if (st === "Excused") attExcused++;
    else attMissing++;
  });
  const attRecorded = attPresent + attLate + attAbsent + attExcused;
  const attRate = attRecorded ? Math.round((attPresent + attLate) / attRecorded * 100) : null;
  const attCoverage = recent14Days.length ? Math.round(attRecorded / recent14Days.length * 100) : null;
  const publishedAssessments = assessments.filter((a) => a.status === "Published" && (a.account === "All accounts" || a.account === currentJourney.account));
  const traineeGrades = assessmentGrades.filter((g) => g.emp === empKey || g.emp === currentJourney.id);
  const assessmentResults = publishedAssessments.map((a) => {
    const grade = traineeGrades.find((g) => g.assessmentId === a.id);
    const pct = grade ? Math.round(100 * grade.score / a.max) : null;
    const passed = grade ? grade.score >= a.passing : false;
    return { a, grade, pct, passed };
  });
  const gradedItems = assessmentResults.filter((x) => x.pct !== null);
  const passedItems = gradedItems.filter((x) => x.passed);
  const overallAvg = gradedItems.length ? Math.round(gradedItems.reduce((acc, x) => acc + (x.pct || 0), 0) / gradedItems.length) : null;
  const fstItems = assessmentResults.filter((x) => x.a.phase === "FST");
  const fstGraded = fstItems.filter((x) => x.pct !== null);
  const fstAvg = fstGraded.length ? Math.round(fstGraded.reduce((acc, x) => acc + (x.pct || 0), 0) / fstGraded.length) : null;
  const pstItems = assessmentResults.filter((x) => x.a.phase === "PST");
  const pstGraded = pstItems.filter((x) => x.pct !== null);
  const pstAvg = pstGraded.length ? Math.round(pstGraded.reduce((acc, x) => acc + (x.pct || 0), 0) / pstGraded.length) : null;
  const ungradedCount = assessmentResults.length - gradedItems.length;
  const latestGradedDate = traineeGrades.filter((g) => assessmentResults.some((r) => r.a.id === g.assessmentId)).map((g) => g.date).filter(Boolean).sort().at(-1) || null;
  const upcomingMaterials = traineeAssignments.filter((a) => a.type === "Material" && a.date > trainingDate).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const handleCreateActivity = (e) => {
    e.preventDefault();
    const assignedTrainer = chooseTrainer();
    if (!canAddActivity || !newActivity.title.trim() || !newActivity.details.trim() || !newActivity.duration.trim() || !assignedTrainer || !availableTrainers.includes(assignedTrainer) || user?.role === "Trainer" && assignedTrainer !== user.trainerName) return;
    addTrainingAssignment({
      emp: empKey,
      date: trainingDate,
      type: newActivity.type,
      title: newActivity.title.trim(),
      description: newActivity.details.trim().slice(0, 145),
      details: newActivity.details.trim(),
      category: newActivity.type === "Material" ? "Learning" : "Practice",
      duration: newActivity.duration.trim(),
      priority: newActivity.priority,
      trainer: assignedTrainer,
      owner: user?.name || "Demo staff"
    });
    setNewActivity({ type: "Material", title: "", details: "", duration: "20 min", priority: "Normal", trainer: "" });
    setIsAddingAssignment(false);
    setShowSuccessToast("Training activity added to the selected day.");
    setTimeout(() => setShowSuccessToast(null), 3e3);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activeMaterialModal || !isEmployee || !!currentJourney.finalOutcome || activeMaterialModal.date > simulatedCurrentDate || !["Not started", "In progress", "Revision requested"].includes(getStatus(activeMaterialModal))) return;
    submitAssignment(activeMaterialModal.id, empKey, submissionNote);
    setShowSuccessToast(`Submitted "${activeMaterialModal.title}" for trainer review!`);
    setActiveMaterialModal(null);
    setSubmissionNote("");
    setTimeout(() => setShowSuccessToast(null), 3e3);
  };
  const selectedAttendance = getAttendanceAt(trainingDate);
  const isToday = trainingDate === simulatedCurrentDate;
  return <div className="space-y-3.5 sm:space-y-4 2xl:space-y-5">
      {
    /* SiBS HRIS Standard Header: White card with top accent gradient bar */
  }
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
                Trainee Learning & Progress • Day {currentJourney.daysElapsed} of 90
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full sibs-text-micro font-bold ${attendanceTone(selectedAttendance)}`}>
                Selected day attendance: {selectedAttendance === "Unrecorded" ? "Not yet recorded" : selectedAttendance}
              </span>
            </div>
            <h2 className="sibs-section-title">
              Good to see you, {currentJourney.fullName.split(" ")[0]}!
            </h2>
            <p className="text-xs text-sibs-muted max-w-3xl leading-normal">
              Track your daily learning materials, FST & PST module grades, curriculum progress, and trainer verification status.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="sibs-text-xs font-medium text-slate-500">
                <strong className="text-sibs-navy">General training contact:</strong> {currentJourney.trainerName || "Not assigned"}
              </span>
              <span className="text-slate-300">•</span>
              <span className="sibs-text-xs font-medium text-slate-500">
                <strong className="text-sibs-navy">Account:</strong> {currentJourney.account}
              </span>
              <span className="text-slate-300">•</span>
              <span className="sibs-text-xs font-medium text-slate-500">
                <strong className="text-sibs-navy">Site:</strong> {currentJourney.siteLocation}
              </span>
            </div>
            <p className="pt-1 sibs-text-xs text-sibs-muted">Demo as-of date: <strong>{dateLabel(simulatedCurrentDate)}</strong> · Training calendar selection: <strong>{dateLabel(trainingDate)}</strong></p>
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
              <span>View Full Training & Journey Record</span>
            </button>

            {!isEmployee && onSwitchModule && <button
    type="button"
    onClick={() => onSwitchModule("New Hire Orientation (NHO)")}
    className="sibs-btn-secondary shrink-0 gap-1.5"
  >
                <Layers className="w-4 h-4 text-sibs-orange" />
                <span>Back to NHO</span>
              </button>}
          </div>
        </div>
      </section>

      {showSuccessToast && <div className="sibs-tone-green-bg border sibs-tone-green-border sibs-tone-green-text text-xs px-4 py-2.5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="font-semibold">{showSuccessToast}</span>
          </div>
        </div>}

      {
    /* Employee's primary action is immediately visible, even if the selected day has no work. */
  }
      <section
        aria-label="My training on the selected day"
        className="sibs-page-card-in rounded-xl border border-sibs-border bg-white shadow-xs overflow-hidden"
        style={{ animationDelay: "140ms", animationFillMode: "both" }}
      >
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="sibs-section-title">My Training</h2>
              <p className="mt-1 text-sm font-semibold text-sibs-navy">{dateLabel(trainingDate)}</p>
              <p className="text-xs text-slate-600 mt-1">{selectedDayAssignments.length ? `${selectedDayAssignments.length} scheduled activities \xB7 ${dailyNeedsRevision.length + dailyToDo.length} need action \xB7 ${dailyForReview.length} awaiting review \xB7 ${dailyVerified.length} verified` : "No training activities scheduled for this date. This is not a failed or incomplete training day."}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {nextAction && <a href="#trainee-daily-work" className="sibs-btn-primary gap-1.5">View task <ChevronRight className="w-4 h-4" /></a>}
              {nextAssignedDate && <button type="button" onClick={() => pickTrainingDate(nextAssignedDate)} className="sibs-btn-secondary">Next assigned day: {dateLabel(nextAssignedDate)}</button>}
              {!nextAction && !nextAssignedDate && selectedDayAssignments.length === 0 && <span className="rounded-xl bg-sibs-surface border border-sibs-border px-3.5 py-2 text-xs font-medium text-slate-600">No upcoming activities recorded in this training window.</span>}
            </div>
          </div>
          {nextAction && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sibs-surface p-3.5 border border-sibs-border">
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sibs-orange">{getStatus(nextAction) === "Revision requested" ? "Action needed \xB7 trainer requested changes" : "Next training task"}</span>
              <p className="text-sm font-bold text-sibs-navy mt-0.5">{nextAction.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{nextAction.type === "Material" ? "Learning material" : "Training module"} · {nextAction.trainer ? `Assigned trainer: ${nextAction.trainer}` : `General contact: ${currentJourney.trainerName || "Not assigned"}`}</p>
            </div>
            <button type="button" onClick={() => {
    setTaskFilter("All");
    setSubmissionNote(getSubmission(nextAction)?.note || "");
    setActiveMaterialModal(nextAction);
  }} className="sibs-btn-secondary">{getStatus(nextAction) === "Revision requested" ? "Review feedback & resubmit" : "Open activity"}</button>
          </div>}
          {!nextAction && dailyForReview.length > 0 && <p className="rounded-xl bg-sibs-surface border border-sibs-border p-3 text-xs text-sibs-tertiary-5">Your activities for this date have been submitted. {dailyForReview.length} {dailyForReview.length === 1 ? "activity is" : "activities are"} awaiting trainer verification.</p>}
        </div>
      </section>

      {
    /* Published FST/PST scores stay above the training calendar. Missing scores are not zero. */
  }
      <section
        className="sibs-page-card-in rounded-xl border border-sibs-border bg-white p-4 sm:p-5 shadow-xs"
        aria-label="Published FST and PST score summary"
        style={{ animationDelay: "200ms", animationFillMode: "both" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-sibs-border">
          <div>
            <h2 className="sibs-section-title">My Training Scores</h2>
            <p className="text-xs text-slate-500 mt-0.5">Current published results{latestGradedDate ? ` \xB7 Latest grade: ${dateLabel(latestGradedDate)}` : ""} · Read-only. Scores do not change when selecting an earlier calendar date.</p>
          </div>
          <a href="#trainee-assessment-details" className="text-xs font-bold text-sibs-orange hover:underline flex items-center gap-1">
            <span>View detailed results</span>
            <span>↓</span>
          </a>
        </div>
        <MetricGrid columns={4}>
          <MetricCard label="Average assessment score" value={overallAvg === null ? "Not scored" : `${overallAvg}%`} description={`${gradedItems.length} graded assessments`} icon={Award} tone="navy" />
          <MetricCard label="Fundamental Skills (FST)" value={fstAvg === null ? "Not scored" : `${fstAvg}%`} description={`${fstGraded.length} scored FST items`} icon={BookOpen} tone="navy" />
          <MetricCard label="Product Skills (PST)" value={pstAvg === null ? "Not scored" : `${pstAvg}%`} description={`${pstGraded.length} scored PST items`} icon={Target} tone="orange" />
          <MetricCard label="Passed / graded assessments" value={`${passedItems.length} / ${gradedItems.length}`} description="Only graded assessments count" icon={CheckCircle2} tone="green" />
        </MetricGrid>
        <p className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-sibs-border">{ungradedCount > 0 ? `${ungradedCount} published assessment${ungradedCount === 1 ? " has" : "s have"} not been scored yet. ` : ""}These grades are separate from independent QA, attendance, and Day 30/60/90 checkpoint results.</p>
      </section>

      {
    /* Employee-friendly week by default; full monthly calendar is preserved. */
  }
      <section
        className="sibs-page-card-in bg-white rounded-xl border border-sibs-border shadow-xs p-4 sm:p-5 space-y-4"
        aria-label="Training calendar with week and month layouts"
        style={{ animationDelay: "260ms", animationFillMode: "both" }}
      >
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-3">
          <div><h2 className="sibs-section-title">My Training Calendar</h2><p className="text-xs text-slate-500 mt-1">Choose a date to see scheduled work and recorded attendance. Switch to Month for the full calendar.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-xl border border-sibs-border-subtle p-1 bg-sibs-surface" role="group" aria-label="Calendar layout">
              {["week", "month"].map((view) => <button key={view} type="button" onClick={() => setCalendarView(view)} aria-pressed={calendarView === view} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${calendarView === view ? "bg-sibs-navy text-white shadow-xs" : "text-sibs-tertiary-5 hover:bg-white"}`}>{view === "week" ? "Week" : "Month"}</button>)}
            </div>
            <button type="button" onClick={() => changeCalendarPage(-1)} disabled={cannotGoPrevious} aria-label={calendarView === "week" ? "Previous training week" : "Previous calendar month"} className="p-2 rounded-xl border border-sibs-border-subtle bg-white hover:bg-sibs-surface text-sibs-navy shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
            <span className="min-w-[130px] text-center sibs-section-title">{calendarView === "month" ? (/* @__PURE__ */ new Date(`${calendarMonth}-01T12:00:00Z`)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }) : `${dateLabel(weekCalendarDates[0])} \u2013 ${dateLabel(weekCalendarDates[6])}`}</span>
            <button type="button" onClick={() => changeCalendarPage(1)} disabled={cannotGoNext} aria-label={calendarView === "week" ? "Next training week" : "Next calendar month"} className="p-2 rounded-xl border border-sibs-border-subtle bg-white hover:bg-sibs-surface text-sibs-navy shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
            <label className="flex items-center gap-2 border border-sibs-border-subtle rounded-xl px-2.5 py-1.5 text-xs text-slate-500 bg-white shadow-xs">Date
              <input type="date" value={trainingDate} min={dateBounds.min} max={dateBounds.max} onChange={(e) => pickTrainingDate(e.target.value)} aria-label="Choose training date" className="bg-transparent text-xs font-semibold text-sibs-navy outline-none cursor-pointer" />
            </label>
            <button type="button" onClick={() => pickTrainingDate(clampTrainingDate(simulatedCurrentDate, dateBounds))} className="rounded-xl border border-sibs-border-subtle bg-white px-3 py-2 text-xs font-bold text-sibs-navy hover:bg-sibs-surface shadow-xs transition-colors">Go to demo as-of date</button>
          </div>
        </div>
        {!dateBounds.linked && <p className="text-xs rounded-xl p-3 bg-amber-50 text-amber-800 border border-amber-200">A confirmed employee start date is needed to display the full 90-day schedule. Only the demo date is available.</p>}
        <div className="hidden sm:grid grid-cols-7 gap-1.5" aria-hidden="true">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day} className="py-1 text-center text-[10px] font-extrabold text-slate-500 uppercase">{day}</span>)}</div>
        <div className="overflow-x-auto pb-2" aria-label="Select a calendar day">
          <div className={calendarView === "week" ? "flex gap-2 sm:grid sm:grid-cols-7 sm:gap-1.5" : "grid grid-cols-7 gap-1.5 min-w-[640px] sm:min-w-0"}>
          {calendarDates.map((date, index) => {
    if (!date) return <div key={`blank-${index}`} className="min-w-0" aria-hidden="true" />;
    const within = dateWithinBounds(date, dateBounds);
    const dayItems = within ? traineeAssignments.filter((a) => a.date === date) : [];
    const trainers = trainersForDay(dayItems, currentJourney.trainerName);
    const hasActivities = dayItems.length > 0;
    const att = within ? getAttendanceAt(date) : "Outside training period";
    const mats = dayItems.filter((a) => a.type === "Material").length;
    const selected = date === trainingDate;
    return <button
      key={date}
      type="button"
      disabled={!within}
      onClick={() => pickTrainingDate(date)}
      aria-pressed={selected}
      aria-label={`${date}: ${mats} materials; ${att}; ${hasActivities ? `training contact ${trainers.names.join(" / ") || "not assigned"}` : "no trainer-led tasks scheduled"}`}
      className={`${calendarView === "week" ? "w-[125px] shrink-0 sm:w-auto" : "min-w-0"} min-h-[82px] sm:min-h-[106px] rounded-xl border p-2 text-left flex flex-col gap-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sibs-navy ${selected ? "bg-orange-50/70 border-2 border-sibs-orange ring-1 ring-sibs-orange/20 shadow-xs" : within && hasActivities ? "bg-blue-50/40 border-blue-200 hover:bg-blue-50 hover:border-blue-300" : within ? "bg-[#FAFCFF] border-sibs-border hover:bg-sibs-surface hover:border-sibs-border-subtle" : "bg-slate-50/60 border-dashed border-slate-200 opacity-50 cursor-not-allowed"}`}
    >
              <span className="text-xs sm:sibs-section-title"><span className="sm:hidden mr-1 text-[10px] text-slate-500">{(/* @__PURE__ */ new Date(date + "T12:00:00Z")).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}</span>{Number(date.slice(-2))}{date === simulatedCurrentDate && <span className="text-sibs-orange font-extrabold"> •</span>}</span>
              {within ? <>
                <span className="text-[9px] sm:text-[10px] leading-tight text-slate-600">{mats} material{mats === 1 ? "" : "s"}</span>
                {hasActivities && <span className="hidden sm:block text-[9px] text-sibs-tertiary-5 font-bold leading-tight break-words">{trainers.explicit ? "Task trainer: " : "Contact: "}{trainers.names.join(" / ") || "Not assigned"}</span>}
                <span className={`self-start rounded-md px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold ${attendanceTone(att)}`}>{att === "Unrecorded" ? "Pending record" : att}</span>
              </> : <span className="text-[9px] text-slate-400">—</span>}
            </button>;
  })}
          </div>
        </div>
        <p className="sibs-text-xs text-slate-500">Orange border = selected date · Orange dot = demo as-of date · Soft blue = scheduled activities · Attendance is based on recorded shifts; missing records are not absences.</p>
      </section>

      {
    /* Trainer assignment can differ by task; staff owner and trainer are separate roles. */
  }
      <section
        className="sibs-page-card-in rounded-xl border border-sibs-border bg-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs"
        aria-label="Selected-day trainers and phase owner"
        style={{ animationDelay: "320ms", animationFillMode: "both" }}
      >
        <div className="flex gap-3 items-center min-w-0">
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 text-sibs-navy flex items-center justify-center shrink-0"><User className="w-5 h-5 text-sibs-navy" /></div>
          <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Training contact · {dateLabel(trainingDate)}</p>
            <h3 className="text-base font-extrabold text-sibs-navy mt-0.5">{selectedDayAssignments.length === 0 ? "No trainer-led tasks scheduled" : dayTrainer.names.join(" / ") || "Trainer not assigned"}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{selectedDayAssignments.length} scheduled activities · {selectedDayAssignments.length === 0 ? `General training contact: ${currentJourney.trainerName || "Not assigned"}` : dayTrainer.explicit ? "Each activity has an assigned trainer" : "General training contact shown where a task-specific trainer is not recorded"}</p>
          </div>
        </div>
        <div className="bg-sibs-surface border border-sibs-border rounded-xl px-3.5 py-2.5 text-xs text-slate-600 shadow-xs"><span className="block text-slate-500 sibs-text-micro">Phase owner / support contact</span><strong className="block text-sibs-navy mt-0.5 text-sm">{phaseContact.owner || "Not assigned"}</strong><span className="text-[10px] text-slate-500 font-medium">{phaseContact.phase}</span></div>
      </section>

      {canAddActivity && <div className="flex justify-end"><button type="button" onClick={() => setIsAddingAssignment(true)} className="sibs-btn-primary">+ Assign training activity</button></div>}

      {
    /* One daily view for materials and goals. Published assessment details stay below. */
  }
      {
    /* Assigned Learning Materials */
  }
      <div id="trainee-daily-work" className="w-full scroll-mt-24" aria-label="Selected day learning materials">
        <div className="bg-white rounded-xl border border-sibs-border shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="sibs-section-title">Assigned Learning Materials ({trainingDate})</h2>
              <p className="text-xs text-slate-500">Read materials, complete tasks, and submit for trainer verification.</p>
            </div>
            {
    /* Filter Tabs */
  }
            <div className="flex items-center gap-1 bg-sibs-surface border border-sibs-border-subtle p-1 rounded-xl flex-wrap" role="group" aria-label="Learning material status filter">
              {["All", "To do", "For review", "Verified"].map((f) => <button
    key={f}
    onClick={() => setTaskFilter(f)}
    aria-pressed={taskFilter === f}
    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${taskFilter === f ? "bg-sibs-navy text-white shadow-xs" : "text-sibs-tertiary-5 hover:text-sibs-navy hover:bg-white"}`}
  >
                  {f}
                </button>)}
            </div>
          </div>

          {
    /* Itemized Materials Table / List */
  }
          {materialRows.filter(filterMatches).length === 0 ? <div className="py-10 text-center text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">{materialRows.length ? `No materials match \u201C${taskFilter}\u201D.` : "No learning materials scheduled for this day."}</p>
              <p className="text-xs text-slate-600">{materialRows.length ? "Try viewing all statuses." : "Nothing to submit for this date."}</p>
              {materialRows.length > 0 && taskFilter !== "All" && <button type="button" className="text-xs font-bold text-sibs-tertiary-5 underline" onClick={() => setTaskFilter("All")}>Show all materials</button>}
              {materialRows.length === 0 && nextAssignedDate && <button type="button" className="text-xs font-bold text-sibs-tertiary-5 underline" onClick={() => pickTrainingDate(nextAssignedDate)}>Go to next assigned day: {dateLabel(nextAssignedDate)}</button>}
            </div> : <div className="space-y-3">
              {materialRows.filter(filterMatches).map((item) => {
    const sub = getSubmission(item);
    const st = getStatus(item);
    return <div
      key={item.id}
      className="p-4 rounded-xl border border-sibs-border bg-white hover:border-sibs-border-subtle transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.category || "General"}</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${getTone(st)}`}>
                          {readableStatus(st)}
                        </span>
                        {item.priority === "High" && <span className="px-2 py-0.2 rounded text-[10px] font-bold sibs-tone-amber-bg sibs-tone-amber-text border sibs-tone-amber-border">
                            High Priority
                          </span>}
                      </div>

                      <h3 className="sibs-section-title">{item.title}</h3>
                      <p className="text-xs text-slate-500">{item.description}</p>
                      
                      <div className="flex items-center gap-3 sibs-text-xs text-slate-400 pt-1">
                        <span>{item.trainer ? "Assigned trainer" : "General training contact"}: {trainerForTask(item, currentJourney.trainerName) || "Not assigned"}</span><span>•</span><span>Assigned by: {item.owner || "Not recorded"}</span>
                        <span>•</span>
                        <span>Duration: {item.duration}</span>
                      </div>

                      <p className="sibs-text-xs text-slate-600 mt-1">{statusExplanation(st)}</p>
                      {sub?.feedback && <div className="mt-2 p-2.5 rounded-lg sibs-tone-blue-bg border sibs-tone-blue-border text-xs text-sibs-navy">
                          <strong className="block text-[10px] uppercase font-bold text-sibs-tertiary-5">Trainer Feedback:</strong>
                          <p className="mt-0.5">{sub.feedback}</p>
                        </div>}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
      onClick={() => {
        setSubmissionNote(getSubmission(item)?.note || "");
        setActiveMaterialModal(item);
      }}
      className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-xs ${st === "Verified" ? "bg-white border border-sibs-border-subtle text-sibs-navy hover:bg-sibs-surface" : "bg-sibs-orange hover:bg-sibs-button-hover text-white"}`}
    >
                        {st === "Verified" ? "View verified activity" : st === "Submitted" ? "View submission" : !isEmployee ? "View details" : st === "Revision requested" ? "Review feedback & resubmit" : "Open activity & submit"}
                      </button>
                    </div>
                  </div>;
  })}
            </div>}
        </div>
      </div>

      <section
        className="sibs-page-card-in space-y-2"
        aria-label="Training progress and recorded attendance"
        style={{ animationDelay: "380ms", animationFillMode: "both" }}
      >
        <div><h2 className="sibs-section-title">My Progress & Attendance</h2><p className="text-xs text-slate-600 mt-1">Submission totals are not the same as trainer verification. Attendance figures use recorded days only.</p></div>
      {
    /* 3 Compact SiBS HRIS Metric Cards */
  }
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {
    /* Metric 1: Selected Day Materials */
  }
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
                {materialRows.length ? <>{daySubmitted} <span className="text-sm font-semibold text-slate-400">/ {materialRows.length}</span></> : <span className="text-sm">Not scheduled</span>}
              </div>
              <span className="text-xs font-bold text-[#B54708]">{dayPct === null ? "N/A" : `${dayPct}%`}</span>
            </div>
            <div className="w-full h-1.5 bg-[#E6EAF0] rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-sibs-orange rounded-full" style={{ width: `${dayPct ?? 0}%` }} />
            </div>
            <div className="mt-1 flex items-center justify-between sibs-text-micro font-medium text-slate-500">
              <span>{dayVerified} verified by trainer</span>
              <span>{materialRows.length ? `${materialRows.length - daySubmitted} not submitted` : "No materials assigned"}</span>
            </div>
          </div>
        </div>

        {
    /* Metric 2: Weekly Progress */
  }
        <div className="flex min-h-[86px] sm:min-h-[92px] flex-col justify-between rounded-xl border border-sibs-border bg-white p-3 sm:p-3.5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 truncate">
              This Week's Materials Submitted
            </span>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="flex items-baseline justify-between">
              <div className="text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight text-sibs-navy">
                {weekMaterials.length ? <>{weekSubmitted} <span className="text-sm font-semibold text-slate-400">/ {weekMaterials.length}</span></> : <span className="text-sm">Not scheduled</span>}
              </div>
              <span className="text-xs font-bold text-sibs-navy">{weekPct === null ? "N/A" : `${weekPct}%`}</span>
            </div>
            <div className="w-full h-1.5 bg-[#E6EAF0] rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-sibs-navy rounded-full" style={{ width: `${weekPct ?? 0}%` }} />
            </div>
            <div className="mt-1 flex items-center justify-between sibs-text-micro font-medium text-slate-500">
              <span>{weekMaterials.length ? `${weekVerified} verified \xB7 ${dateLabel(weekDays[0])}\u2013${dateLabel(weekDays[6])}` : "No materials scheduled this week"}</span>
              {weekRevision > 0 ? <span className="text-[#E74C3C] font-bold">{weekRevision} revision needed</span> : <span>0 revisions</span>}
            </div>
          </div>
        </div>

        {
    /* Metric 3: Attendance Summary */
  }
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
                {attPresent + attLate} <span className="text-xs font-medium text-slate-400">/ {attRecorded} recorded days</span>
              </div>
              <span className="text-xs font-bold text-sibs-navy">{attRate === null ? "N/A" : `${attRate}%`} recorded attendance</span>
            </div>
            <div className="w-full h-1.5 bg-[#E6EAF0] rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-[#2ECC71] rounded-full" style={{ width: `${attRate ?? 0}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 sibs-text-xs font-semibold text-sibs-muted">
              <span>Record coverage: {attCoverage === null ? "N/A" : `${attCoverage}%`} ({attRecorded} of {recent14Days.length} expected workdays)</span>
              <span>{attMissing} unrecorded</span>
            </div>
            <p className="mt-1 sibs-text-xs text-slate-600">{attLate} late · {attAbsent} absent · {attExcused} excused. Missing time records are not counted as absences.</p>
          </div>
        </div>
      </div>

      </section>

      {
    /* Complete scorecards remain accessible without crowding the daily tasks. */
  }
      <section
        id="trainee-assessment-details"
        className="sibs-page-card-in bg-white rounded-xl border border-sibs-border shadow-xs p-4 sm:p-5 space-y-4 scroll-mt-24"
        style={{ animationDelay: "440ms", animationFillMode: "both" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sibs-border pb-3">
          <div>
            <h2 className="sibs-section-title">Detailed FST & PST Assessment Results</h2>
            <p className="text-xs text-slate-500 mt-0.5">All published assessments, including those not yet scored. Only graded assessments count toward averages and the passed/graded total. Separate from independent QA and coaching evidence.</p>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-sibs-surface border border-sibs-border px-2.5 py-1 rounded-lg">Read-only</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[{ label: "FST \xB7 Days 1\u201314", avg: fstAvg }, { label: "PST \xB7 Days 15\u201328", avg: pstAvg }].map(({ label, avg }) => <div key={label} className="bg-sibs-surface border border-sibs-border rounded-xl p-3.5 shadow-xs">
            <div className="flex justify-between items-center gap-2 text-xs"><strong className="text-sibs-navy">{label}</strong><span className="font-bold text-sibs-navy">{avg === null ? "Not scored" : `${avg}%`}</span></div>
            <div className="h-1.5 rounded-full bg-[#E6EAF0] overflow-hidden mt-2"><div className="h-full bg-sibs-orange" style={{ width: `${avg ?? 0}%` }} /></div>
          </div>)}
        </div>
        {assessmentResults.length === 0 ? <p className="rounded-xl p-4 bg-sibs-surface border border-sibs-border text-xs text-slate-500">No published FST/PST assessments for this account.</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{assessmentResults.map(({ a, grade, pct, passed }) => <article key={a.id} className="border border-sibs-border bg-white rounded-xl p-3.5 space-y-1.5 shadow-xs hover:border-sibs-border-subtle transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] uppercase font-bold text-slate-400">{a.phase} · {a.skill}</span><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${pct === null ? "bg-sibs-surface border border-sibs-border text-slate-600" : passed ? "sibs-tone-green-bg sibs-tone-green-text border sibs-tone-green-border" : "sibs-tone-red-bg sibs-tone-red-text border sibs-tone-red-border"}`}>{pct === null ? "Not scored" : passed ? "Passed" : "Below target"}</span></div>
              <strong className="text-xs block text-sibs-navy">{a.title}</strong>
              <div className="flex justify-between gap-2 text-xs text-slate-500"><span>Score: <strong className="text-sibs-navy">{grade ? grade.score : "\u2014"}</strong> / {a.max}</span><span>Passing: {a.passing}</span></div>
              {grade && <p className="text-[10px] text-slate-500 pt-0.5">Graded by {grade.grader} · {dateLabel(grade.date)}</p>}
            </article>)}</div>}
      </section>

      {
    /* Authorized staff can assign an individual trainer to each activity. */
  }
      {isAddingAssignment && canAddActivity && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4" role="presentation" onMouseDown={(e) => {
    if (e.target === e.currentTarget) setIsAddingAssignment(false);
  }}>
          <form onSubmit={handleCreateActivity} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5 space-y-3.5 max-h-[90vh] overflow-y-auto border border-sibs-border" aria-label="Assign training activity">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sibs-navy text-base">New Training Activity · {dateLabel(trainingDate)}</h3>
              <button type="button" aria-label="Close assignment form" onClick={() => setIsAddingAssignment(false)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <label className="block text-xs font-bold text-sibs-navy">Type
              <select value={newActivity.type} onChange={(e) => setNewActivity((p) => ({ ...p, type: e.target.value }))} className="block w-full border border-sibs-border-subtle rounded-xl p-2.5 mt-1 text-xs text-sibs-navy outline-none focus:border-sibs-orange">
                <option value="Material">Learning Material</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-sibs-navy">Title
              <input required maxLength={140} value={newActivity.title} onChange={(e) => setNewActivity((p) => ({ ...p, title: e.target.value }))} className="block w-full border border-sibs-border-subtle rounded-xl p-2.5 mt-1 text-xs text-sibs-navy outline-none focus:border-sibs-orange" placeholder="Module or assignment title..." />
            </label>
            <label className="block text-xs font-bold text-sibs-navy">Learning instructions / success criteria
              <textarea required rows={4} value={newActivity.details} onChange={(e) => setNewActivity((p) => ({ ...p, details: e.target.value }))} className="block w-full border border-sibs-border-subtle rounded-xl p-2.5 mt-1 text-xs text-sibs-navy outline-none focus:border-sibs-orange" placeholder="Enter clear instructions or success metrics..." />
            </label>
            <label className="block text-xs font-bold text-sibs-navy">Assigned trainer
              <select required value={chooseTrainer()} onChange={(e) => setNewActivity((p) => ({ ...p, trainer: e.target.value }))} className="block w-full border border-sibs-border-subtle rounded-xl p-2.5 mt-1 text-xs text-sibs-navy outline-none focus:border-sibs-orange">
                {availableTrainers.filter((name) => user?.role !== "Trainer" || name === user.trainerName).map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-bold text-sibs-navy">Duration
                <input value={newActivity.duration} required onChange={(e) => setNewActivity((p) => ({ ...p, duration: e.target.value }))} className="block w-full border border-sibs-border-subtle rounded-xl p-2.5 mt-1 text-xs text-sibs-navy outline-none focus:border-sibs-orange" />
              </label>
              <label className="block text-xs font-bold text-sibs-navy">Priority
                <select value={newActivity.priority} onChange={(e) => setNewActivity((p) => ({ ...p, priority: e.target.value }))} className="block w-full border border-sibs-border-subtle rounded-xl p-2.5 mt-1 text-xs text-sibs-navy outline-none focus:border-sibs-orange">
                  <option>Normal</option>
                  <option>High</option>
                </select>
              </label>
            </div>
            <p className="sibs-text-xs text-slate-500">Prototype records are saved in browser storage. A task's creator is separate from its assigned trainer.</p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddingAssignment(false)} className="sibs-btn-secondary">Cancel</button>
              <button type="submit" className="sibs-btn-primary">Save activity</button>
            </div>
          </form>
        </div>}

      {
    /* Material Detail & Submission Modal */
  }
      {activeMaterialModal && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4" role="presentation" onKeyDown={(e) => {
    if (e.key === "Escape") setActiveMaterialModal(null);
  }} onMouseDown={(e) => {
    if (e.target === e.currentTarget) setActiveMaterialModal(null);
  }}>
          <div role="dialog" aria-modal="true" aria-labelledby="trainee-activity-modal-title" className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-sibs-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{activeMaterialModal.category} • {activeMaterialModal.duration}</span>
                <h3 id="trainee-activity-modal-title" className="text-base font-extrabold text-sibs-navy">{activeMaterialModal.title}</h3>
              </div>
              <button type="button" autoFocus aria-label="Close activity details" onClick={() => setActiveMaterialModal(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 focus-visible:outline-2 focus-visible:outline-sibs-navy transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{activeMaterialModal.description}</p>
            <div className="p-3.5 rounded-xl bg-sibs-surface border border-sibs-border text-xs space-y-1">
              <strong className="text-sibs-navy block">Instructions:</strong>
              <p className="text-slate-600 leading-normal">{activeMaterialModal.details || "Review guidelines, practice required steps, and upload or enter your completion notes below."}</p>
            </div>
            <p className="text-xs text-slate-500">{activeMaterialModal.trainer ? "Assigned trainer" : "General training contact"}: <strong className="text-sibs-navy">{trainerForTask(activeMaterialModal, currentJourney.trainerName) || "Not assigned"}</strong> · Assigned by: {activeMaterialModal.owner || "Not recorded"}</p>
            <p className="text-xs text-slate-600">Status: <strong className="text-sibs-navy">{readableStatus(getStatus(activeMaterialModal))}</strong>. {statusExplanation(getStatus(activeMaterialModal))}</p>
            {getSubmission(activeMaterialModal)?.feedback && <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-sibs-navy">
                <strong className="block text-[10px] uppercase font-bold text-sibs-tertiary-5">Reviewer feedback:</strong>
                <p className="mt-0.5">{getSubmission(activeMaterialModal)?.feedback}</p>
              </div>}
            {isEmployee && !currentJourney.finalOutcome && activeMaterialModal.date <= simulatedCurrentDate && ["Not started", "In progress", "Revision requested"].includes(getStatus(activeMaterialModal)) ? <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-sibs-navy mb-1">Completion Notes / Submission Link</label>
                  <textarea
    rows={3}
    value={submissionNote}
    onChange={(e) => setSubmissionNote(e.target.value)}
    placeholder="Enter completion details, work simulation links, or questions for your trainer..."
    className="w-full p-2.5 rounded-xl border border-sibs-border-subtle text-xs text-sibs-navy outline-none focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange"
    required
  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
    type="button"
    onClick={() => setActiveMaterialModal(null)}
    className="px-4 py-2 rounded-xl border border-sibs-border-subtle text-sibs-navy font-semibold text-xs hover:bg-sibs-surface shadow-xs transition-colors cursor-pointer"
  >
                    Cancel
                  </button>
                  <button
    type="submit"
    className="px-4 py-2 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit to Trainer</span>
                  </button>
                </div>
              </form> : <div className="space-y-3 pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500">{getSubmission(activeMaterialModal)?.note ? `Submission: ${getSubmission(activeMaterialModal)?.note}` : "No submission recorded."}</p>
                <div className="flex justify-end">
                  <button
    type="button"
    onClick={() => setActiveMaterialModal(null)}
    className="px-4 py-2 rounded-xl border border-sibs-border-subtle bg-white text-sibs-navy hover:bg-sibs-surface text-xs font-semibold shadow-xs transition-colors cursor-pointer"
  >
                    Close
                  </button>
                </div>
              </div>}
          </div>
        </div>}
    </div>;
}
export {
  TraineeDashboardView as default
};
