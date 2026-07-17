import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  ListChecks,
} from "lucide-react";
import SummaryCard from "./SummaryCard.jsx";

export default function WeeklyReportsStats({ stats }) {
  return (
    <section
      className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
      style={{ animationDelay: "60ms" }}
    >
      <h2 className="text-base font-bold text-[#101828]">
        Weekly Reports Summary
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <SummaryCard
          title="Reports"
          value={stats.totalReports}
          icon={FileText}
          description="Weekly reports created"
          delay={0}
        />

        <SummaryCard
          title="Generated"
          value={stats.generated}
          icon={Clock3}
          description="Pending send"
          valueClassName="text-blue-600"
          iconClassName="bg-blue-50 text-blue-600"
          delay={60}
        />

        <SummaryCard
          title="Sent"
          value={stats.sent}
          icon={CheckCircle2}
          description="Already distributed"
          valueClassName="text-emerald-600"
          iconClassName="bg-emerald-50 text-emerald-600"
          delay={120}
        />

        <SummaryCard
          title="Archived"
          value={stats.archived}
          icon={ClipboardList}
          description="Historical reports"
          delay={180}
        />

        <SummaryCard
          title="Action Items"
          value={stats.current?.actionItemsCount || 0}
          icon={ListChecks}
          description="Current week actions"
          valueClassName="text-amber-600"
          iconClassName="bg-amber-50 text-amber-600"
          delay={240}
        />

        <SummaryCard
          title="Missing Data"
          value={stats.current?.missingDataCount || 0}
          icon={AlertTriangle}
          description="Needs explanation"
          valueClassName="text-red-600"
          iconClassName="bg-red-50 text-red-600"
          delay={300}
        />
      </div>
    </section>
  );
}
