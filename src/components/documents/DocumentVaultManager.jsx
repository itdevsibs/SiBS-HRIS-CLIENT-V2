import { useState } from "react";
import { FileText, FolderLock, ShieldCheck } from "lucide-react";

export default function DocumentVaultManager({
  title = "Document Vault Manager",
  description = "Manage general and pre-employment documents in one place.",
  otherFilesCount = 0,
  preEmploymentCount = 0,
  defaultSection = "other",
  renderOtherFiles,
  renderPreEmploymentFiles,
}) {
  const [activeSection, setActiveSection] = useState(defaultSection);

  const cards = [
    {
      id: "other",
      title: "Other Files",
      description:
        "Resume, audio recordings, assessments, certificates, and supporting attachments.",
      count: otherFilesCount,
      icon: FileText,
    },
    {
      id: "pre-employment",
      title: "Pre-Employment Files",
      description:
        "Major requirements, other requirements, and previous-employment documents.",
      count: preEmploymentCount,
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="rounded-2xl border border-[#D9E2EC] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-6 flex items-start gap-3 border-b border-[#E6ECF2] pb-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E9F0FC] text-sibs-primary-1">
          <FolderLock size={20} />
        </span>

        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-[#101828]">{title}</h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
            {description}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          const active = activeSection === card.id;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveSection(card.id)}
              className={`h-full w-full min-w-0 rounded-2xl border p-5 text-left transition ${
                active
                  ? "border-sibs-primary-1 bg-sibs-primary-1 text-white shadow-md"
                  : "border-[#D9E2EC] bg-white text-sibs-primary-1 hover:border-sibs-primary-1/40 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    active
                      ? "bg-white/10 text-[#FF9C73]"
                      : "bg-[#E9F0FC] text-sibs-primary-1"
                  }`}
                >
                  <Icon size={19} />
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${
                    active
                      ? "bg-white/10 text-white"
                      : "bg-[#F2F4F7] text-[#52637A]"
                  }`}
                >
                  {card.count} uploaded
                </span>
              </div>

              <h3 className="mt-4 text-sm font-extrabold">{card.title}</h3>
              <p
                className={`mt-1 text-[10px] font-semibold leading-4 ${
                  active ? "text-white/70" : "text-[#667085]"
                }`}
              >
                {card.description}
              </p>
            </button>
          );
        })}
      </div>

      {activeSection === "pre-employment"
        ? renderPreEmploymentFiles?.()
        : renderOtherFiles?.()}
    </section>
  );
}
