import React, { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Save,
  Search,
  UsersRound,
} from "lucide-react";

import StatusModal from "../../../modals/StatusModal";
import api from "../../../../lib/axios/api-template";
import { useUser } from "../../../../services/context/UserContext";
import {
  RECRUITMENT_HEADCOUNT_CLUSTER_OPTIONS,
  RECRUITMENT_HEADCOUNT_PAGE_LIMIT,
  canEditRequiredHeadcountByRole,
  formatHeadcountNumber,
  formatHeadcountPercent,
  formatRecruitmentWeekOption,
  getActualBufferClass,
  getActualHeadcount,
  getActualHeadcountNeeds,
  getHeadcountNumberValue,
  getOpsPrf,
  getRecruitmentAccountName,
  getRecruitmentClusterName,
  getRecruitmentHeadcountMetrics,
  getRecruitmentStatusForHeadcountTable,
  getRecruitmentWeekPercent,
} from "../../../../lib/utils/recruitmentSettings/recruitmentHeadcountHelpers";
import {
  CustomSelect,
  RecruitmentHeadcountMobileMetric,
  StatusPill,
  inputClass,
} from "./RecruitmentHeadcountPrimitives";
import SettingsHeaderCapsules from "../SettingsHeaderCapsules";

async function saveRequiredHeadcountOverride(item, requiredHeadcount) {
  const cleanRequiredHeadcount = Number(requiredHeadcount);

  if (!Number.isFinite(cleanRequiredHeadcount) || cleanRequiredHeadcount < 0) {
    throw new Error("Invalid required headcount.");
  }

  const payload = {
    weekNumber: item?.weekNumber || item?.week_number || null,
    weekLabel: item?.weekLabel || item?.week_label || null,
    weekStart: item?.weekStart || item?.week_start || null,
    weekEnd: item?.weekEnd || item?.week_end || null,
    clusterName: item?.clusterName || item?.cluster || item?.cluster_name,
    accountName: item?.accountName || item?.account || item?.account_name,
    requiredHeadcount: cleanRequiredHeadcount,
    actualHeadcount: Number(getActualHeadcount(item)),
    opsPrf: Number(getOpsPrf(item)),
    actualHeadcountNeeds: Number(getActualHeadcountNeeds(item)),
    priorityLevel: item?.priorityLevel || item?.priority_level || null,
    remarks:
      item?.remarks ||
      item?.headcountRemarks ||
      item?.headcount_remarks ||
      null,
    status: "Approved",
  };

  const res = await api.put("/api/recruitment-settings/headcount", payload, {
    withCredentials: true,
  });

  return res?.data || res;
}

function UpdateHeadcountsPanel() {
  const { user } = useUser();
  const canEditRequiredHeadcount = canEditRequiredHeadcountByRole(user);

  const [weeks, setWeeks] = useState([]);
  const [activeWeekId, setActiveWeekId] = useState("");
  const [weeksLoading, setWeeksLoading] = useState(false);

  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);

  const [selectedCluster, setSelectedCluster] = useState("All");
  const [selectedAccount, setSelectedAccount] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [savingRequiredId, setSavingRequiredId] = useState("");
  const [requiredDrafts, setRequiredDrafts] = useState({});

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const activeWeek =
    weeks.find((week) => String(week.id) === String(activeWeekId)) || weeks[0];

  const activeWeekStartDate =
    activeWeek?.startDate ||
    activeWeek?.weekStart ||
    activeWeek?.week_start ||
    "";

  const activeWeekEndDate =
    activeWeek?.endDate || activeWeek?.weekEnd || activeWeek?.week_end || "";

  const activeWeekPercent = getRecruitmentWeekPercent(activeWeek);

  const weekOptions = useMemo(() => {
    return (weeks || []).map((week) => ({
      label: formatRecruitmentWeekOption(week),
      value: week.id,
      data: week,
    }));
  }, [weeks]);

  const clusterOptions = useMemo(() => {
    return RECRUITMENT_HEADCOUNT_CLUSTER_OPTIONS;
  }, []);

  const normalizedAccounts = useMemo(() => {
    return (accounts || []).map((account, index) => {
      const accountName = getRecruitmentAccountName(account);
      const clusterName = getRecruitmentClusterName(account);
      const recruitmentSettingsStatus =
        getRecruitmentStatusForHeadcountTable(account);

      const baseRow = {
        ...account,

        id: String(
          account.id ||
            account.accountId ||
            account.account_id ||
            account.backendAccountId ||
            account.gy_acc_id ||
            `${clusterName}-${accountName}-${index}`,
        ),

        weekNumber: activeWeek?.weekNumber || activeWeek?.week_number || "",
        week_number: activeWeek?.weekNumber || activeWeek?.week_number || "",

        weekLabel:
          activeWeek?.label ||
          activeWeek?.weekLabel ||
          activeWeek?.week_label ||
          "",
        week_label:
          activeWeek?.label ||
          activeWeek?.weekLabel ||
          activeWeek?.week_label ||
          "",

        weekStart: activeWeekStartDate,
        week_start: activeWeekStartDate,

        weekEnd: activeWeekEndDate,
        week_end: activeWeekEndDate,

        account: accountName,
        accountName,
        account_name: accountName,

        cluster: clusterName,
        clusterName,
        cluster_name: clusterName,

        hiringRate: activeWeekPercent,
        hiring_rate: activeWeekPercent,
        hiringPlanPercent: activeWeekPercent,
        hiring_plan_percent: activeWeekPercent,

        recruitmentSettingsStatus,
        recruitment_settings_status: recruitmentSettingsStatus,

        statusNote:
          account.statusNote ||
          account.status_note ||
          account.headcountRemarks ||
          account.headcount_remarks ||
          account.remarks ||
          account.departmentName ||
          account.department_name ||
          "-",
      };

      const metrics = getRecruitmentHeadcountMetrics(baseRow);

      return {
        ...baseRow,

        requiredHeadcount: metrics.requiredHeadcount,
        required_headcount: metrics.requiredHeadcount,

        actualHeadcount: metrics.actualHeadcount,
        actual_headcount: metrics.actualHeadcount,

        requiredBufferHeadcount: metrics.requiredBufferHeadcount,
        required_buffer_headcount: metrics.requiredBufferHeadcount,

        requiredBufferPercent: metrics.requiredBufferPercent,
        required_buffer_percent: metrics.requiredBufferPercent,

        actualBufferCount: metrics.actualBufferCount,
        actual_buffer_count: metrics.actualBufferCount,

        actualBufferPercent: metrics.actualBufferPercent,
        actual_buffer_percent: metrics.actualBufferPercent,

        requiredActualHeadcountWithBuffer:
          metrics.requiredActualHeadcountWithBuffer,
        required_actual_headcount_with_buffer:
          metrics.requiredActualHeadcountWithBuffer,

        absenteeismPastSixWeeksAverage: metrics.absenteeismPastSixWeeksAverage,
        absenteeism_past_six_weeks_average:
          metrics.absenteeismPastSixWeeksAverage,

        attritionPastSixWeeksAverage: metrics.attritionPastSixWeeksAverage,
        attrition_past_six_weeks_average: metrics.attritionPastSixWeeksAverage,

        opsPrf: metrics.opsPrf,
        ops_prf: metrics.opsPrf,

        actualHeadcountNeeds: metrics.actualHeadcountNeeds,
        actual_headcount_needs: metrics.actualHeadcountNeeds,

        leadsToInterview: metrics.leadsToInterview,
        leads_to_interview: metrics.leadsToInterview,
      };
    });
  }, [
    accounts,
    activeWeek,
    activeWeekPercent,
    activeWeekStartDate,
    activeWeekEndDate,
  ]);

  const accountOptions = useMemo(() => {
    const accountMap = new Map();

    normalizedAccounts.forEach((item) => {
      const accountName = String(item.accountName || item.account || "").trim();

      if (!accountName) return;

      const key = accountName.toLowerCase();

      if (!accountMap.has(key)) {
        accountMap.set(key, {
          label: accountName,
          value: accountName,
        });
      }
    });

    return [
      { label: "All Accounts", value: "All" },
      ...Array.from(accountMap.values()).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
    ];
  }, [normalizedAccounts]);

  const statusOptions = useMemo(() => {
    const statuses = new Set();

    normalizedAccounts.forEach((item) => {
      const value = String(
        item.recruitmentSettingsStatus ||
          item.recruitment_settings_status ||
          "",
      ).trim();

      if (value) statuses.add(value);
    });

    return [
      { label: "All Status", value: "All" },
      ...Array.from(statuses)
        .sort()
        .map((value) => ({
          label: value,
          value,
        })),
    ];
  }, [normalizedAccounts]);

  const filteredAccounts = useMemo(() => {
    const keyword = String(search || "")
      .trim()
      .toLowerCase();

    return normalizedAccounts.filter((item) => {
      const recruitmentSettingsStatus = String(
        item.recruitmentSettingsStatus ||
          item.recruitment_settings_status ||
          "",
      ).trim();

      const accountName = String(item.accountName || item.account || "").trim();

      const matchesAccount =
        selectedAccount === "All" ||
        accountName.toLowerCase() === selectedAccount.toLowerCase();

      const matchesStatus =
        statusFilter === "All" ||
        recruitmentSettingsStatus.toLowerCase() === statusFilter.toLowerCase();

      const metrics = getRecruitmentHeadcountMetrics(item);

      const searchableText = [
        item.id,
        item.account,
        item.accountName,
        metrics.requiredHeadcount,
        metrics.actualHeadcount,
        metrics.requiredBufferHeadcount,
        metrics.requiredBufferPercent,
        metrics.actualBufferCount,
        metrics.actualBufferPercent,
        metrics.requiredActualHeadcountWithBuffer,
        metrics.absenteeismPastSixWeeksAverage,
        metrics.attritionPastSixWeeksAverage,
        metrics.opsPrf,
        metrics.actualHeadcountNeeds,
        metrics.leadsToInterview,
        metrics.hiringRate,
      ]
        .filter((value) => value !== undefined && value !== null)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);

      return matchesAccount && matchesStatus && matchesSearch;
    });
  }, [normalizedAccounts, search, selectedAccount, statusFilter]);

  const totalRecords = filteredAccounts.length;
  const totalPages = Math.max(
    Math.ceil(totalRecords / RECRUITMENT_HEADCOUNT_PAGE_LIMIT),
    1,
  );

  const paginatedAccounts = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safePage - 1) * RECRUITMENT_HEADCOUNT_PAGE_LIMIT;

    return filteredAccounts.slice(
      startIndex,
      startIndex + RECRUITMENT_HEADCOUNT_PAGE_LIMIT,
    );
  }, [filteredAccounts, currentPage, totalPages]);

  const showingFrom =
    totalRecords > 0
      ? (currentPage - 1) * RECRUITMENT_HEADCOUNT_PAGE_LIMIT + 1
      : 0;

  const showingTo = Math.min(
    currentPage * RECRUITMENT_HEADCOUNT_PAGE_LIMIT,
    totalRecords,
  );

  function openStatusModal({ type = "success", title = "", message = "" }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal((previous) => ({
      ...previous,
      open: false,
    }));
  }

  async function fetchWeeks() {
    try {
      setWeeksLoading(true);

      const res = await api.get("/api/workforce-hiring-plan/weeks", {
        withCredentials: true,
      });

      const weekRows = Array.isArray(res.data?.data) ? res.data.data : [];

      const formattedWeeks = weekRows.map((week, index) => {
        const startDate = week.startDate || week.weekStart || "";
        const endDate = week.endDate || week.weekEnd || "";
        const weekKey = `${startDate}__${endDate}`;

        return {
          ...week,
          id: weekKey || week.id || `week-${index}`,
          startDate,
          endDate,
          weekStart: startDate,
          weekEnd: endDate,
        };
      });

      setWeeks(formattedWeeks);
      setActiveWeekId((previous) => previous || formattedWeeks[0]?.id || "");
    } catch (error) {
      console.error("FETCH RECRUITMENT HEADCOUNT WEEKS ERROR:", error);

      setWeeks([]);

      openStatusModal({
        type: "error",
        title: "Load Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to load weekly versions.",
      });
    } finally {
      setWeeksLoading(false);
    }
  }

  async function fetchAccounts() {
    if (!activeWeekStartDate || !activeWeekEndDate) {
      setAccounts([]);
      return;
    }

    try {
      setAccountsLoading(true);

      const res = await api.get("/api/workforce-hiring-plan/accounts", {
        params: {
          cluster: selectedCluster,
          startDate: activeWeekStartDate,
          endDate: activeWeekEndDate,
          _t: Date.now(),
        },
        withCredentials: true,
      });

      const accountRows = Array.isArray(res.data?.data) ? res.data.data : [];

      setAccounts(accountRows);

      setRequiredDrafts((previous) => {
        const next = { ...previous };

        accountRows.forEach((account, index) => {
          const accountName = getRecruitmentAccountName(account);
          const clusterName = getRecruitmentClusterName(account);

          const id = String(
            account.id ||
              account.accountId ||
              account.account_id ||
              account.backendAccountId ||
              account.gy_acc_id ||
              `${clusterName}-${accountName}-${index}`,
          );

          next[id] = String(
            getHeadcountNumberValue(
              account.requiredHeadcount,
              account.required_headcount,
              account.kronosRequiredHeadcount,
              account.kronos_required_headcount,
            ),
          );
        });

        return next;
      });
    } catch (error) {
      console.error("FETCH RECRUITMENT HEADCOUNT ACCOUNTS ERROR:", error);

      setAccounts([]);

      openStatusModal({
        type: "error",
        title: "Load Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to load headcount accounts.",
      });
    } finally {
      setAccountsLoading(false);
    }
  }

  useEffect(() => {
    fetchWeeks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAccounts();
    setSelectedAccount("All");
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWeekId, selectedCluster]);

  useEffect(() => {
    const accountStillExists = accountOptions.some(
      (option) => String(option.value) === String(selectedAccount),
    );

    if (!accountStillExists) {
      setSelectedAccount("All");
    }
  }, [accountOptions, selectedAccount]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedAccount, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handleClearFilters() {
    setSearch("");
    setSelectedCluster("All");
    setSelectedAccount("All");
    setStatusFilter("All");
    setCurrentPage(1);
  }

  function handlePageChange(nextPage) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);

    setCurrentPage(safePage);
  }

  function handleRequiredDraftChange(id, value) {
    setRequiredDrafts((previous) => ({
      ...previous,
      [id]: value,
    }));
  }

  async function handleSaveRequiredHeadcount(item) {
    if (!canEditRequiredHeadcount) {
      openStatusModal({
        type: "error",
        title: "Permission Denied",
        message: "Only HR or HR Admin can update required headcount here.",
      });
      return;
    }

    if (!item?.id || savingRequiredId) return;

    const rawValue =
      requiredDrafts[item.id] !== undefined
        ? requiredDrafts[item.id]
        : item.requiredHeadcount;

    const requiredHeadcount = Number(rawValue);

    if (!Number.isFinite(requiredHeadcount) || requiredHeadcount < 0) {
      openStatusModal({
        type: "error",
        title: "Invalid Required HC",
        message: "Please enter a valid required headcount.",
      });
      return;
    }

    try {
      setSavingRequiredId(item.id);

      await saveRequiredHeadcountOverride(item, requiredHeadcount);

      setRequiredDrafts((previous) => ({
        ...previous,
        [item.id]: String(requiredHeadcount),
      }));

      setAccounts((previousAccounts) =>
        previousAccounts.map((account, index) => {
          const accountName = getRecruitmentAccountName(account);
          const clusterName = getRecruitmentClusterName(account);

          const accountId = String(
            account.id ||
              account.accountId ||
              account.account_id ||
              account.backendAccountId ||
              account.gy_acc_id ||
              `${clusterName}-${accountName}-${index}`,
          );

          const sameRow =
            String(accountId) === String(item.id) ||
            (accountName.toLowerCase() ===
              String(item.accountName || item.account || "").toLowerCase() &&
              clusterName.toLowerCase() ===
                String(item.clusterName || item.cluster || "").toLowerCase());

          if (!sameRow) return account;

          return {
            ...account,
            requiredHeadcount,
            required_headcount: requiredHeadcount,
            kronosRequiredHeadcount: requiredHeadcount,
            kronos_required_headcount: requiredHeadcount,
            recruitmentSettingsStatus: "Approved",
            recruitment_settings_status: "Approved",
            status: "Approved",
          };
        }),
      );

      openStatusModal({
        type: "success",
        title: "Headcount Updated",
        message: "Required headcount was updated successfully.",
      });
    } catch (error) {
      console.error("SAVE RECRUITMENT REQUIRED HEADCOUNT ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Save Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to save required headcount.",
      });
    } finally {
      setSavingRequiredId("");
    }
  }

  return (
    <>
      <style>{`
        @keyframes sibsRecruitmentHeadcountRowReveal {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sibs-recruitment-headcount-row-reveal {
          animation: sibsRecruitmentHeadcountRowReveal 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: opacity, transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .sibs-recruitment-headcount-row-reveal {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <section
        className="relative z-[80] overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-sm"
        style={{ animationDelay: "300ms" }}
      >
        <div className="flex flex-col gap-3 rounded-t-2xl border-b border-[#E6ECF2] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <SettingsHeaderCapsules
              items={[
                { label: "Add / Reduce Employee Headcounts", icon: UsersRound },
              ]}
            />

            <h2 className="mt-3 text-base font-extrabold text-[#042C51]">
              Update Headcounts
            </h2>

            <p className="mt-1 text-xs font-semibold text-[#667085]">
              Review and update account-level required headcount.
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase text-[#164E7A]">
            {totalRecords} Records
          </span>
        </div>

        <div className="relative z-[90] overflow-visible border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-5">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(280px,1.4fr)_minmax(220px,0.8fr)_minmax(180px,0.7fr)_minmax(210px,0.8fr)_minmax(210px,0.8fr)_auto] xl:items-end">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#101828]">
                Search
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search account, cluster, status..."
                  className={inputClass("pl-11 pr-4")}
                />
              </div>
            </div>

            <CustomSelect
              label="Weekly Version"
              value={activeWeekId}
              options={weekOptions}
              placeholder="Select weekly version"
              loading={weeksLoading}
              disabled={accountsLoading}
              onChange={(nextWeekId) => {
                setActiveWeekId(nextWeekId);
                setCurrentPage(1);
              }}
              zIndex="z-60"
            />

            <CustomSelect
              label="Cluster"
              value={selectedCluster}
              options={clusterOptions}
              placeholder="All Clusters"
              disabled={accountsLoading}
              onChange={(nextCluster) => {
                setSelectedCluster(nextCluster);
                setSelectedAccount("All");
                setCurrentPage(1);
              }}
              zIndex="z-50"
            />

            <CustomSelect
              label="Account"
              value={selectedAccount}
              options={accountOptions}
              placeholder="All Accounts"
              loading={accountsLoading}
              disabled={weeksLoading}
              onChange={(nextAccount) => {
                setSelectedAccount(nextAccount);
                setCurrentPage(1);
              }}
              zIndex="z-40"
            />

            <CustomSelect
              label="Recruitment Settings Status"
              value={statusFilter}
              options={statusOptions}
              placeholder="All Status"
              disabled={accountsLoading}
              onChange={(nextStatus) => {
                setStatusFilter(nextStatus);
                setCurrentPage(1);
              }}
              zIndex="z-30"
            />

            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#D6DEE8] bg-[#F8FAFC] px-4 text-xs font-extrabold text-sibs-tertiary-5 transition-all duration-200 hover:border-[#FF5C28]/30 hover:bg-white hover:text-sibs-primary-1 active:scale-[0.98]"
            >
              <Filter size={17} />
              Clear
            </button>
          </div>
        </div>

        <div>
          <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5 lg:hidden">
            {accountsLoading || weeksLoading ? (
              <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                Loading recruitment headcount records...
              </div>
            ) : paginatedAccounts.length > 0 ? (
              paginatedAccounts.map((item, index) => {
                const metrics = getRecruitmentHeadcountMetrics(item);
                const requiredInputValue =
                  requiredDrafts[item.id] !== undefined
                    ? requiredDrafts[item.id]
                    : String(metrics.requiredHeadcount);

                const isSaving = savingRequiredId === item.id;

                return (
                  <div
                    key={item.id || index}
                    className="sibs-page-card-in w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-sibs-primary-1">
                          {item.cluster || "—"}
                        </p>

                        <h3 className="mt-1 text-sm font-bold text-[#101828]">
                          {item.account || "—"}
                        </h3>

                        <p className="mt-1 break-words text-xs font-semibold text-sibs-tertiary-5">
                          HC Needs:{" "}
                          {formatHeadcountNumber(
                            metrics.actualHeadcountNeeds,
                            2,
                          )}{" "}
                          / Leads:{" "}
                          {formatHeadcountNumber(metrics.leadsToInterview)}
                        </p>
                      </div>

                      <StatusPill
                        status={
                          item.recruitmentSettingsStatus ||
                          item.recruitment_settings_status ||
                          "Kronos"
                        }
                        fallback="Kronos"
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <RecruitmentHeadcountMobileMetric
                        label="Required HC"
                        value={
                          canEditRequiredHeadcount ? (
                            <input
                              type="number"
                              min="0"
                              value={requiredInputValue}
                              onChange={(e) =>
                                handleRequiredDraftChange(
                                  item.id,
                                  e.target.value,
                                )
                              }
                              className="h-9 w-full rounded-[10px] border border-[#D0D5DD] bg-white px-3 text-xs font-extrabold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                            />
                          ) : (
                            formatHeadcountNumber(metrics.requiredHeadcount)
                          )
                        }
                      />

                      <RecruitmentHeadcountMobileMetric
                        label="Actual HC"
                        value={formatHeadcountNumber(metrics.actualHeadcount)}
                        valueClassName="text-[#344054]"
                      />

                      <RecruitmentHeadcountMobileMetric
                        label="Required Buffer"
                        value={formatHeadcountNumber(
                          metrics.requiredBufferHeadcount,
                          2,
                        )}
                      />

                      <RecruitmentHeadcountMobileMetric
                        label="Buffer %"
                        value={formatHeadcountPercent(
                          metrics.requiredBufferPercent,
                        )}
                        valueClassName="text-[#344054]"
                      />

                      <RecruitmentHeadcountMobileMetric
                        label="Actual Buffer"
                        value={formatHeadcountNumber(metrics.actualBufferCount)}
                        valueClassName={getActualBufferClass(
                          metrics.actualBufferCount,
                        )}
                      />

                      <RecruitmentHeadcountMobileMetric
                        label="Actual Buffer %"
                        value={formatHeadcountPercent(
                          metrics.actualBufferPercent,
                        )}
                        valueClassName={getActualBufferClass(
                          metrics.actualBufferPercent,
                        )}
                      />

                      <RecruitmentHeadcountMobileMetric
                        label="OPS PRF"
                        value={formatHeadcountNumber(metrics.opsPrf)}
                      />

                      <RecruitmentHeadcountMobileMetric
                        label="Hiring Rate"
                        value={formatHeadcountPercent(metrics.hiringRate)}
                        valueClassName="text-[#344054]"
                      />
                    </div>

                    <div className="mt-3 rounded-xl bg-[#F8FAFC] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        Status Note
                      </p>

                      <p className="mt-1 line-clamp-3 text-xs font-semibold text-[#344054]">
                        {item.statusNote || "—"}
                      </p>
                    </div>

                    {canEditRequiredHeadcount && (
                      <button
                        type="button"
                        onClick={() => handleSaveRequiredHeadcount(item)}
                        disabled={isSaving || accountsLoading}
                        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 text-xs font-extrabold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        Save Required Headcount
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                No recruitment headcount records found.
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="overflow-hidden bg-white px-4 py-4 sm:px-5 sm:pb-5">
              <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
                <table className="w-full min-w-[1120px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#E6ECF2] bg-[#F8FAFC] text-[9px] font-extrabold uppercase tracking-[0.04em] text-[#7B8DB3]">
                      <th className="w-[21%] px-3 py-3">Account</th>
                      <th className="w-[16%] px-3 py-3">
                        Required / Actual HC
                      </th>
                      <th className="w-[19%] px-3 py-3">Buffer</th>
                      <th className="w-[14%] px-3 py-3">HC Needs / Leads</th>
                      <th className="w-[11%] px-3 py-3">Hiring Rate</th>
                      <th className="w-[11%] px-3 py-3">Status</th>
                      <th className="w-[8%] px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {accountsLoading || weeksLoading ? (
                      Array.from({
                        length: RECRUITMENT_HEADCOUNT_PAGE_LIMIT,
                      }).map((_, index) => (
                        <tr key={index}>
                          <td
                            colSpan={7}
                            className="border-b border-[#E6ECF2] px-3 py-3"
                          >
                            <div className="h-4 w-full animate-sibs-pulse rounded bg-gray-200" />
                          </td>
                        </tr>
                      ))
                    ) : paginatedAccounts.length > 0 ? (
                      paginatedAccounts.map((item, index) => {
                        const metrics = getRecruitmentHeadcountMetrics(item);
                        const requiredInputValue =
                          requiredDrafts[item.id] !== undefined
                            ? requiredDrafts[item.id]
                            : String(metrics.requiredHeadcount);

                        const isSaving = savingRequiredId === item.id;

                        return (
                          <tr
                            key={item.id || index}
                            className="sibs-recruitment-headcount-row-reveal transition-all duration-200 hover:bg-[#FAFBFC]"
                            style={{
                              animationDelay: `${Math.min(index, 10) * 36}ms`,
                            }}
                          >
                            <td className="border-b border-[#E6ECF2] px-3 py-3">
                              <p className="max-w-[220px] truncate text-[11px] font-extrabold text-[#042C51]">
                                {item.account || "—"}
                              </p>

                              <p className="mt-0.5 max-w-[220px] truncate text-[10px] font-semibold text-sibs-tertiary-5">
                                {item.cluster || "—"}
                              </p>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-3 py-3">
                              {canEditRequiredHeadcount ? (
                                <div>
                                  <p className="mb-0.5 text-[9px] font-bold uppercase tracking-normal text-sibs-tertiary-5">
                                    Required
                                  </p>

                                  <input
                                    type="number"
                                    min="0"
                                    value={requiredInputValue}
                                    onChange={(e) =>
                                      handleRequiredDraftChange(
                                        item.id,
                                        e.target.value,
                                      )
                                    }
                                    className="h-8 w-20 rounded-lg border border-[#D0D5DD] bg-white px-2 text-center text-[10px] font-extrabold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-2 focus:ring-sibs-primary-1/10"
                                  />
                                </div>
                              ) : (
                                <p className="text-[10px] font-semibold text-[#344054]">
                                  Required:{" "}
                                  <span className="text-sibs-primary-1">
                                    {formatHeadcountNumber(
                                      metrics.requiredHeadcount,
                                    )}
                                  </span>
                                </p>
                              )}

                              <p className="mt-1 text-[10px] font-semibold text-sibs-tertiary-5">
                                Actual:{" "}
                                {formatHeadcountNumber(metrics.actualHeadcount)}
                              </p>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-3 py-3">
                              <p className="text-[10px] font-extrabold leading-4 text-sibs-primary-1">
                                Req. Buffer:{" "}
                                {formatHeadcountNumber(
                                  metrics.requiredBufferHeadcount,
                                  2,
                                )}
                              </p>

                              <p className="mt-0.5 text-[10px] font-semibold leading-4 text-[#344054]">
                                Req. Buffer %:{" "}
                                {formatHeadcountPercent(
                                  metrics.requiredBufferPercent,
                                )}
                              </p>

                              <p
                                className={`mt-0.5 text-[10px] font-bold leading-4 ${getActualBufferClass(
                                  metrics.actualBufferCount,
                                )}`}
                              >
                                Actual Buffer:{" "}
                                {formatHeadcountNumber(
                                  metrics.actualBufferCount,
                                )}{" "}
                                /{" "}
                                {formatHeadcountPercent(
                                  metrics.actualBufferPercent,
                                )}
                              </p>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-3 py-3">
                              <p className="text-[10px] font-extrabold leading-4 text-violet-700">
                                Needs:{" "}
                                {formatHeadcountNumber(
                                  metrics.actualHeadcountNeeds,
                                  2,
                                )}
                              </p>

                              <p className="mt-0.5 text-[10px] font-semibold leading-4 text-[#344054]">
                                Leads:{" "}
                                {formatHeadcountNumber(
                                  metrics.leadsToInterview,
                                )}
                              </p>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-3 py-3 text-[10px] font-semibold text-[#344054]">
                              {formatHeadcountPercent(metrics.hiringRate)}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-3 py-3">
                              <div className="[&>span]:min-w-[68px] [&>span]:px-2 [&>span]:py-0.5 [&>span]:text-[9px]">
                                <StatusPill
                                  status={
                                    item.recruitmentSettingsStatus ||
                                    item.recruitment_settings_status ||
                                    "Kronos"
                                  }
                                  fallback="Kronos"
                                />
                              </div>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-3 py-3 text-right">
                              {canEditRequiredHeadcount ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSaveRequiredHeadcount(item)
                                  }
                                  disabled={isSaving || accountsLoading}
                                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[10px] font-extrabold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isSaving ? (
                                    <Loader2
                                      size={13}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Save size={13} />
                                  )}
                                  Save
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-sibs-tertiary-5">
                                  View only
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-10 text-center text-xs font-bold text-gray-500"
                        >
                          No recruitment headcount records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-b-2xl border-t border-[#E6ECF2] bg-white px-4 py-4 sm:px-5 md:flex-row md:items-center">
            <p className="text-xs font-semibold text-sibs-tertiary-5">
              Showing {showingFrom} to {showingTo} of {totalRecords} headcount
              records
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || accountsLoading || weeksLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-xs font-extrabold text-sibs-tertiary-5 transition hover:bg-[#F8FAFC] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span
                aria-current="page"
                className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-[#FF5C28] px-3 text-xs font-extrabold text-white shadow-sm"
              >
                {currentPage}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={
                  currentPage >= totalPages || accountsLoading || weeksLoading
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#BFD8F1] bg-white px-4 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
      />
    </>
  );
}

export default UpdateHeadcountsPanel;
