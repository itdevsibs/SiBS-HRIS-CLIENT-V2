import {
  Clock3,
  FileText,
  Send,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { useOffers } from "../../../services/context/OffersContext";

function StatCard({ title, value, icon, description, tone = "navy", delay = 0 }) {
  const IconComponent = icon;

  return (
    <article
      className="sibs-metric-card sibs-page-card-in flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
          <div>
            <p
              className={`m-0 truncate sibs-text-micro font-extrabold uppercase sibs-tone-${tone}-label`}
            >
              {title}
            </p>
            <p
              className={`font-heading mt-1.5 2xl:mt-2 text-2xl 2xl:text-3xl font-bold leading-none tabular-nums tracking-tight sibs-tone-${tone}-label`}
            >
              {value ?? 0}
            </p>
          </div>

          <p className="line-clamp-1 truncate sibs-text-micro font-bold text-[#667085]">
            {description}
          </p>
        </div>

        <span
          className={`flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full sibs-tone-${tone}-icon`}
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
      <div className="grid grid-cols-2 gap-2.5 2xl:gap-3 md:grid-cols-3 xl:grid-cols-6">
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
          delay={60}
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={ShieldCheck}
          description="Ready to send"
          tone="green"
          delay={120}
        />
        <StatCard
          title="Contract Sent"
          value={stats.contractSent}
          icon={Send}
          description="Awaiting response"
          tone="indigo"
          delay={180}
        />
        <StatCard
          title="Accepted"
          value={stats.accepted}
          icon={UserCheck}
          description={`${stats.acceptanceRate ?? 0}% rate`}
          tone="green"
          delay={240}
        />
        <StatCard
          title="Declined"
          value={stats.declined}
          icon={UserX}
          description="With reasons"
          tone="red"
          delay={300}
        />
      </div>
    </section>
  );
}
