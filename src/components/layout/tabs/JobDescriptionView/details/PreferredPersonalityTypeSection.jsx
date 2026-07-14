import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  ChevronDown,
  PencilLine,
  Search,
  SquarePen,
  X,
} from "lucide-react";

const PERSONALITY_TYPE_OPTIONS = [
  { value: "INTJ", label: "INTJ (Architect)" },
  { value: "INTP", label: "INTP (Logician)" },
  { value: "ENTJ", label: "ENTJ (Commander)" },
  { value: "ENTP", label: "ENTP (Debater)" },
  { value: "INFJ", label: "INFJ (Advocate)" },
  { value: "INFP", label: "INFP (Mediator)" },
  { value: "ENFJ", label: "ENFJ (Protagonist)" },
  { value: "ENFP", label: "ENFP (Campaigner)" },
  { value: "ISTJ", label: "ISTJ (Logistician)" },
  { value: "ISFJ", label: "ISFJ (Defender)" },
  { value: "ESTJ", label: "ESTJ (Executive)" },
  { value: "ESFJ", label: "ESFJ (Consul)" },
  { value: "ISTP", label: "ISTP (Virtuoso)" },
  { value: "ISFP", label: "ISFP (Adventurer)" },
  { value: "ESTP", label: "ESTP (Entrepreneur)" },
  { value: "ESFP", label: "ESFP (Entertainer)" },
];

const PERSONALITY_TYPE_LABELS = Object.fromEntries(
  PERSONALITY_TYPE_OPTIONS.map((option) => [
    option.value,
    option.label,
  ]),
);

function normalizePersonalityCode(value = "") {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) return "";

  const codeMatch = cleanValue.match(/[A-Za-z]{4}/);
  const code = String(codeMatch?.[0] || cleanValue).toUpperCase();

  return PERSONALITY_TYPE_LABELS[code] ? code : "";
}

function parsePersonalityTypes(value = "") {
  const source = Array.isArray(value)
    ? value
    : String(value || "").split(/[,;|\n]/);

  return [
    ...new Set(
      source
        .map(normalizePersonalityCode)
        .filter(Boolean),
    ),
  ];
}

function formatPersonalityTypeLabel(value = "") {
  const code = normalizePersonalityCode(value);

  return code
    ? PERSONALITY_TYPE_LABELS[code]
    : String(value || "").trim();
}

function normalizeCompareText(value = "") {
  return String(value || "")
    .trim()
    .replace(/[()]/g, " ")
    .replace(/[,;|]/g, " ")
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
      `${comment.sectionKey || ""}-${getCommentSelectedText(
        comment,
      )}-${comment.comment || ""}-${fallback}`,
  );
}

function PersonalityCommentCard({
  comment,
  compact = false,
}) {
  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 ${
        compact ? "px-3 py-2" : "px-4 py-3"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
          Reviewer Comment
        </p>

        <span className="rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-700">
          {comment?.status || "Open"}
        </span>
      </div>

      {getCommentSelectedText(comment) && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-white/80 px-2.5 py-1.5 text-xs font-bold text-amber-800">
          {getCommentSelectedText(comment)}
        </p>
      )}

      <p className="mt-2 whitespace-pre-line text-xs font-semibold leading-5 text-amber-800">
        {comment?.comment ||
          "No revision comment provided."}
      </p>
    </div>
  );
}

function PersonalityMultiSelect({
  value = "",
  onChange,
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedValues = useMemo(
    () => parsePersonalityTypes(value),
    [value],
  );

  const visibleOptions = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    if (!searchValue) {
      return PERSONALITY_TYPE_OPTIONS;
    }

    return PERSONALITY_TYPE_OPTIONS.filter(
      (option) =>
        option.value
          .toLowerCase()
          .includes(searchValue) ||
        option.label
          .toLowerCase()
          .includes(searchValue),
    );
  }, [search]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
        setSearch("");
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );
    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  function commit(nextValues) {
    onChange?.(
      [...new Set(nextValues)]
        .filter(Boolean)
        .join(", "),
    );
  }

  function toggleOption(optionValue) {
    const exists =
      selectedValues.includes(optionValue);

    commit(
      exists
        ? selectedValues.filter(
            (item) => item !== optionValue,
          )
        : [...selectedValues, optionValue],
    );
  }

  function removeOption(optionValue) {
    commit(
      selectedValues.filter(
        (item) => item !== optionValue,
      ),
    );
  }

  return (
    <div
      ref={dropdownRef}
      className="relative z-[80]"
    >
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-[#C9D8E8] bg-white px-3 py-2 text-left outline-none transition hover:border-sibs-primary-1 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {selectedValues.length > 0 ? (
            selectedValues.map((personalityType) => (
              <span
                key={personalityType}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#BFD6F6] bg-[#EAF2FB] px-3 py-1 text-xs font-bold text-sibs-primary-1"
              >
                <span className="min-w-0 truncate">
                  {formatPersonalityTypeLabel(
                    personalityType,
                  )}
                </span>

                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeOption(personalityType);
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      event.stopPropagation();
                      removeOption(personalityType);
                    }
                  }}
                  className="rounded-full p-0.5 transition hover:bg-sibs-primary-1/10"
                  aria-label={`Remove ${formatPersonalityTypeLabel(
                    personalityType,
                  )}`}
                >
                  <X size={12} />
                </span>
              </span>
            ))
          ) : (
            <span className="px-1 text-sm font-medium text-[#90A4B7]">
              Select personality types
            </span>
          )}
        </div>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[99999] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl">
          <div className="border-b border-[#E6ECF2] p-3">
            <div className="flex h-10 items-center gap-2 rounded-lg border border-[#D7DEE8] bg-[#F8FAFC] px-3 focus-within:border-sibs-primary-1">
              <Search
                size={16}
                className="shrink-0 text-[#667085]"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                autoFocus
                placeholder="Search personality type"
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#344054] outline-none placeholder:text-[#98A2B3]"
              />
            </div>
          </div>

          <div className="thin-scroll max-h-64 overflow-y-auto p-2">
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => {
                const selected =
                  selectedValues.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      toggleOption(option.value)
                    }
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      selected
                        ? "bg-[#EAF2FB] font-extrabold text-sibs-primary-1"
                        : "font-semibold text-[#344054] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <span>{option.label}</span>

                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        selected
                          ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
                          : "border-[#C9D8E8] bg-white text-transparent"
                      }`}
                    >
                      <Check size={13} />
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-6 text-center text-sm font-semibold text-[#667085]">
                No personality type found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PreferredPersonalityTypeSection({
  value = "",
  comments = [],
  approvalPage = false,
  canManageJdDetails = false,
  disableEdit = false,
  disableComment = false,
  isEditing = false,
  editingDraft = "",
  setEditingDraft,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onAddComment,
}) {
  const [selectedTypes, setSelectedTypes] =
    useState([]);

  const personalityTypes = useMemo(
    () => parsePersonalityTypes(value),
    [value],
  );

  useEffect(() => {
    setSelectedTypes((previous) =>
      previous.filter((selectedType) =>
        personalityTypes.includes(
          normalizePersonalityCode(selectedType),
        ),
      ),
    );
  }, [personalityTypes]);

  function isTypeSelected(type = "") {
    const code = normalizePersonalityCode(type);

    return selectedTypes.some(
      (selectedType) =>
        normalizePersonalityCode(selectedType) === code,
    );
  }

  function toggleSelectedType(type = "") {
    if (
      !approvalPage ||
      disableComment ||
      isEditing
    ) {
      return;
    }

    const code = normalizePersonalityCode(type);

    setSelectedTypes((previous) =>
      previous.includes(code)
        ? previous.filter((item) => item !== code)
        : [...previous, code],
    );
  }

  function clearSelectedTypes() {
    setSelectedTypes([]);
  }

  function handleAddComment() {
    const selectedText = selectedTypes
      .map(formatPersonalityTypeLabel)
      .join(", ");

    onAddComment?.({
      selectedText,
    });

    clearSelectedTypes();
  }

  function getCommentsForType(type = "") {
    const code = normalizePersonalityCode(type);
    const formattedLabel =
      formatPersonalityTypeLabel(code);
    const normalizedCode =
      normalizeCompareText(code);
    const normalizedLabel =
      normalizeCompareText(formattedLabel);

    return comments.filter((comment) => {
      const normalizedSelectedText =
        normalizeCompareText(
          getCommentSelectedText(comment),
        );

      if (!normalizedSelectedText) return false;

      return (
        normalizedSelectedText === normalizedCode ||
        normalizedSelectedText === normalizedLabel ||
        normalizedSelectedText.includes(
          normalizedCode,
        ) ||
        normalizedSelectedText.includes(
          normalizedLabel,
        )
      );
    });
  }

  const sectionComments = comments.filter(
    (comment) => !getCommentSelectedText(comment),
  );

  const hasSelectedTypes =
    selectedTypes.length > 0;

  function getEditTitle() {
    if (!canManageJdDetails) {
      return "Only authorized JD reviewers can edit this JD.";
    }

    if (disableEdit) {
      return "Editing is disabled because this JD has revision comments.";
    }

    return "Edit preferred personality type.";
  }

  function getCommentTitle() {
    if (!canManageJdDetails) {
      return "Only authorized JD reviewers can add revision comments.";
    }

    if (disableComment) {
      return "Commenting is disabled because this JD already has edited changes.";
    }

    if (!hasSelectedTypes) {
      return "Select one or more personality capsules first.";
    }

    return "Add a comment to the selected personality types.";
  }

  return (
    <section className="space-y-3">
      <div className="jd-details-section-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-extrabold uppercase tracking-wide text-[#101828] sm:text-[15px]">
              4. Preferred Personality Type
            </h4>

            {comments.length > 0 && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-700">
                {comments.length} comment
                {comments.length > 1 ? "s" : ""}
              </span>
            )}

            {hasSelectedTypes && !isEditing && (
              <span className="rounded-full border border-amber-300 bg-[#FFF3B8] px-2.5 py-1 text-[11px] font-extrabold text-[#101828]">
                {selectedTypes.length} selected
              </span>
            )}
          </div>

          {approvalPage &&
            canManageJdDetails &&
            !isEditing && (
              <p className="mt-1 text-xs font-semibold text-sibs-primary-1/80">
                Click one or more personality capsules,
                then click Add Comment.
              </p>
            )}
        </div>

        {approvalPage &&
          !isEditing &&
          canManageJdDetails && (
            <div className="jd-mobile-actions-row flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              {hasSelectedTypes && (
                <button
                  type="button"
                  onClick={clearSelectedTypes}
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-2.5 py-1.5 text-xs font-bold text-[#667085] transition hover:bg-[#F8FAFC] hover:text-sibs-primary-1 sm:flex-none"
                >
                  Clear
                </button>
              )}

              <button
                type="button"
                onMouseDown={(event) =>
                  event.preventDefault()
                }
                onClick={onStartEdit}
                disabled={disableEdit}
                title={getEditTitle()}
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
                onMouseDown={(event) =>
                  event.preventDefault()
                }
                onClick={handleAddComment}
                disabled={
                  disableComment ||
                  !hasSelectedTypes
                }
                title={getCommentTitle()}
                className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition sm:flex-none ${
                  disableComment ||
                  !hasSelectedTypes
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
        <div className="rounded-xl border border-[#D7DEE8] bg-white p-3 shadow-sm sm:p-4">
          <label className="mb-2 block text-sm font-extrabold text-sibs-primary-1">
            Preferred Personality Type
          </label>

          <PersonalityMultiSelect
            value={editingDraft}
            onChange={(nextValue) =>
              setEditingDraft?.(nextValue)
            }
          />

          <p className="mt-2 text-xs font-semibold text-[#667085]">
            Select one or more personality types.
            This uses the same options as Add Job
            Description.
          </p>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSaveEdit}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-sibs-primary-1 px-4 text-sm font-extrabold text-white transition hover:opacity-90 sm:w-auto"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-xl border px-3 py-2 ${
            comments.length > 0
              ? "border-amber-200 bg-amber-50/40"
              : "border-[#D7DEE8] bg-white"
          }`}
        >
          {personalityTypes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {personalityTypes.map((type) => {
                const selected =
                  isTypeSelected(type);
                const typeComments =
                  getCommentsForType(type);

                return (
                  <span
                    key={type}
                    className="group relative inline-flex"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleSelectedType(type)
                      }
                      disabled={
                        !approvalPage ||
                        disableComment
                      }
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-[0.98] ${
                        selected
                          ? "border-amber-300 bg-[#FFF3B8] text-[#101828] shadow-sm ring-1 ring-amber-300"
                          : typeComments.length > 0
                            ? "border-amber-300 bg-[#FFF3B8] text-[#101828]"
                            : "border-[#BFD6F6] bg-[#EAF2FB] text-sibs-primary-1 hover:border-sibs-primary-1/40 hover:bg-blue-50"
                      } ${
                        !approvalPage ||
                        disableComment
                          ? "cursor-default"
                          : "cursor-pointer"
                      }`}
                    >
                      {formatPersonalityTypeLabel(
                        type,
                      )}
                    </button>

                    {typeComments.length > 0 && (
                      <div className="pointer-events-none absolute left-0 top-[calc(100%+8px)] z-[99999] hidden w-[min(300px,calc(100vw-2rem))] group-hover:block group-focus-within:block">
                        <PersonalityCommentCard
                          comment={typeComments[0]}
                          compact
                        />
                      </div>
                    )}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#667085]">
              No preferred personality type provided.
            </p>
          )}
        </div>
      )}

      {sectionComments.length > 0 && (
        <div className="space-y-2">
          {sectionComments.map(
            (comment, index) => (
              <PersonalityCommentCard
                key={getCommentKey(
                  comment,
                  `section-${index}`,
                )}
                comment={comment}
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}
