import {
  Clock3,
  FileText,
  Send,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { useOffers } from "../../../services/context/OffersContext";

const TONES = {
  navy: {
    label: "text-[#667085]",
    value: "text-[#042C51]",
    icon: "bg-[#E9F0FC] text-[#042C51]",
  },
  amber: {
    label: "text-amber-600",
    value: "text-amber-700",
    icon: "bg-amber-50 text-amber-700",
  },
  green: {
    label: "text-emerald-600",
    value: "text-emerald-700",
    icon: "bg-emerald-50 text-emerald-700",
  },
  blue: {
    label: "text-blue-600",
    value: "text-blue-700",
    icon: "bg-blue-50 text-blue-700",
  },
  red: {
    label: "text-red-600",
    value: "text-red-700",
    icon: "bg-red-50 text-red-700",
  },
};

function StatCard({ title, value, icon, description, tone = "navy" }) {
  const classes = TONES[tone] || TONES.navy;
  const IconComponent = icon;

  return (
    <article className="sibs-metric-card overflow-hidden">
      <div className="flex h-full items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-[10px] font-extrabold uppercase tracking-normal ${classes.label}`}
          >
            {title}
          </p>
          <p
            className={`mt-2.5 truncate text-[30px] font-extrabold leading-none tabular-nums tracking-normal ${classes.value}`}
          >
            {value ?? 0}
          </p>
          <p className="mt-1.5 line-clamp-2 text-xs font-bold leading-4 text-[#667085]">
            {description}
          </p>
        </div>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${classes.icon}`}
        >
          <IconComponent size={17} strokeWidth={2} />
        </span>
      </div>
    </article>
  );
}

export default function OfferSummaryCards() {
  const { stats = {} } = useOffers();

  return (
    <section
      className="sibs-profile-tab-panel"
      aria-labelledby="offer-summary-title"
      style={{ animationDelay: "60ms" }}
    >

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Total Offers"
          value={stats.total}
          icon={FileText}
          description="Offer records"
        />
        <StatCard
          title="For Review"
          value={stats.forReview}
          icon={Clock3}
          description="Needs approval"
          tone="amber"
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={ShieldCheck}
          description="Ready to send"
          tone="green"
        />
        <StatCard
          title="Contract Sent"
          value={stats.contractSent}
          icon={Send}
          description="Awaiting response"
          tone="blue"
        />
        <StatCard
          title="Accepted"
          value={stats.accepted}
          icon={UserCheck}
          description={`${stats.acceptanceRate ?? 0}% rate`}
          tone="green"
        />
        <StatCard
          title="Declined"
          value={stats.declined}
          icon={UserX}
          description="With reasons"
          tone="red"
        />
      </div>
    </section>
  );
}
