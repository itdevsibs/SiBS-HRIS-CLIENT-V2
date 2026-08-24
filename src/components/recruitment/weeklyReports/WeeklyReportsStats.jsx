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
    <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
      <SummaryCard
        title="Total Reports"
        value={stats?.totalReports || 0}
        icon={FileText}
        description="Total logged"
        tone="navy"
        delay={0}
      />

      <SummaryCard
        title="Generated"
        value={stats?.generated || 0}
        icon={Clock3}
        description="Pending send"
        tone="amber"
        delay={60}
      />

      <SummaryCard
        title="Sent"
        value={stats?.sent || 0}
        icon={CheckCircle2}
        description="Distributed"
        tone="green"
        delay={120}
      />

      <SummaryCard
        title="Archived"
        value={stats?.archived || 0}
        icon={Archive}
        description="Past logs"
        tone="indigo"
        delay={180}
      />

      <SummaryCard
        title="Action Items"
        value={current?.actionItemsCount || 0}
        icon={ListChecks}
        description="Active tasks"
        tone="orange"
        delay={240}
      />

      <SummaryCard
        title="Missing Data"
        value={current?.missingDataCount || 0}
        icon={AlertTriangle}
        description="Data alerts"
        tone="red"
        delay={300}
      />
    </section>
  );
}
