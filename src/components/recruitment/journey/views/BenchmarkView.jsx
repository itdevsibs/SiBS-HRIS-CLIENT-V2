/* eslint-disable react-hooks/preserve-manual-memoization, no-unused-vars */
import { useState, useMemo } from "react";
import { useJourney } from "../JourneyContext";
import { MetricCard, MetricGrid } from "@/components/ui";
import {
  AlertTriangle, Award, CheckCircle2, Clock3, Users
} from "lucide-react";
const SCORE_WEIGHTS = {
  "Training Assessment": 0.35,
  "QA Audit": 0.4,
  "Work Simulation": 0.25
};
function BenchmarkView({ onOpenLinkModal, onSwitchModule, summaryOnly = false }) {
  const {
    journeys,
    phaseTrainingScores,
    evidence,
    attendance,
    assignments,
    progress,
    coachingActions,
    simulatedCurrentDate,
    setSimulatedCurrentDate,
    setSelectedJourney,
    pendingDay30HandoffsCount
  } = useJourney();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState("All accounts");
  const [selectedTrainer, setSelectedTrainer] = useState("All trainers");
  const [selectedSite, setSelectedSite] = useState("All sites");
  const [selectedRisk, setSelectedRisk] = useState("all");
  const [showOnlyHandoffDue, setShowOnlyHandoffDue] = useState(false);
  const [inspectedEmpId, setInspectedEmpId] = useState("SIBS-2904");
  const [inspectedDay, setInspectedDay] = useState(90);
  const dayOffset = (dateStr, numDays) => {
    const d = /* @__PURE__ */ new Date(dateStr + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + numDays);
    return d.toISOString().slice(0, 10);
  };
  const dateLabel = (dStr) => {
    if (!dStr) return "\u2014";
    return (/* @__PURE__ */ new Date(dStr + "T12:00:00")).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const getBenchmarkRecord = (e, day) => {
    const hire = e.hireDate || e.startDate || "2026-09-01";
    const start = day === 30 ? dayOffset(hire, 0) : dayOffset(hire, day - 30);
    const end = dayOffset(hire, day - 1);
    const eligible = end <= simulatedCurrentDate;
    const fstScoreObj = phaseTrainingScores.find((s) => (s.emp === e.sibsEmployeeId || s.emp === e.id) && s.phase === "FST");
    const pstScoreObj = phaseTrainingScores.find((s) => (s.emp === e.sibsEmployeeId || s.emp === e.id) && s.phase === "PST");
    const nestingQa = e.day30?.nestingQaScore;
    const qaEvid = evidence.filter((ev) => (ev.emp === e.sibsEmployeeId || ev.emp === e.id) && ev.type === "QDS / QA");
    const qaScore = qaEvid.length > 0 ? Math.round(qaEvid.reduce((acc, ev) => acc + (ev.score || 85), 0) / qaEvid.length) : nestingQa ?? null;
    const trScore = day === 30 ? fstScoreObj?.score ?? nestingQa ?? null : day === 60 ? pstScoreObj?.score ?? fstScoreObj?.score ?? null : fstScoreObj && pstScoreObj ? Math.round((fstScoreObj.score + pstScoreObj.score) / 2) : pstScoreObj?.score ?? fstScoreObj?.score ?? null;
    const simScore = day === 60 ? e.day60?.coreProductionScore ?? null : day === 90 ? e.day90?.compositeScore ?? null : null;
    const validScores = [trScore, qaScore, simScore].filter((s) => s !== null);
    const composite = eligible && validScores.length > 0 ? trScore !== null && qaScore !== null && simScore !== null ? Math.round(trScore * 0.35 + qaScore * 0.4 + simScore * 0.25) : Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : null;
    const attRecords = attendance.filter((a) => a.emp === e.sibsEmployeeId || a.emp === e.id);
    let present = 0, late = 0, absent = 0, excused = 0, unrecorded = 0, totalWorkdays = 0;
    for (let cur = start; cur <= end && cur <= simulatedCurrentDate; cur = dayOffset(cur, 1)) {
      const w = (/* @__PURE__ */ new Date(cur + "T12:00:00Z")).getUTCDay();
      if (w === 0 || w === 6) continue;
      totalWorkdays++;
      const match = attRecords.find((a) => a.date === cur);
      const st = match?.status || "Unrecorded";
      if (st === "Present") present++;
      else if (st === "Late") late++;
      else if (st === "Absent") absent++;
      else if (st === "Excused") excused++;
      else unrecorded++;
    }
    const covered = present + late + absent + excused;
    const coverage = totalWorkdays ? Math.round(100 * covered / totalWorkdays) : null;
    const attRate = covered ? Math.round(100 * (present + late) / covered) : null;
    const phaseAssigns = assignments.filter((a) => (a.emp === e.sibsEmployeeId || a.emp === e.id) && a.date >= start && a.date <= end);
    const verifiedAssigns = phaseAssigns.filter((a) => {
      const p = progress.find((pr) => (pr.emp === e.sibsEmployeeId || pr.emp === e.id) && pr.assignmentId === a.id);
      return p?.status === "Verified";
    }).length;
    const rev = e.reviews?.[day];
    const reviewStatus = !eligible ? "Upcoming" : rev ? day === 90 ? e.acknowledged ? "Acknowledged" : "Manager submitted" : rev.hr ? "HR confirmed" : "Awaiting HR" : "Review pending";
    return {
      day,
      start,
      end,
      eligible,
      composite,
      trScore,
      qaScore,
      simScore,
      fstScore: fstScoreObj?.score ?? null,
      pstScore: pstScoreObj?.score ?? null,
      attRate,
      coverage,
      covered,
      totalWorkdays,
      absent,
      excused,
      late,
      unrecorded,
      phaseAssignsCount: phaseAssigns.length,
      verifiedAssigns,
      reviewStatus,
      gap: trScore - qaScore
    };
  };
  const accounts = ["All accounts", ...Array.from(new Set(journeys.map((j) => j.account).filter(Boolean)))];
  const trainers = ["All trainers", ...Array.from(new Set(journeys.map((j) => j.trainerName).filter(Boolean)))];
  const sites = ["All sites", ...Array.from(new Set(journeys.map((j) => j.siteLocation).filter(Boolean)))];
  const visibleJourneys = useMemo(() => {
    return journeys.filter((j) => {
      if (showOnlyHandoffDue) {
        const days = j.daysElapsed || 1;
        const handoff = j.day30Handoff || j.day30?.handoff;
        if (days < 20 || handoff && handoff.status === "Accepted") {
          return false;
        }
      }
      const term = searchQuery.toLowerCase().trim();
      const matchesSearch = !term || j.fullName.toLowerCase().includes(term) || (j.sibsEmployeeId || "").toLowerCase().includes(term) || (j.kronosId || "").toLowerCase().includes(term) || j.account.toLowerCase().includes(term) || j.siteLocation.toLowerCase().includes(term) || (j.trainerName || "").toLowerCase().includes(term);
      const matchesAccount = selectedAccount === "All accounts" || j.account === selectedAccount;
      const matchesTrainer = selectedTrainer === "All trainers" || j.trainerName === selectedTrainer;
      const matchesSite = selectedSite === "All sites" || j.siteLocation === selectedSite;
      let matchesRisk = true;
      if (selectedRisk !== "all") {
        const daysToCheck = selectedPhaseFilter === "all" ? [30, 60, 90] : [Number(selectedPhaseFilter)];
        const records = daysToCheck.map((d) => getBenchmarkRecord(j, d)).filter((r) => r.eligible);
        if (selectedRisk === "missing") {
          matchesRisk = records.some((r) => r.composite === null);
        } else if (selectedRisk === "high") {
          matchesRisk = records.some((r) => r.composite !== null && r.composite >= 85);
        } else if (selectedRisk === "developing") {
          matchesRisk = records.some((r) => r.composite !== null && r.composite >= 70 && r.composite < 85);
        } else if (selectedRisk === "low") {
          matchesRisk = records.some((r) => r.composite !== null && r.composite < 70);
        }
      }
      return matchesSearch && matchesAccount && matchesTrainer && matchesSite && matchesRisk;
    });
  }, [journeys, searchQuery, selectedPhaseFilter, selectedAccount, selectedTrainer, selectedSite, selectedRisk, showOnlyHandoffDue, simulatedCurrentDate]);
  const getAggregates = (day) => {
    const records = visibleJourneys.map((j) => getBenchmarkRecord(j, day));
    const eligible = records.filter((r) => r.eligible);
    const complete = eligible.filter((r) => r.composite !== null);
    const meanComp = complete.length ? Math.round(complete.reduce((s, r) => s + (r.composite || 0), 0) / complete.length) : null;
    const qaRecords = eligible.filter((r) => r.qaScore !== null && r.qaScore !== void 0 && !isNaN(r.qaScore));
    const meanQA = qaRecords.length ? Math.round(qaRecords.reduce((s, r) => s + Number(r.qaScore), 0) / qaRecords.length) : null;
    const attEligible = eligible.filter((r) => r.attRate !== null && !isNaN(r.attRate));
    const meanAtt = attEligible.length ? Math.round(attEligible.reduce((s, r) => s + (r.attRate || 0), 0) / attEligible.length) : null;
    const highCount = complete.filter((r) => (r.composite || 0) >= 85).length;
    const lowCount = complete.filter((r) => (r.composite || 0) < 70).length;
    const totalAbsent = eligible.reduce((s, r) => s + r.absent, 0);
    const totalExcused = eligible.reduce((s, r) => s + r.excused, 0);
    const totalUnrecorded = eligible.reduce((s, r) => s + r.unrecorded, 0);
    return { day, eligibleCount: eligible.length, completeCount: complete.length, meanComp, meanQA, meanAtt, highCount, lowCount, totalAbsent, totalExcused, totalUnrecorded };
  };
  const agg30 = getAggregates(30);
  const agg60 = getAggregates(60);
  const agg90 = getAggregates(90);
  const totalScored = agg30.completeCount + agg60.completeCount + agg90.completeCount;
  const totalDue = agg30.eligibleCount + agg60.eligibleCount + agg90.eligibleCount;
  const totalLow = agg30.lowCount + agg60.lowCount + agg90.lowCount;
  const inspectedJourney = journeys.find((j) => (j.sibsEmployeeId || j.id) === inspectedEmpId) || visibleJourneys[0] || journeys[0];
  const inspectedRecord = inspectedJourney ? getBenchmarkRecord(inspectedJourney, inspectedDay) : null;
  const scoreCategoryTone = (val) => {
    if (val === null) return "sibs-tone-blue-bg sibs-tone-blue-text border border-blue-200";
    if (val >= 85) return "sibs-tone-green-bg sibs-tone-green-text border sibs-tone-green-border";
    if (val >= 70) return "sibs-tone-amber-bg sibs-tone-amber-text border sibs-tone-amber-border";
    return "sibs-tone-red-bg sibs-tone-red-text border sibs-tone-red-border";
  };
  const columns = selectedPhaseFilter === "all" ? [30, 60, 90] : [Number(selectedPhaseFilter)];
  if (summaryOnly) return <MetricGrid columns={5}>
    <MetricCard title="Trainees in View" value={visibleJourneys.length} description="Active cohort trainees" icon={Users} tone="navy" />
    <MetricCard title="Completed Scorecards" value={`${totalScored} / ${totalDue}`} description="Trainer + QA + TL combined" icon={CheckCircle2} tone="green" />
    <MetricCard title="Needs Support" value={totalLow} description="Scorecards below 70% benchmark" icon={AlertTriangle} tone="red" />
    <MetricCard title="Pending Scorecards" value={totalDue - totalScored} description="Due results lacking inputs" icon={Clock3} tone="amber" />
    <MetricCard title="Day 30 TL Handoffs" value={pendingDay30HandoffsCount} description="Trainer → TL transition needed" badge={pendingDay30HandoffsCount > 0 ? "Action Due" : undefined} icon={Award} tone="orange" className={pendingDay30HandoffsCount > 0 ? "border-sibs-orange bg-sibs-cream-light" : ""} />
  </MetricGrid>;
  return <div className="space-y-6">


      {
    /* HR Urgent Notification Alert Banner for Day 30 Trainer -> Team Leader Handoff */
  }
      {pendingDay30HandoffsCount > 0 && <div className="bg-gradient-to-r from-orange-50 via-amber-50/60 to-white border-l-4 border-[#FF5C28] border-y border-r border-[#E6ECF2] rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 text-[#FF5C28] flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-[#FF5C28]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-[#FF5C28] text-white">
                  HR Action Required
                </span>
                <h3 className="text-sm font-black text-[#042C51]">
                  Post-FST Employee Custody Handoff: Trainer → Team Leader Transition ({pendingDay30HandoffsCount} Pending)
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Trainees completing Fundamental Skill Training (FST Days 1–14) must receive formal Trainer readiness endorsement and Team Leader acceptance before transitioning into Product Skills Training (PST Days 15–28). Review pending handoffs below.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
    type="button"
    onClick={() => setShowOnlyHandoffDue((prev) => !prev)}
    className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs ${showOnlyHandoffDue ? "bg-[#042C51] text-white hover:bg-[#083a69]" : "bg-[#FF5C28] text-white hover:bg-[#e04f20]"}`}
  >
              {showOnlyHandoffDue ? "Show All Cohort Trainees" : `Filter Handoffs Due (${pendingDay30HandoffsCount})`}
            </button>
          </div>
        </div>}



      {
    /* 30–60–90 Milestone Benchmark Summary Cards */
  }
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-[#042C51]">30–60–90 Milestone Benchmark</h2>
            <p className="text-xs text-slate-500">Each milestone uses scores recorded within that phase only. Day 30 emphasizes FST + PST results.</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold sibs-tone-blue-bg sibs-tone-blue-text border sibs-tone-blue-border">
            Sample data • {visibleJourneys.length} trainees
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {[agg30, agg60, agg90].filter((a) => selectedPhaseFilter === "all" || String(a.day) === selectedPhaseFilter).map((a) => <div key={a.day} className="bg-white border border-[#E6ECF2] rounded-xl p-3.5 sm:p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#042C51]">Day {a.day} Benchmark{a.day === 30 ? " \u2022 FST + PST" : ""}</h3>
                  <span className="text-[9.5px] font-bold sibs-tone-blue-bg sibs-tone-blue-text border sibs-tone-blue-border px-2 py-0.5 rounded-full">
                    {a.eligibleCount} reached milestone
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <strong className="text-2xl font-black tabular-nums text-[#042C51]">
                    {a.meanComp === null ? "\u2014" : a.meanComp + "%"}
                  </strong>
                  <span className="text-[11px] text-slate-500 font-semibold">{a.completeCount} scorecards</span>
                </div>

                <div className="w-full h-1.5 bg-[#E6EAF0] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#042C51] to-[#FF5C28] rounded-full" style={{ width: `${a.meanComp || 0}%` }} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                  <div className="p-2 bg-[#F7F9FC] border border-[#E6ECF2] rounded-lg">
                    <span className="text-[9.5px] font-semibold text-slate-500 block">Independent QA</span>
                    <strong className="text-sm font-bold text-[#042C51] block mt-0.5">{a.meanQA === null ? "N/A" : a.meanQA + "%"}</strong>
                  </div>
                  <div className="p-2 bg-[#F7F9FC] border border-[#E6ECF2] rounded-lg">
                    <span className="text-[9.5px] font-semibold text-slate-500 block">Attendance*</span>
                    <strong className="text-sm font-bold text-[#042C51] block mt-0.5">{a.meanAtt === null ? "N/A" : a.meanAtt + "%"}</strong>
                  </div>
                  <div className="p-2 bg-[#F7F9FC] border border-[#E6ECF2] rounded-lg">
                    <span className="text-[9.5px] font-semibold text-slate-500 block">High performers</span>
                    <strong className="text-sm font-bold text-emerald-600 block mt-0.5">{a.highCount} / {a.completeCount}</strong>
                  </div>
                  <div className="p-2 bg-[#F7F9FC] border border-[#E6ECF2] rounded-lg">
                    <span className="text-[9.5px] font-semibold text-slate-500 block">Need support</span>
                    <strong className="text-sm font-bold text-rose-600 block mt-0.5">{a.lowCount} / {a.completeCount}</strong>
                  </div>
                </div>

                <p className="text-[9.5px] text-slate-400 truncate">
                  {a.totalAbsent} absences • {a.totalExcused} excused • {a.totalUnrecorded} missing records
                </p>
              </div>)}
        </div>
      </div>



      {
    /* Trainee Checkpoint Drill-Down Inspection Card */
  }
      {inspectedJourney && inspectedRecord && <div id="benchmark-detail" className="bg-white rounded-xl border border-[#E6ECF2] p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-[#FF5C28] tracking-widest block">TRAINEE CHECKPOINT DRILL-DOWN</span>
              <h2 className="text-base font-extrabold text-[#042C51]">
                {inspectedJourney.fullName} — Day {inspectedDay}{inspectedDay === 30 ? " (FST + PST)" : ""}
              </h2>
              <p className="text-xs text-slate-500">
                {inspectedJourney.sibsEmployeeId || inspectedJourney.id} • {inspectedJourney.account} • {inspectedJourney.siteLocation} • Trainer: {inspectedJourney.trainerName || "Unassigned"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${inspectedRecord.reviewStatus === "HR confirmed" ? "sibs-tone-green-bg sibs-tone-green-text border sibs-tone-green-border" : "sibs-tone-amber-bg sibs-tone-amber-text border sibs-tone-amber-border"}`}>
                {inspectedRecord.reviewStatus}
              </span>

              <button
    type="button"
    onClick={() => setSelectedJourney(inspectedJourney)}
    className="px-3.5 py-1.5 rounded-xl bg-[#FF5C28] hover:bg-[#e04f20] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
  >
                Open 30/60/90 Review
              </button>
            </div>
          </div>

          {
    /* 4 Drilldown KPI Cards */
  }
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-[#E6ECF2] bg-[#F7F9FC]">
              <span className="text-[10px] text-slate-500 font-bold block">Phase Performance Score</span>
              <strong className="text-xl font-black text-[#042C51] my-0.5 block">
                {inspectedRecord.composite === null ? "N/A" : inspectedRecord.composite + "%"}
              </strong>
              <p className="text-[10px] text-slate-500">
                {inspectedRecord.composite === null ? "Three independent inputs required" : scoreCategoryTone(inspectedRecord.composite)}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-[#E6ECF2] bg-[#F7F9FC]">
              <span className="text-[10px] text-slate-500 font-bold block">Trainer / QA / Simulation</span>
              <strong className="text-xl font-black text-[#042C51] my-0.5 block">
                {inspectedRecord.trScore}% / {inspectedRecord.qaScore}% / {inspectedRecord.simScore}%
              </strong>
              <p className="text-[10px] text-slate-500">
                {inspectedRecord.gap >= 15 ? "Scoring discrepancy requires review" : "Scores recorded separately by owner"}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-[#E6ECF2] bg-[#F7F9FC]">
              <span className="text-[10px] text-slate-500 font-bold block">Attendance / Record Coverage</span>
              <strong className="text-xl font-black text-[#042C51] my-0.5 block">
                {inspectedRecord.attRate === null ? "N/A" : inspectedRecord.attRate + "%"}{" "}
                <span className="text-xs font-semibold text-slate-500">({inspectedRecord.coverage ?? 0}% covered)</span>
              </strong>
              <p className="text-[10px] text-slate-500">
                {inspectedRecord.absent} absent • {inspectedRecord.excused} excused • {inspectedRecord.late} late
              </p>
            </div>

            <div className="p-3 rounded-xl border border-[#E6ECF2] bg-[#F7F9FC]">
              <span className="text-[10px] text-slate-500 font-bold block">Training Activities</span>
              <strong className="text-xl font-black text-[#042C51] my-0.5 block">
                {inspectedRecord.verifiedAssigns} / {inspectedRecord.phaseAssignsCount} verified
              </strong>
              <p className="text-[10px] text-slate-500">
                Owner-verified completion in phase
              </p>
            </div>
          </div>

          {
    /* Day 30 FST & PST breakdown bars if Day 30 */
  }
          {inspectedDay === 30 && <div className="p-3.5 rounded-xl border border-[#E6ECF2] bg-[#F7F9FC] space-y-2">
              <strong className="text-xs font-bold text-[#042C51] block">First 30 days: FST and PST assessments (separate sample evidence)</strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>FST assessment</span>
                    <span className="text-[#042C51]">{inspectedRecord.fstScore !== null ? inspectedRecord.fstScore + "%" : "Not scored"}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E6EAF0] rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-[#042C51] rounded-full" style={{ width: `${inspectedRecord.fstScore || 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>PST assessment</span>
                    <span className="text-[#FF5C28]">{inspectedRecord.pstScore !== null ? inspectedRecord.pstScore + "%" : "Not scored"}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E6EAF0] rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-[#FF5C28] rounded-full" style={{ width: `${inspectedRecord.pstScore || 0}%` }} />
                  </div>
                </div>
              </div>
            </div>}

          {
    /* Evidence and Checkpoint Details */
  }
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100 text-xs">
            <div>
              <h3 className="font-extrabold text-[#042C51] mb-2">Phase Evidence</h3>
              <p className="text-[11px] text-slate-500 mb-2.5">{dateLabel(inspectedRecord.start)} – {dateLabel(inspectedRecord.end)}</p>

              <div className="space-y-1.5">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-slate-700">Training Assessment</span>
                  <span className="text-slate-600">{inspectedRecord.trScore}% • {inspectedJourney.trainerName || "Trainer"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-slate-700">Independent QA Audit</span>
                  <span className="text-slate-600">{inspectedRecord.qaScore}% • {inspectedJourney.qa || "QA Lead"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-slate-700">Work Simulation</span>
                  <span className="text-slate-600">{inspectedRecord.simScore}% • {inspectedJourney.tl || "Team Leader"}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-extrabold text-[#042C51] mb-2">Checkpoint & Development</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-slate-700">HR Checkpoint</span>
                  <span className="font-bold text-[#042C51]">{inspectedRecord.reviewStatus}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-slate-700">Open Coaching Actions</span>
                  <span className="font-bold text-slate-700">
                    {coachingActions.filter((a) => (a.emp === inspectedJourney.sibsEmployeeId || a.emp === inspectedJourney.id) && a.status !== "Done").length}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                Attendance is contextual evidence and is not weighted into performance composite. Missing records never count as absences. Final employment decisions remain with HR.
              </p>
            </div>
          </div>
        </div>}
    </div>;
}
export {
  BenchmarkView as default
};
