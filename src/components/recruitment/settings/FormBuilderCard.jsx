import React, { Fragment, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Edit3,
  GripVertical,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";

import { useRecruitmentSettings } from "../../../services/context/RecruitmentSettingsContext";
import FormDetailsCard from "./FormDetailsCard";
import AddFieldCard from "./AddFieldCard";

function statusClass(status) {
  if (status === "Active") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (status === "Inactive") {
    return "border-red-100 bg-red-50 text-red-600";
  }

  return "border-amber-100 bg-amber-50 text-amber-700";
}

function questionTypeClass(type) {
  const normalized = String(type || "").trim().toLowerCase();

  if (normalized === "rating") {
    return "border-blue-100 bg-blue-50 text-blue-700";
  }

  if (normalized === "paragraph" || normalized === "text") {
    return "border-violet-100 bg-violet-50 text-violet-700";
  }

  if (normalized === "dropdown") {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  if (normalized === "checkbox") {
    return "border-cyan-100 bg-cyan-50 text-cyan-700";
  }

  if (normalized === "number") {
    return "border-orange-100 bg-orange-50 text-orange-700";
  }

  if (normalized === "date") {
    return "border-indigo-100 bg-indigo-50 text-indigo-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function QuestionList({ group, onEditQuestion }) {
  return (
    <div className="border-t border-[#E6ECF2] bg-[#F8FAFC] px-5 py-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
            Saved Questions
          </p>

          <p className="mt-1 text-sm font-semibold text-[#475467]">
            {group.questions.length} saved question
            {group.questions.length === 1 ? "" : "s"} under{" "}
            <span className="font-extrabold text-[#101828]">
              {group.section}
            </span>
            .
          </p>
        </div>

      </div>

      <div className="space-y-3">
        {group.questions.map((question, questionIndex) => (
          <div
            key={
              question.id ||
              `${group.section}-${question.label}-${questionIndex}`
            }
            className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sibs-primary-1 text-xs font-extrabold text-white">
                  {questionIndex + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-extrabold leading-6 text-[#101828]">
                    {question.label || "Untitled question"}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${questionTypeClass(
                        question.type,
                      )}`}
                    >
                      {question.type || "Text"}
                    </span>


                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${
                        question.enabled !== false
                          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {question.enabled !== false ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onEditQuestion(question)}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-extrabold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
                title="Edit this question"
              >
                <Edit3 size={15} />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FormBuilderCard() {
  const {
    activePositionId,
    setActivePositionId,
    positionSearch,
    setPositionSearch,
    filteredPositions,
    positionsLoading,
    positionsError,
    refreshAvailablePositions,
    search,
    setSearch,
    filteredFields,
    saveStatus,
    formSavingStatus,
    formSaveError,
    questionsSaving,
    questionsSaveError,
    handleToggleFieldGroup,
    handleDeleteFieldGroup,
    handleEditField,
  } = useRecruitmentSettings();

  const [expandedSections, setExpandedSections] = useState(() => new Set());

  const groupedFields = useMemo(() => {
    const groups = new Map();

    (Array.isArray(filteredFields) ? filteredFields : []).forEach((field) => {
      const section = field.section || "Untitled Section";

      if (!groups.has(section)) {
        groups.set(section, {
          section,
          questions: [],
          enabled: true,
        });
      }

      const group = groups.get(section);

      group.questions.push(field);

      if (field.enabled === false) {
        group.enabled = false;
      }

    });

    return Array.from(groups.values());
  }, [filteredFields]);

  function toggleSection(section) {
    const cleanSection = String(section || "").trim();

    if (!cleanSection) return;

    setExpandedSections((previous) => {
      const next = new Set(previous);

      if (next.has(cleanSection)) {
        next.delete(cleanSection);
      } else {
        next.add(cleanSection);
      }

      return next;
    });
  }

  function stopRowClick(event) {
    event.stopPropagation();
  }

  return (
    <div className="flex h-[calc(100vh-330px)] min-h-[680px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm">
      <div className="shrink-0 border-b border-[#E6ECF2] bg-white p-5">
        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-[#101828]">
              Position-based Final Interview Forms
            </h3>

            <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
              Select a role from Available Positions, then create or update its
              final interview questions.
            </p>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row xl:w-auto">
            <span className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-4 text-xs font-extrabold text-sibs-primary-1">
              {filteredPositions.length} active positions
            </span>

            <button
              type="button"
              onClick={() => refreshAvailablePositions?.()}
              disabled={positionsLoading}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 transition hover:border-sibs-primary-1 hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={positionsLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <div className="relative w-full sm:min-w-[320px] xl:w-[420px]">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search questions..."
                className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-10 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </div>
          </div>
        </div>
      </div>

      {(formSavingStatus ||
        saveStatus ||
        formSaveError ||
        questionsSaveError) && (
        <div className="shrink-0 border-b border-[#E6ECF2] bg-white px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {formSavingStatus && (
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold ${
                  formSavingStatus.toLowerCase().includes("failed") ||
                  formSavingStatus.toLowerCase().includes("not saved")
                    ? "border-red-200 bg-red-50 text-red-700"
                    : formSavingStatus.toLowerCase().includes("saved")
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-blue-200 bg-blue-50 text-blue-700"
                }`}
              >
                {formSavingStatus.toLowerCase().includes("saving") && (
                  <Loader2 size={13} className="animate-spin" />
                )}

                {formSavingStatus}
              </span>
            )}

            {(questionsSaving || saveStatus) && (
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                {questionsSaving && (
                  <Loader2 size={13} className="animate-spin" />
                )}

                {questionsSaving ? "Saving questions..." : saveStatus}
              </span>
            )}

            {(formSaveError || questionsSaveError) && (
              <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-extrabold text-red-700">
                {formSaveError || questionsSaveError}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 bg-[#F5F7FA] xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex min-h-0 min-w-0 flex-col border-b border-[#E6ECF2] bg-[#F8FAFC] px-4 pt-4 xl:border-b-0 xl:border-r">
          <div className="relative shrink-0">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />

            <input
              value={positionSearch}
              onChange={(event) => setPositionSearch(event.target.value)}
              placeholder="Search positions..."
              className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-10 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>

          <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pb-4 pr-1 pt-1">
            {positionsError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-extrabold text-amber-700">
                  {positionsError}
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-amber-700/80">
                  Cached positions are shown when available. Press Refresh after
                  the Available Positions API is reachable.
                </p>
              </div>
            )}

            {positionsLoading && !filteredPositions.length && (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-10 text-sm font-extrabold text-sibs-primary-1">
                <Loader2 size={18} className="animate-spin" />
                Loading all active positions...
              </div>
            )}

            {filteredPositions.map((position) => {
              const isActive =
                String(activePositionId) === String(position.id);

              return (
                <button
                  key={position.id}
                  type="button"
                  onClick={() => {
                    setActivePositionId(position.id);
                    setExpandedSections(new Set());
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                    isActive
                      ? "border-sibs-primary-1 bg-white shadow-sm ring-4 ring-sibs-primary-1/10"
                      : "border-[#E6ECF2] bg-white hover:border-sibs-primary-1/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-[#101828]">
                        {position.position}
                      </p>

                      <p className="mt-1 text-xs font-bold text-sibs-primary-1">
                        {position.code}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusClass(
                        position.status,
                      )}`}
                    >
                      {position.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs font-semibold text-[#475467]">
                    <p className="truncate">
                      <span className="font-extrabold text-sibs-tertiary-5">
                        Dept:
                      </span>{" "}
                      {position.department}
                    </p>

                    <p className="truncate">
                      <span className="font-extrabold text-sibs-tertiary-5">
                        Site:
                      </span>{" "}
                      {position.location}
                    </p>

                    <p className="line-clamp-2 leading-5">
                      <span className="font-extrabold text-sibs-tertiary-5">
                        Skills:
                      </span>{" "}
                      {position.skills}
                    </p>
                  </div>
                </button>
              );
            })}

            {!positionsLoading && !filteredPositions.length && (
              <div className="rounded-xl border border-dashed border-[#D6DEE8] bg-white px-4 py-8 text-center">
                <p className="text-xs font-extrabold text-sibs-tertiary-5">
                  No positions found.
                </p>
              </div>
            )}
          </div>
        </aside>

        <div className="min-h-0 min-w-0 overflow-y-auto p-5">
          <div className="space-y-5">
            <div className="min-w-0">
              <FormDetailsCard />
            </div>

            <div className="min-w-0 overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                  Selected Role Questions
                </p>

                <p className="mt-1 text-sm font-semibold leading-5 text-[#344054]">
                  Click a question group below to display its saved questions.
                </p>
              </div>

              <div className="w-full overflow-x-auto rounded-xl border border-[#E6ECF2]">
                <table className="w-full min-w-[920px] table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[44px]" />
                    <col />
                    <col className="w-[140px]" />
                    <col className="w-[130px]" />
                    <col className="w-[150px]" />
                  </colgroup>

                  <thead className="bg-[#F8FAFC]">
                    <tr className="text-left text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                      <th className="px-4 py-3" />
                      <th className="px-4 py-3">Field Label</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-3 py-3 text-center">Section</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#EEF2F6] bg-white">
                    {groupedFields.map((group) => {
                      const firstQuestion = group.questions[0];
                      const isExpanded = expandedSections.has(group.section);

                      return (
                        <Fragment key={group.section}>
                          <tr
                            role="button"
                            tabIndex={0}
                            aria-expanded={isExpanded}
                            onClick={() => toggleSection(group.section)}
                            onKeyDown={(event) => {
                              if (
                                event.key === "Enter" ||
                                event.key === " "
                              ) {
                                event.preventDefault();
                                toggleSection(group.section);
                              }
                            }}
                            className={`cursor-pointer text-sm outline-none transition hover:bg-[#F8FAFC] focus:bg-[#F8FAFC] ${
                              isExpanded ? "bg-blue-50/40" : ""
                            }`}
                          >
                            <td className="px-4 py-4 text-sibs-tertiary-5">
                              <div className="flex items-center gap-2">
                                <GripVertical size={18} />

                                <ChevronDown
                                  size={17}
                                  className={`transition-transform duration-200 ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="min-w-0">
                                <p
                                  title={group.section}
                                  className="truncate whitespace-nowrap font-extrabold uppercase text-[#101828]"
                                >
                                  {group.section}
                                </p>

                                <p className="mt-1 truncate whitespace-nowrap text-xs font-semibold text-sibs-primary-1">
                                  {group.questions.length} question
                                  {group.questions.length === 1 ? "" : "s"} in
                                  this field
                                </p>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <p className="truncate whitespace-nowrap font-bold text-[#344054]">
                                {group.questions.length === 1
                                  ? group.questions[0].type
                                  : "Multiple"}
                              </p>
                            </td>

                            <td className="px-3 py-4 text-center">
                              <p
                                title="Form Section"
                                className="truncate whitespace-nowrap font-bold text-[#344054]"
                              >
                                Form Section
                              </p>
                            </td>


                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    stopRowClick(event);
                                    handleToggleFieldGroup(
                                      group.section,
                                      "enabled",
                                    );
                                  }}
                                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                                    group.enabled
                                      ? "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                      : "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                                  }`}
                                  title={
                                    group.enabled
                                      ? "Disable question group"
                                      : "Enable question group"
                                  }
                                >
                                  {group.enabled ? (
                                    <CheckCircle2 size={16} />
                                  ) : (
                                    <XCircle size={16} />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    stopRowClick(event);
                                    handleEditField(firstQuestion);
                                  }}
                                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                                  title="Edit first question"
                                >
                                  <Edit3 size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    stopRowClick(event);
                                    handleDeleteFieldGroup(group.section);
                                    setExpandedSections((previous) => {
                                      const next = new Set(previous);
                                      next.delete(group.section);
                                      return next;
                                    });
                                  }}
                                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                                  title="Delete question group"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td colSpan={5} className="p-0">
                                <QuestionList
                                  group={group}
                                  onEditQuestion={handleEditField}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}

                    {!groupedFields.length && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center">
                          <p className="text-sm font-extrabold text-sibs-tertiary-5">
                            No questions found for this position.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <AddFieldCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
