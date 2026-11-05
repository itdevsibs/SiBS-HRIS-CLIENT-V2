/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  INITIAL_JOURNEYS,
  INITIAL_ASSIGNMENTS,
  INITIAL_PROGRESS,
  INITIAL_ASSESSMENTS,
  INITIAL_ASSESSMENT_GRADES,
  INITIAL_PHASE_TRAINING_SCORES,
  INITIAL_ATTENDANCE,
  INITIAL_EVIDENCE,
  INITIAL_CHECKINS,
  INITIAL_COACHING_ACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_QDS_REQUESTS,
  SNAPSHOT_DATE,
  INITIAL_ESEP_SESSIONS,
  INITIAL_ESEP_EVALUATIONS
} from "./journeyInitialData";
const JOURNEY_STORAGE_KEY = "sibs_employee_journeys_data";
const DEFAULT_SIMULATED_DATE = SNAPSHOT_DATE || "2026-10-14";
const JourneyContext = createContext(void 0);
function calculateJourneyStage(startDate, simDate = DEFAULT_SIMULATED_DATE) {
  if (!startDate) {
    return { daysElapsed: 0, stage: "Awaiting Start", progressPct: 0 };
  }
  const start = new Date(startDate).getTime();
  const current = new Date(simDate).getTime();
  const diffTime = current - start;
  const days = Math.floor(diffTime / (1e3 * 60 * 60 * 24));
  if (days < 0) {
    return { daysElapsed: 0, stage: "Awaiting Start", progressPct: 0 };
  }
  const daysElapsed = days + 1;
  let stage = "Day 1-30 Nesting";
  let progressPct = Math.min(100, Math.round(daysElapsed / 90 * 100));
  if (daysElapsed > 90) {
    stage = "Completed Onboarding";
    progressPct = 100;
  } else if (daysElapsed > 60) {
    stage = "Day 61-90 Regularization Assessment";
  } else if (daysElapsed > 30) {
    stage = "Day 31-60 Ramp";
  }
  return { daysElapsed, stage, progressPct };
}
function pureCreateOrLinkJourney(existingJourneys, applicant, hrActor = "Dulla, Ralph Vincent (HR Operations Lead)", simDate = DEFAULT_SIMULATED_DATE) {
  const existing = existingJourneys.find(
    (j) => applicant.id && j.nhoApplicantId === applicant.id || applicant.officialKronosId && j.kronosId === applicant.officialKronosId
  );
  if (existing) {
    return { updatedJourneys: existingJourneys, journey: existing, isNew: false };
  }
  const kronosId = applicant.officialKronosId || void 0;
  const sibsEmployeeId = applicant.sibsEmployeeId || void 0;
  const trainerId = applicant.assignedTrainerId || void 0;
  const trainerName = applicant.assignedTrainerName || void 0;
  const hireDate = applicant.hireDate || applicant.confirmedStartDate || applicant.startDate || void 0;
  const startDate = applicant.confirmedStartDate || applicant.startDate || applicant.hireDate || void 0;
  const { daysElapsed, stage, progressPct } = calculateJourneyStage(startDate, simDate);
  const outstandingDocs = (applicant.documents || []).filter(
    (d) => !d.isMajor && !d.isEssentialAgreement && d.status !== "Verified"
  );
  const targetDate30 = startDate ? new Date(new Date(startDate).getTime() + 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0] : "";
  const targetDate60 = startDate ? new Date(new Date(startDate).getTime() + 60 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0] : "";
  const targetDate90 = startDate ? new Date(new Date(startDate).getTime() + 90 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0] : "";
  const newJourneyId = `JRN-2026-${String(existingJourneys.length + 1).padStart(3, "0")}`;
  const isAwaitingLinkage = !sibsEmployeeId || !trainerId || !hireDate;
  const newJourney = {
    id: newJourneyId,
    nhoApplicantId: applicant.id,
    nhoHandoffId: `handoff-${applicant.id}`,
    kronosId,
    sibsEmployeeId,
    fullName: applicant.fullName,
    email: applicant.email,
    contactNumber: applicant.phone || "+63 917 000 0000",
    roleTitle: applicant.position || "Customer Support Advocate",
    department: applicant.assignedDepartment || "Operations",
    account: applicant.account || "CD - CONNECT",
    siteLocation: applicant.reportingLocation || "SiBS Davao",
    wfmSeating: applicant.wfmSeatNumber ? {
      wing: applicant.wfmProductionWing || "Main Wing",
      seatNumber: applicant.wfmSeatNumber,
      floor: "2nd Floor Main Operations",
      assignedBy: applicant.wfmAssignedBy || "Danilo Morales (WFM Lead)"
    } : void 0,
    trainerId,
    trainerName,
    trainerAcceptedAt: applicant.trainerAcceptedAt,
    qdsMaterials: Array.isArray(applicant.qdsMaterials) ? applicant.qdsMaterials : [],
    hireDate,
    nhoAcceptedAt: applicant.hrAcceptedAt || `${simDate} 09:30 AM`,
    nhoAcceptedBy: hrActor,
    startDate,
    daysElapsed,
    stage,
    overallProgressPct: progressPct,
    outstandingNhoDocuments: outstandingDocs,
    reviews: {},
    finalOutcome: "",
    acknowledged: false,
    day30: {
      status: stage === "Awaiting Start" ? "Pending" : "In Progress",
      targetDate: targetDate30,
      evaluatorId: trainerId,
      evaluatorName: trainerName,
      evaluatorRole: "Assigned Trainer",
      nestingQaScore: 85,
      attendancePunctualityScore: 98,
      systemsNavigationRating: 4,
      callHandlingRating: 4,
      complianceAdherenceRating: 5,
      outstandingDocsCleared: outstandingDocs.length === 0,
      trainerEndorsement: "Floor Ready"
    },
    day60: {
      status: "Pending",
      targetDate: targetDate60
    },
    day90: {
      status: "Pending",
      targetDate: targetDate90
    },
    touchpoints: [
      {
        id: `tp-${Date.now()}`,
        date: simDate,
        authorName: hrActor,
        authorRole: "HR Operations",
        type: "1-on-1 Check-in",
        notes: `NHO Handoff successfully accepted. Trainee officially registered on 30/60/90 Employee Journey roadmap.${trainerName ? ` Assigned to Trainer ${trainerName}.` : " Trainer assignment pending authorized linkage."}`,
        moodRating: "Thriving"
      }
    ],
    auditTrail: [
      {
        date: `${simDate} ` + (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        action: "Handoff Accepted & Journey Created",
        actor: hrActor,
        details: `NHO Handoff completed. Created Journey ${newJourneyId}.${hireDate ? ` Preserved hire date: ${hireDate}.` : " Hire date pending authorized linkage."}`
      }
    ],
    isAwaitingLinkage
  };
  return {
    updatedJourneys: [newJourney, ...existingJourneys],
    journey: newJourney,
    isNew: true
  };
}
const STORAGE_PREFIX = "sibs_journey_v2_";
function loadStorage(key, defaultValue) {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    if (item) {
      const parsed = JSON.parse(item);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (Array.isArray(defaultValue)) {
          const parsedIds = new Set(parsed.map((p) => p.id ?? p.emp ?? p.sessionId));
          const missing = defaultValue.filter((d) => !parsedIds.has(d.id ?? d.emp ?? d.sessionId));
          return [...parsed, ...missing];
        }
        return parsed;
      }
      if (typeof parsed === "object" && parsed !== null) return parsed;
    }
  } catch (e) { void e; /* empty */
  }
  return defaultValue;
}
function JourneyProvider({ children }) {
  const [simulatedCurrentDate, setSimulatedCurrentDate] = useState(DEFAULT_SIMULATED_DATE);
  const [journeys, setJourneys] = useState(() => {
    try {
      const storedV2 = localStorage.getItem(STORAGE_PREFIX + "journeys");
      if (storedV2) {
        const parsed = JSON.parse(storedV2);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const storedLegacy = localStorage.getItem(JOURNEY_STORAGE_KEY);
      if (storedLegacy) {
        const parsed = JSON.parse(storedLegacy);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { void e; /* empty */
    }
    return INITIAL_JOURNEYS;
  });
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [assignments, setAssignments] = useState(() => loadStorage("assignments", INITIAL_ASSIGNMENTS));
  const [progress, setProgress] = useState(() => loadStorage("progress", INITIAL_PROGRESS));
  const [assessments] = useState(INITIAL_ASSESSMENTS);
  const [assessmentGrades, setAssessmentGrades] = useState(() => loadStorage("assessment_grades", INITIAL_ASSESSMENT_GRADES));
  const [phaseTrainingScores] = useState(INITIAL_PHASE_TRAINING_SCORES);
  const [attendance, setAttendance] = useState(() => loadStorage("attendance", INITIAL_ATTENDANCE));
  const [evidence, setEvidence] = useState(() => loadStorage("evidence", INITIAL_EVIDENCE));
  const [checkIns, setCheckIns] = useState(() => loadStorage("checkins", INITIAL_CHECKINS));
  const [coachingActions, setCoachingActions] = useState(() => loadStorage("coaching", INITIAL_COACHING_ACTIONS));
  const [esepSessions, setEsepSessions] = useState(() => loadStorage("esep_sessions", INITIAL_ESEP_SESSIONS));
  const [esepEvaluations, setEsepEvaluations] = useState(() => loadStorage("esep_evaluations", INITIAL_ESEP_EVALUATIONS));
  const [notifications, setNotifications] = useState(() => loadStorage("notifications", INITIAL_NOTIFICATIONS));
  const [qdsRequests, setQdsRequests] = useState(() => loadStorage("qds_requests", INITIAL_QDS_REQUESTS));
  useEffect(() => {
    const handleStorageSync = () => {
      try {
        const stored = localStorage.getItem(STORAGE_PREFIX + "journeys") || localStorage.getItem(JOURNEY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setJourneys(parsed);
          }
        }
      } catch (e) { void e; /* empty */
      }
    };
    window.addEventListener("journey-storage-updated", handleStorageSync);
    window.addEventListener("storage", handleStorageSync);
    return () => {
      window.removeEventListener("journey-storage-updated", handleStorageSync);
      window.removeEventListener("storage", handleStorageSync);
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + "journeys", JSON.stringify(journeys));
      localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(journeys));
    } catch (e) { void e; /* empty */
    }
  }, [journeys]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + "assignments", JSON.stringify(assignments));
    } catch (e) { void e; /* empty */
    }
  }, [assignments]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + "progress", JSON.stringify(progress));
    } catch (e) { void e; /* empty */
    }
  }, [progress]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + "assessment_grades", JSON.stringify(assessmentGrades));
    } catch (e) { void e; /* empty */
    }
  }, [assessmentGrades]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + "attendance", JSON.stringify(attendance));
    } catch (e) { void e; /* empty */
    }
  }, [attendance]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + "evidence", JSON.stringify(evidence));
    } catch (e) { void e; /* empty */
    }
  }, [evidence]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + "checkins", JSON.stringify(checkIns));
    } catch (e) { void e; /* empty */
    }
  }, [checkIns]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + "coaching", JSON.stringify(coachingActions));
    } catch (e) { void e; /* empty */
    }
  }, [coachingActions]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + "esep_sessions", JSON.stringify(esepSessions));
    } catch (e) { void e; /* empty */
    }
  }, [esepSessions]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + "esep_evaluations", JSON.stringify(esepEvaluations));
    } catch (e) { void e; /* empty */
    }
  }, [esepEvaluations]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + "notifications", JSON.stringify(notifications));
    } catch (e) { void e; /* empty */
    }
  }, [notifications]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + "qds_requests", JSON.stringify(qdsRequests));
    } catch (e) { void e; /* empty */
    }
  }, [qdsRequests]);
  const createOrLinkJourneyFromNHO = (applicant, hrActor = "Dulla, Ralph Vincent (HR Operations Lead)", simDate = simulatedCurrentDate) => {
    const res = pureCreateOrLinkJourney(journeys, applicant, hrActor, simDate);
    if (res.isNew) {
      setJourneys(res.updatedJourneys);
      if (Array.isArray(applicant.qdsMaterials) && applicant.qdsMaterials.length > 0) {
        const empKey = res.journey.sibsEmployeeId || res.journey.id;
        const newAssignments = [];
        applicant.qdsMaterials.forEach((m, idx) => {
          const exists = assignments.some((a) => (a.emp === empKey || a.emp === res.journey.id) && a.title.toLowerCase() === m.title.toLowerCase());
          if (!exists) {
            newAssignments.push({
              id: Date.now() + idx + Math.floor(Math.random() * 1e4),
              emp: empKey,
              date: res.journey.startDate || simDate,
              category: m.type || "QDS Curriculum",
              title: m.title,
              type: "Material",
              description: m.description || m.fileOrLinkRef,
              owner: applicant.assignedTrainerName || "Unassigned owner",
              trainer: applicant.assignedTrainerName || void 0,
              duration: "30 mins",
              priority: "Normal",
              details: m.description || m.fileOrLinkRef,
              created: simDate
            });
          }
        });
        if (newAssignments.length > 0) {
          setAssignments((prev) => [...prev, ...newAssignments]);
        }
      }
    }
    return { success: true, journey: res.journey, isNew: res.isNew };
  };
  const updateDay30Milestone = (journeyId, updates) => {
    setJourneys((prev) => prev.map((j) => {
      if (j.id !== journeyId) return j;
      const updated30 = { ...j.day30, ...updates };
      return {
        ...j,
        day30: updated30,
        auditTrail: [
          {
            date: `${simulatedCurrentDate} ` + (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            action: `Day 30 Milestone Updated (${updated30.status})`,
            actor: updated30.evaluatorName || "Carlos Mendoza (L&D Specialist)",
            details: updated30.trainerNotes || "Updated Day 30 nesting scorecard metrics."
          },
          ...j.auditTrail
        ]
      };
    }));
    return true;
  };
  const submitTrainerToTlHandoff = (journeyId, handoffUpdates) => {
    let affectedEmployeeName = "";
    const nowStr = `${simulatedCurrentDate} ` + (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setJourneys((prev) => prev.map((j) => {
      if (j.id !== journeyId) return j;
      affectedEmployeeName = j.fullName;
      const targetTl = handoffUpdates.targetTlName || j.tl || "Anton Reyes";
      const trainer = handoffUpdates.trainerName || j.trainerName || "Maria Cruz";
      const newHandoff = {
        status: handoffUpdates.status || "Submitted",
        trainerId: j.trainerId,
        trainerName: trainer,
        targetTlId: void 0,
        targetTlName: targetTl,
        submittedAt: nowStr,
        readinessRating: handoffUpdates.readinessRating || "Floor Ready",
        coreStrengths: handoffUpdates.coreStrengths || ["Customer Communication", "Systems Navigation"],
        focusAreas: handoffUpdates.focusAreas || ["AHT pacing"],
        fstScore: handoffUpdates.fstScore,
        pstScore: handoffUpdates.pstScore,
        qaScore: handoffUpdates.qaScore,
        attendanceRate: handoffUpdates.attendanceRate,
        trainerNotes: handoffUpdates.trainerNotes || "Trainer endorsed Day 30 handoff to Team Leader for ramp operations.",
        recommendedNestingWing: handoffUpdates.recommendedNestingWing || j.wfmSeating?.wing,
        recommendedStation: handoffUpdates.recommendedStation || j.wfmSeating?.seatNumber,
        ...handoffUpdates
      };
      const updated30 = {
        ...j.day30,
        trainerEndorsement: handoffUpdates.readinessRating === "Floor Ready" ? "Floor Ready" : handoffUpdates.readinessRating === "At Risk" ? "At Risk" : "Requires Coaching",
        trainerNotes: handoffUpdates.trainerNotes || j.day30.trainerNotes,
        handoff: newHandoff
      };
      return {
        ...j,
        day30: updated30,
        day30Handoff: newHandoff,
        auditTrail: [
          {
            date: nowStr,
            action: `Day 30 Handoff Endorsed (${trainer} \u2192 ${targetTl})`,
            actor: trainer,
            details: `Readiness: ${newHandoff.readinessRating}. ${newHandoff.trainerNotes}`
          },
          ...j.auditTrail
        ]
      };
    }));
    if (affectedEmployeeName) {
      addNotification({
        emp: journeyId,
        text: `Day 30 Handoff Endorsed: Trainer endorsed ${affectedEmployeeName} for Team Leader transfer.`,
        date: simulatedCurrentDate,
        role: "HR / Operations"
      });
    }
    return true;
  };
  const acceptTrainerToTlHandoff = (journeyId, acceptedBy, notes) => {
    let affectedEmployeeName = "";
    const nowStr = `${simulatedCurrentDate} ` + (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setJourneys((prev) => prev.map((j) => {
      if (j.id !== journeyId) return j;
      affectedEmployeeName = j.fullName;
      const currentHandoff = j.day30Handoff || j.day30?.handoff;
      const updatedHandoff = {
        trainerName: currentHandoff?.trainerName || j.trainerName || "Assigned Trainer",
        targetTlName: currentHandoff?.targetTlName || j.tl || "Team Leader",
        readinessRating: currentHandoff?.readinessRating || "Floor Ready",
        coreStrengths: currentHandoff?.coreStrengths || ["Customer Communication", "Systems Navigation"],
        focusAreas: currentHandoff?.focusAreas || ["AHT pacing"],
        trainerNotes: currentHandoff?.trainerNotes || "Trainer endorsed.",
        submittedAt: currentHandoff?.submittedAt || nowStr,
        acceptedAt: nowStr,
        acceptedBy,
        tlAcceptanceNotes: notes || "Team Leader accepted operational custody of employee.",
        ...currentHandoff,
        status: "Accepted"
      };
      const updated30 = {
        ...j.day30,
        status: "Completed",
        completedDate: simulatedCurrentDate,
        handoff: updatedHandoff
      };
      return {
        ...j,
        day30: updated30,
        day30Handoff: updatedHandoff,
        auditTrail: [
          {
            date: nowStr,
            action: `Day 30 Handoff Formally Accepted`,
            actor: acceptedBy,
            details: `Operational custody transferred. Notes: ${notes || "Accepted"}`
          },
          ...j.auditTrail
        ]
      };
    }));
    if (affectedEmployeeName) {
      addNotification({
        emp: journeyId,
        text: `Day 30 Handoff Accepted: ${acceptedBy} assumed operational custody for ${affectedEmployeeName}.`,
        date: simulatedCurrentDate,
        role: "HR / Operations"
      });
    }
    return true;
  };
  const updateDay60Milestone = (journeyId, updates) => {
    setJourneys((prev) => prev.map((j) => {
      if (j.id !== journeyId) return j;
      const updated60 = { ...j.day60, ...updates };
      return {
        ...j,
        day60: updated60,
        auditTrail: [
          {
            date: `${simulatedCurrentDate} ` + (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            action: `Day 60 Milestone Updated (${updated60.status})`,
            actor: updated60.evaluatorName || "Michael Corpuz (Operations Supervisor)",
            details: updated60.supervisorNotes || "Updated Day 60 core performance scorecard."
          },
          ...j.auditTrail
        ]
      };
    }));
    return true;
  };
  const updateDay90Milestone = (journeyId, updates) => {
    setJourneys((prev) => prev.map((j) => {
      if (j.id !== journeyId) return j;
      const updated90 = { ...j.day90, ...updates };
      return {
        ...j,
        day90: updated90,
        // Keep stage separated from automatic regularization
        stage: updated90.status === "Completed" ? "Completed Onboarding" : j.stage,
        auditTrail: [
          {
            date: `${simulatedCurrentDate} ` + (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            action: `Day 90 Review Assessment Updated (${updated90.status})`,
            actor: updated90.evaluatorName || "Dulla, Ralph Vincent (HR Operations Lead)",
            details: updated90.trainerNotes || "Updated Day 90 milestone review records."
          },
          ...j.auditTrail
        ]
      };
    }));
    return true;
  };
  const updateJourneyReview = (journeyId, milestoneDay, review) => {
    setJourneys((prev) => prev.map((j) => {
      if (j.id !== journeyId) return j;
      const newReviews = { ...j.reviews, [milestoneDay]: review };
      return {
        ...j,
        reviews: newReviews,
        auditTrail: [
          {
            date: `${simulatedCurrentDate} ` + (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            action: `Day ${milestoneDay} Review Recorded (${review.decision})`,
            actor: review.manager,
            details: review.notes
          },
          ...j.auditTrail
        ]
      };
    }));
    return true;
  };
  const setFinalEmploymentOutcome = (journeyId, outcome, notes, authorizedBy = "Paolo Vega (Operations Manager)") => {
    setJourneys((prev) => prev.map((j) => {
      if (j.id !== journeyId) return j;
      return {
        ...j,
        finalOutcome: outcome,
        auditTrail: [
          {
            date: `${simulatedCurrentDate} ` + (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            action: `Official Employment Decision: ${outcome}`,
            actor: authorizedBy,
            details: notes || `Recorded official employment outcome: ${outcome}.`
          },
          ...j.auditTrail
        ]
      };
    }));
    return true;
  };
  const acknowledgeReview = (journeyId) => {
    setJourneys((prev) => prev.map((j) => {
      if (j.id !== journeyId) return j;
      return {
        ...j,
        acknowledged: true,
        auditTrail: [
          {
            date: `${simulatedCurrentDate} ` + (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            action: "Employee Milestone Review Acknowledged",
            actor: j.fullName,
            details: "Employee signed and confirmed review records."
          },
          ...j.auditTrail
        ]
      };
    }));
    return true;
  };
  const addTouchpoint = (journeyId, touchpoint) => {
    const newTp = {
      ...touchpoint,
      id: `tp-${Date.now()}`
    };
    setJourneys((prev) => prev.map((j) => {
      if (j.id !== journeyId) return j;
      return {
        ...j,
        touchpoints: [newTp, ...j.touchpoints],
        auditTrail: [
          {
            date: `${simulatedCurrentDate} ` + (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            action: `Logged Touchpoint: ${touchpoint.type}`,
            actor: touchpoint.authorName,
            details: touchpoint.notes
          },
          ...j.auditTrail
        ]
      };
    }));
    return true;
  };
  const linkEmployeeProfile = (journeyId, sibsEmployeeId, startDate, trainerId, trainerName, hireDate) => {
    if (!sibsEmployeeId || !sibsEmployeeId.trim() || !startDate || !startDate.trim()) {
      return false;
    }
    const cleanId = sibsEmployeeId.trim();
    const cleanStart = startDate.trim();
    setJourneys((prev) => prev.map((j) => {
      if (j.id !== journeyId) return j;
      const { daysElapsed, stage, progressPct } = calculateJourneyStage(cleanStart, simulatedCurrentDate);
      return {
        ...j,
        sibsEmployeeId: cleanId,
        startDate: cleanStart,
        hireDate: hireDate?.trim() || j.hireDate || cleanStart,
        trainerId: trainerId || j.trainerId,
        trainerName: trainerName || j.trainerName,
        daysElapsed,
        stage,
        overallProgressPct: progressPct,
        isAwaitingLinkage: false,
        auditTrail: [
          {
            date: `${simulatedCurrentDate} ` + (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            action: "Authorized Linkage Completed",
            actor: "HR Operations Lead",
            details: `Linked SIB ID: ${cleanId}. Confirmed Start Date: ${cleanStart}.${trainerName ? ` Trainer: ${trainerName}.` : ""}`
          },
          ...j.auditTrail
        ]
      };
    }));
    return true;
  };
  const addTrainingAssignment = (assignment) => {
    setAssignments((prev) => [...prev, { ...assignment, id: Date.now() + Math.floor(Math.random() * 1e3), created: simulatedCurrentDate }]);
  };
  const submitAssignment = (assignmentId, emp, note = "Trainee completed material") => {
    setProgress((prev) => {
      const existing = prev.find((p) => p.assignmentId === assignmentId && p.emp === emp);
      if (existing) {
        return prev.map((p) => p.id === existing.id ? { ...p, status: "Submitted", note, submitted: simulatedCurrentDate } : p);
      }
      return [
        ...prev,
        {
          id: Date.now(),
          assignmentId,
          emp,
          status: "Submitted",
          note,
          submitted: simulatedCurrentDate
        }
      ];
    });
  };
  const verifyAssignment = (assignmentId, emp, status, reviewer, feedback) => {
    setProgress((prev) => {
      const existing = prev.find((p) => p.assignmentId === assignmentId && p.emp === emp);
      if (existing) {
        return prev.map((p) => p.id === existing.id ? { ...p, status, reviewer, reviewed: simulatedCurrentDate, feedback } : p);
      }
      return [
        ...prev,
        {
          id: Date.now(),
          assignmentId,
          emp,
          status,
          reviewer,
          reviewed: simulatedCurrentDate,
          feedback
        }
      ];
    });
  };
  const saveAssessmentGrade = (grade) => {
    setAssessmentGrades((prev) => {
      const existing = prev.findIndex((g) => g.assessmentId === grade.assessmentId && g.emp === grade.emp);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = grade;
        return copy;
      }
      return [...prev, grade];
    });
  };
  const addAttendanceRecord = (record) => {
    const newRecord = {
      ...record,
      id: Date.now(),
      recorded: simulatedCurrentDate
    };
    setAttendance((prev) => [newRecord, ...prev]);
  };
  const addEvidenceItem = (item) => {
    const newItem = {
      ...item,
      id: Date.now()
    };
    setEvidence((prev) => [newItem, ...prev]);
  };
  const addCheckIn = (item) => {
    const newItem = {
      ...item,
      id: Date.now()
    };
    setCheckIns((prev) => [newItem, ...prev]);
  };
  const addCoachingAction = (action) => {
    const newAction = {
      ...action,
      id: Date.now()
    };
    setCoachingActions((prev) => [newAction, ...prev]);
  };
  const toggleCoachingAction = (id) => {
    setCoachingActions((prev) => prev.map((c) => c.id === id ? { ...c, status: c.status === "Open" ? "Done" : "Open" } : c));
  };
  const addEsepSession = (session) => {
    setEsepSessions((prev) => [session, ...prev]);
  };
  const addEsepEvaluation = (evaluation) => {
    setEsepEvaluations((prev) => [evaluation, ...prev]);
  };
  const addQDSRequest = (req) => {
    const newReq = {
      ...req,
      id: Date.now(),
      created: simulatedCurrentDate,
      status: "Open"
    };
    setQdsRequests((prev) => [newReq, ...prev]);
  };
  const updateQDSRequestStatus = (id, status, resolution) => {
    setQdsRequests((prev) => prev.map((q) => q.id === id ? { ...q, status, resolution, closed: status === "Closed" ? simulatedCurrentDate : void 0 } : q));
  };
  const addNotification = (notif) => {
    const newNotif = {
      ...notif,
      id: Date.now()
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };
  const clearNotifications = () => {
    setNotifications([]);
  };
  const resetJourneysToDefault = () => {
    localStorage.removeItem(JOURNEY_STORAGE_KEY);
    const keys = ["journeys", "assignments", "progress", "assessment_grades", "attendance", "evidence", "checkins", "coaching", "esep_sessions", "esep_evaluations", "notifications", "qds_requests"];
    keys.forEach((k) => localStorage.removeItem(STORAGE_PREFIX + k));
    setJourneys(INITIAL_JOURNEYS);
    setSelectedJourney(null);
    setAssignments(INITIAL_ASSIGNMENTS);
    setProgress(INITIAL_PROGRESS);
    setAssessmentGrades(INITIAL_ASSESSMENT_GRADES);
    setAttendance(INITIAL_ATTENDANCE);
    setEvidence(INITIAL_EVIDENCE);
    setCheckIns(INITIAL_CHECKINS);
    setCoachingActions(INITIAL_COACHING_ACTIONS);
    setEsepSessions(INITIAL_ESEP_SESSIONS);
    setEsepEvaluations(INITIAL_ESEP_EVALUATIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setQdsRequests(INITIAL_QDS_REQUESTS);
  };
  const getJourneyByNhoApplicantId = (applicantId) => {
    return journeys.find((j) => j.nhoApplicantId === applicantId);
  };
  const pendingDay30HandoffsCount = useMemo(() => {
    return journeys.filter((j) => {
      const days = j.daysElapsed || 1;
      const handoff = j.day30Handoff || j.day30?.handoff;
      return days >= 14 && (!handoff || handoff.status !== "Accepted");
    }).length;
  }, [journeys]);
  const value = useMemo(() => ({
    journeys,
    selectedJourney,
    setSelectedJourney,
    simulatedCurrentDate,
    setSimulatedCurrentDate,
    assignments,
    progress,
    assessments,
    assessmentGrades,
    phaseTrainingScores,
    attendance,
    evidence,
    checkIns,
    coachingActions,
    esepSessions,
    esepEvaluations,
    notifications,
    qdsRequests,
    pendingDay30HandoffsCount,
    createOrLinkJourneyFromNHO,
    updateDay30Milestone,
    submitTrainerToTlHandoff,
    acceptTrainerToTlHandoff,
    updateDay60Milestone,
    updateDay90Milestone,
    updateJourneyReview,
    setFinalEmploymentOutcome,
    acknowledgeReview,
    addTouchpoint,
    linkEmployeeProfile,
    addTrainingAssignment,
    submitAssignment,
    verifyAssignment,
    saveAssessmentGrade,
    addAttendanceRecord,
    addEvidenceItem,
    addCheckIn,
    addCoachingAction,
    toggleCoachingAction,
    addEsepSession,
    addEsepEvaluation,
    addQDSRequest,
    updateQDSRequestStatus,
    addNotification,
    clearNotifications,
    resetJourneysToDefault,
    getJourneyByNhoApplicantId
  }), [
    journeys,
    selectedJourney,
    simulatedCurrentDate,
    assignments,
    progress,
    assessments,
    assessmentGrades,
    phaseTrainingScores,
    attendance,
    evidence,
    checkIns,
    coachingActions,
    esepSessions,
    esepEvaluations,
    notifications,
    qdsRequests
  ]);
  return <JourneyContext.Provider value={value}>
      {children}
    </JourneyContext.Provider>;
}
function useJourney() {
  const context = useContext(JourneyContext);
  if (!context) {
    return {
      journeys: [],
      qdsRequests: [],
      esepSessions: [],
      esepEvaluations: [],
      coachingActions: [],
      benchmarks: [],
      dailyChecklists: {},
      notifications: [],
      simulatedCurrentDate: DEFAULT_SIMULATED_DATE,
      addQDSRequest: () => {},
      updateQDSRequestStatus: () => {},
      setSelectedJourney: () => {},
      addCoachingAction: () => {},
      updateCoachingAction: () => {},
    };
  }
  return context;
}
export {
  DEFAULT_SIMULATED_DATE,
  JOURNEY_STORAGE_KEY,
  JourneyProvider,
  JourneyContext,
  STORAGE_PREFIX,
  calculateJourneyStage,
  pureCreateOrLinkJourney,
  useJourney
};
