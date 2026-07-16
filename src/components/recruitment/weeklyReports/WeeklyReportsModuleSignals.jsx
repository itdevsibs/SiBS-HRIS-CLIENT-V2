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

export default function WeeklyReportsModuleSignals({ items }) {
  return (
    <section
      className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
      style={{ animationDelay: "240ms" }}
    >
      <h2 className="text-base font-bold text-[#101828]">
        Recruitment Module Signals
      </h2>

      <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
        These values are pulled from other recruitment module local records.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => (
          <ModuleSignalCard
            key={item.title}
            item={{ ...item, icon: ICONS[item.iconKey] || ListChecks }}
            delay={index * 60}
          />
        ))}
      </div>
    </section>
  );
}
