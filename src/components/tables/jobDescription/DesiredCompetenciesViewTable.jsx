import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  PencilLine,
  Plus,
  SquarePen,
  Trash2,
} from "lucide-react";

const PROFICIENCY_LEVELS = [
  "Average",
  "Proficient",
  "Excellent",
];

function normalizeLevel(competency = {}) {
  const rawLevel = String(
    competency.level ||
      competency.proficiencyLevel ||
      competency.proficiency_level ||
      competency.selectedLevel ||
      competency.selected_level ||
      "",
  )
    .trim()
    .toLowerCase();

  if (rawLevel === "average") return "Average";
  if (rawLevel === "proficient") {
    return "Proficient";
  }
  if (rawLevel === "excellent") return "Excellent";

  if (
    Number(competency.average) === 1 ||
    competency.average === true
  ) {
    return "Average";
  }

  if (
    Number(competency.proficient) === 1 ||
    competency.proficient === true
  ) {
    return "Proficient";
  }

  if (
    Number(competency.excellent) === 1 ||
    competency.excellent === true
  ) {
    return "Excellent";
  }

  return "";
}

function normalizeCompetency(
  competency = {},
  index = 0,
) {
  const title = String(
    competency.title ||
      competency.competency ||
      competency.competencyName ||
      competency.competency_name ||
      competency.label ||
      "",
  ).trim();

  const description = String(
    competency.description ||
      competency.details ||
      competency.competencyDescription ||
      competency.competency_description ||
      competency.definition ||
      "",
  ).trim();

  const level = normalizeLevel(competency);

  return {
    id:
      competency.id ??
      competency.competencyId ??
      competency.competency_id ??
      null,
    _key: String(
      competency._key ||
        competency.id ||
        competency.competencyId ||
        `competency-${index}-${title}`,
    ),
    title,
    description,
    level,
    average: level === "Average" ? 1 : 0,
    proficient: level === "Proficient" ? 1 : 0,
    excellent: level === "Excellent" ? 1 : 0,
  };
}

function normalizeCompetencies(
  competencies = [],
) {
  if (!Array.isArray(competencies)) return [];

  return competencies.map(normalizeCompetency);
}

function createEmptyCompetency() {
  return {
    id: null,
    _key: `new-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`,
    title: "",
    description: "",
    level: "Average",
    average: 1,
    proficient: 0,
    excellent: 0,
  };
}

function getCompetencyText(competency = {}) {
  const title = String(
    competency.title || "",
  ).trim();

  const description = String(
    competency.description || "",
  ).trim();

  if (title && description) {
    return `${title}: ${description}`;
  }

  return title || description;
}

function normalizeCompareText(value = "") {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getCommentSelectedText(comment = {}) {
  return String(
    comment.selectedText ||
      comment.selected_text ||
      "",
  ).trim();
}

function getCommentKey(comment = {}, fallback = "") {
  return String(
    comment.id ||
      `${comment.competencyId || ""}-${getCommentSelectedText(
        comment,
      )}-${comment.comment || ""}-${fallback}`,
  );
}

function getCommentsForCompetency(
  comments = [],
  competency = {},
) {
  const competencyId = String(
    competency.id || "",
  );

  const competencyText =
    normalizeCompareText(
      getCompetencyText(competency),
    );

  const title = normalizeCompareText(
    competency.title,
  );

  return comments.filter((comment) => {
    const commentCompetencyId = String(
      comment.competencyId ||
        comment.competency_id ||
        "",
    );

    if (
      competencyId &&
      commentCompetencyId &&
      competencyId === commentCompetencyId
    ) {
      return true;
    }

    const selectedText =
      normalizeCompareText(
        getCommentSelectedText(comment),
      );

    if (!selectedText) return false;

    return (
      selectedText === competencyText ||
      selectedText === title ||
      competencyText.includes(selectedText) ||
      selectedText.includes(title)
    );
  });
}

function CompetencyCommentCard({ comment }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
          Reviewer Comment
        </p>

        <span className="rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-700">
          {comment?.status || "Open"}
        </span>
      </div>

      <p className="mt-2 whitespace-pre-line text-xs font-semibold leading-5 text-amber-800">
        {comment?.comment ||
          "No revision comment provided."}
      </p>
    </div>
  );
}

function ProficiencyRadio({
  checked = false,
  label,
  name,
  onChange,
}) {
  return (
    <label className="inline-flex cursor-pointer items-center justify-center gap-2">
      <input
        type="radio"
        name={name}
        value={label}
        checked={checked}
        onChange={() => onChange?.(label)}
        className="h-4 w-4 accent-[#0D4676]"
      />

      <span className="sr-only">{label}</span>
    </label>
  );
}

export default function DesiredCompetenciesViewTable({
  competencies = [],
  comments = [],
  onAddComment,
  disableEdit = false,
  disableComment = false,
  canManageActions = false,
  onEditedChange,
  onCompetenciesChange,
}) {
  const normalizedCompetencies = useMemo(
    () => normalizeCompetencies(competencies),
    [competencies],
  );

  const [isEditing, setIsEditing] =
    useState(false);

  const [drafts, setDrafts] = useState(
    normalizedCompetencies,
  );

  const [
    selectedCompetencyKeys,
    setSelectedCompetencyKeys,
  ] = useState([]);

  const [validationMessage, setValidationMessage] =
    useState("");

  useEffect(() => {
    if (isEditing) return;

    setDrafts(normalizedCompetencies);
  }, [isEditing, normalizedCompetencies]);

  function startEditing() {
    if (disableEdit) return;

    setDrafts(
      normalizedCompetencies.length > 0
        ? normalizedCompetencies
        : [createEmptyCompetency()],
    );

    setValidationMessage("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setDrafts(normalizedCompetencies);
    setValidationMessage("");
    setIsEditing(false);
  }

  function updateDraft(
    key,
    field,
    value,
  ) {
    setDrafts((previous) =>
      previous.map((competency) => {
        if (competency._key !== key) {
          return competency;
        }

        if (field === "level") {
          return {
            ...competency,
            level: value,
            average:
              value === "Average" ? 1 : 0,
            proficient:
              value === "Proficient" ? 1 : 0,
            excellent:
              value === "Excellent" ? 1 : 0,
          };
        }

        return {
          ...competency,
          [field]: value,
        };
      }),
    );

    setValidationMessage("");
  }

  function addDraft() {
    setDrafts((previous) => [
      ...previous,
      createEmptyCompetency(),
    ]);
  }

  function removeDraft(key) {
    setDrafts((previous) =>
      previous.filter(
        (competency) =>
          competency._key !== key,
      ),
    );

    setValidationMessage("");
  }

  function saveEditing() {
    const meaningfulDrafts = drafts.filter(
      (competency) =>
        String(competency.title || "").trim() ||
        String(
          competency.description || "",
        ).trim(),
    );

    const invalidDraft = meaningfulDrafts.find(
      (competency) =>
        !String(
          competency.title || "",
        ).trim() ||
        !String(
          competency.level || "",
        ).trim(),
    );

    if (invalidDraft) {
      setValidationMessage(
        "Each competency must have a competency name and one selected proficiency level.",
      );
      return;
    }

    const nextCompetencies =
      meaningfulDrafts.map(
        (competency) => {
          const title = String(
            competency.title || "",
          ).trim();

          const description = String(
            competency.description || "",
          ).trim();

          const level =
            PROFICIENCY_LEVELS.includes(
              competency.level,
            )
              ? competency.level
              : "Average";

          return {
            id: competency.id || null,
            title,
            description,
            level,
            average:
              level === "Average" ? 1 : 0,
            proficient:
              level === "Proficient" ? 1 : 0,
            excellent:
              level === "Excellent" ? 1 : 0,
          };
        },
      );

    onCompetenciesChange?.(
      nextCompetencies,
    );

    onEditedChange?.(true);
    setValidationMessage("");
    setIsEditing(false);
  }

  function selectCompetencyForComment(
    competency,
  ) {
    if (
      disableComment ||
      !canManageActions
    ) {
      return;
    }

    setSelectedCompetencyKeys((currentKeys) =>
      currentKeys.includes(competency._key)
        ? currentKeys.filter((key) => key !== competency._key)
        : [...currentKeys, competency._key],
    );
  }

  function handleAddComment() {
    const selectedCompetencies = normalizedCompetencies.filter(
      (competency) => selectedCompetencyKeys.includes(competency._key),
    );

    if (!selectedCompetencies.length) return;

    onAddComment?.(
      "competencies",
      "Desired Competencies",
      {
        competencies: selectedCompetencies.map((competency) => ({
          competencyId: competency.id || null,
          selectedText: getCompetencyText(competency),
        })),
        selectedText: selectedCompetencies
          .map(getCompetencyText)
          .join("\n"),
      },
    );

    setSelectedCompetencyKeys([]);
  }

  const selectedCompetencies = normalizedCompetencies.filter(
    (competency) => selectedCompetencyKeys.includes(competency._key),
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-extrabold text-[#101828]">
              Desired Competencies
            </h4>

            {comments.length > 0 && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-700">
                {comments.length} comment
                {comments.length > 1 ? "s" : ""}
              </span>
            )}

            {selectedCompetencies.length > 0 && !isEditing && (
              <span className="rounded-full border border-amber-300 bg-[#FFF3B8] px-2.5 py-1 text-[11px] font-extrabold text-[#101828]">
                {selectedCompetencies.length} selected
              </span>
            )}
          </div>

          <p className="mt-1 text-sm font-medium text-[#315F8C]">
            Expected competency level required for
            this position.
          </p>

          {canManageActions &&
            !isEditing &&
            normalizedCompetencies.length > 0 && (
              <p className="mt-1 text-xs font-semibold text-sibs-primary-1/80">
                Select one or more competency rows before adding a comment.
              </p>
            )}
        </div>

        {canManageActions && !isEditing && (
          <div className="jd-mobile-actions-row flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={startEditing}
              disabled={disableEdit}
              className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition sm:flex-none ${
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
              onClick={handleAddComment}
              disabled={
                disableComment ||
                !selectedCompetencies.length
              }
              className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition sm:flex-none ${
                disableComment ||
                !selectedCompetencies.length
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-blue-100 bg-blue-50 text-sibs-primary-1 hover:bg-blue-100"
              }`}
            >
              <PencilLine size={14} />
              Add Comment
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-sm">
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="w-[50%] border-b border-r border-[#D7DEE8] px-4 py-3 text-left text-xs font-extrabold uppercase text-sibs-primary-1">
                    Competency for this position
                  </th>

                  {PROFICIENCY_LEVELS.map(
                    (level) => (
                      <th
                        key={level}
                        className="w-[15%] border-b border-r border-[#D7DEE8] px-3 py-3 text-center text-xs font-extrabold uppercase text-sibs-primary-1 last:border-r-0"
                      >
                        {level}
                      </th>
                    ),
                  )}

                  <th className="w-[5%] border-b border-[#D7DEE8] px-3 py-3 text-center text-xs font-extrabold uppercase text-sibs-primary-1">
                    Remove
                  </th>
                </tr>
              </thead>

              <tbody>
                {drafts.map(
                  (competency, index) => (
                    <tr
                      key={competency._key}
                      className="align-top"
                    >
                      <td className="border-b border-r border-[#D7DEE8] p-3">
                        <div className="space-y-2">
                          <input
                            value={competency.title}
                            onChange={(event) =>
                              updateDraft(
                                competency._key,
                                "title",
                                event.target.value,
                              )
                            }
                            placeholder={`Competency ${
                              index + 1
                            }`}
                            className="h-10 w-full rounded-lg border border-[#C9D8E8] bg-white px-3 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                          />

                          <textarea
                            rows={2}
                            value={
                              competency.description
                            }
                            onChange={(event) =>
                              updateDraft(
                                competency._key,
                                "description",
                                event.target.value,
                              )
                            }
                            placeholder="Optional competency description"
                            className="min-h-[70px] w-full resize-y rounded-lg border border-[#C9D8E8] bg-white px-3 py-2 text-sm font-medium leading-5 text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                          />
                        </div>
                      </td>

                      {PROFICIENCY_LEVELS.map(
                        (level) => (
                          <td
                            key={level}
                            className="border-b border-r border-[#D7DEE8] px-3 py-5 text-center last:border-r-0"
                          >
                            <ProficiencyRadio
                              name={`competency-level-${competency._key}`}
                              label={level}
                              checked={
                                competency.level ===
                                level
                              }
                              onChange={(
                                nextLevel,
                              ) =>
                                updateDraft(
                                  competency._key,
                                  "level",
                                  nextLevel,
                                )
                              }
                            />
                          </td>
                        ),
                      )}

                      <td className="border-b border-[#D7DEE8] px-3 py-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            removeDraft(
                              competency._key,
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                          aria-label={`Remove competency ${
                            index + 1
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[#E6ECF2] bg-[#F8FAFC] p-3 sm:p-4">
            <button
              type="button"
              onClick={addDraft}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-sibs-primary-1/40 bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-blue-50 sm:w-auto"
            >
              <Plus size={16} />
              Add Competency
            </button>

            {validationMessage && (
              <p className="mt-3 text-sm font-bold text-red-600">
                {validationMessage}
              </p>
            )}

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelEditing}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveEditing}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-sibs-primary-1 px-4 text-sm font-extrabold text-white transition hover:opacity-90 sm:w-auto"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-[#D7DEE8] bg-white md:block">
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="w-[65%] border-b border-r border-[#D7DEE8] px-4 py-3 text-left text-xs font-extrabold uppercase text-sibs-primary-1">
                    Competency for this position
                  </th>

                  {PROFICIENCY_LEVELS.map(
                    (level) => (
                      <th
                        key={level}
                        className="border-b border-r border-[#D7DEE8] px-3 py-3 text-center text-xs font-extrabold uppercase text-sibs-primary-1 last:border-r-0"
                      >
                        {level}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {normalizedCompetencies.length >
                0 ? (
                  normalizedCompetencies.map(
                    (competency) => {
                      const selected = selectedCompetencyKeys.includes(
                        competency._key,
                      );

                      const competencyComments =
                        getCommentsForCompetency(
                          comments,
                          competency,
                        );

                      return (
                        <tr
                          key={competency._key}
                          onClick={() =>
                            selectCompetencyForComment(
                              competency,
                            )
                          }
                          className={`transition ${
                            canManageActions &&
                            !disableComment
                              ? "cursor-pointer"
                              : ""
                          } ${
                            selected
                              ? "bg-[#FFF8D9]"
                              : competencyComments.length >
                                  0
                                ? "bg-amber-50/50"
                                : "hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <td className="border-b border-r border-[#D7DEE8] px-4 py-4 align-top last:border-b-0">
                            <p className="font-extrabold leading-5 text-[#344054]">
                              {competency.title ||
                                "Untitled competency"}
                            </p>

                            {competency.description && (
                              <p className="mt-1 whitespace-pre-line text-sm font-medium leading-5 text-[#667085]">
                                {
                                  competency.description
                                }
                              </p>
                            )}

                            {competencyComments.length >
                              0 && (
                              <div className="mt-3 space-y-2">
                                {competencyComments.map(
                                  (
                                    comment,
                                    index,
                                  ) => (
                                    <CompetencyCommentCard
                                      key={getCommentKey(
                                        comment,
                                        `${competency._key}-${index}`,
                                      )}
                                      comment={
                                        comment
                                      }
                                    />
                                  ),
                                )}
                              </div>
                            )}
                          </td>

                          {PROFICIENCY_LEVELS.map(
                            (level) => (
                              <td
                                key={level}
                                className="border-b border-r border-[#D7DEE8] px-3 py-4 text-center align-top last:border-r-0"
                              >
                                <span
                                  className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full border ${
                                    competency.level ===
                                    level
                                      ? "border-sibs-primary-1 bg-sibs-primary-1"
                                      : "border-[#C9D8E8] bg-white"
                                  }`}
                                >
                                  {competency.level ===
                                    level && (
                                    <span className="h-2 w-2 rounded-full bg-white" />
                                  )}
                                </span>
                              </td>
                            ),
                          )}
                        </tr>
                      );
                    },
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-9 text-center text-sm font-bold text-[#315F8C]"
                    >
                      No competencies provided.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {normalizedCompetencies.length >
            0 ? (
              normalizedCompetencies.map(
                (competency) => {
                  const selected = selectedCompetencyKeys.includes(
                    competency._key,
                  );

                  const competencyComments =
                    getCommentsForCompetency(
                      comments,
                      competency,
                    );

                  return (
                    <button
                      key={competency._key}
                      type="button"
                      onClick={() =>
                        selectCompetencyForComment(
                          competency,
                        )
                      }
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-amber-300 bg-[#FFF8D9] ring-1 ring-amber-300"
                          : competencyComments.length > 0
                            ? "border-amber-200 bg-amber-50/50"
                            : "border-[#D7DEE8] bg-white"
                      }`}
                    >
                      <p className="font-extrabold leading-5 text-[#344054]">
                        {competency.title ||
                          "Untitled competency"}
                      </p>

                      {competency.description && (
                        <p className="mt-1 whitespace-pre-line text-sm font-medium leading-5 text-[#667085]">
                          {competency.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {PROFICIENCY_LEVELS.map(
                          (level) => (
                            <span
                              key={level}
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${
                                competency.level ===
                                level
                                  ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
                                  : "border-[#D7DEE8] bg-[#F8FAFC] text-[#667085]"
                              }`}
                            >
                              {level}
                            </span>
                          ),
                        )}
                      </div>

                      {competencyComments.length >
                        0 && (
                        <div className="mt-3 space-y-2">
                          {competencyComments.map(
                            (
                              comment,
                              index,
                            ) => (
                              <CompetencyCommentCard
                                key={getCommentKey(
                                  comment,
                                  `${competency._key}-${index}`,
                                )}
                                comment={comment}
                              />
                            ),
                          )}
                        </div>
                      )}
                    </button>
                  );
                },
              )
            ) : (
              <div className="rounded-xl border border-[#D7DEE8] bg-white px-4 py-9 text-center text-sm font-bold text-[#315F8C]">
                No competencies provided.
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
