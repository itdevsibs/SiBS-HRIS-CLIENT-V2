/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useNHO, AUTHORIZED_TRAINERS } from "../NHOContext";
import {
  BookOpenCheck,
  Search,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  FileText,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  Link as LinkIcon,
  UploadCloud,
  FileCheck,
  Package,
  Send,
  GraduationCap,
  AlertTriangle,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bell
} from "lucide-react";
import { useJourney } from "../../journey/JourneyContext";
import EmployeeJourneyDrawer from "../../journey/EmployeeJourneyDrawer";
import TwoWeekTrainingScheduleView from "../TwoWeekTrainingScheduleView";
const PRESET_CATALOG = [
  {
    title: "Fintech Core Product & Operations Playbook 2026",
    type: "PDF Document",
    fileOrLinkRef: "Fintech_Operations_Playbook_v5.pdf",
    fileSize: "4.8 MB",
    description: "Standard operating procedures, fintech product matrix, and transactional workflows.",
    source: "Catalog"
  },
  {
    title: "Customer Engagement & De-escalation Scripts",
    type: "Word Document",
    fileOrLinkRef: "Customer_Engagement_Scripts_2026.docx",
    fileSize: "1.9 MB",
    description: "Approved voice and chat responses for high-priority escalation scenarios.",
    source: "Catalog"
  },
  {
    title: "Enterprise Systems & Core Banking Sandbox Link",
    type: "Approved Training Resource Link",
    fileOrLinkRef: "https://sandbox.simulations.internal.sibs.com/core-banking",
    fileSize: "Web Portal",
    description: "Interactive employee training simulation environment with test customer data.",
    source: "Catalog"
  },
  {
    title: "Information Security, PCI-DSS & Clean Desk Standards",
    type: "PowerPoint Presentation",
    fileOrLinkRef: "Security_Compliance_Deck_2026.pptx",
    fileSize: "6.2 MB",
    description: "Mandatory regulatory security slides for floor and remote agents.",
    source: "Catalog"
  }
];
function NHOQDSDashboard({ subTab = "queue", onSubTabChange }) {
  const {
    applicants,
    activeApplicant,
    setSelectedApplicantId,
    qdsAddMaterial,
    qdsRemoveMaterial,
    qdsConfirmMaterials,
    qdsAssignAndSendToTrainer,
    qdsFulfillMaterialRequest,
    qdsNotifications = [],
    dismissQdsNotification,
    qdsAssignAttendanceSchedule,
    simulatedCurrentDate
  } = useNHO();
  const [activeViewMode, setActiveViewMode] = useState("calendar");
  React.useEffect(() => {
    if (subTab === "schedule" || subTab === "two-week") {
      setActiveViewMode("two-week");
    } else if (subTab === "queue") {
      setActiveViewMode("calendar");
    }
  }, [subTab]);

  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(9);
  const [isAssignScheduleModalOpen, setIsAssignScheduleModalOpen] = useState(false);
  const [scheduleTargetApplicantId, setScheduleTargetApplicantId] = useState("");
  const [scheduleDateInput, setScheduleDateInput] = useState("2026-10-12");
  const [scheduleShiftInput, setScheduleShiftInput] = useState("08:00 AM \u2013 05:00 PM");
  const [scheduleLocationInput, setScheduleLocationInput] = useState("Fintech Training Room 4A");
  const [scheduleTrainerInput, setScheduleTrainerInput] = useState(AUTHORIZED_TRAINERS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedApplicantForMaterials, setSelectedApplicantForMaterials] = useState(activeApplicant?.id || "");
  const [selectedTrainerId, setSelectedTrainerId] = useState(
    activeApplicant?.assignedTrainerId || AUTHORIZED_TRAINERS[0].id
  );
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("PDF Document");
  const [newRef, setNewRef] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [fulfillingRequest, setFulfillingRequest] = useState(null);
  const [fulfillTitle, setFulfillTitle] = useState("");
  const [fulfillType, setFulfillType] = useState("PDF Document");
  const [fulfillRef, setFulfillRef] = useState("");
  const [fulfillDesc, setFulfillDesc] = useState("");
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionReasonInput, setCorrectionReasonInput] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const { journeys, getJourneyByNhoApplicantId, createOrLinkJourneyFromNHO } = useJourney();
  const [drawerJourney, setDrawerJourney] = useState(null);
  const [isJourneyDrawerOpen, setIsJourneyDrawerOpen] = useState(false);
  const handleOpenJourney = (app) => {
    let j = getJourneyByNhoApplicantId(app.id);
    if (!j && app.officialKronosId) {
      j = journeys.find((item) => item.kronosId === app.officialKronosId);
    }
    if (j) {
      setDrawerJourney(j);
      setIsJourneyDrawerOpen(true);
    } else {
      alert("Employee Journey record will be available once HR Operations formally accepts the onboarding handoff.");
    }
  };
  const postITApplicants = applicants.filter((a) => a.itRequestStatus === "Completed" && !!a.officialKronosId);
  const filteredApplicants = postITApplicants.filter((a) => {
    const matchesSearch = a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || a.applicantNumber.toLowerCase().includes(searchQuery.toLowerCase()) || (a.officialKronosId || "").toLowerCase().includes(searchQuery.toLowerCase()) || a.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || statusFilter === "Pending" && (a.qdsStatus === "Pending" || a.qdsStatus === "Not Ready") || statusFilter === "In Progress" && a.qdsStatus === "In Progress" || statusFilter === "Completed" && a.qdsStatus === "Completed";
    return matchesSearch && matchesStatus;
  });
  const selectedApp = applicants.find((a) => a.id === selectedApplicantForMaterials) || filteredApplicants[0] || postITApplicants[0];
  React.useEffect(() => {
    if (selectedApp?.assignedTrainerId) {
      setSelectedTrainerId(selectedApp.assignedTrainerId);
    }
  }, [selectedApp?.id, selectedApp?.assignedTrainerId]);
  const handleOpenApplicant = (app) => {
    setSelectedApplicantForMaterials(app.id);
    setSelectedApplicantId(app.id);
    if (app.assignedTrainerId) {
      setSelectedTrainerId(app.assignedTrainerId);
    }
    if (onSubTabChange) onSubTabChange("materials");
  };
  const handleAssignAndSendToTrainer = () => {
    if (!selectedApp) return;
    const targetTrainer = AUTHORIZED_TRAINERS.find((t) => t.id === selectedTrainerId);
    if (!targetTrainer) {
      alert("Please select an authorized trainer from the L&D roster.");
      return;
    }
    const mats = selectedApp.qdsMaterials || [];
    if (mats.length === 0) {
      alert("Cannot send to Trainer: Please assign at least 1 training material before sending the package to the Trainer.");
      return;
    }
    qdsAssignAndSendToTrainer(selectedApp.id, targetTrainer.id, targetTrainer.name);
  };
  const handleOpenFulfillModal = (req) => {
    setFulfillingRequest(req);
    setFulfillTitle(req.materialTitle);
    setFulfillType(
      req.category?.includes("PPTX") || req.category?.includes("Deck") ? "PowerPoint Presentation" : req.category?.includes("DOCX") || req.category?.includes("Script") ? "Word Document" : req.category?.includes("Link") || req.category?.includes("Portal") ? "Approved Training Resource Link" : "PDF Document"
    );
    setFulfillRef(`${req.materialTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Approved_2026.pdf`);
    setFulfillDesc(`Fulfillment for Trainer request: ${req.reason}`);
  };
  const handleConfirmFulfill = (e) => {
    e.preventDefault();
    if (!selectedApp || !fulfillingRequest || !fulfillTitle.trim() || !fulfillRef.trim()) return;
    qdsFulfillMaterialRequest(selectedApp.id, fulfillingRequest.id, {
      title: fulfillTitle.trim(),
      type: fulfillType,
      fileOrLinkRef: fulfillRef.trim(),
      fileSize: fulfillType === "Approved Training Resource Link" ? "Web Portal Link" : "3.2 MB",
      description: fulfillDesc.trim() || void 0,
      source: fulfillType === "Approved Training Resource Link" ? "Approved Link" : "Catalog"
    });
    setFulfillingRequest(null);
  };
  const handleOpenAssignScheduleModal = (applicantId, defaultDate) => {
    const targetId = applicantId || selectedApp?.id || postITApplicants[0]?.id || "";
    setScheduleTargetApplicantId(targetId);
    const target = applicants.find((a) => a.id === targetId);
    if (defaultDate) {
      setScheduleDateInput(defaultDate);
    } else if (target?.qdsAssignedScheduleDate) {
      setScheduleDateInput(target.qdsAssignedScheduleDate);
    } else if (target?.scheduledNhoDate) {
      setScheduleDateInput(target.scheduledNhoDate);
    } else {
      setScheduleDateInput("2026-10-12");
    }
    if (target?.qdsShiftHours) setScheduleShiftInput(target.qdsShiftHours);
    if (target?.qdsTrainingLocation) setScheduleLocationInput(target.qdsTrainingLocation);
    if (target?.assignedTrainerId) setScheduleTrainerInput(target.assignedTrainerId);
    setIsAssignScheduleModalOpen(true);
  };
  const handleConfirmAssignSchedule = (e) => {
    e.preventDefault();
    if (!scheduleTargetApplicantId) return;
    const res = qdsAssignAttendanceSchedule(scheduleTargetApplicantId, {
      scheduledDate: scheduleDateInput,
      shiftHours: scheduleShiftInput,
      trainingLocation: scheduleLocationInput,
      assignedBy: "Carla Villanueva (Lead QDS)"
    });
    if (res.success) {
      const notif = qdsNotifications.find((n) => n.applicantId === scheduleTargetApplicantId && !n.isRead);
      if (notif) dismissQdsNotification(notif.id);
      setIsAssignScheduleModalOpen(false);
    }
  };
  const executeAdd = (material, reason) => {
    if (!selectedApp) return;
    qdsAddMaterial(selectedApp.id, material, reason);
  };
  const executeRemove = (materialId, reason) => {
    if (!selectedApp) return;
    qdsRemoveMaterial(selectedApp.id, materialId, reason);
  };
  const handleAddPreset = (preset) => {
    if (!selectedApp) return;
    if (selectedApp.qdsStatus === "Completed") {
      setPendingAction({ type: "add", material: preset });
      setShowCorrectionModal(true);
      return;
    }
    executeAdd(preset);
  };
  const handleAddManualMaterial = (e) => {
    e.preventDefault();
    if (!selectedApp || !newTitle.trim()) return;
    const cleanedRef = newRef.trim();
    if (!cleanedRef) {
      alert("Missing material reference: An uploaded filename or approved URL link is required.");
      return;
    }
    const materialToAdd = {
      title: newTitle.trim(),
      type: newType,
      fileOrLinkRef: cleanedRef,
      fileSize: newType === "Approved Training Resource Link" ? "Web Link" : "2.5 MB",
      description: newDesc.trim() || void 0,
      source: newType === "Approved Training Resource Link" ? "Approved Link" : "Uploaded File"
    };
    if (selectedApp.qdsStatus === "Completed") {
      setPendingAction({ type: "add", material: materialToAdd });
      setShowAddModal(false);
      setShowCorrectionModal(true);
      return;
    }
    executeAdd(materialToAdd);
    setNewTitle("");
    setNewRef("");
    setNewDesc("");
    setShowAddModal(false);
  };
  const handleRemoveMaterial = (materialId) => {
    if (!selectedApp) return;
    if (selectedApp.qdsStatus === "Completed") {
      setPendingAction({ type: "remove", materialId });
      setShowCorrectionModal(true);
      return;
    }
    executeRemove(materialId);
  };
  const handleConfirmCorrection = () => {
    if (!selectedApp || !pendingAction || !correctionReasonInput.trim()) return;
    if (pendingAction.type === "add" && pendingAction.material) {
      executeAdd(pendingAction.material, correctionReasonInput.trim());
      setNewTitle("");
      setNewRef("");
      setNewDesc("");
    } else if (pendingAction.type === "remove" && pendingAction.materialId) {
      executeRemove(pendingAction.materialId, correctionReasonInput.trim());
    }
    setShowCorrectionModal(false);
    setPendingAction(null);
    setCorrectionReasonInput("");
  };
  const handleConfirmFinalize = () => {
    if (!selectedApp) return;
    qdsConfirmMaterials(selectedApp.id);
  };
  return <div className="space-y-6">
      {
    /* Top Banner */
  }
      <div className="bg-white rounded-2xl border border-sibs-border shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sibs-navy via-sibs-orange to-emerald-500" />
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sibs-navy/5 border border-sibs-navy/10 flex items-center justify-center shrink-0">
            <BookOpenCheck className="w-6 h-6 text-sibs-navy" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-sibs-navy">QDS Module — Training Materials Assignment</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sibs-orange/10 text-sibs-orange">
                Quality Development Queue
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign account curriculum, SOPs, training playbooks, and sandbox links post-IT endorsement. Operates asynchronously with Trainer & WFM.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-sibs-surface border border-sibs-border px-3.5 py-2 rounded-xl">
          <Package className="w-4 h-4 text-sibs-orange" />
          <span>Curriculum Specialist: <strong>{activeApplicant?.qdsCompletedBy || "Not Recorded"}</strong></span>
        </div>
      </div>

      {
    /* Info Callout */
  }
      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-sibs-navy flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold text-sibs-navy">QDS Operational Prerequisite:</strong>{" "}
          Quality Development assigns and finalizes all mandatory training materials for the new hire. Once confirmed, this milestone clears QDS readiness. HR handoff requires Trainer, QDS, and WFM to all complete before final acceptance.
        </div>
      </div>

      {
    /* Requirement 3: IT Credentials Completion & Notification Inbox Banner */
  }
      {qdsNotifications.length > 0 && <div className="bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-blue-50/60 border border-orange-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sibs-orange text-white flex items-center justify-center font-bold shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-sibs-navy">
                  IT Credentials Ready Notifications ({qdsNotifications.filter((n) => !n.isRead).length} Pending)
                </h3>
                <p className="text-[11px] text-slate-500">
                  IT has completed candidate credentials. Assign attendance schedules below to synchronize with HR Operations and training calendar.
                </p>
              </div>
            </div>
            <button
    onClick={() => handleOpenAssignScheduleModal()}
    className="px-3.5 py-1.5 rounded-xl bg-sibs-orange hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
  >
              <Calendar className="w-3.5 h-3.5" />
              <span>+ Assign Attendance Schedule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {qdsNotifications.map((notif) => <div
    key={notif.id}
    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${notif.isRead ? "bg-white/70 border-slate-200 text-slate-500" : "bg-white border-orange-200 shadow-2xs text-sibs-navy"}`}
  >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sibs-navy">{notif.applicantName}</span>
                    <span className="font-mono text-[10px] bg-purple-50 text-purple-900 border border-purple-200 px-1.5 py-0.5 rounded font-bold">
                      {notif.officialKronosId}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{notif.account}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{notif.message}</p>
                  <span className="text-[9.5px] text-slate-400 block">{notif.timestamp}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
    onClick={() => handleOpenAssignScheduleModal(notif.applicantId)}
    className="px-3 py-1.5 rounded-xl bg-sibs-navy hover:bg-sibs-navy/90 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
  >
                    Assign Schedule
                  </button>
                  {!notif.isRead && <button
    onClick={() => dismissQdsNotification(notif.id)}
    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
    title="Dismiss notification"
  >
                      <X className="w-3.5 h-3.5" />
                    </button>}
                </div>
              </div>)}
          </div>
        </div>}

      {
    /* View Switcher Bar */
  }
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-sibs-border shadow-xs text-xs">
        <div className="flex items-center gap-1.5 p-1 bg-sibs-surface rounded-xl border border-sibs-border">
          <button
    onClick={() => {
      setActiveViewMode("calendar");
      if (onSubTabChange) onSubTabChange("queue");
    }}
    className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeViewMode === "calendar" ? "bg-sibs-navy text-white shadow-xs" : "text-slate-600 hover:text-sibs-navy"}`}
  >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar View (Primary)</span>
          </button>

          <button
    onClick={() => {
      setActiveViewMode("queue");
      if (onSubTabChange) onSubTabChange("queue");
    }}
    className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeViewMode === "queue" ? "bg-sibs-navy text-white shadow-xs" : "text-slate-600 hover:text-sibs-navy"}`}
  >
            <Layers className="w-3.5 h-3.5" />
            <span>Roster Queue Table</span>
          </button>

          <button
    onClick={() => {
      setActiveViewMode("materials");
      if (onSubTabChange) onSubTabChange("materials");
    }}
    className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeViewMode === "materials" ? "bg-sibs-navy text-white shadow-xs" : "text-slate-600 hover:text-sibs-navy"}`}
  >
            <BookOpenCheck className="w-3.5 h-3.5" />
            <span>Materials Package Details</span>
          </button>

          <button
    onClick={() => {
      setActiveViewMode("two-week");
      if (onSubTabChange) onSubTabChange("two-week");
    }}
    className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeViewMode === "two-week" ? "bg-sibs-navy text-white shadow-xs" : "text-slate-600 hover:text-sibs-navy"}`}
  >
            <Calendar className="w-3.5 h-3.5 text-sibs-orange" />
            <span>2-Week PST &amp; FST Schedule</span>
          </button>
        </div>


        <div className="flex items-center gap-2">
          <button
    onClick={() => handleOpenAssignScheduleModal()}
    className="px-3.5 py-1.5 rounded-xl bg-sibs-orange hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
  >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Attendance Schedule</span>
          </button>
        </div>
      </div>

      {
    /* Main View Display */
  }
      {activeViewMode === "calendar" ? (
    /* Requirement 4: Calendar-Based Interface for Training Materials Assignment */
    <div className="space-y-4">
          {
      /* Calendar Header Toolbar */
    }
          <div className="bg-white rounded-2xl border border-sibs-border shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
      type="button"
      onClick={() => {
        if (calendarMonth === 0) {
          setCalendarMonth(11);
          setCalendarYear((y) => y - 1);
        } else {
          setCalendarMonth((m) => m - 1);
        }
      }}
      className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
      title="Previous Month"
    >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
      type="button"
      onClick={() => {
        if (calendarMonth === 11) {
          setCalendarMonth(0);
          setCalendarYear((y) => y + 1);
        } else {
          setCalendarMonth((m) => m + 1);
        }
      }}
      className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
      title="Next Month"
    >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-base font-bold text-sibs-navy tracking-tight">
                {new Date(calendarYear, calendarMonth).toLocaleString("en-US", { month: "long" })} {calendarYear}
              </h2>

              <button
      type="button"
      onClick={() => {
        setCalendarYear(2026);
        setCalendarMonth(9);
      }}
      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] cursor-pointer"
    >
                Today (Oct 2026)
              </button>
            </div>

            {
      /* Quick KPI stats */
    }
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <div className="px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-medium">
                Scheduled Trainees: <strong>{postITApplicants.length}</strong>
              </div>
              <div className="px-3 py-1 rounded-xl bg-green-50 border border-green-200 text-green-900 font-medium">
                Finalized Materials: <strong>{postITApplicants.filter((a) => a.qdsStatus === "Completed").length}</strong>
              </div>
              <div className="px-3 py-1 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 font-medium">
                Assigned Trainers: <strong>{AUTHORIZED_TRAINERS.length}</strong>
              </div>
            </div>
          </div>

          {
      /* Calendar Grid */
    }
          <div className="bg-white rounded-2xl border border-sibs-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto thin-scroll">
              <div className="min-w-[768px]">
                {
          /* Weekday Header */
        }
                <div className="grid grid-cols-7 border-b border-sibs-border bg-sibs-surface text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 py-2.5">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {
          /* Month Day Cells */
        }
                {(() => {
          const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
          const daysCount = new Date(calendarYear, calendarMonth + 1, 0).getDate();
          const prevTotal = new Date(calendarYear, calendarMonth, 0).getDate();
          const cells = [];
          for (let i = firstDayIndex - 1; i >= 0; i--) {
            const d = prevTotal - i;
            const m = calendarMonth === 0 ? 12 : calendarMonth;
            const y = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
            cells.push({
              day: d,
              isCurrent: false,
              dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
            });
          }
          for (let d = 1; d <= daysCount; d++) {
            cells.push({
              day: d,
              isCurrent: true,
              dateStr: `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
            });
          }
          const extra = (7 - cells.length % 7) % 7;
          for (let d = 1; d <= extra; d++) {
            const m = calendarMonth === 11 ? 1 : calendarMonth + 2;
            const y = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
            cells.push({
              day: d,
              isCurrent: false,
              dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
            });
          }
          return <div className="grid grid-cols-7 divide-x divide-y divide-sibs-border">
                      {cells.map((cell, idx) => {
            const isToday = cell.dateStr === simulatedCurrentDate;
            const sessions = postITApplicants.filter((a) => {
              const sDate = a.qdsAssignedScheduleDate || a.scheduledNhoDate;
              return sDate === cell.dateStr;
            });
            return <div
              key={idx}
              className={`min-h-[140px] p-2 flex flex-col justify-between transition-colors group relative ${cell.isCurrent ? "bg-white hover:bg-slate-50/60" : "bg-slate-50/40 text-slate-400"}`}
            >
                            <div className="flex items-center justify-between mb-1">
                              <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isToday ? "bg-sibs-orange text-white shadow-2xs" : cell.isCurrent ? "text-sibs-navy" : "text-slate-400"}`}
            >
                                {cell.day}
                              </span>

                              {cell.isCurrent && <button
              type="button"
              onClick={() => handleOpenAssignScheduleModal(void 0, cell.dateStr)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-sibs-navy transition-all cursor-pointer"
              title={`Schedule training session on ${cell.dateStr}`}
            >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>}
                            </div>

                            {
              /* Sessions List */
            }
                            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[120px]">
                              {sessions.map((app) => {
              const matCount = app.qdsMaterials?.length || 0;
              const isFinal = app.qdsStatus === "Completed";
              const hasTrainerRequest = app.trainerMaterialRequests?.some((r) => r.status === "Pending QDS Fulfillment");
              return <div
                key={app.id}
                onClick={() => {
                  handleOpenApplicant(app);
                  setActiveViewMode("materials");
                }}
                className={`p-2 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.02] shadow-2xs space-y-1 ${isFinal ? "bg-green-50/70 border-green-200 hover:border-green-300" : "bg-orange-50/60 border-orange-200 hover:border-orange-300"}`}
                title="Click to view session details and manage training materials"
              >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-sibs-navy text-[11px] truncate block max-w-[120px]">
                                        {app.fullName.split(" ")[0]} {app.fullName.split(" ")[1] || ""}
                                      </span>
                                      <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-white text-purple-900 border border-slate-200 font-bold shrink-0">
                                        {app.officialKronosId || "IT Done"}
                                      </span>
                                    </div>

                                    <div className="text-[9.5px] text-slate-500 truncate">
                                      {app.account || app.department}
                                    </div>

                                    <div className="flex items-center gap-1 text-[9.5px] text-sibs-navy font-medium">
                                      <GraduationCap className="w-3 h-3 text-sibs-orange shrink-0" />
                                      <span className="truncate">{app.assignedTrainerName ? app.assignedTrainerName.split(" ")[0] : "Trainer"}</span>
                                    </div>

                                    <div className="text-[9px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-200/60">
                                      <span className="truncate">{app.qdsShiftHours ? app.qdsShiftHours.split("\u2013")[0].trim() : "08:00 AM"} • {app.qdsTrainingLocation ? app.qdsTrainingLocation.split(" ")[0] : "Room 4A"}</span>
                                      <span className={`px-1 py-0.2 rounded font-bold text-[9px] ${isFinal ? "bg-green-200 text-green-900" : "bg-amber-200 text-amber-900"}`}>
                                        {matCount} {matCount === 1 ? "Mat" : "Mats"}
                                      </span>
                                    </div>

                                    {hasTrainerRequest && <div className="text-[8.5px] font-bold text-orange-800 bg-orange-100 px-1 py-0.5 rounded flex items-center gap-1">
                                        <span>⚠️ Material Requested</span>
                                      </div>}
                                  </div>;
            })}
                            </div>
                          </div>;
          })}
                    </div>;
        })()}
              </div>
            </div>
          </div>
        </div>
  ) : activeViewMode === "queue" ? (
    /* Queue View */
    <div className="space-y-4">
          {
      /* Search & Filter Toolbar */
    }
          <div className="bg-white rounded-2xl border border-sibs-border shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
      type="text"
      placeholder="Search applicant, Kronos ID, account..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-9 pr-3 py-2 rounded-xl border border-sibs-border focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange outline-none text-xs"
    />
              </div>

              <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="px-3 py-2 rounded-xl border border-sibs-border bg-white text-sibs-navy font-medium outline-none text-xs"
    >
                <option value="All">All Materials Statuses</option>
                <option value="Pending">Pending Assignment</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed / Finalized</option>
              </select>
            </div>

            <div className="text-slate-500 font-medium shrink-0 self-end md:self-center">
              Showing <strong className="text-sibs-navy font-bold">{filteredApplicants.length}</strong> of {postITApplicants.length} post-IT applicants
            </div>
          </div>

          {
      /* Table */
    }
          <div className="bg-white rounded-2xl border border-sibs-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sibs-surface border-b border-sibs-border text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Applicant Name</th>
                    <th className="py-3 px-3">Employee / App ID</th>
                    <th className="py-3 px-3">Dept / Account</th>
                    <th className="py-3 px-3">Position</th>
                    <th className="py-3 px-3">Official Kronos ID</th>
                    <th className="py-3 px-3">Attendance Schedule</th>
                    <th className="py-3 px-3">Materials Status</th>
                    <th className="py-3 px-3">Assigned Materials</th>
                    <th className="py-3 px-3">Assigned Trainer</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                  {filteredApplicants.length === 0 ? <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                        No candidates match the selected filters.
                      </td>
                    </tr> : filteredApplicants.map((app) => {
      const isCompleted = app.qdsStatus === "Completed";
      const isInProgress = app.qdsStatus === "In Progress";
      const count = app.qdsMaterials?.length || 0;
      return <tr key={app.id} className="hover:bg-sibs-cream-light transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-sibs-navy">{app.fullName}</div>
                            <div className="text-[11px] text-slate-400">{app.email}</div>
                          </td>
                          <td className="py-3 px-3 font-mono font-medium text-slate-600">
                            {app.applicantNumber}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800">{app.department}</span>
                            <span className="block text-[10px] text-slate-400">{app.account}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {app.position}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-purple-900">
                            {app.officialKronosId || "\u2014"}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-sibs-orange text-[11px]">
                              {app.qdsAssignedScheduleDate || app.scheduledNhoDate || "Unassigned"}
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                              {app.qdsShiftHours || "08:00 AM \u2013 05:00 PM"}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${isCompleted ? "bg-green-100 text-green-800" : isInProgress ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
                              {isCompleted && <CheckCircle className="w-3 h-3 text-green-600" />}
                              {isInProgress && <Layers className="w-3 h-3 text-blue-600" />}
                              {!isCompleted && !isInProgress && <Clock className="w-3 h-3 text-amber-600" />}
                              {app.qdsStatus || "Pending"}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                              {count} {count === 1 ? "item" : "items"}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-sibs-navy text-[11px] truncate max-w-[140px]">
                              {app.assignedTrainerName ? app.assignedTrainerName.split(" ")[0] + " " + (app.assignedTrainerName.split(" ")[1] || "") : "Unassigned"}
                            </div>
                            <div className="mt-0.5">
                              {app.trainerStatus === "Accepted" ? <span className="text-[9.5px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                                  ✓ Accepted
                                </span> : app.qdsStatus === "Completed" && app.trainerStatus === "Pending Acceptance" ? <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  Sent to Trainer
                                </span> : <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  Pending Dispatch
                                </span>}
                              {app.trainerMaterialRequests?.some((r) => r.status === "Pending QDS Fulfillment") && <span className="text-[9.5px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded border border-orange-200 inline-block mt-0.5">
                                  ✉ Material Requested
                                </span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
        onClick={() => {
          handleOpenApplicant(app);
          setActiveViewMode("materials");
        }}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 ${isCompleted ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-sibs-orange text-white hover:bg-orange-600 shadow-xs"}`}
      >
                              <span>{isCompleted ? "View / Re-Send" : "Assign & Send"}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>;
    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
  ) : activeViewMode === "two-week" ? (
    /* Two-Week PST & FST Matrix View */
    <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-sibs-border shadow-xs p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trainee Cohort:</span>
              <select
      value={selectedApp?.id || postITApplicants[0]?.id || ""}
      onChange={(e) => {
        const target = applicants.find((a) => a.id === e.target.value);
        if (target) handleOpenApplicant(target);
      }}
      className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-sibs-navy bg-white outline-none focus:border-sibs-orange"
    >
                {postITApplicants.map((app) => <option key={app.id} value={app.id}>
                    {app.fullName} ({app.officialKronosId || "IT Done"}) — {app.account}
                  </option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
      type="button"
      onClick={() => handleOpenAssignScheduleModal(selectedApp?.id)}
      className="px-3.5 py-1.5 rounded-xl bg-sibs-navy text-white hover:bg-sibs-navy/90 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
    >
                <Clock className="w-3.5 h-3.5 text-sibs-orange" />
                <span>Adjust Shift / Venue</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-sibs-border shadow-xs p-5">
            <TwoWeekTrainingScheduleView
      startDate={selectedApp?.qdsAssignedScheduleDate || selectedApp?.scheduledNhoDate || "2026-10-12"}
      assignedTrainerId={selectedApp?.assignedTrainerId}
      assignedTrainerName={selectedApp?.assignedTrainerName}
      existingMaterials={selectedApp?.qdsMaterials || []}
      shiftHours={selectedApp?.qdsShiftHours || "08:00 AM \u2013 05:00 PM (Default)"}
      trainingLocation={selectedApp?.qdsTrainingLocation || "Fintech Training Room 4A"}
      traineeName={selectedApp?.fullName}
    />
          </div>
        </div>
  ) : (
    /* Materials Assignment Detail Form */
    <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
      onClick={() => setActiveViewMode("calendar")}
      className="px-3.5 py-1.5 rounded-xl border border-sibs-border text-sibs-navy font-semibold text-xs hover:bg-sibs-surface transition-colors cursor-pointer flex items-center gap-1.5"
    >
              ← Back to Training Schedule Calendar
            </button>

            <div className="text-xs text-slate-500">
              Candidate: <strong className="text-sibs-navy">{selectedApp?.fullName}</strong> ({selectedApp?.applicantNumber})
            </div>
          </div>

          {selectedApp ? <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {
      /* Left Column: Read-Only Overview & Fast Catalog */
    }
              <div className="lg:col-span-1 space-y-4">
                {
      /* Employee Card */
    }
                <div className="bg-white rounded-2xl border border-sibs-border shadow-xs p-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-sibs-navy uppercase text-[11px] tracking-wider">
                      Trainee Profile
                    </h3>
                    <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {selectedApp.applicantNumber}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-sibs-navy">{selectedApp.fullName}</h2>
                    <p className="text-slate-500 text-[11px]">{selectedApp.position}</p>
                    <p className="text-slate-400 text-[10px]">{selectedApp.department} • {selectedApp.account}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Official Kronos ID:</span>
                      <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {selectedApp.officialKronosId || "Not assigned"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">QDS Status:</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${selectedApp.qdsStatus === "Completed" ? "bg-green-100 text-green-800" : selectedApp.qdsStatus === "In Progress" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
                        {selectedApp.qdsStatus || "Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                {
      /* Preset Catalog Quick-Add */
    }
                <div className="bg-white rounded-2xl border border-sibs-border shadow-xs p-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 font-bold text-sibs-navy">
                      <Sparkles className="w-4 h-4 text-sibs-orange" />
                      <span>Approved Standard Curriculum</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Quick-Add</span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-tight">
                    Add standard curriculum packages matching {selectedApp.department}:
                  </p>

                  <div className="space-y-2">
                    {PRESET_CATALOG.map((preset, idx) => {
      const isAlreadyAssigned = selectedApp.qdsMaterials?.some((m) => m.title === preset.title);
      return <div
        key={idx}
        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-start justify-between gap-2"
      >
                          <div className="space-y-0.5">
                            <span className="font-bold text-sibs-navy text-[11px] block">
                              {preset.title}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {preset.type} • {preset.fileSize}
                            </span>
                          </div>

                          <button
        onClick={() => handleAddPreset(preset)}
        disabled={isAlreadyAssigned}
        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 cursor-pointer ${isAlreadyAssigned ? "bg-green-100 text-green-700 cursor-not-allowed" : "bg-sibs-navy hover:bg-sibs-navy/90 text-white"}`}
      >
                            {isAlreadyAssigned ? "Added" : "+ Add"}
                          </button>
                        </div>;
    })}
                  </div>
                </div>
              </div>

              {
      /* Right Column: Assigned Materials List & Confirmation */
    }
              <div className="lg:col-span-2 space-y-5">
                {
      /* 1. Designated Trainer Assignment Card */
    }
                <div className="bg-white rounded-2xl border border-sibs-border shadow-xs p-5 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4 text-sibs-orange" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sibs-navy text-xs uppercase tracking-wider">
                          1. Designated L&D Trainer Assignment
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          QDS assigns designated trainer to the applicant alongside curriculum materials before dispatching
                        </p>
                      </div>
                    </div>

                    <div>
                      {selectedApp.trainerStatus === "Accepted" ? <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-green-100 text-green-800 border border-green-200 inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          <span>Accepted by Trainer ({selectedApp.trainerAcceptedBy || selectedApp.assignedTrainerName})</span>
                        </span> : selectedApp.qdsStatus === "Completed" && selectedApp.trainerStatus === "Pending Acceptance" ? <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Sent to Trainer • Awaiting Acceptance</span>
                        </span> : selectedApp.trainerStatus === "Unable to Accept" ? <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-red-100 text-red-800 border border-red-200 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          <span>Trainer Declined ({selectedApp.trainerUnableReason || "Declined"}) — Reassign</span>
                        </span> : <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pending QDS Dispatch</span>
                        </span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Select Authorized Trainer from L&D Roster:
                      </label>
                      <select
      value={selectedTrainerId}
      onChange={(e) => setSelectedTrainerId(e.target.value)}
      disabled={selectedApp.handoffStatus === "Accepted"}
      className="w-full px-3 py-2 rounded-xl border border-sibs-border bg-white text-xs font-semibold text-sibs-navy focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange outline-none disabled:bg-slate-50 disabled:text-slate-400"
    >
                        {AUTHORIZED_TRAINERS.map((t) => <option key={t.id} value={t.id}>
                            {t.name} ({t.id})
                          </option>)}
                      </select>
                    </div>

                    <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border text-xs space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Current Assigned Trainer</div>
                      <div className="font-bold text-sibs-navy">{selectedApp.assignedTrainerName || "Not Assigned"}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Trainer ID: {selectedApp.assignedTrainerId || "\u2014"} {selectedApp.trainerAssignedAt && `\u2022 Dispatched: ${selectedApp.trainerAssignedAt}`}
                      </div>
                    </div>
                  </div>
                </div>

                {
      /* 2. Assigned Materials Package Card */
    }
                <div className="bg-white rounded-2xl border border-sibs-border shadow-xs p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-sibs-orange uppercase tracking-wider block">
                        2. Training Materials Package
                      </span>
                      <h2 className="text-base font-bold text-sibs-navy mt-0.5">
                        Trainee Curriculum Package ({selectedApp.qdsMaterials?.length || 0} Items)
                      </h2>
                    </div>

                    <button
      onClick={() => setShowAddModal(true)}
      className="px-4 py-2 rounded-xl bg-sibs-navy hover:bg-sibs-navy/90 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
    >
                      <Plus className="w-4 h-4" />
                      <span>Upload / Add Custom Material</span>
                    </button>
                  </div>

                  {
      /* Trainer Material Requests Alert Card */
    }
                  {selectedApp.trainerMaterialRequests && selectedApp.trainerMaterialRequests.length > 0 && <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-sibs-navy">
                          <Send className="w-4 h-4 text-sibs-orange" />
                          <span>Trainer Material Requests ({selectedApp.trainerMaterialRequests.length})</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {selectedApp.trainerMaterialRequests.filter((r) => r.status === "Pending QDS Fulfillment").length} Pending Fulfillment
                        </span>
                      </div>

                      <div className="space-y-2">
                        {selectedApp.trainerMaterialRequests.map((req) => <div
      key={req.id}
      className="p-3 bg-white rounded-xl border border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sibs-navy text-xs">{req.materialTitle}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${req.priority === "Urgent" ? "bg-red-100 text-red-800 border border-red-200" : "bg-blue-100 text-blue-800 border border-blue-200"}`}>
                                  {req.priority}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-600">
                                  {req.category || "General"}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 italic">
                                "{req.reason}"
                              </p>
                              <div className="text-[10px] text-slate-400">
                                Requested by <strong>{req.requestedByTrainerName}</strong> on {req.requestedAt}
                              </div>
                            </div>

                            <div>
                              {req.status === "Pending QDS Fulfillment" ? <button
      type="button"
      onClick={() => handleOpenFulfillModal(req)}
      className="px-3.5 py-1.5 rounded-xl bg-sibs-orange hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors shrink-0"
    >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Fulfill Request</span>
                                </button> : <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200 flex items-center gap-1 shrink-0">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  <span>Fulfilled ({req.fulfilledBy || "QDS"})</span>
                                </span>}
                            </div>
                          </div>)}
                      </div>
                    </div>}

                  {
      /* List of Assigned Materials */
    }
                  <div className="space-y-3">
                    {!selectedApp.qdsMaterials || selectedApp.qdsMaterials.length === 0 ? <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                        <UploadCloud className="w-8 h-8 text-slate-300 mx-auto" />
                        <h4 className="font-bold text-sibs-navy text-xs">No Training Materials Assigned Yet</h4>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          Click <strong>+ Add</strong> on standard curriculum on the left, or click <strong>Upload / Add Custom Material</strong> above to assign training items.
                        </p>
                      </div> : selectedApp.qdsMaterials.map((mat, idx) => <div
      key={mat.id}
      className="p-4 rounded-xl border border-slate-200 bg-sibs-surface flex items-start justify-between gap-3 text-xs"
    >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                              {mat.type === "Approved Training Resource Link" ? <LinkIcon className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-sibs-orange" />}
                            </div>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sibs-navy text-xs">{mat.title}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-600">
                                  {mat.type}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${mat.source === "Catalog" ? "bg-purple-100 text-purple-800" : mat.source === "Approved Link" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}>
                                  {mat.source || "Catalog"}
                                </span>
                              </div>

                              {mat.description && <p className="text-[11px] text-slate-500 leading-tight">
                                  {mat.description}
                                </p>}

                              <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                                <span className="font-mono">{mat.fileOrLinkRef}</span>
                                <span>•</span>
                                <span>Assigned by {mat.assignedBy}</span>
                                <span>•</span>
                                <span>{mat.assignedAt}</span>
                              </div>
                            </div>
                          </div>

                          {selectedApp.handoffStatus !== "Accepted" && selectedApp.outcome !== "Completed Handoff" && <button
      onClick={() => handleRemoveMaterial(mat.id)}
      title="Remove Material"
      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
    >
                              <Trash2 className="w-4 h-4" />
                            </button>}
                        </div>)}
                  </div>

                  {
      /* Locked status banner if accepted */
    }
                  {selectedApp.handoffStatus === "Accepted" && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-900 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      <span>Handoff Formally Accepted by HR Operations — Training Curriculum is Locked & Immutably Preserved.</span>
                    </div>}

                  {
      /* Confirmation / Finalize & Dispatch Area */
    }
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="text-slate-500 text-[11px]">
                      {selectedApp.handoffStatus === "Accepted" ? <span className="text-green-700 font-bold flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          <span>Curriculum finalized & accepted by HR Operations</span>
                        </span> : selectedApp.qdsStatus === "Completed" && selectedApp.trainerStatus === "Accepted" ? <span className="text-green-700 font-bold flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          <span>Trainer accepted responsibility ({selectedApp.trainerAcceptedBy})</span>
                        </span> : selectedApp.qdsStatus === "Completed" ? <span className="text-blue-700 font-bold flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>Materials dispatched on {selectedApp.qdsCompletedAt} • Waiting for Trainer acceptance</span>
                        </span> : <span>Requires at least 1 assigned curriculum item before dispatching to Trainer.</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedApp.handoffStatus !== "Accepted" && selectedApp.outcome !== "Completed Handoff" && <button
      onClick={handleAssignAndSendToTrainer}
      disabled={!selectedApp.qdsMaterials || selectedApp.qdsMaterials.length === 0}
      className="px-6 py-2.5 rounded-xl font-bold text-xs shadow-xs bg-sibs-orange hover:bg-orange-600 disabled:opacity-50 text-white flex items-center gap-2 cursor-pointer transition-all"
    >
                          <Send className="w-4 h-4" />
                          <span>
                            {selectedApp.qdsStatus === "Completed" && selectedApp.trainerStatus === "Pending Acceptance" ? "Re-Send Assignment & Materials to Trainer" : "Send Assignment & Materials to Trainer"}
                          </span>
                        </button>}

                      {selectedApp.handoffStatus === "Accepted" && <button
      onClick={() => handleOpenJourney(selectedApp)}
      className="px-4 py-2 rounded-xl bg-sibs-navy hover:bg-sibs-navy/90 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
    >
                          <Sparkles className="w-3.5 h-3.5 text-sibs-orange" />
                          <span>Open 30/60/90 Journey</span>
                        </button>}
                    </div>
                  </div>
                </div>
              </div>
            </div> : <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              No applicant selected.
            </div>}
        </div>
  )}

      {
    /* Add Custom Material Modal */
  }
      {showAddModal && <div className="fixed inset-0 z-50 bg-sibs-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sibs-navy text-sm flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-sibs-orange" />
                <span>Upload / Link Training Material</span>
              </h3>
              <button
    onClick={() => setShowAddModal(false)}
    className="text-slate-400 hover:text-slate-600 text-base font-bold"
  >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualMaterial} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Material Title <span className="text-red-500">*</span>
                </label>
                <input
    type="text"
    required
    placeholder="e.g. Account Call Flow & CRM Navigation Handbook"
    value={newTitle}
    onChange={(e) => setNewTitle(e.target.value)}
    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange outline-none text-xs"
  />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Format / Type</label>
                  <select
    value={newType}
    onChange={(e) => setNewType(e.target.value)}
    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-sibs-navy outline-none text-xs"
  >
                    <option value="PDF Document">PDF Document</option>
                    <option value="PowerPoint Presentation">PowerPoint Presentation</option>
                    <option value="Word Document">Word Document</option>
                    <option value="Approved Training Resource Link">Approved Resource Link</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    {newType === "Approved Training Resource Link" ? "Resource URL" : "Simulated File Name"} <span className="text-red-500">*</span>
                  </label>
                  <input
    type="text"
    required
    placeholder={newType === "Approved Training Resource Link" ? "https://lms.internal.sibs.com/..." : "handbook_2026.pdf"}
    value={newRef}
    onChange={(e) => setNewRef(e.target.value)}
    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange outline-none text-xs"
  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Description (Optional)</label>
                <textarea
    rows={2}
    placeholder="Key instructions or scope of this training item..."
    value={newDesc}
    onChange={(e) => setNewDesc(e.target.value)}
    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange outline-none text-xs"
  />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
    type="button"
    onClick={() => setShowAddModal(false)}
    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
  >
                  Cancel
                </button>
                <button
    type="submit"
    className="px-5 py-2 rounded-xl bg-sibs-orange hover:bg-orange-600 text-white font-bold cursor-pointer"
  >
                  Add Material to Trainee
                </button>
              </div>
            </form>
          </div>
        </div>}

      {
    /* Documented Correction Modal for Finalized Curriculum */
  }
      {showCorrectionModal && <div className="fixed inset-0 z-50 bg-sibs-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <Package className="w-5 h-5 shrink-0" />
              <span>Documented Curriculum Correction</span>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Training curriculum for <strong>{selectedApp?.fullName}</strong> has already been marked <strong>Completed</strong>. Under SiBS HRIS audit policy, modifying a finalized curriculum requires a documented operational correction reason.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
              <strong>Notice:</strong> Submitting this correction will return QDS status to <strong>In Progress</strong> and reset overall handoff readiness until materials are re-confirmed.
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                Correction Reason / Audit Justification <span className="text-red-500">*</span>
              </label>
              <textarea
    rows={3}
    required
    value={correctionReasonInput}
    onChange={(e) => setCorrectionReasonInput(e.target.value)}
    placeholder="e.g. Account curriculum updated to include new 2026 security compliance module per L&D notice..."
    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-sibs-orange focus:ring-1 focus:ring-sibs-orange outline-none text-xs"
  />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
    type="button"
    onClick={() => {
      setShowCorrectionModal(false);
      setPendingAction(null);
      setCorrectionReasonInput("");
    }}
    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
  >
                Cancel
              </button>
              <button
    type="button"
    onClick={handleConfirmCorrection}
    disabled={!correctionReasonInput.trim()}
    className="px-5 py-2 rounded-xl bg-sibs-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold cursor-pointer"
  >
                Confirm Correction & Update
              </button>
            </div>
          </div>
        </div>}

      {
    /* Fulfill Trainer Material Request Modal */
  }
      {fulfillingRequest && selectedApp && <div className="fixed inset-0 z-50 bg-sibs-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden text-xs">
            <div className="p-4 bg-sibs-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <FileCheck className="w-4 h-4 text-sibs-orange" />
                <span>Fulfill Trainer Material Request</span>
              </div>
              <button
    type="button"
    onClick={() => setFulfillingRequest(null)}
    className="text-slate-300 hover:text-white cursor-pointer"
  >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmFulfill} className="p-5 space-y-4">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-sibs-orange uppercase">Trainer Request Details</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${fulfillingRequest.priority === "Urgent" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                    {fulfillingRequest.priority} Priority
                  </span>
                </div>
                <div className="font-bold text-sibs-navy">{fulfillingRequest.materialTitle}</div>
                <p className="text-[11px] text-slate-600 italic">
                  "{fulfillingRequest.reason}"
                </p>
                <div className="text-[10px] text-slate-400">
                  Requested by {fulfillingRequest.requestedByTrainerName} for {selectedApp.fullName}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Material Title / Module Name <span className="text-red-500">*</span>
                </label>
                <input
    type="text"
    required
    value={fulfillTitle}
    onChange={(e) => setFulfillTitle(e.target.value)}
    className="w-full px-3 py-2 rounded-xl border border-sibs-border text-xs font-semibold text-sibs-navy focus:border-sibs-orange outline-none"
  />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Material Type</label>
                <select
    value={fulfillType}
    onChange={(e) => setFulfillType(e.target.value)}
    className="w-full px-3 py-2 rounded-xl border border-sibs-border text-xs font-semibold text-sibs-navy bg-white focus:border-sibs-orange outline-none"
  >
                  <option value="PDF Document">PDF Document (.pdf)</option>
                  <option value="PowerPoint Presentation">PowerPoint Presentation (.pptx)</option>
                  <option value="Word Document">Word Document (.docx)</option>
                  <option value="Approved Training Resource Link">Approved Web Portal Link (URL)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Filename Reference or Approved Web Link <span className="text-red-500">*</span>
                </label>
                <input
    type="text"
    required
    value={fulfillRef}
    onChange={(e) => setFulfillRef(e.target.value)}
    placeholder="e.g. Disputed_Transactions_SOP_2026.pdf or https://..."
    className="w-full px-3 py-2 rounded-xl border border-sibs-border text-xs font-mono text-sibs-navy focus:border-sibs-orange outline-none"
  />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Curriculum Description & Learning Objective</label>
                <textarea
    rows={2}
    value={fulfillDesc}
    onChange={(e) => setFulfillDesc(e.target.value)}
    placeholder="e.g. Standard operating procedures for handling disputed transactions in fintech customer accounts."
    className="w-full p-2.5 rounded-xl border border-sibs-border text-xs focus:border-sibs-orange outline-none"
  />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
    type="button"
    onClick={() => setFulfillingRequest(null)}
    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
  >
                  Cancel
                </button>
                <button
    type="submit"
    disabled={!fulfillTitle.trim() || !fulfillRef.trim()}
    className="px-5 py-2 rounded-xl bg-sibs-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
  >
                  <FileCheck className="w-4 h-4" />
                  <span>Fulfill & Attach Material to Trainee</span>
                </button>
              </div>
            </form>
          </div>
        </div>}

      {
    /* Employee Journey Drawer */
  }
      {drawerJourney && <EmployeeJourneyDrawer
    journey={drawerJourney}
    isOpen={isJourneyDrawerOpen}
    onClose={() => setIsJourneyDrawerOpen(false)}
  />}
    </div>;
}
export {
  NHOQDSDashboard as default
};
