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

  return (
    <article
      className="sibs-metric-card sibs-page-card-in relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-full items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`sibs-text-micro truncate font-extrabold uppercase tracking-wide sibs-tone-${card.tone}-label`}
          >
            {card.title}
          </p>

          <p
            className={`mt-2 text-2xl font-extrabold leading-none tabular-nums 2xl:text-3xl sibs-tone-${card.tone}-label`}
          >
            {Number(value || 0).toLocaleString("en-US")}
            {card.suffix || ""}
          </p>

          <p className="mt-1.5 sibs-text-micro font-semibold text-[#667085]">
            {card.description}
          </p>
        </div>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border sibs-tone-${card.tone}-icon`}
        >
          <Icon size={16} strokeWidth={2.2} />
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
