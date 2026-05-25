import React, { useMemo } from "react";
import {
  CheckCircle2,
  Edit3,
  GripVertical,
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

export default function FormBuilderCard() {
  const {
    activePositionId,
    setActivePositionId,
    positionSearch,
    setPositionSearch,
    filteredPositions,
    search,
    setSearch,
    filteredFields,
    handleToggleFieldGroup,
    handleDeleteFieldGroup,
    handleEditField,
  } = useRecruitmentSettings();

  const groupedFields = useMemo(() => {
    const groups = new Map();

    filteredFields.forEach((field) => {
      const section = field.section || "Untitled Section";

      if (!groups.has(section)) {
        groups.set(section, {
          section,
          questions: [],
          enabled: true,
          requiredCount: 0,
        });
      }

      const group = groups.get(section);

      group.questions.push(field);

      if (!field.enabled) {
        group.enabled = false;
      }

      if (field.required) {
        group.requiredCount += 1;
      }
    });

    return Array.from(groups.values());
  }, [filteredFields]);

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
              final interview form fields.
            </p>
          </div>

          <div className="relative w-full shrink-0 xl:w-[420px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fields..."
              className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-10 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>
      </div>

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 bg-[#F5F7FA] xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex min-h-0 min-w-0 flex-col border-b border-[#E6ECF2] bg-[#F8FAFC] px-4 pt-4 xl:border-b-0 xl:border-r">
          <div className="relative shrink-0">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />
            <input
              value={positionSearch}
              onChange={(e) => setPositionSearch(e.target.value)}
              placeholder="Search positions..."
              className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-10 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>

          <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 pb-4 pt-1">
            {filteredPositions.map((position) => {
              const isActive = activePositionId === position.id;

              return (
                <button
                  key={position.id}
                  type="button"
                  onClick={() => setActivePositionId(position.id)}
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

            {!filteredPositions.length && (
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
                  Selected Role Form
                </p>
                <p className="mt-1 text-sm font-semibold leading-5 text-[#344054]">
                  The field list below belongs only to the selected
                  role/position. Switching to another position will show that
                  position’s own form.
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
                    <col className="w-[150px]" />
                  </colgroup>

                  <thead className="bg-[#F8FAFC]">
                    <tr className="text-left text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                      <th className="px-4 py-3" />
                      <th className="px-4 py-3">Field Label</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-3 py-3 text-center">Section</th>
                      <th className="px-4 py-3 text-center">Required</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#EEF2F6] bg-white">
                    {groupedFields.map((group) => {
                      const firstQuestion = group.questions[0];

                      return (
                        <tr
                          key={group.section}
                          className="text-sm transition hover:bg-[#F8FAFC]"
                        >
                          <td className="px-4 py-4 text-sibs-tertiary-5">
                            <GripVertical size={18} />
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

                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex max-w-full items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                              <span className="truncate whitespace-nowrap">
                                {group.requiredCount}/{group.questions.length}{" "}
                                Required
                              </span>
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleFieldGroup(
                                    group.section,
                                    "enabled",
                                  )
                                }
                                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                                  group.enabled
                                    ? "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                                }`}
                                title={
                                  group.enabled
                                    ? "Disable field group"
                                    : "Enable field group"
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
                                onClick={() => handleEditField(firstQuestion)}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                                title="Edit first question"
                              >
                                <Edit3 size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteFieldGroup(group.section)
                                }
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                                title="Delete field group"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {!groupedFields.length && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center">
                          <p className="text-sm font-extrabold text-sibs-tertiary-5">
                            No fields found for this position.
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
