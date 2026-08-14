import React from "react";
import {
  CheckCircle2,
  MailCheck,
  MessageSquareText,
  Sparkles,
  Star,
  UserX,
  UsersRound,
} from "lucide-react";

function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  tone = "navy",
  delay = 0,
  featured = false,
}) {
  return (
    <article
      className={`sibs-metric-card sibs-page-card-in flex h-[104px] 2xl:h-[116px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5 font-jakarta ${
        featured
          ? "!border-transparent !bg-gradient-to-br !from-[#042C51] !to-[#0A467E] text-white"
          : ""
      }`}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
          <div>
            <p
              className={`m-0 truncate sibs-text-micro font-extrabold uppercase ${
                featured ? "text-white" : `sibs-tone-${tone}-label`
              }`}
            >
              {title}
            </p>

            <p
              className={`mt-1 text-2xl 2xl:text-3xl font-extrabold leading-none tabular-nums ${
                featured ? "text-white" : `sibs-tone-${tone}-label`
              }`}
            >
              {value}
            </p>
          </div>

          <p
            className={`line-clamp-1 truncate sibs-text-micro font-bold ${
              featured ? "text-slate-200" : "text-[#667085]"
            }`}
          >
            {description}
          </p>
        </div>

        <span
          className={`flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full ${
            featured
              ? "bg-white/10 text-[#FF5C28]"
              : `sibs-tone-${tone}-icon`
          }`}
        >
          <Icon className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
        </span>
      </div>
    </article>
  );
}

export default function CandidateExperienceSummary({ metrics }) {
  return (
    <section className="font-jakarta">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-7">
        <SummaryCard
          title="Total Cases"
          value={metrics.totalCases || 0}
          icon={UsersRound}
          description="Recorded journeys"
          tone="navy"
          delay={0}
        />
        <SummaryCard
          title="Completed"
          value={metrics.completed || 0}
          icon={CheckCircle2}
          description="Hired / Completed"
          tone="green"
          delay={45}
        />
        <SummaryCard
          title="Drop-offs"
          value={metrics.dropOffs || 0}
          icon={UserX}
          description="Exited candidates"
          tone="red"
          delay={90}
        />
        <SummaryCard
          title="Surveys Sent"
          value={metrics.surveysSent || 0}
          icon={MailCheck}
          description="Delivered forms"
          tone="indigo"
          delay={135}
        />
        <SummaryCard
          title="Responses"
          value={metrics.responsesReceived || 0}
          icon={MessageSquareText}
          description="Feedback received"
          tone="amber"
          delay={180}
        />
        <SummaryCard
          title="Avg. Rating"
          value={`${metrics.averageRating || "0.0"}/5`}
          icon={Star}
          description={`Pos ${metrics.positiveRatings || 0} · Low ${metrics.lowRatings || 0}`}
          tone="amber"
          delay={225}
        />
        <SummaryCard
          title="Voice of Candidate"
          value={`${metrics.responseRate || 0}%`}
          icon={Sparkles}
          description="Response health rate"
          featured
          delay={270}
        />
      </div>
    </section>
  );
}
