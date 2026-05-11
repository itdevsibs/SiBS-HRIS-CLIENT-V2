import React from "react";
import { Check } from "lucide-react";

const proficiencyOptions = ["Average", "Proficient", "Excellent"];

function getCompetencyLevel(item) {
  if (item.level) return item.level;

  if (item.average === true || Number(item.average) === 1) return "Average";
  if (item.proficient === true || Number(item.proficient) === 1)
    return "Proficient";
  if (item.excellent === true || Number(item.excellent) === 1)
    return "Excellent";

  return "";
}

const DesiredCompetenciesViewTable = ({ competencies = [] }) => {
  if (!competencies.length) {
    return (
      <section>
        <h4 className="mb-2 text-base font-extrabold text-[#101828]">
          Desired Competencies
        </h4>

        <div className="rounded-xl border border-[#E6ECF2] bg-white px-4 py-4">
          <p className="text-sm text-sibs-tertiary-5">
            No desired competencies added.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3">
        <h4 className="text-base font-extrabold text-[#101828]">
          Desired Competencies
        </h4>

        <p className="mt-1 text-sm text-sibs-tertiary-5">
          Expected competency level required for this position.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-sm">
        <div className="hidden grid-cols-[minmax(0,1fr)_110px_110px_110px] border-b border-[#D7DEE8] bg-[#F8FAFC] md:grid">
          <div className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
            Competency for this Position
          </div>

          {proficiencyOptions.map((option) => (
            <div
              key={option}
              className="flex items-center justify-center border-l border-[#E6ECF2] px-3 py-3 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1"
            >
              {option}
            </div>
          ))}
        </div>

        <div className="divide-y divide-[#E6ECF2]">
          {competencies.map((item, index) => {
            const selectedLevel = getCompetencyLevel(item);

            return (
              <div
                key={item.id || `${item.title}-${index}`}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_110px_110px_110px]"
              >
                <div className="px-4 py-4 md:border-r md:border-[#E6ECF2]">
                  <p className="text-sm font-extrabold text-[#101828]">
                    {item.title || `Competency ${index + 1}`}
                  </p>

                  {item.description && (
                    <p className="mt-2 whitespace-pre-line text-sm font-medium leading-7 text-[#344054]">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-3 flex md:hidden">
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                      {selectedLevel || "No level selected"}
                    </span>
                  </div>
                </div>

                {proficiencyOptions.map((option) => {
                  const active = selectedLevel === option;

                  return (
                    <div
                      key={option}
                      className="hidden items-center justify-center border-l border-[#E6ECF2] px-3 py-4 md:flex"
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                          active
                            ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
                            : "border-[#D7DEE8] bg-white text-transparent"
                        }`}
                        aria-label={active ? option : undefined}
                      >
                        <Check size={15} strokeWidth={3} />
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DesiredCompetenciesViewTable;
