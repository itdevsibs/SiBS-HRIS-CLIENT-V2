import { Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";

const proficiencyOptions = ["Average", "Proficient", "Excellent"];

const DesiredCompetenciesTable = () => {
  const [competencies, setCompetencies] = useState([]);

  const handleAddRow = () => {
    setCompetencies((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: "",
        description: "",
        level: "",
      },
    ]);
  };

  const handleRemoveRow = (id) => {
    setCompetencies((prev) => prev.filter((item) => item.id !== id));
  };

  const handleChange = (id, field, value) => {
    setCompetencies((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm mt-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-[#101828]">
          Desired Competencies
        </h3>

        <p className="mt-1 text-sm text-sibs-tertiary-5">
          Define the competencies required for this position and assign the
          expected proficiency level.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D7DEE8]">
        {/* Header */}
        <div className="hidden grid-cols-[minmax(0,1fr)_120px_120px_120px_56px] border-b border-[#D7DEE8] bg-[#F8FAFC] md:grid">
          <div className="px-4 py-3 text-sm font-bold uppercase tracking-wide text-sibs-primary-1">
            Competency for this Position
          </div>
          <div className="flex items-center justify-center px-3 py-3 text-sm font-bold uppercase tracking-wide text-sibs-primary-1">
            Average
          </div>
          <div className="flex items-center justify-center px-3 py-3 text-sm font-bold uppercase tracking-wide text-sibs-primary-1">
            Proficient
          </div>
          <div className="flex items-center justify-center px-3 py-3 text-sm font-bold uppercase tracking-wide text-sibs-primary-1">
            Excellent
          </div>
          <div className="px-3 py-3" />
        </div>

        {competencies.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm font-medium text-sibs-tertiary-5">
            No competencies added yet.
          </div>
        ) : (
          <div className="divide-y divide-[#E6ECF2]">
            {competencies.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_120px_120px_120px_56px]"
              >
                {/* Left side */}
                <div className="border-b border-[#E6ECF2] p-4 md:border-b-0 md:border-r">
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-[#101828] md:hidden">
                        Competency Title
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) =>
                          handleChange(item.id, "title", e.target.value)
                        }
                        placeholder={`Competency ${index + 1} title`}
                        className="w-full rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-[#101828] md:hidden">
                        Description
                      </label>
                      <textarea
                        rows={4}
                        value={item.description}
                        onChange={(e) =>
                          handleChange(item.id, "description", e.target.value)
                        }
                        placeholder="Describe this competency..."
                        className="w-full resize-none rounded-xl border border-sibs-tertiary-8 bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Radio columns */}
                {proficiencyOptions.map((option) => (
                  <div
                    key={option}
                    className="flex items-center justify-center border-b border-[#E6ECF2] px-3 py-4 md:border-b-0 md:border-r"
                  >
                    <label className="flex cursor-pointer flex-col items-center gap-2">
                      <span className="text-sm font-semibold text-[#344054] md:hidden">
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

                {/* Remove button */}
                <div className="flex items-center justify-center px-2 py-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(item.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                    aria-label="Remove competency"
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
          className="inline-flex items-center justify-center gap-2 rounded-lg 
            border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold
            text-blue-600 transition hover:bg-blue-100 w-full border-dashed"
        >
          <Plus size={18} />
          Add Competency
        </button>
      </div>
    </div>
  );
};

export default DesiredCompetenciesTable;
