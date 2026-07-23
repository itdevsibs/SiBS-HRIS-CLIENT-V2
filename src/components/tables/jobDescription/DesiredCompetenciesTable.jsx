import { Plus, Trash2 } from "lucide-react";
import React, { useEffect, useRef } from "react";

const proficiencyOptions = ["Average", "Proficient", "Excellent"];

const createCompetencyRow = () => ({
  id:
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  title: "",
  description: "",
  level: "",
});

function AutoGrowTextarea({ value, onChange, placeholder = "" }) {
  const textareaRef = useRef(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    resizeTextarea();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        requestAnimationFrame(resizeTextarea);
      }}
      onInput={resizeTextarea}
      placeholder={placeholder}
      className="min-h-[76px] w-full resize-none rounded-[10px] border border-sibs-tertiary-8 bg-white px-3 py-2.5 text-xs font-semibold leading-relaxed text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-sibs-primary-1/10"
    />
  );
}

const DesiredCompetenciesTable = ({ competencies = [], setCompetencies }) => {
  const handleAddRow = () => {
    setCompetencies((prev) => [...prev, createCompetencyRow()]);
  };

  const handleRemoveRow = (id) => {
    setCompetencies((prev) => prev.filter((item) => item.id !== id));
  };

  const handleChange = (id, field, value) => {
    setCompetencies((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  return (
    <div>
      <div className="overflow-hidden rounded-[10px] border border-sibs-tertiary-8 bg-white">
        <div className="hidden grid-cols-[minmax(0,1fr)_120px_120px_120px_56px] border-b border-[#E6ECF2] bg-[#F8FAFC] md:grid">
          <div className="px-3 py-3 text-[10px] font-extrabold uppercase tracking-normal text-sibs-primary-1">
            Competency for this Position
          </div>

          {proficiencyOptions.map((option) => (
            <div
              key={option}
              className="flex items-center justify-center px-3 py-3 text-[10px] font-extrabold uppercase tracking-normal text-sibs-primary-1"
            >
              {option}
            </div>
          ))}

          <div className="px-3 py-3" />
        </div>

        {competencies.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs font-semibold text-sibs-tertiary-5">
            No competencies added yet.
          </div>
        ) : (
          <div className="divide-y divide-[#E6ECF2]">
            {competencies.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_120px_120px_120px_56px]"
              >
                <div className="border-b border-[#E6ECF2] p-3 md:border-b-0 md:border-r">
                  <AutoGrowTextarea
                    value={item.description || ""}
                    onChange={(value) =>
                      handleChange(item.id, "description", value)
                    }
                    placeholder="Describe this competency..."
                  />
                </div>

                {proficiencyOptions.map((option) => (
                  <div
                    key={option}
                    className="flex items-center justify-center border-b border-[#E6ECF2] px-3 py-3 md:border-b-0 md:border-r"
                  >
                    <label className="flex cursor-pointer flex-col items-center gap-2">
                      <span className="text-xs font-semibold text-[#344054] md:hidden">
                        {option}
                      </span>

                      <input
                        type="radio"
                        name={`competency-level-${item.id}`}
                        value={option}
                        checked={item.level === option}
                        onChange={(e) =>
                          handleChange(item.id, "level", e.target.value)
                        }
                        className="h-4 w-4 accent-[var(--sibs-primary-1)]"
                      />
                    </label>
                  </div>
                ))}

                <div className="flex items-center justify-center px-2 py-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(item.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                    aria-label="Remove competency"
                    title="Remove competency"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-sibs-tertiary-8 bg-white px-4 text-xs font-extrabold text-sibs-primary-1 transition hover:border-[var(--sibs-tertiary-10)] hover:text-[var(--sibs-tertiary-10)] focus:outline-none focus:ring-4 focus:ring-sibs-tertiary-10/15"
        >
          <Plus size={18} />
          Add Competency
        </button>
      </div>
    </div>
  );
};

export default DesiredCompetenciesTable;
