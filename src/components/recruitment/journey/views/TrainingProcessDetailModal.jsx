import { useState } from "react";
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  Check,
  Printer,
  BookOpen,
  Target
} from "lucide-react";
import { ModalShell, MetricCard, MetricGrid } from "@/components/ui";
function TrainingProcessDetailModal({
  isOpen,
  onClose,
  processType,
  journey,
  scoreVal,
  evaluatorName,
  items
}) {
  const [activeTab, setActiveTab] = useState("syllabus");
  if (!isOpen) return null;
  const isFST = processType === "FST";
  const phaseTitle = isFST ? "FST \u2014 Fundamental Skill Training" : "PST \u2014 Product Skills Training";
  const phaseTimeline = isFST ? "Phase 1 \u2022 Days 1\u201314" : "Phase 2 \u2022 Days 15\u201328";
  const brandColor = isFST ? "var(--color-sibs-navy, #042c51)" : "var(--color-sibs-orange, #ff5c28)";
  const displayScore = scoreVal !== null ? `${scoreVal}%` : "Not Scored";
  const isPassed = scoreVal !== null && scoreVal >= 80;
  const fullCurriculum = isFST ? [
    {
      id: 8103,
      module: "Module 1: Communication & Active Listening",
      title: "Communication Role Play & Scenario Execution",
      category: "Customer Communication",
      weight: "30%",
      score: items.find((i) => i.id === 8103)?.score ?? 85,
      maxScore: 100,
      passingScore: 80,
      evaluator: evaluatorName || "Maria Cruz",
      completionDate: "Day 6 \u2022 Verified",
      status: "Passed",
      notes: "Demonstrates high empathy, warm conversational tone, and proactive clarifying questions. Excellent pacing under timed scenarios."
    },
    {
      id: 8104,
      module: "Module 2: Compliance & Information Security",
      title: "Data Privacy & Compliance Assessment",
      category: "Information Security",
      weight: "25%",
      score: items.find((i) => i.id === 8104)?.score ?? 41,
      maxScore: 50,
      passingScore: 40,
      evaluator: evaluatorName || "Maria Cruz",
      completionDate: "Day 9 \u2022 Verified",
      status: "Passed",
      notes: "Achieved 41/50 (82%). Fully compliant with Republic Act 10173 (DPA), customer credential masking, and zero data leakage standards."
    },
    {
      id: 8107,
      module: "Module 3: Systems & Keyboard Dexterity",
      title: "Dual-Screen Navigation & Typing Proficiency Drill",
      category: "Technical Tooling",
      weight: "20%",
      score: 88,
      maxScore: 100,
      passingScore: 75,
      evaluator: evaluatorName || "Maria Cruz",
      completionDate: "Day 12 \u2022 Verified",
      status: "Passed",
      notes: "44 WPM with 98.2% typing accuracy. Fluent multi-tab navigation between internal knowledgebase and ticketing scratchpad."
    },
    {
      id: 8108,
      module: "Module 4: Professional Conduct & Attendance",
      title: "Workplace Standards & Punctuality Assessment",
      category: "HR Operations",
      weight: "25%",
      score: 95,
      maxScore: 100,
      passingScore: 85,
      evaluator: evaluatorName || "Maria Cruz",
      completionDate: "Day 14 \u2022 Verified",
      status: "Passed",
      notes: "100% attendance adherence during Phase 1. Zero tardiness or unplanned absences logged in Kronos."
    }
  ] : [
    {
      id: 8101,
      module: "Module 1: Account Knowledge & Regulations",
      title: "US Visa Process Knowledge Quiz",
      category: "Domain Expertise",
      weight: "30%",
      score: items.find((i) => i.id === 8101)?.score ?? 86,
      maxScore: 100,
      passingScore: 80,
      evaluator: evaluatorName || "Maria Cruz",
      completionDate: "Day 19 \u2022 Verified",
      status: "Passed",
      notes: "Exemplary grasp of DS-160 application lifecycles, interview appointment scheduling rules, and consular document tiers."
    },
    {
      id: 8102,
      module: "Module 2: CRM & Workflow Systems",
      title: "System Navigation & Appointment Booking Practical",
      category: "Technical Systems",
      weight: "30%",
      score: items.find((i) => i.id === 8102)?.score ?? 89,
      maxScore: 100,
      passingScore: 80,
      evaluator: evaluatorName || "Maria Cruz",
      completionDate: "Day 23 \u2022 Verified",
      status: "Passed",
      notes: "Completed test case booking in 210 seconds (target: < 300s). Accurate applicant record lookups and disposition tagging."
    },
    {
      id: 8105,
      module: "Module 3: Live Case Simulations",
      title: "Mock Call Handling & Exception Escalation",
      category: "Voice Simulation",
      weight: "25%",
      score: 84,
      maxScore: 100,
      passingScore: 80,
      evaluator: journey.tl || "Anton Reyes",
      completionDate: "Day 26 \u2022 Verified",
      status: "Passed",
      notes: "Successfully handled expedited visa request scenarios and emergency appointment routing while maintaining calm composure."
    },
    {
      id: 8109,
      module: "Module 4: Quality & Compliance Audit",
      title: "Independent Quality Assurance Pre-Nesting Audit",
      category: "Quality Assurance",
      weight: "15%",
      score: 88,
      maxScore: 100,
      passingScore: 80,
      evaluator: journey.qa || "Elena Santos",
      completionDate: "Day 28 \u2022 Verified",
      status: "Passed",
      notes: "Zero fatal errors detected. 100% adherence to mandatory greeting, identity verification, and recording disclosures."
    }
  ];
  const competencies = isFST ? [
    { name: "Verbal Communication & Call Control", level: 85, benchmark: 80, description: "Professional vocabulary, active listening, clear pacing without filler words." },
    { name: "Empathy & Positive Framing", level: 88, benchmark: 80, description: "Validating customer concerns and presenting reassuring solutions." },
    { name: "Compliance & Security (PII Protection)", level: 92, benchmark: 85, description: "Strict zero-tolerance adherence to data masking and account privacy." },
    { name: "Systems Aptitude & Multitasking", level: 86, benchmark: 75, description: "Rapid information retrieval across CRM and policy guidelines." },
    { name: "Attendance & Schedule Adherence", level: 98, benchmark: 95, description: "Punctuality, shift logging, and proactive break management." }
  ] : [
    { name: "Account Product Mastery (US Visa)", level: 86, benchmark: 80, description: "Knowledge of visa categories, consular fee procedures, and forms." },
    { name: "CRM Tool & Schedule Engine Proficiency", level: 89, benchmark: 80, description: "Error-free entry into official appointment database and ticket management." },
    { name: "De-escalation & Urgent Exception Handling", level: 84, benchmark: 80, description: "Managing distressed applicants seeking expedited emergency slots." },
    { name: "Documentation & Disposition Accuracy", level: 90, benchmark: 80, description: "Precise case tagging, timestamping, and comprehensive shift notes." },
    { name: "Independent QA Standard Compliance", level: 88, benchmark: 85, description: "Zero fatal compliance breaches and consistent script compliance." }
  ];
  const handlePrint = () => {
    window.print();
  };
  return <ModalShell
    open={isOpen}
    onClose={onClose}
    variant="navy"
    maxWidth="max-w-4xl"
    zIndex="z-[10020]"
    icon={isFST ? BookOpen : Award}
    title={phaseTitle + " — Full Process View"}
    badge={phaseTimeline}
    subtitle={journey.fullName + " • " + (journey.sibsEmployeeId || journey.id) + " • " + journey.account}
    bodyClassName="p-0 flex flex-col bg-sibs-surface"
    footerMeta={<p className="sibs-text-xs text-sibs-muted">{phaseTimeline} records are permanent audit artifacts under SiBS HRIS Talent Governance.</p>}
    footer={<>
      <button type="button" onClick={handlePrint} className="sibs-modal-btn-secondary"><Printer size={14} />Print Audit</button>
      <button type="button" onClick={onClose} className="sibs-modal-btn-secondary">Close Full View</button>
    </>}
  >
        {
    /* KPI Strip */
  }
        <div className="bg-sibs-surface border-b border-sibs-border p-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="p-3 bg-white rounded-xl border border-sibs-border shadow-2xs">
            <span className="text-[10px] font-bold text-sibs-muted uppercase tracking-wider block">Phase Score</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <strong className="text-xl font-black" style={{ color: brandColor }}>
                {displayScore}
              </strong>
              <span className="text-[10px] text-sibs-faint font-semibold">/ 80% Min</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-sibs-border shadow-2xs">
            <span className="text-[10px] font-bold text-sibs-muted uppercase tracking-wider block">Process Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <strong className="text-xs font-black text-emerald-700">
                {isPassed ? "Completed & Passed" : "Completed"}
              </strong>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-sibs-border shadow-2xs">
            <span className="text-[10px] font-bold text-sibs-muted uppercase tracking-wider block">Lead Evaluator</span>
            <strong className="text-xs font-black text-sibs-navy mt-1 block truncate">
              {evaluatorName || (isFST ? "Maria Cruz" : "Anton Reyes")}
            </strong>
          </div>

          <div className="p-3 bg-white rounded-xl border border-sibs-border shadow-2xs">
            <span className="text-[10px] font-bold text-sibs-muted uppercase tracking-wider block">Next Gate</span>
            <strong className="text-xs font-black text-sibs-navy mt-1 block truncate">
              {isFST ? "Phase 2 (PST) Transition" : "Day 30 Operations Handoff"}
            </strong>
          </div>
        </div>

        {
    /* Tab Selection */
  }
        <div className="px-6 pt-3 border-b border-sibs-border bg-white flex items-center gap-2 shrink-0">
          <button
    type="button"
    onClick={() => setActiveTab("syllabus")}
    className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "syllabus" ? "border-sibs-orange text-sibs-navy" : "border-transparent text-sibs-muted hover:text-sibs-navy"}`}
  >
            <BookOpen size={14} className={activeTab === "syllabus" ? "text-sibs-orange" : ""} />
            <span>Curriculum Modules &amp; Practicals ({fullCurriculum.length})</span>
          </button>
          <button
    type="button"
    onClick={() => setActiveTab("rubric")}
    className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "rubric" ? "border-sibs-orange text-sibs-navy" : "border-transparent text-sibs-muted hover:text-sibs-navy"}`}
  >
            <Target size={14} className={activeTab === "rubric" ? "text-sibs-orange" : ""} />
            <span>Competency Rubric &amp; Benchmarks</span>
          </button>
          <button
    type="button"
    onClick={() => setActiveTab("endorsement")}
    className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "endorsement" ? "border-sibs-orange text-sibs-navy" : "border-transparent text-sibs-muted hover:text-sibs-navy"}`}
  >
            <ShieldCheck size={14} className={activeTab === "endorsement" ? "text-sibs-orange" : ""} />
            <span>Audit &amp; Trainer Endorsement</span>
          </button>
        </div>

        {
    /* Training detail content */
  }
        <div className="p-4 sm:p-5 space-y-4">

          {
    /* TAB 1: CURRICULUM SYLLABUS & PRACTICALS */
  }
          {activeTab === "syllabus" && <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-sibs-navy">
                    {isFST ? "Fundamental Skills Modules & Practical Assessments" : "Product Skills Curriculum & Workflow Practicals"}
                  </h4>
                  <p className="text-xs text-sibs-muted mt-0.5">
                    Individual module grades, weighted contributions, evaluator remarks, and completion records.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  All 4 Modules Completed
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-sibs-border shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sibs-navy text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Module &amp; Practical Assessment</th>
                      <th className="py-2.5 px-3 font-bold">Category</th>
                      <th className="py-2.5 px-3 font-bold text-center">Weight</th>
                      <th className="py-2.5 px-3 font-bold text-center">Score / Max</th>
                      <th className="py-2.5 px-3 font-bold text-center">Target</th>
                      <th className="py-2.5 px-3 font-bold">Evaluator</th>
                      <th className="py-2.5 px-3 font-bold">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sibs-border bg-white">
                    {fullCurriculum.map((m) => <tr key={m.id} className="hover:bg-sibs-surface/80 transition-colors">
                        <td className="py-3 px-3">
                          <strong className="text-sibs-navy block text-[12px]">{m.title}</strong>
                          <span className="text-[10px] text-sibs-faint block">{m.module}</span>
                          <p className="text-[10.5px] text-sibs-secondary mt-1 italic font-normal">
                            "{m.notes}"
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-sibs-navy">
                            {m.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-sibs-secondary">
                          {m.weight}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <strong className="text-sm font-black text-sibs-navy">
                            {m.score}
                          </strong>
                          <span className="text-[10px] text-sibs-faint block">/ {m.maxScore}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-sibs-muted">
                          ≥ {m.passingScore}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-sibs-navy block">{m.evaluator}</span>
                          <span className="text-[10px] text-sibs-faint">{m.completionDate}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            <Check size={11} className="text-emerald-700" />
                            {m.status}
                          </span>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              {
    /* Phase Score Summary Box */
  }
              <div className="p-4 rounded-xl bg-sibs-surface border border-sibs-border flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-sibs-navy">
                      Weighted Phase Composite: <span className="font-black text-sm" style={{ color: brandColor }}>{displayScore}</span>
                    </h5>
                    <p className="text-[11px] text-sibs-muted">
                      Calculated from all {fullCurriculum.length} core training assessments. Minimum benchmark requirement: 80.0%.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    Phase Benchmark Satisfied
                  </span>
                </div>
              </div>
            </div>}

          {
    /* TAB 2: COMPETENCY RUBRIC */
  }
          {activeTab === "rubric" && <div className="space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-sibs-navy">
                  Competency Dimensions &amp; Behavior Matrix
                </h4>
                <p className="text-xs text-sibs-muted mt-0.5">
                  Detailed evaluation of core behavioural and technical proficiencies demonstrated during {phaseTimeline}.
                </p>
              </div>

              <div className="space-y-3">
                {competencies.map((comp, idx) => <div key={idx} className="p-4 rounded-xl bg-white border border-sibs-border shadow-2xs">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <div>
                        <strong className="text-xs font-black text-sibs-navy">{comp.name}</strong>
                        <p className="text-[11px] text-sibs-muted mt-0.5">{comp.description}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <strong className="text-sm font-black" style={{ color: brandColor }}>{comp.level}%</strong>
                        <span className="text-[10px] text-sibs-faint block font-medium">Target: ≥ {comp.benchmark}%</span>
                      </div>
                    </div>

                    {
    /* Bar */
  }
                    <div className="w-full h-2 bg-[#E6EAF0] rounded-full overflow-hidden mt-2">
                      <div
    className="h-full rounded-full transition-all duration-500"
    style={{
      width: `${comp.level}%`,
      backgroundColor: brandColor
    }}
  />
                    </div>
                  </div>)}
              </div>
            </div>}

          {
    /* TAB 3: AUDIT & ENDORSEMENT */
  }
          {activeTab === "endorsement" && <div className="space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-sibs-navy">
                  Trainer Audit Sign-off &amp; Formal Recommendation
                </h4>
                <p className="text-xs text-sibs-muted mt-0.5">
                  Official verification signed by the training leadership certifying floor and curriculum compliance.
                </p>
              </div>

              {
    /* Endorsement Statement Card */
  }
              <div className="p-5 rounded-xl border border-sibs-border bg-sibs-surface space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sibs-navy text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-sibs-orange" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-sibs-navy uppercase tracking-wider">
                      Official Evaluator Sign-off
                    </h5>
                    <p className="text-xs text-sibs-navy mt-1.5 leading-relaxed font-medium">
                      {isFST ? <>
                          "Trainee <strong>{journey.fullName}</strong> ({journey.sibsEmployeeId || journey.id}) has successfully met all Fundamental Skill Training requirements across Days 1 through 14. Verbal communication and empathy scoring exceeded expectations at 85%, and information security assessment was passed with zero compliance alerts. Full clearance is granted for Phase 2: Product Skills Training (PST)."
                        </> : <>
                          "Trainee <strong>{journey.fullName}</strong> ({journey.sibsEmployeeId || journey.id}) has demonstrated mastery of the <strong>{journey.account}</strong> program workflow requirements during Days 15 through 28. Navigation practical test results (89%) and independent quality audit (88%) confirm immediate readiness for floor transition. Endorsed for formal Day 30 handoff to Team Leader {journey.tl || "Anton Reyes"}."
                        </>}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-sibs-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-sibs-faint font-bold uppercase block">Certified By</span>
                    <strong className="text-sibs-navy font-bold">{evaluatorName || (isFST ? "Maria Cruz" : "Anton Reyes")}</strong>
                    <span className="text-[10px] text-sibs-muted block">{isFST ? "Senior Foundation Trainer" : "Operational Team Leader"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-sibs-faint font-bold uppercase block">Verification Date</span>
                    <strong className="text-sibs-navy font-bold">{isFST ? "2026-09-28" : "2026-10-14"}</strong>
                    <span className="text-[10px] text-sibs-muted block">Digital Signature Logged</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-sibs-faint font-bold uppercase block">Audit Status</span>
                    <span className="inline-flex items-center gap-1 font-black text-emerald-700">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      Compliant &amp; Approved
                    </span>
                  </div>
                </div>
              </div>

              {
    /* Prerequisite Checklist */
  }
              <div className="p-4 rounded-xl border border-sibs-border bg-white space-y-2">
                <span className="text-[10.5px] font-bold text-sibs-muted uppercase tracking-wider block">
                  Phase Gate Checklist
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-sibs-navy">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Completed 100% of required classroom modules and interactive practicals</span>
                  </div>
                  <div className="flex items-center gap-2 text-sibs-navy">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Composite phase score of {displayScore} satisfies or exceeds minimum passing standard (80.0%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sibs-navy">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>No unresolved data privacy or zero-tolerance compliance infractions recorded</span>
                  </div>
                  <div className="flex items-center gap-2 text-sibs-navy">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Attendance records verified in Kronos without unexcused absences</span>
                  </div>
                </div>
              </div>
            </div>}

        </div>

  </ModalShell>;
}
export {
  TrainingProcessDetailModal as default
};
