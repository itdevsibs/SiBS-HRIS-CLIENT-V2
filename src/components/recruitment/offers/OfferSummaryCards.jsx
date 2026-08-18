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

function StatCard({ title, value, icon, description, tone = "navy", delay = 0 }) {
  const classes = TONES[tone] || TONES.navy;
  const IconComponent = icon;

  return (
    <article
      className="sibs-metric-card sibs-page-card-in flex h-[104px] 2xl:h-[116px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
          <div>
            <p
              className={`m-0 truncate sibs-text-micro font-extrabold uppercase ${classes.label}`}
            >
              {title}
            </p>
            <p
              className={`mt-1 text-2xl 2xl:text-3xl font-extrabold leading-none tabular-nums ${classes.value}`}
            >
              {value ?? 0}
            </p>
          </div>

          <p className="line-clamp-1 truncate sibs-text-micro font-bold text-[#667085]">
            {description}
          </p>
        </div>

        <span
          className={`flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full ${classes.icon}`}
        >
          <IconComponent className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
        </span>
      </div>
    </article>
  );
}

export default function OfferSummaryCards() {
  const { stats = {} } = useOffers();

  return (
    <section aria-labelledby="offer-summary-title">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          title="Total Offers"
          value={stats.total}
          icon={FileText}
          description="Offer records"
          delay={0}
        />
        <StatCard
          title="For Review"
          value={stats.forReview}
          icon={Clock3}
          description="Needs approval"
          tone="amber"
          delay={45}
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={ShieldCheck}
          description="Ready to send"
          tone="green"
          delay={90}
        />
        <StatCard
          title="Contract Sent"
          value={stats.contractSent}
          icon={Send}
          description="Awaiting response"
          tone="blue"
          delay={135}
        />
        <StatCard
          title="Accepted"
          value={stats.accepted}
          icon={UserCheck}
          description={`${stats.acceptanceRate ?? 0}% rate`}
          tone="green"
          delay={180}
        />
        <StatCard
          title="Declined"
          value={stats.declined}
          icon={UserX}
          description="With reasons"
          tone="red"
          delay={225}
        />
      </div>
    </section>
  );
}
