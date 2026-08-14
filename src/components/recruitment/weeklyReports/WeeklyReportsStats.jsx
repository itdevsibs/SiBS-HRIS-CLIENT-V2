import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock3,
  FileText,
  ListChecks,
} from "lucide-react";
import SummaryCard from "./SummaryCard.jsx";

export default function WeeklyReportsStats({ stats }) {
  const current = stats?.current || null;

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <SummaryCard
        title="Total Reports"
        value={stats?.totalReports || 0}
        icon={FileText}
        description="Weekly logs compiled"
        tone="navy"
        delay={0}
      />

      <SummaryCard
        title="Generated"
        value={stats?.generated || 0}
        icon={Clock3}
        description="Awaiting distribution"
        tone="amber"
        delay={45}
      />

      <SummaryCard
        title="Sent"
        value={stats?.sent || 0}
        icon={CheckCircle2}
        description="Distributed reports"
        tone="green"
        delay={90}
      />

      <SummaryCard
        title="Archived"
        value={stats?.archived || 0}
        icon={Archive}
        description="Historical reports"
        tone="indigo"
        delay={135}
      />

      <SummaryCard
        title="Action Items"
        value={current?.actionItemsCount || 0}
        icon={ListChecks}
        description="Active week follow-ups"
        tone="orange"
        delay={180}
      />

      <SummaryCard
        title="Missing Data"
        value={current?.missingDataCount || 0}
        icon={AlertTriangle}
        description="Requires explanation"
        tone="red"
        delay={225}
      />
    </section>
  );
}
