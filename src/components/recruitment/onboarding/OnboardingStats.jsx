import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  TrendingUp,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { useOnboarding } from "../../../services/context/OnboardingContext";

const cards = [
  {
    key: "total",
    title: "Total Records",
    description: "All onboarding records",
    icon: UsersRound,
    tone: "navy",
  },
  {
    key: "trueHires",
    title: "True Hires",
    description: "Reported and placed",
    icon: UserCheck,
    tone: "green",
  },
  {
    key: "pending",
    title: "Pending Start",
    description: "Awaiting start date",
    icon: Clock3,
    tone: "amber",
  },
  {
    key: "noShow",
    title: "No Show",
    description: "Did not report",
    icon: AlertTriangle,
    tone: "red",
  },
  {
    key: "withdrawals",
    title: "Withdrawal",
    description: "Pre-start drop-offs",
    icon: AlertTriangle,
    tone: "orange",
  },
  {
    key: "showRate",
    title: "Show Rate",
    description: "True hires / resolved",
    icon: TrendingUp,
    tone: "indigo",
    suffix: "%",
  },
];

function StatCard({ card, value, delay }) {
  const Icon = card.icon;
  const tone = card.tone || "navy";

  return (
    <article
      className="sibs-metric-card sibs-page-card-in flex h-[104px] 2xl:h-[116px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
          <div>
            <p
              className={`m-0 truncate sibs-text-micro font-extrabold uppercase sibs-tone-${tone}-label`}
            >
              {card.title}
            </p>

            <p
              className={`mt-1 text-2xl 2xl:text-3xl font-extrabold leading-none tabular-nums sibs-tone-${tone}-label`}
            >
              {Number(value || 0).toLocaleString("en-US")}
              {card.suffix || ""}
            </p>
          </div>

          <p className="line-clamp-1 truncate sibs-text-micro font-bold text-[#667085]">
            {card.description}
          </p>
        </div>

        <span
          className={`flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full sibs-tone-${tone}-icon`}
        >
          <Icon className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
        </span>
      </div>
    </article>
  );
}

export default function OnboardingStats() {
  const { stats = {} } = useOnboarding();

  return (
    <section
      aria-label="Onboarding Summary"
      className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6"
    >
      {cards.map((card, index) => (
        <StatCard
          key={card.key}
          card={card}
          value={stats?.[card.key]}
          delay={index * 60}
        />
      ))}
    </section>
  );
}
