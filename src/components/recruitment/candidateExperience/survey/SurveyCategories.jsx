import { Check } from "lucide-react";
import { EXPERIENCE_CATEGORIES } from "@/lib/utils/candidateExperience/index.js";

export default function SurveyCategories({ value = [], onChange }) {
  const selectedList = Array.isArray(value)
    ? value
    : typeof value === "string" && value.trim()
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  function toggleCategory(category) {
    if (selectedList.includes(category)) {
      const next = selectedList.filter((item) => item !== category);
      onChange?.(next);
    } else {
      const next = [...selectedList, category];
      onChange?.(next);
    }
  }

  return (
    <section className="font-jakarta">
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#042C51]">
          EXPERIENCE CATEGORIES (SELECT ALL THAT APPLY) *
        </h3>
        <span className="text-[10px] font-bold text-slate-500">
          {selectedList.length > 0
            ? `${selectedList.length} selected`
            : "Select one or more topics"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {EXPERIENCE_CATEGORIES.map((category) => {
          const isSelected = selectedList.includes(category);

          return (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-xs font-extrabold transition-all duration-150 ${
                isSelected
                  ? "border-[#042C51] bg-[#042C51] text-white shadow-sm ring-2 ring-[#042C51]/20"
                  : "border-[#E6ECF2] bg-[#F8FAFC] text-slate-700 hover:border-[#D0D5DD] hover:bg-slate-100"
              }`}
            >
              <span className="truncate pr-2">{category}</span>
              {isSelected ? (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#FF5C28] text-white shadow-xs">
                  <Check size={13} strokeWidth={3} />
                </span>
              ) : (
                <span className="h-5 w-5 shrink-0 rounded-md border border-[#D0D5DD] bg-white transition hover:border-[#FF5C28]" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
