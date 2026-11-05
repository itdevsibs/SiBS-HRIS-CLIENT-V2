/* eslint-disable no-unused-vars */
import { useState, useMemo } from "react";
import { useJourney } from "../JourneyContext";
import { addCalendarDays } from "../traineeCalendarUtils";
import {
  Calendar as CalendarIcon,
  Filter,
  Layers,
  Search,
  Zap,
  ArrowUpRight,
  ChevronDown
} from "lucide-react";
import DayActivityDetailModal from "./DayActivityDetailModal";
function DailyPerformanceCalendarView({
  journey,
  onOpenCoachingModal,
  onClose
}) {
  const {
    checkIns,
    attendance,
    assignments,
    evidence,
    esepSessions,
    phaseTrainingScores,
    simulatedCurrentDate
  } = useJourney();
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState("all");
  const [selectedViewMode, setSelectedViewMode] = useState("calendar");
  const [activeMonthIndex, setActiveMonthIndex] = useState(0);
  const [selectedModalDayRecord, setSelectedModalDayRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const startDate = journey.startDate || journey.hireDate || "2026-09-01";
  const trainerName = journey.trainerName || "Maria Cruz";
  const tlName = journey.tl || "Anton Reyes";
  const qaName = journey.qa || "Elena Santos";
  const managerName = journey.manager || "Paolo Vega";
  const allDaysData = useMemo(() => {
    const days = [];
    const empCoaching = esepSessions.filter((s) => s.emp === journey.sibsEmployeeId || s.emp === journey.id);
    for (let day = 1; day <= 90; day++) {
      const dateStr = addCalendarDays(startDate, day - 1);
      const dateObj = /* @__PURE__ */ new Date(dateStr + "T12:00:00Z");
      const dayOfWeekShort = dateObj.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
      const formattedDateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
      const isWeekend = dayOfWeekShort === "Sat" || dayOfWeekShort === "Sun";
      const isElapsed = day <= (journey.daysElapsed || 1) || dateStr <= simulatedCurrentDate;
      const isCurrentDay = dateStr === simulatedCurrentDate || day === journey.daysElapsed;
      let phaseId = "fst";
      let phaseName = "FST \u2014 Fundamental Skill Training";
      let phaseCode = "FST";
      let phaseRange = "Days 1\u201314";
      let supervisoryOwner = `${trainerName} (Lead Trainer)`;
      if (day >= 1 && day <= 14) {
        phaseId = "fst";
        phaseName = "FST \u2014 Fundamental Skill Training";
        phaseCode = "FST";
        phaseRange = "Days 1\u201314";
        supervisoryOwner = `${trainerName} (Lead Trainer)`;
      } else if (day >= 15 && day <= 28) {
        phaseId = "pst";
        phaseName = "PST \u2014 Product Skills Training";
        phaseCode = "PST";
        phaseRange = "Days 15\u201328";
        supervisoryOwner = `${trainerName} & ${tlName} (Team Leader)`;
      } else if (day >= 29 && day <= 30) {
        phaseId = "day30";
        phaseName = "Day 30 Nesting & Custody Handoff";
        phaseCode = "Day 30";
        phaseRange = "Days 29\u201330";
        supervisoryOwner = `${trainerName} (Trainer) \u2794 ${tlName} (TL)`;
      } else if (day >= 31 && day <= 59) {
        phaseId = "ramp";
        phaseName = "Supported Operations & Live Ramp";
        phaseCode = "Ramp";
        phaseRange = "Days 31\u201359";
        supervisoryOwner = `${tlName} (Team Leader)`;
      } else if (day === 60) {
        phaseId = "day60";
        phaseName = "Day 60 Mid-Probation Appraisal";
        phaseCode = "Day 60";
        phaseRange = "Day 60";
        supervisoryOwner = `${tlName} (TL) & ${managerName} (SOM)`;
      } else if (day >= 61 && day <= 89) {
        phaseId = "consistency";
        phaseName = "Performance Consistency & Autonomy";
        phaseCode = "Consistency";
        phaseRange = "Days 61\u201389";
        supervisoryOwner = `${tlName} (Team Leader)`;
      } else {
        phaseId = "day90";
        phaseName = "Day 90 Regularization Assessment";
        phaseCode = "Day 90";
        phaseRange = "Day 90";
        supervisoryOwner = `${managerName} (SOM) & HR Operations`;
      }
      let checkInTitle = `Day ${day} Daily Check-In`;
      let checkInType = "Trainer 1:1";
      let facilitator = trainerName;
      let facilitatorRole = "Lead Trainer";
      let topic = "Fundamental communication competencies";
      let notes = "Participated actively in role-play drills. Demonstrated clear articulation and positive customer tone.";
      let actionItem = "Practice open-ended questioning technique during partner simulation.";
      let confidenceScore = 4;
      let checkInStatus = isElapsed ? "Completed" : "Scheduled";
      if (isWeekend) {
        checkInTitle = "Scheduled Rest Day";
        checkInType = "Rest Day";
        facilitator = "System Automation";
        facilitatorRole = "WFM Scheduling";
        topic = "Rest Day \u2022 Shift Rest Interval";
        notes = "No scheduled operational training or shift requirement.";
        actionItem = "Review training materials if desired; prepare for next scheduled operational shift.";
        confidenceScore = 5;
      } else if (day === 1) {
        checkInTitle = "Orientation & Day 1 Induction Check-In";
        topic = "Company Mission, Values, & Training Code of Conduct";
        notes = "Trainee arrived promptly. Account credentials, ID, and training handbook issued. High enthusiasm demonstrated.";
        actionItem = "Complete compliance e-learning module by end of week.";
        confidenceScore = 5;
      } else if (day === 2) {
        checkInTitle = "Communication Principles & Active Listening";
        topic = "Active Listening & Paraphrasing Techniques";
        notes = "Practiced customer acknowledgment scripts. Trainee exhibits great vocal tone and natural empathy.";
        actionItem = "Refine transition statements between probing and problem verification.";
        confidenceScore = 4;
      } else if (day === 8) {
        checkInTitle = "Data Privacy & Information Security Check-In";
        topic = "Strict Non-Disclosure, PII Safeguards, & Clean Desk Policy";
        notes = "Reviewed US Visa privacy stipulations and Zero-Tolerance PII guidelines. Trainee acknowledged policy.";
        actionItem = "Apply screen-locking discipline whenever stepping away from workstation.";
        confidenceScore = 5;
      } else if (day === 14) {
        checkInTitle = "FST Phase Culmination & Gate Review";
        topic = "Fundamental Skill Training Final Assessment & Readiness Sign-off";
        notes = "Scored 84% on FST Practical Assessment. Fully cleared for Product Skills Training (PST).";
        actionItem = "Begin pre-reading US Visa intake manual ahead of Day 15 PST launch.";
        confidenceScore = 4;
      } else if (day === 15) {
        checkInTitle = "PST Product Induction & System Setup";
        facilitatorRole = "Product Trainer";
        topic = "US Visa Program Architecture & Case Categories";
        notes = "Navigated production sandboxes smoothly. Grasped core eligibility criteria and document verification steps.";
        actionItem = "Memorize the top 5 visa category processing requirements.";
        confidenceScore = 4;
      } else if (day === 28) {
        checkInTitle = "PST Certification & Nesting Wrap-Up";
        topic = "Comprehensive Product Exam & Nesting Quality Validation";
        notes = "Completed PST exam with 91% composite score. Quality standards validated. Ready for Day 30 formal handoff.";
        actionItem = "Prepare operational ramp goals and meet receiving Team Leader Anton Reyes.";
        confidenceScore = 5;
      } else if (day === 30) {
        checkInTitle = "Day 30 Formal Handoff 1-on-1 Touchpoint";
        checkInType = "Handoff Calibration";
        facilitator = `${trainerName} & ${tlName}`;
        facilitatorRole = "Trainer & Team Leader";
        topic = "Custody Transfer & Live Floor Transition Review";
        notes = "Trainer Maria Cruz endorsed Marco Santos with 'Floor Ready' designation. Anton Reyes confirmed acceptance into Ramp.";
        actionItem = "Report to Workstation RW-042 at 08:00 AM for live production intake.";
        confidenceScore = 5;
      } else if (day >= 31 && day <= 59) {
        facilitator = tlName;
        facilitatorRole = "Team Leader";
        checkInType = "Team Leader 1:1";
        topic = `Ramp Floor Performance & Handle Time Management (Week ${Math.floor((day - 30) / 7) + 1})`;
        notes = "Managing live customer queues. Average handle time currently at 380s. Documentation accuracy consistently high.";
        actionItem = "Focus on multi-tab CRM efficiency to reduce hold duration.";
        confidenceScore = 4;
      } else if (day === 60) {
        checkInTitle = "Day 60 Mid-Probation Evaluation Touchpoint";
        checkInType = "Milestone Review";
        facilitator = tlName;
        facilitatorRole = "Team Leader";
        topic = "Mid-Probationary Appraisal & SLA Compliance";
        notes = "Production score 89%, AHT 380s. Performance trending well above account baseline. Endorsed to continue on track.";
        actionItem = "Maintain quality consistency through Days 61\u201390 toward regularization.";
        confidenceScore = 5;
      } else if (day >= 61 && day <= 89) {
        facilitator = tlName;
        facilitatorRole = "Team Leader";
        checkInType = "Consistency 1:1";
        topic = "Autonomous Case Resolution & CSAT Drivers";
        notes = "Demonstrating seasoned agent behaviors. Zero escalations this week. Quality score steady at 91%.";
        actionItem = "Shadow newer colleagues on difficult customer verification cases.";
        confidenceScore = 5;
      } else if (day === 90) {
        checkInTitle = "Day 90 Regularization Final Appraisal";
        checkInType = "Appraisal Sign-Off";
        facilitator = managerName;
        facilitatorRole = "Senior Operations Manager";
        topic = "Probationary Completion & Regularization Endorsement";
        notes = "Composite score 91%. Exceptional attendance (98.5%) and strong team citizenship. Recommended for Regularization.";
        actionItem = "Sign official Regularization Employment Agreement with HR.";
        confidenceScore = 5;
      }
      const hasCoachingOnDay = empCoaching.some((s) => s.date === dateStr) || day === 42 && empCoaching.length > 0;
      const coachingId = hasCoachingOnDay ? empCoaching[0]?.id || 8201 : void 0;
      let attStatus = isWeekend ? "Rest day" : "Present";
      let punchIn = isWeekend ? void 0 : "07:54 AM";
      let punchOut = isWeekend ? void 0 : "05:02 PM";
      let adherencePercent = isWeekend ? 100 : 98.5;
      if (!isWeekend) {
        if (day === 11 || day === 37) {
          attStatus = "Late";
          punchIn = "08:12 AM";
          adherencePercent = 92;
        } else if (day === 45) {
          punchIn = "07:50 AM";
          punchOut = isCurrentDay ? void 0 : "05:05 PM";
          adherencePercent = 99;
        }
      }
      let performanceObj = {};
      if (day === 14) {
        performanceObj = { taskTitle: "FST Practical Communication Role-Play", score: 84, scoreType: "FST Practical", passingTarget: 80 };
      } else if (day === 28) {
        performanceObj = { taskTitle: "PST US Visa Process Knowledge Exam", score: 91, scoreType: "PST Exam", passingTarget: 80 };
      } else if (day === 42) {
        performanceObj = { taskTitle: "Weekly Transaction Quality Audit (PAC-24187)", score: 88, scoreType: "QA Audit", passingTarget: 85 };
      } else if (day === 60) {
        performanceObj = { taskTitle: "Mid-Probation Core Production Scorecard", score: 89, scoreType: "Ramp Production", passingTarget: 85 };
      } else if (day === 75) {
        performanceObj = { taskTitle: "Consistency QA Deep Dive Audit", score: 92, scoreType: "QA Audit", passingTarget: 85 };
      } else if (day === 90) {
        performanceObj = { taskTitle: "Day 90 Regularization Composite Score", score: 91, scoreType: "Ramp Production", passingTarget: 85 };
      } else if (!isWeekend && day % 3 === 0) {
        performanceObj = { taskTitle: `Day ${day} Quality Spot Check`, score: 86 + day % 7, scoreType: "QA Audit", passingTarget: 80 };
      }
      let milestoneEvent = void 0;
      if (day === 14) {
        milestoneEvent = { title: "FST Milestone Cleared", decision: "Passed & Endorsed to PST", authority: trainerName, isKeyMilestone: true };
      } else if (day === 28) {
        milestoneEvent = { title: "PST Certification Complete", decision: "Certified Floor Ready (91%)", authority: trainerName, isKeyMilestone: true };
      } else if (day === 30) {
        milestoneEvent = { title: "Day 30 Handoff Signed Off", decision: "Transferred to Operational Ramp", authority: tlName, isKeyMilestone: true };
      } else if (day === 60) {
        milestoneEvent = { title: "Day 60 Mid-Probation Review", decision: "Progressing Well", authority: tlName, isKeyMilestone: true };
      } else if (day === 90) {
        milestoneEvent = { title: "Day 90 Regularization Milestone", decision: "Endorsed for Regularization", authority: managerName, isKeyMilestone: true };
      }
      days.push({
        dayNumber: day,
        date: dateStr,
        formattedDate: formattedDateStr,
        dayOfWeek: dayOfWeekShort,
        isWeekend,
        phaseId,
        phaseName,
        phaseCode,
        phaseRange,
        supervisoryOwner,
        isElapsed,
        isCurrentDay,
        checkIn: {
          id: day * 10,
          title: checkInTitle,
          type: checkInType,
          facilitator,
          facilitatorRole,
          confidenceScore,
          status: checkInStatus,
          topic,
          notes,
          actionItem,
          verifiedAt: isElapsed ? `${formattedDateStr} \u2022 04:30 PM` : void 0
        },
        attendance: {
          status: attStatus,
          punchIn,
          punchOut,
          adherencePercent,
          notes: isWeekend ? "Rest Day" : "Standard 9h operational shift"
        },
        performance: performanceObj,
        milestoneEvent,
        hasCoaching: hasCoachingOnDay,
        coachingSessionId: coachingId
      });
    }
    return days;
  }, [startDate, trainerName, tlName, qaName, managerName, journey.daysElapsed, simulatedCurrentDate, journey.account, esepSessions, journey.sibsEmployeeId, journey.id]);
  const filteredDays = useMemo(() => {
    return allDaysData.filter((d) => {
      if (selectedPhaseFilter !== "all" && d.phaseId !== selectedPhaseFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return d.dayNumber.toString().includes(query) || d.formattedDate.toLowerCase().includes(query) || d.checkIn.title.toLowerCase().includes(query) || d.checkIn.topic.toLowerCase().includes(query) || d.checkIn.facilitator.toLowerCase().includes(query) || d.checkIn.notes.toLowerCase().includes(query) || d.phaseName.toLowerCase().includes(query);
      }
      return true;
    });
  }, [allDaysData, selectedPhaseFilter, searchQuery]);
  const month1Days = allDaysData.slice(0, 30);
  const month2Days = allDaysData.slice(30, 60);
  const month3Days = allDaysData.slice(60, 90);
  const currentMonthDays = activeMonthIndex === 0 ? month1Days : activeMonthIndex === 1 ? month2Days : month3Days;
  const currentMonthLabel = activeMonthIndex === 0 ? "Month 1 \u2022 Days 1 to 30 (FST, PST & Day 30 Handoff)" : activeMonthIndex === 1 ? "Month 2 \u2022 Days 31 to 60 (Ramp Operations & Day 60 Appraisal)" : "Month 3 \u2022 Days 61 to 90 (Performance Consistency & Regularization)";
  const handlePhaseFilterChange = (phaseId) => {
    setSelectedPhaseFilter(phaseId);
    if (phaseId === "fst" || phaseId === "pst" || phaseId === "day30") {
      setActiveMonthIndex(0);
    } else if (phaseId === "ramp" || phaseId === "day60") {
      setActiveMonthIndex(1);
    } else if (phaseId === "consistency" || phaseId === "day90") {
      setActiveMonthIndex(2);
    }
  };
  const displayDays = useMemo(() => {
    if (selectedPhaseFilter === "all") return currentMonthDays;
    return currentMonthDays.filter((d) => d.phaseId === selectedPhaseFilter);
  }, [currentMonthDays, selectedPhaseFilter]);
  const matchedCoachingSession = useMemo(() => {
    if (!selectedModalDayRecord) return null;
    const empSessions = esepSessions.filter((s) => s.emp === journey.sibsEmployeeId || s.emp === journey.id);
    return empSessions.find((s) => s.date === selectedModalDayRecord.date) || (selectedModalDayRecord.hasCoaching && empSessions.length > 0 ? empSessions[0] : null);
  }, [selectedModalDayRecord, esepSessions, journey]);
  return <div className="space-y-4 animate-in fade-in duration-200 w-full">
      
      {
    /* ======================================================== */
  }
      {
    /* STREAMLINED HEADER & CONTROLS STRIP (FULL WIDTH) */
  }
      {
    /* ======================================================== */
  }
      <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase text-[#FF5C28] tracking-wider">
                90-DAY PER-DAY PERFORMANCE CALENDAR
              </span>
              <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-[#042C51] text-white">
                FST ➔ Day 90
              </span>
              <span className="text-xs font-semibold text-slate-500">
                • Current: <strong className="text-[#FF5C28]">Day {journey.daysElapsed || 45} of 90</strong>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#042C51] mt-0.5">
              Daily Check-Ins, QA Audits &amp; Attendance Trajectory
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any calendar day to inspect what <strong className="text-[#042C51]">{journey.fullName}</strong> completed, including daily 1-on-1 check-ins, QA scores, Kronos attendance punches, and remedial coaching records.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {
    /* View Mode Toggle: Calendar Grid vs Detailed Feed */
  }
            <div className="flex items-center bg-[#F7F9FC] p-1 rounded-xl border border-[#BECBDA] text-xs font-bold shadow-2xs">
              <button
    type="button"
    onClick={() => setSelectedViewMode("calendar")}
    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${selectedViewMode === "calendar" ? "bg-[#042C51] text-white shadow-xs" : "text-slate-600 hover:text-[#042C51]"}`}
  >
                <CalendarIcon size={13} />
                <span>Calendar Grid</span>
              </button>
              <button
    type="button"
    onClick={() => setSelectedViewMode("feed")}
    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${selectedViewMode === "feed" ? "bg-[#042C51] text-white shadow-xs" : "text-slate-600 hover:text-[#042C51]"}`}
  >
                <Layers size={13} />
                <span>Daily Feed</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {
    /* ======================================================== */
  }
      {
    /* FULL-WIDTH EXPANDED CALENDAR GRID OR FEED */
  }
      {
    /* ======================================================== */
  }
      {selectedViewMode === "calendar" ? <div className="bg-white rounded-2xl border border-[#E6ECF2] p-5 shadow-xs space-y-4 w-full">
          {
    /* Month Navigation Tabs */
  }
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#FF5C28]">
                <CalendarIcon size={16} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-[#042C51] tracking-wider">
                  {currentMonthLabel}
                </h4>
                <span className="text-[11px] text-slate-500">
                  Click any day card below to open the complete activity &amp; performance breakdown modal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-[#F7F9FC] p-1 rounded-xl border border-[#BECBDA]">
              <button
    type="button"
    onClick={() => setActiveMonthIndex(0)}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeMonthIndex === 0 ? "bg-[#FF5C28] text-white shadow-xs" : "text-slate-600 hover:text-[#042C51]"}`}
  >
                Month 1 (Days 1–30)
              </button>
              <button
    type="button"
    onClick={() => setActiveMonthIndex(1)}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeMonthIndex === 1 ? "bg-[#FF5C28] text-white shadow-xs" : "text-slate-600 hover:text-[#042C51]"}`}
  >
                Month 2 (Days 31–60)
              </button>
              <button
    type="button"
    onClick={() => setActiveMonthIndex(2)}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeMonthIndex === 2 ? "bg-[#FF5C28] text-white shadow-xs" : "text-slate-600 hover:text-[#042C51]"}`}
  >
                Month 3 (Days 61–90)
              </button>
            </div>
          </div>

          {
    /* Phase Filter Dropdown Row (Below Month Tabs) */
  }
          <div className="flex items-center justify-between gap-3 pt-0.5 pb-2 border-b border-slate-100 flex-wrap">
            <div className="flex items-center gap-2.5">
              <label htmlFor="phase-filter-select" className="text-xs font-black uppercase text-[#042C51] tracking-wider shrink-0 flex items-center gap-1.5">
                <Filter size={13} className="text-[#FF5C28]" />
                <span>Filter Phase:</span>
              </label>
              <div className="relative inline-block text-xs font-bold">
                <select
    id="phase-filter-select"
    value={selectedPhaseFilter}
    onChange={(e) => handlePhaseFilterChange(e.target.value)}
    className="appearance-none bg-[#F7F9FC] hover:bg-white text-[#042C51] font-bold py-1.5 pl-3 pr-8 rounded-xl border border-[#BECBDA] focus:border-[#FF5C28] focus:ring-2 focus:ring-[#FF5C28]/20 focus:outline-none shadow-2xs transition-all cursor-pointer text-xs"
  >
                  <option value="all">All 90 Days (Days 1–90)</option>
                  <option value="fst">FST Fundamental (Days 1–14)</option>
                  <option value="pst">PST Product (Days 15–28)</option>
                  <option value="day30">Day 30 Handoff (Days 29–30)</option>
                  <option value="ramp">Ramp Operations (Days 31–59)</option>
                  <option value="day60">Day 60 Mid-Probation (Day 60)</option>
                  <option value="consistency">Performance Consistency (Days 61–89)</option>
                  <option value="day90">Day 90 Regularization (Day 90)</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
              {selectedPhaseFilter !== "all" && <button
    type="button"
    onClick={() => handlePhaseFilterChange("all")}
    className="text-[11px] font-bold text-[#FF5C28] hover:underline cursor-pointer transition-colors"
  >
                  Reset Filter
                </button>}
            </div>

            <span className="text-[11px] text-slate-500 font-medium">
              Showing <strong className="text-[#042C51] font-bold">{displayDays.length}</strong> of {currentMonthDays.length} days in this month view
            </span>
          </div>

          {
    /* Expanded 5-Column Calendar Grid (Full Width, Spacious Cards) */
  }
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 w-full">
            {displayDays.map((dayItem) => {
    const hasMilestone = Boolean(dayItem.milestoneEvent);
    return <div
      key={dayItem.dayNumber}
      onClick={() => setSelectedModalDayRecord(dayItem)}
      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[148px] group hover:shadow-md hover:-translate-y-0.5 ${dayItem.isCurrentDay ? "border-blue-400 bg-blue-50/40 shadow-xs hover:border-blue-500" : dayItem.isWeekend ? "border-slate-200 bg-[#FBFBFC] opacity-80 hover:opacity-100 hover:bg-white" : "border-[#E6ECF2] bg-white hover:border-[#FF5C28]"}`}
    >
                  {
      /* Top Row: Day Number, Date & Phase Pill */
    }
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-black text-[#042C51] group-hover:text-[#FF5C28] transition-colors tabular-nums">
                          Day {dayItem.dayNumber}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {dayItem.formattedDate.split(",")[0]}
                        </span>
                      </div>

                      <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase ${dayItem.phaseId === "fst" ? "bg-blue-100 text-[#042C51]" : dayItem.phaseId === "pst" ? "bg-purple-100 text-purple-900" : dayItem.phaseId === "day30" ? "bg-amber-100 text-amber-900 border border-amber-300" : dayItem.phaseId === "ramp" ? "bg-indigo-100 text-indigo-900" : dayItem.phaseId === "day60" ? "bg-emerald-100 text-emerald-900 border border-emerald-300" : dayItem.phaseId === "consistency" ? "bg-teal-100 text-teal-900" : "bg-rose-100 text-rose-900 border border-rose-300 font-black"}`}>
                        {dayItem.phaseCode}
                      </span>
                    </div>

                    {
      /* Check-In Topic Summary */
    }
                    <div className="my-1.5 space-y-0.5">
                      <strong className="text-[11px] font-bold text-[#042C51] line-clamp-1 block leading-tight">
                        {dayItem.checkIn.title.replace(" Check-in", "").replace(" Check-In", "")}
                      </strong>
                      <p className="text-[10px] text-slate-500 truncate">
                        Lead: {dayItem.checkIn.facilitator.split(" ")[0]} ({dayItem.checkIn.facilitatorRole.split(" ")[0]})
                      </p>
                    </div>

                    {
      /* Coaching Banner if active on this day */
    }
                    {dayItem.hasCoaching && <div className="my-1 px-2 py-0.5 rounded bg-orange-100 border border-orange-300 text-[#FF5C28] text-[9.5px] font-black flex items-center gap-1">
                        <Zap size={10} className="fill-[#FF5C28]" />
                        <span>GROW Coaching (ESEP-{dayItem.coachingSessionId})</span>
                      </div>}
                  </div>

                  {
      /* EMPHASIZED QA & ATTENDANCE ROW */
    }
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[9.5px] mt-1.5">
                    {
      /* Attendance Pill */
    }
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium text-[9px] uppercase">Attendance:</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold flex items-center gap-1 ${dayItem.attendance.status === "Present" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : dayItem.attendance.status === "Late" ? "bg-amber-50 text-amber-700 border border-amber-200" : dayItem.attendance.status === "Rest day" ? "bg-slate-100 text-slate-500" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dayItem.attendance.status === "Present" ? "bg-emerald-500" : dayItem.attendance.status === "Late" ? "bg-amber-500" : dayItem.attendance.status === "Rest day" ? "bg-slate-300" : "bg-red-500"}`} />
                        <span>{dayItem.attendance.status}</span>
                        {dayItem.attendance.punchIn && <span className="text-[8.5px] font-mono text-slate-400">({dayItem.attendance.punchIn})</span>}
                      </span>
                    </div>

                    {
      /* QA / Practical Score */
    }
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium text-[9px] uppercase">QA / Practical:</span>
                      {dayItem.performance.score ? <span className={`px-1.5 py-0.2 rounded font-bold font-mono ${dayItem.performance.score >= 85 ? "bg-blue-50 text-blue-900 border border-blue-200" : dayItem.performance.score >= 80 ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
                          {dayItem.performance.score}% Passed
                        </span> : <span className="text-slate-400 text-[9px]">
                          Rating: ★ {dayItem.checkIn.confidenceScore}/5
                        </span>}
                    </div>

                    {
      /* Milestone pill or Expand cue */
    }
                    <div className="flex items-center justify-between pt-0.5 text-[9px]">
                      {hasMilestone ? <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-[#FF5C28] text-white">
                          Milestone Sign-off
                        </span> : <span className="text-slate-400">
                          {dayItem.isWeekend ? "Rest interval" : "9h shift"}
                        </span>}
                      
                      <span className="text-[#FF5C28] font-bold group-hover:underline flex items-center gap-0.5">
                        <span>Details</span>
                        <ArrowUpRight size={10} />
                      </span>
                    </div>
                  </div>
                </div>;
  })}
          </div>
        </div> : (
    /* FULL-WIDTH DETAILED FEED VIEW */
    <div className="bg-white rounded-2xl border border-[#E6ECF2] p-5 shadow-xs space-y-4 w-full">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 flex-wrap">
            <div>
              <h4 className="text-xs font-black uppercase text-[#042C51] tracking-wider">
                Full 90-Day Trajectory Feed ({filteredDays.length} Days)
              </h4>
              <p className="text-[11px] text-slate-500">
                Chronological list of all daily check-ins, QA audits, and attendance records
              </p>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
      type="text"
      placeholder="Search day #, topic, coach..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#BECBDA] text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#FF5C28] bg-[#F7F9FC]"
    />
            </div>
          </div>

          <div className="space-y-3">
            {filteredDays.map((dayItem) => <div
      key={dayItem.dayNumber}
      onClick={() => setSelectedModalDayRecord(dayItem)}
      className="p-4 rounded-xl border border-[#E6ECF2] bg-[#FAFCFF] hover:bg-white hover:border-[#FF5C28] transition-all cursor-pointer shadow-xs space-y-2.5"
    >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-[#042C51] text-white tabular-nums">
                      Day {dayItem.dayNumber}
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-[#042C51]">
                        {dayItem.checkIn.title}
                      </h5>
                      <span className="text-[11px] text-slate-500">
                        {dayItem.dayOfWeek}, {dayItem.formattedDate} • {dayItem.phaseName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {
      /* Attendance Pill */
    }
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dayItem.attendance.status === "Present" ? "bg-emerald-100 text-emerald-800" : dayItem.attendance.status === "Late" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                      {dayItem.attendance.status} ({dayItem.attendance.adherencePercent}%)
                    </span>

                    {
      /* QA Score */
    }
                    {dayItem.performance.score && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 font-mono">
                        QA: {dayItem.performance.score}%
                      </span>}

                    {
      /* Coaching tag */
    }
                    {dayItem.hasCoaching && <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-100 text-[#FF5C28]">
                        GROW Coaching
                      </span>}

                    <span className="text-xs text-[#FF5C28] font-bold flex items-center gap-1">
                      <span>View</span>
                      <ArrowUpRight size={13} />
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 p-2.5 bg-white rounded-lg border border-[#E6ECF2]">
                  <p><strong>Check-In Notes:</strong> {dayItem.checkIn.notes}</p>
                  <p className="text-[#042C51] font-semibold mt-1"><strong>Action Plan:</strong> {dayItem.checkIn.actionItem}</p>
                </div>
              </div>)}
          </div>
        </div>
  )}

      {
    /* ======================================================== */
  }
      {
    /* DAY ACTIVITY DETAIL MODAL (WHEN ANY DAY IS CLICKED) */
  }
      {
    /* ======================================================== */
  }
      {selectedModalDayRecord && <DayActivityDetailModal
    isOpen={Boolean(selectedModalDayRecord)}
    onClose={() => setSelectedModalDayRecord(null)}
    dayRecord={selectedModalDayRecord}
    journey={journey}
    coachingSession={matchedCoachingSession}
    onOpenCoachingModal={(sessionId) => {
      if (onOpenCoachingModal) {
        onOpenCoachingModal(sessionId);
      }
    }}
    onPrevDay={() => {
      const prev = allDaysData.find((d) => d.dayNumber === selectedModalDayRecord.dayNumber - 1);
      if (prev) setSelectedModalDayRecord(prev);
    }}
    onNextDay={() => {
      const next = allDaysData.find((d) => d.dayNumber === selectedModalDayRecord.dayNumber + 1);
      if (next) setSelectedModalDayRecord(next);
    }}
  />}
    </div>;
}
export {
  DailyPerformanceCalendarView as default
};
