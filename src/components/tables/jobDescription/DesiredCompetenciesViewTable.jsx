import React, { useEffect, useState } from "react";
import { Check, PencilLine, SquarePen } from "lucide-react";

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

const DesiredCompetenciesViewTable = ({
  competencies = [],
  comments = [],
  onAddComment,
  disableEdit = false,
  disableComment = false,
  onEditedChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableCompetencies, setEditableCompetencies] = useState([]);

  useEffect(() => {
    setEditableCompetencies(
      competencies.map((item, index) => ({
        id: item.id || `competency-${index}`,
        title: item.title || `Competency ${index + 1}`,
        description: item.description || "",
        level: getCompetencyLevel(item),
      })),
    );

    setIsEditing(false);
  }, [competencies]);

  function handleChange(id, field, value) {
    setEditableCompetencies((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function handleCancelEdit() {
    setEditableCompetencies(
      competencies.map((item, index) => ({
        id: item.id || `competency-${index}`,
        title: item.title || `Competency ${index + 1}`,
        description: item.description || "",
        level: getCompetencyLevel(item),
      })),
    );

    setIsEditing(false);
  }

  function handleSaveEdit() {
    const original = competencies.map((item, index) => ({
      id: item.id || `competency-${index}`,
      title: item.title || `Competency ${index + 1}`,
      description: item.description || "",
      level: getCompetencyLevel(item),
    }));

    const hasChanged =
      JSON.stringify(original) !== JSON.stringify(editableCompetencies);

    if (hasChanged) {
      onEditedChange?.(true);
    }

    setIsEditing(false);
  }

  const displayCompetencies = isEditing
    ? editableCompetencies
    : editableCompetencies.length
      ? editableCompetencies
      : competencies.map((item, index) => ({
          id: item.id || `competency-${index}`,
          title: item.title || `Competency ${index + 1}`,
          description: item.description || "",
          level: getCompetencyLevel(item),
        }));

  return (
    <section>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-extrabold text-[#101828]">
              Desired Competencies
            </h4>

            {comments.length > 0 && (
              <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-extrabold text-amber-700">
                {comments.length} comment{comments.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-sibs-tertiary-5">
            Expected competency level required for this position.
          </p>
        </div>

        {!isEditing ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (disableEdit) return;
                setIsEditing(true);
              }}
              disabled={disableEdit}
              title={
                disableEdit
                  ? "Editing is disabled because this JD has revision comments."
                  : "Edit desired competencies."
              }
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                disableEdit
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-[#D7DEE8] bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
              }`}
            >
              <SquarePen size={14} />
              Edit
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                onAddComment?.("competencies", "Desired Competencies")
              }
              disabled={disableComment}
              title={
                disableComment
                  ? "Commenting is disabled because this JD already has edited changes."
                  : "Add revision comment."
              }
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                disableComment
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-blue-100 bg-blue-50 text-sibs-primary-1 hover:bg-blue-100"
              }`}
            >
              <PencilLine size={14} />
              Add Comment
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-3 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveEdit}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-sibs-primary-1 px-3 text-xs font-extrabold text-white transition hover:opacity-90"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {!displayCompetencies.length ? (
        <div className="rounded-xl border border-[#E6ECF2] bg-white px-4 py-4">
          <p className="text-sm text-sibs-tertiary-5">
            No desired competencies added.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-sm selection:bg-[#FFF3B8] selection:text-[#101828]">
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
            {displayCompetencies.map((item, index) => {
              const selectedLevel = item.level || "";

              return (
                <div
                  key={item.id || `${item.title}-${index}`}
                  className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_110px_110px_110px]"
                >
                  <div className="px-4 py-4 md:border-r md:border-[#E6ECF2]">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          value={item.title}
                          onChange={(e) =>
                            handleChange(item.id, "title", e.target.value)
                          }
                          placeholder={`Competency ${index + 1} title`}
                          className="w-full rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 text-sm font-extrabold text-[#101828] outline-none transition focus:border-sibs-primary-1"
                        />

                        <textarea
                          value={item.description}
                          onChange={(e) =>
                            handleChange(item.id, "description", e.target.value)
                          }
                          placeholder="Describe this competency..."
                          rows={3}
                          className="w-full resize-y rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 text-sm font-medium leading-7 text-[#344054] outline-none transition focus:border-sibs-primary-1"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-extrabold text-[#101828]">
                          {item.title || `Competency ${index + 1}`}
                        </p>

                        {item.description && (
                          <p className="mt-2 whitespace-pre-line text-sm font-medium leading-7 text-[#344054]">
                            {item.description}
                          </p>
                        )}
                      </>
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
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleChange(item.id, "level", option)
                            }
                            className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                              active
                                ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
                                : "border-[#D7DEE8] bg-white text-transparent hover:border-sibs-primary-1"
                            }`}
                            aria-label={option}
                          >
                            <Check size={15} strokeWidth={3} />
                          </button>
                        ) : (
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
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default DesiredCompetenciesViewTable;
