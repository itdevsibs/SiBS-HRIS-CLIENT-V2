import { AUTHORIZED_TRAINERS } from "./NHOContext";
const STANDARD_FST_CURRICULUM = [
  {
    dayNumber: 1,
    phase: "FST",
    weekNumber: 1,
    dayName: "Day 1",
    title: "Program Orientation, Corporate Culture & Code of Conduct",
    topics: [
      "Company History, Core Values & Workplace Ethics",
      "Employee Rights, Code of Conduct & Workplace Etiquette",
      "Attendance, Punctuality & Leave Management Protocols",
      "Introduction to Foundation Competency Scorecard"
    ],
    defaultMaterials: [
      {
        id: "mat-fst-d1-1",
        title: "SiBS Corporate Culture & Code of Conduct Guide 2026",
        type: "PDF Document",
        fileOrLinkRef: "SiBS_Corporate_Culture_Code_of_Conduct_2026.pdf",
        fileSize: "3.2 MB",
        description: "Official organizational culture handbook, employee guidelines, and ethics standards.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      },
      {
        id: "mat-fst-d1-2",
        title: "New Hire Attendance & Shift Policy Master Deck",
        type: "PowerPoint Presentation",
        fileOrLinkRef: "Attendance_Shift_Policy_Deck_2026.pptx",
        fileSize: "4.5 MB",
        description: "Workforce attendance guidelines, biometric log rules, and escalation paths.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      }
    ]
  },
  {
    dayNumber: 2,
    phase: "FST",
    weekNumber: 1,
    dayName: "Day 2",
    title: "Customer Engagement, Active Listening & Tone Calibration",
    topics: [
      "Customer Empathy Framework & Active Listening Practices",
      "Professional Tone, Inflection & Positive Language Choice",
      "De-escalation Principles for Challenging Interactions",
      "First Contact Resolution (FCR) Principles"
    ],
    defaultMaterials: [
      {
        id: "mat-fst-d2-1",
        title: "Customer Engagement & De-escalation Scripts",
        type: "Word Document",
        fileOrLinkRef: "Customer_Engagement_Scripts_2026.docx",
        fileSize: "1.9 MB",
        description: "Approved voice and chat responses for high-priority escalation scenarios.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      },
      {
        id: "mat-fst-d2-2",
        title: "Active Listening & Empathic Communication Rubric",
        type: "PDF Document",
        fileOrLinkRef: "Active_Listening_Empathy_Rubric.pdf",
        fileSize: "1.4 MB",
        description: "Speech standards, tone calibration guidelines, and audio reference samples.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      }
    ]
  },
  {
    dayNumber: 3,
    phase: "FST",
    weekNumber: 1,
    dayName: "Day 3",
    title: "Information Security, PCI-DSS & Clean Desk Standards",
    topics: [
      "Payment Card Industry Data Security Standards (PCI-DSS)",
      "Protecting Customer Personally Identifiable Information (PII)",
      "Clean Desk, Physical Security & Password Integrity Rules",
      "Phishing, Social Engineering & Security Incident Reporting"
    ],
    defaultMaterials: [
      {
        id: "mat-fst-d3-1",
        title: "Information Security, PCI-DSS & Clean Desk Standards",
        type: "PowerPoint Presentation",
        fileOrLinkRef: "Security_Compliance_Deck_2026.pptx",
        fileSize: "6.2 MB",
        description: "Mandatory regulatory security slides for floor and remote agents.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      },
      {
        id: "mat-fst-d3-2",
        title: "Floor Security & Clean Desk Compliance Checklist",
        type: "PDF Document",
        fileOrLinkRef: "Clean_Desk_Audit_Checklist.pdf",
        fileSize: "850 KB",
        description: "Daily floor inspection audit checklist and regulatory requirements.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      }
    ]
  },
  {
    dayNumber: 4,
    phase: "FST",
    weekNumber: 1,
    dayName: "Day 4",
    title: "Core Systems Navigation, Keyboard Mastery & CRM Basics",
    topics: [
      "Dual-Monitor Workplace Layout & Rapid Window Switching",
      "CRM Account Lookup, Customer Verification & Note-Taking",
      "Internal Knowledgebase Navigation & Quick-Search Techniques",
      "Typing Speed & Data Entry Accuracy Standards"
    ],
    defaultMaterials: [
      {
        id: "mat-fst-d4-1",
        title: "Core Systems Navigation & CRM Quick Reference Manual",
        type: "PDF Document",
        fileOrLinkRef: "Core_Systems_Navigation_Manual_v3.pdf",
        fileSize: "2.8 MB",
        description: "Step-by-step CRM shortcuts, ticket tagging, and account disposition guide.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      },
      {
        id: "mat-fst-d4-2",
        title: "Internal Knowledgebase Index & Troubleshooting Links",
        type: "Approved Training Resource Link",
        fileOrLinkRef: "https://kb.internal.sibs.com/foundations-portal",
        fileSize: "Web Portal",
        description: "Centralized knowledgebase articles and system troubleshooting guides.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      }
    ]
  },
  {
    dayNumber: 5,
    phase: "FST",
    weekNumber: 1,
    dayName: "Day 5",
    title: "Foundation Skills Assessment & QA Calibration",
    topics: [
      "Week 1 Comprehensive Foundation Knowledge Assessment",
      "Mock Scenario Handling & Simulated Case Study Reviews",
      "Quality Assurance (QA) Scorecard Review & Calibration",
      "Transition Roadmap from FST to Product Specific Training (PST)"
    ],
    defaultMaterials: [
      {
        id: "mat-fst-d5-1",
        title: "FST Foundation Competency Exam & Practice Questions",
        type: "PDF Document",
        fileOrLinkRef: "FST_Foundation_Competency_Exam.pdf",
        fileSize: "1.7 MB",
        description: "Written assessment questions covering culture, compliance, and systems.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      },
      {
        id: "mat-fst-d5-2",
        title: "SiBS QA Evaluation Scorecard & Rubric 2026",
        type: "PDF Document",
        fileOrLinkRef: "QA_Scorecard_Rubric_2026.pdf",
        fileSize: "2.1 MB",
        description: "Scoring parameters, non-negotiable critical fails, and coaching criteria.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      }
    ]
  }
];
const STANDARD_PST_CURRICULUM = [
  {
    dayNumber: 6,
    phase: "PST",
    weekNumber: 2,
    dayName: "Day 6",
    title: "Fintech Core Product Architecture & Account Operations",
    topics: [
      "Fintech Tier 1 & Tier 2 Product Portfolio & Account Tiers",
      "Digital Wallet Ecosystem, Card Issuance & Virtual Cards",
      "Customer Know-Your-Customer (KYC) Verification Workflows",
      "Daily Limits, Fee Structures & Transaction Types"
    ],
    defaultMaterials: [
      {
        id: "mat-pst-d6-1",
        title: "Fintech Core Product & Operations Playbook 2026",
        type: "PDF Document",
        fileOrLinkRef: "Fintech_Operations_Playbook_v5.pdf",
        fileSize: "4.8 MB",
        description: "Standard operating procedures, fintech product matrix, and transactional workflows.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      },
      {
        id: "mat-pst-d6-2",
        title: "KYC & Account Verification Workflow Diagrams",
        type: "PowerPoint Presentation",
        fileOrLinkRef: "KYC_Verification_Workflows.pptx",
        fileSize: "5.1 MB",
        description: "Visual flows for tier upgrades, identity documents, and AML screenings.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      }
    ]
  },
  {
    dayNumber: 7,
    phase: "PST",
    weekNumber: 2,
    dayName: "Day 7",
    title: "Transaction Lifecycle, Payment Disputes & Chargebacks",
    topics: [
      "End-to-End Transaction Flow (Auth, Capture, Settle, Reversal)",
      "Identifying Unauthorized Transactions & Fraud Signals",
      "Dispute Initiation, Evidence Gathering & SLA Requirements",
      "Merchant Settlement Failures & Provisional Credit Rules"
    ],
    defaultMaterials: [
      {
        id: "mat-pst-d7-1",
        title: "Transaction Dispute Matrix & Escalation Procedures",
        type: "PDF Document",
        fileOrLinkRef: "Transaction_Dispute_Matrix_2026.pdf",
        fileSize: "3.4 MB",
        description: "Dispute reason codes, card brand regulations, and chargeback timeframes.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      },
      {
        id: "mat-pst-d7-2",
        title: "Fraud Prevention & Suspicious Activity Escalation Form",
        type: "Word Document",
        fileOrLinkRef: "Fraud_Escalation_Form_Template.docx",
        fileSize: "1.2 MB",
        description: "Official form for reporting account takeover and suspicious transactions.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      }
    ]
  },
  {
    dayNumber: 8,
    phase: "PST",
    weekNumber: 2,
    dayName: "Day 8",
    title: "Enterprise Systems & Core Banking Simulation Sandbox",
    topics: [
      "Sandbox Authentication & Test Customer Profile Loading",
      "Executing Live Simulated Balance Adjustments & Holds",
      "Simulating Card Locks, Unlocks, Pin Resets & Re-issuances",
      "Handling Simulated API Latency & Downtime Fallback Procedures"
    ],
    defaultMaterials: [
      {
        id: "mat-pst-d8-1",
        title: "Enterprise Systems & Core Banking Sandbox Link",
        type: "Approved Training Resource Link",
        fileOrLinkRef: "https://sandbox.simulations.internal.sibs.com/core-banking",
        fileSize: "Web Portal",
        description: "Interactive employee training simulation environment with test customer data.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      },
      {
        id: "mat-pst-d8-2",
        title: "Core Banking Sandbox Lab Exercise Workbook",
        type: "PDF Document",
        fileOrLinkRef: "Sandbox_Lab_Exercises_v4.pdf",
        fileSize: "2.6 MB",
        description: "15 hands-on scenarios to complete in the live simulation sandbox.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      }
    ]
  },
  {
    dayNumber: 9,
    phase: "PST",
    weekNumber: 2,
    dayName: "Day 9",
    title: "Live Mock Calls, QA Calibration & Trainer 1-on-1 Coaching",
    topics: [
      "Simulated Customer Inquiries (Phone, Chat & Email Cases)",
      "Dual-Listen Sessions with Assigned Trainer",
      "Real-Time Call Calibration on Live Scoring Dimensions",
      "Individual Strength & Growth Area Coaching Plan"
    ],
    defaultMaterials: [
      {
        id: "mat-pst-d9-1",
        title: "Live Call Simulation Case Studies & Customer Personas",
        type: "PDF Document",
        fileOrLinkRef: "Live_Simulation_Case_Studies.pdf",
        fileSize: "3.9 MB",
        description: "Detailed persona backgrounds, dispute complexities, and mock customer cues.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      },
      {
        id: "mat-pst-d9-2",
        title: "Trainer 1-on-1 Coaching & Calibration Scorecard",
        type: "Word Document",
        fileOrLinkRef: "Trainer_Coaching_Calibration_Sheet.docx",
        fileSize: "1.5 MB",
        description: "Feedback template with metric benchmarks for communication and accuracy.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      }
    ]
  },
  {
    dayNumber: 10,
    phase: "PST",
    weekNumber: 2,
    dayName: "Day 10",
    title: "Final PST Certification Assessment & Nesting Hand-off",
    topics: [
      "Comprehensive Product Specific Certification Examination",
      "Final Live Scenario Assessment with Quality Assurance (QA)",
      "Nesting Readiness Clearance & Floor Workstation Verification",
      "Official Hand-off to Operations Team Leader & WFM"
    ],
    defaultMaterials: [
      {
        id: "mat-pst-d10-1",
        title: "Final PST Comprehensive Certification Exam",
        type: "PDF Document",
        fileOrLinkRef: "PST_Comprehensive_Certification_Exam.pdf",
        fileSize: "2.4 MB",
        description: "Official certification exam covering product architecture and core systems.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      },
      {
        id: "mat-pst-d10-2",
        title: "Floor Nesting Readiness Sign-Off & Checklist",
        type: "PDF Document",
        fileOrLinkRef: "Nesting_Readiness_SignOff_Checklist.pdf",
        fileSize: "1.1 MB",
        description: "Multi-departmental sign-off document confirming operational floor clearance.",
        assignedAt: "2026-10-09",
        assignedBy: "Carla Villanueva (Lead QDS)",
        source: "Catalog"
      }
    ]
  }
];
function calculateWorkingDays(startDateStr, count = 10) {
  const result = [];
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const parts = startDateStr.split("-").map(Number);
  let cur;
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    cur = new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    cur = new Date(2026, 9, 12);
  }
  while (cur.getDay() === 0 || cur.getDay() === 6) {
    cur.setDate(cur.getDate() + 1);
  }
  while (result.length < count) {
    const dayIndex = cur.getDay();
    if (dayIndex !== 0 && dayIndex !== 6) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, "0");
      const d = String(cur.getDate()).padStart(2, "0");
      result.push({
        dateStr: `${y}-${m}-${d}`,
        dayOfWeek: daysOfWeek[dayIndex]
      });
    }
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}
function generate2WeekTrainingSchedule(startDateStr = "2026-10-12", assignedTrainerId, assignedTrainerName, existingMaterials, shiftHours = "08:00 AM \u2013 05:00 PM (Default)", room = "Fintech Training Room 4A") {
  const workingDays = calculateWorkingDays(startDateStr, 10);
  const trainer = AUTHORIZED_TRAINERS.find((t) => t.id === assignedTrainerId) || AUTHORIZED_TRAINERS.find((t) => t.name === assignedTrainerName) || AUTHORIZED_TRAINERS[0];
  const tId = assignedTrainerId || trainer.id;
  const tName = assignedTrainerName || trainer.name;
  const allTemplates = [...STANDARD_FST_CURRICULUM, ...STANDARD_PST_CURRICULUM];
  return workingDays.map((wd, index) => {
    const template = allTemplates[index] || allTemplates[allTemplates.length - 1];
    const dayMaterials = [...template.defaultMaterials];
    if (existingMaterials && existingMaterials.length > 0) {
      existingMaterials.forEach((em, emIdx) => {
        if (emIdx % 10 === index) {
          if (!dayMaterials.some((m) => m.title === em.title || m.id === em.id)) {
            dayMaterials.push(em);
          }
        }
      });
    }
    return {
      dayNumber: index + 1,
      phase: template.phase,
      weekNumber: template.weekNumber,
      dayOfWeek: wd.dayOfWeek,
      date: wd.dateStr,
      title: template.title,
      topics: template.topics,
      shiftHours,
      room,
      trainerId: tId,
      trainerName: tName,
      trainerRole: template.phase === "FST" ? "Lead Foundations & Culture Coach" : "Senior PST Operations Specialist",
      materials: dayMaterials,
      status: index === 0 ? "In Progress" : index < 0 ? "Completed" : "Scheduled"
    };
  });
}
export {
  STANDARD_FST_CURRICULUM,
  STANDARD_PST_CURRICULUM,
  calculateWorkingDays,
  generate2WeekTrainingSchedule
};
