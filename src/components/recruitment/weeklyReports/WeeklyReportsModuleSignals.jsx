import {
  BriefcaseBusiness,
  CheckCircle2,
  Layers3,
  ListChecks,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import ModuleSignalCard from "./ModuleSignalCard.jsx";

const ICONS = {
  publicTalentPool: UsersRound,
  talentPool: UserCheck,
  hiringNeeds: BriefcaseBusiness,
  candidatePipeline: Layers3,
  offers: ShieldCheck,
  onboarding: CheckCircle2,
  actionItems: ListChecks,
};

const TONES = {
  hiringNeeds: "navy",
  candidatePipeline: "indigo",
  offers: "green",
  onboarding: "teal",
  actionItems: "orange",
  talentPool: "purple",
};

export default function WeeklyReportsModuleSignals({ items }) {
  const safeItems = Array.isArray(items) ? items : [];
  const publicTalentPool = safeItems.find((item) => item.iconKey === "publicTalentPool");

  const desiredOrder = [
    "hiringNeeds",
    "candidatePipeline",
    "offers",
    "onboarding",
    "actionItems",
    "talentPool",
  ];

  const visibleItems = desiredOrder
    .map((iconKey) => safeItems.find((item) => item.iconKey === iconKey))
    .filter(Boolean)
    .map((item) => {
      if (item.iconKey !== "talentPool" || !publicTalentPool) return item;

      return {
        ...item,
        description: `${item.description} · ${publicTalentPool.value || 0} public applicants`,
        hasRisk: item.hasRisk || publicTalentPool.hasRisk,
      };
    });

  return (
    <section
      className="font-jakarta"
      style={{ animationDelay: "240ms" }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {visibleItems.map((item, index) => (
          <ModuleSignalCard
            key={`${item.iconKey}-${item.title}`}
            item={{ ...item, icon: ICONS[item.iconKey] || ListChecks }}
            tone={TONES[item.iconKey] || "navy"}
            delay={180 + index * 45}
          />
        ))}
      </div>
    </section>
  );
}
