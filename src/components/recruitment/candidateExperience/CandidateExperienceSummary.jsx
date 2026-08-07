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
      className={`sibs-metric-card sibs-page-card-in flex min-h-[110px] flex-col justify-between overflow-hidden p-3.5 font-jakarta ${
        featured
          ? "!border-transparent !bg-gradient-to-br !from-[#042C51] !to-[#0A467E] text-white"
          : ""
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={`min-w-0 line-clamp-2 text-[10px] font-extrabold uppercase tracking-tight ${
            featured ? "text-white" : `sibs-tone-${tone}-label`
          }`}
        >
          {title}
        </p>

        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            featured
              ? "bg-white/10 text-[#FF5C28]"
              : `sibs-tone-${tone}-icon`
          }`}
        >
          <Icon size={16} strokeWidth={2} />
        </span>
      </div>

      <div className="mt-2">
        <p
          className={`text-2xl sm:text-3xl font-extrabold leading-none tabular-nums tracking-normal ${
            featured ? "text-white" : `sibs-tone-${tone}-label`
          }`}
        >
          {value}
        </p>
        <p
          className={`mt-1.5 truncate text-xs font-bold ${
            featured ? "text-slate-200" : "text-[#667085]"
          }`}
        >
          {description}
        </p>
      </div>
    </article>
  );
}

export default function CandidateExperienceSummary({ metrics }) {
  return (
    <section className="sibs-profile-tab-panel font-jakarta" style={{ animationDelay: "60ms" }}>
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
          delay={50}
        />
        <SummaryCard
          title="Drop-offs"
          value={metrics.dropOffs || 0}
          icon={UserX}
          description="Exited candidates"
          tone="red"
          delay={100}
        />
        <SummaryCard
          title="Surveys Sent"
          value={metrics.surveysSent || 0}
          icon={MailCheck}
          description="Delivered forms"
          tone="indigo"
          delay={150}
        />
        <SummaryCard
          title="Responses"
          value={metrics.responsesReceived || 0}
          icon={MessageSquareText}
          description="Feedback received"
          tone="amber"
          delay={200}
        />
        <SummaryCard
          title="Avg. Rating"
          value={`${metrics.averageRating || "0.0"}/5`}
          icon={Star}
          description={`Pos ${metrics.positiveRatings || 0} · Low ${metrics.lowRatings || 0}`}
          tone="amber"
          delay={250}
        />
        <SummaryCard
          title="Voice of Candidate"
          value={`${metrics.responseRate || 0}%`}
          icon={Sparkles}
          description="Response health rate"
          featured
          delay={300}
        />
      </div>
    </section>
  );
}
