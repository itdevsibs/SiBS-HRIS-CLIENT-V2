import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/layout/Header";
import api from "../../lib/axios/api-template";
import StatusModal from "../../components/modals/StatusModal";
import PercentageRiskGraphTable from "../../components/tables/WeeklyHiringPlan/PercentageRiskGraphTable";
import WeeklyHiringAccountsTable from "../../components/tables/WeeklyHiringPlan/WeeklyHiringAccountsTable";
import WeeklyVersionTable from "../../components/tables/WeeklyHiringPlan/WeeklyVersionTable";
import HeadcountTable from "../../components/tables/WeeklyHiringPlan/HeadcountTable";
import ViewPlanModal from "../../components/modals/weeklyHiringPlan/ViewPlanModal";
import KPISnapshotModal from "../../components/modals/weeklyHiringPlan/KPISnapshotModal";
import ActionItemModal from "../../components/modals/weeklyHiringPlan/ActionItemModal";

import {
  getWeeklyHiringPlanAccounts,
  getWeeklyHiringPlanWeeks,
} from "../../lib/axios/getWeeklyHiringPlan";

import { useUser } from "../../services/context/UserContext";

const FULL_WEEKLY_ACCESS_ROLES = ["ta", "hr", "hr_admin", "super_admin"];

const initialActionItemForm = {
  actionItem: "",
  owner: "",
  deadline: "",
  status: "Pending",
  remarks: "",
};

function getText(value) {
  return String(value || "").trim();
}

function getAccountIdFromAny(item) {
  return getText(
    item?.backendAccountId ||
      item?.accountId ||
      item?.account_id ||
      item?.gy_acc_id ||
      item?.id ||
      ""
  );
}

function getAccountNameFromAny(item) {
  return getText(
    item?.accountName ||
      item?.account ||
      item?.gy_acc_name ||
      item?.account_name ||
      ""
  );
}

function getGhlNameFromAny(item) {
  return getText(
    item?.ghlName || item?.gy_acc_ghl_name || item?.ghl_name || ""
  );
}

function getClusterFromAny(item) {
  const accountName = getAccountNameFromAny(item);
  const ghlName = getGhlNameFromAny(item);
  const text = `${accountName} ${ghlName}`.toLowerCase();

  if (
    text.includes("cd -") ||
    text.includes("cd-") ||
    text.includes("coast dental")
  ) {
    return "Coast Dental";
  }

  if (text.includes("us visa")) {
    return "US Visa";
  }

  if (
    text.includes("sme-") ||
    text.includes("sme -") ||
    text.includes("frontsteps") ||
    text.includes("front steps")
  ) {
    return "SME";
  }

  if (text.includes("yomdel")) {
    return "Yomdel";
  }

  const explicitCluster = getText(item?.clusterName || item?.cluster);

  if (explicitCluster) return explicitCluster;

  return "Corporate";
}

function getBackendNumber(record, keys, fallback = 0) {
  for (const key of keys) {
    const rawValue = record?.[key];

    if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
      const numberValue = Number(rawValue);

      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }
  }

  const fallbackNumber = Number(fallback || 0);

  return Number.isFinite(fallbackNumber) ? fallbackNumber : 0;
}

function calculatePipelineStatus(item) {
  const requiredHeadcount = Number(item.requiredHeadcount || 0);
  const actualHeadcount = Number(item.actualHeadcount || 0);
  const leadsToInterview = Number(item.leadsToInterview || 0);
  const opsPrf = Number(item.opsPrf || 0);

  if (requiredHeadcount <= 0) return "Pending";

  if (opsPrf > 0 || leadsToInterview > 0) {
    return "At Risk";
  }

  if (actualHeadcount >= requiredHeadcount) {
    return "Completed";
  }

  const gap = requiredHeadcount - actualHeadcount;

  if (leadsToInterview === 0 && gap > 0) {
    return "Delayed";
  }

  return "On Track";
}

async function saveRequiredHeadcount(payload) {
  const res = await api.post("/api/weekly-hiring-plan/headcount", payload, {
    withCredentials: true,
  });

  return res.data;
}

async function updateWeeklyHiringPlanFile(payload) {
  const formData = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (key === "uploadedFile") return;

    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  if (payload?.uploadedFile) {
    formData.append("uploadedFile", payload.uploadedFile);
  }

  const res = await api.post("/api/weekly-hiring-plan/headcount/file", formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

async function openWeeklyHiringPlanFile({ sibsId, filename }) {
  if (!sibsId || !filename) {
    throw new Error("Missing file information.");
  }

  const res = await api.get(
    `/api/weekly-hiring-plan/file/${encodeURIComponent(
      sibsId
    )}/${encodeURIComponent(filename)}`,
    {
      responseType: "blob",
      withCredentials: true,
    }
  );

  const blobUrl = window.URL.createObjectURL(res.data);
  window.open(blobUrl, "_blank", "noopener,noreferrer");

  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 60_000);
}

function buildWeeklyAccess(user) {
  const role = String(user?.role || "").toLowerCase();
  const hasFullAccess = FULL_WEEKLY_ACCESS_ROLES.includes(role);

  const assignedAccounts = Array.isArray(user?.assignedAccounts)
    ? user.assignedAccounts
    : [];

  const assignedAccountIds = new Set(
    assignedAccounts
      .map((account) => getAccountIdFromAny(account))
      .filter(Boolean)
  );

  const assignedAccountNames = new Set(
    assignedAccounts
      .map((account) => getAccountNameFromAny(account))
      .filter(Boolean)
  );

  const assignedClusterNames = new Set(
    assignedAccounts
      .map((account) => getClusterFromAny(account))
      .filter(Boolean)
  );

  return {
    role,
    hasFullAccess,
    assignedAccounts,
    assignedAccountIds,
    assignedAccountNames,
    assignedClusterNames,
  };
}

export default function WeeklyHiringPlanPage() {
  const { user } = useUser();

  const mainScrollRef = useRef(null);
  const weekDropdownRef = useRef(null);
  const clusterDropdownRef = useRef(null);
  const accountDropdownRef = useRef(null);

  const canEditRequiredHeadcount = [5, 7].includes(Number(user?.adminAccess));

  const [weeklyVersions, setWeeklyVersions] = useState([]);
  const [activeWeekId, setActiveWeekId] = useState("");
  const [weeksLoading, setWeeksLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [weekSearch, setWeekSearch] = useState("");
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);

  const [selectedClusters, setSelectedClusters] = useState(["All"]);
  const [showClusterDropdown, setShowClusterDropdown] = useState(false);

  const [selectedAccounts, setSelectedAccounts] = useState(["All"]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");

  const [selectedHiringPlanPercent, setSelectedHiringPlanPercent] =
    useState(5);

  const [accountOptions, setAccountOptions] = useState([
    {
      id: "All",
      accountName: "All Accounts",
      ghlName: "",
    },
  ]);

  const [remoteAccounts, setRemoteAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [actionItemTarget, setActionItemTarget] = useState(null);
  const [actionItemForm, setActionItemForm] = useState(initialActionItemForm);
  const [showKpiSnapshot, setShowKpiSnapshot] = useState(false);

  const [requiredInputs, setRequiredInputs] = useState({});
  const [savingRequiredId, setSavingRequiredId] = useState("");
  const [requiredSaveMessage, setRequiredSaveMessage] = useState("");
  const [weeklyPlanFiles, setWeeklyPlanFiles] = useState({});
  const [savingFileId, setSavingFileId] = useState("");
  const [openingFile, setOpeningFile] = useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const activeWeek =
    weeklyVersions.find((week) => week.id === activeWeekId) ||
    weeklyVersions[0];

  const isLocked = !!activeWeek?.locked;
  const activeWeekStartDate = activeWeek?.startDate || "";
  const activeWeekEndDate = activeWeek?.endDate || "";

  const weeklyAccess = useMemo(() => buildWeeklyAccess(user), [user]);

  const userAccessReady = useMemo(() => {
    if (!user) return false;

    const role = String(user?.role || "").toLowerCase();

    if (FULL_WEEKLY_ACCESS_ROLES.includes(role)) {
      return true;
    }

    return Array.isArray(user?.assignedAccounts);
  }, [user]);

  const filteredWeeklyVersions = useMemo(() => {
    const keyword = weekSearch.trim().toLowerCase();

    if (!keyword) return weeklyVersions;

    return weeklyVersions.filter((week) => {
      const searchableText = [
        week.label,
        week.weekRange,
        week.startDate,
        week.endDate,
        week.locked ? "Locked" : "Editable",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [weeklyVersions, weekSearch]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        weekDropdownRef.current &&
        !weekDropdownRef.current.contains(e.target)
      ) {
        setShowWeekDropdown(false);
      }

      if (
        clusterDropdownRef.current &&
        !clusterDropdownRef.current.contains(e.target)
      ) {
        setShowClusterDropdown(false);
      }

      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(e.target)
      ) {
        setShowAccountDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function fetchWeeklyVersions() {
      try {
        setWeeksLoading(true);

        const weeks = await getWeeklyHiringPlanWeeks();

        const formattedWeeks = (weeks || []).map((week) => ({
          ...week,
          records: [],
        }));

        if (!ignore) {
          setWeeklyVersions(formattedWeeks);
          setActiveWeekId(formattedWeeks[0]?.id || "");
        }
      } catch (error) {
        console.error("FETCH WEEKLY VERSIONS ERROR:", error);

        if (!ignore) {
          setWeeklyVersions([]);
          setActiveWeekId("");
        }
      } finally {
        if (!ignore) {
          setWeeksLoading(false);
        }
      }
    }

    fetchWeeklyVersions();

    return () => {
      ignore = true;
    };
  }, []);

  function isAllClustersSelected() {
    return selectedClusters.includes("All") || selectedClusters.length === 0;
  }

  function isAllAccountsSelected() {
    return selectedAccounts.includes("All") || selectedAccounts.length === 0;
  }

  function handleToggleCluster(cluster) {
    setSelectedClusters((prev) => {
      if (cluster === "All") {
        return ["All"];
      }

      const current = prev.includes("All") ? [] : prev;
      const alreadySelected = current.includes(cluster);

      const next = alreadySelected
        ? current.filter((item) => item !== cluster)
        : [...current, cluster];

      return next.length > 0 ? next : ["All"];
    });

    setSelectedAccounts(["All"]);
    setAccountSearch("");
  }

  function handleToggleAccount(accountName) {
    setSelectedAccounts((prev) => {
      if (accountName === "All") {
        return ["All"];
      }

      const current = prev.includes("All") ? [] : prev;
      const alreadySelected = current.includes(accountName);

      const next = alreadySelected
        ? current.filter((item) => item !== accountName)
        : [...current, accountName];

      return next.length > 0 ? next : ["All"];
    });
  }

  async function fetchAccountsByCluster({ resetAccountFilter = true } = {}) {
    if (!activeWeekStartDate || !activeWeekEndDate) {
      return [];
    }

    if (!userAccessReady) {
      return [];
    }

    try {
      setAccountsLoading(true);

      let accounts = [];

      if (isAllClustersSelected()) {
        accounts = await getWeeklyHiringPlanAccounts(
          "All",
          activeWeekStartDate,
          activeWeekEndDate
        );
      } else {
        const results = await Promise.all(
          selectedClusters.map((cluster) =>
            getWeeklyHiringPlanAccounts(
              cluster,
              activeWeekStartDate,
              activeWeekEndDate
            )
          )
        );

        accounts = results.flat();
      }

      if (!weeklyAccess.hasFullAccess) {
        const assignedAccountIds = weeklyAccess.assignedAccountIds;
        const assignedAccountNames = weeklyAccess.assignedAccountNames;

        accounts = (accounts || []).filter((account) => {
          const accountId = getAccountIdFromAny(account);
          const accountName = getAccountNameFromAny(account);

          return (
            assignedAccountIds.has(accountId) ||
            assignedAccountNames.has(accountName)
          );
        });
      }

      const uniqueAccountsMap = new Map();

      (accounts || []).forEach((account) => {
        const accountId = Number(account?.id || account?.accountId || 0);
        const accountName = String(
          account?.accountName || account?.account || ""
        ).trim();
        const clusterName = getClusterFromAny(account);

        if (!accountId || !accountName) return;

        const key = `${accountId}-${accountName.toLowerCase()}-${clusterName.toLowerCase()}`;

        if (!uniqueAccountsMap.has(key)) {
          uniqueAccountsMap.set(key, {
            ...account,
            clusterName,
          });
        }
      });

      accounts = Array.from(uniqueAccountsMap.values());

      const uniqueAccountOptionsMap = new Map();

      accounts.forEach((account) => {
        const accountId = Number(account?.id || account?.accountId || 0);
        const accountName = String(
          account?.accountName || account?.account || ""
        ).trim();

        if (!accountId || !accountName) return;

        const key = accountName.toLowerCase();

        if (!uniqueAccountOptionsMap.has(key)) {
          uniqueAccountOptionsMap.set(key, {
            ...account,
            clusterName: getClusterFromAny(account),
          });
        }
      });

      setRemoteAccounts(accounts || []);

      setAccountOptions([
        {
          id: "All",
          accountName: "All Accounts",
          ghlName: "",
        },
        ...Array.from(uniqueAccountOptionsMap.values()),
      ]);

      if (resetAccountFilter) {
        setSelectedAccounts(["All"]);
      }

      return accounts || [];
    } catch (error) {
      console.error("FETCH ACCOUNTS BY CLUSTER ERROR:", error);

      setRemoteAccounts([]);
      setAccountOptions([
        {
          id: "All",
          accountName: "All Accounts",
          ghlName: "",
        },
      ]);

      if (resetAccountFilter) {
        setSelectedAccounts(["All"]);
      }

      return [];
    } finally {
      setAccountsLoading(false);
    }
  }

  useEffect(() => {
    if (activeWeekStartDate && activeWeekEndDate && userAccessReady) {
      fetchAccountsByCluster();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedClusters,
    activeWeekStartDate,
    activeWeekEndDate,
    userAccessReady,
    user?.role,
    user?.adminAccess,
    user?.assignedAccounts,
  ]);

  const displayData = useMemo(() => {
    return (remoteAccounts || []).map((account, index) => {
      const accountName =
        account.accountName ||
        account.account ||
        account.gy_acc_name ||
        "Unassigned Account";

      const accountCluster =
        getClusterFromAny(account) ||
        (isAllClustersSelected()
          ? "Unassigned"
          : selectedClusters.length === 1
            ? selectedClusters[0]
            : "Unassigned");

      const requiredHeadcount = getBackendNumber(account, [
        "requiredHeadcount",
        "required_headcount",
      ]);

      const actualHeadcount = getBackendNumber(account, [
        "actualHeadcount",
        "actual_headcount",
      ]);

      const bufferHeadcount = getBackendNumber(account, [
        "bufferHeadcount",
        "buffer_headcount",
        "buffer_head_count",
      ]);

      const bufferPercent = getBackendNumber(account, [
        "bufferPercent",
        "buffer_percent",
      ]);

      const opsPrf = getBackendNumber(account, ["opsPrf", "ops_prf"]);

      const projectedEmployeeNeeds = getBackendNumber(
        account,
        [
          "projectedEmployeeNeeds",
          "projected_employee_needs",
          "projectedNeeds",
          "projected_needs",
        ],
        opsPrf
      );

      const row = {
        id: `db-${accountCluster}-${account.id || account.accountId || index}`,
        backendAccountId: account.id || account.accountId || account.gy_acc_id,
        accountId: account.id || account.accountId || account.gy_acc_id,
        week: activeWeek?.label || "Current Week",
        cluster: accountCluster,
        account: accountName,

        requiredHeadcount,
        actualHeadcount,

        bufferHeadcount,
        bufferPercent,
        missingHeadcount: requiredHeadcount + bufferHeadcount - actualHeadcount,

        scheduledCount: Number(account.scheduledCount || 0),
        presentCount: Number(account.presentCount || 0),

        absenteeismCount:
          account.absenteeismOpsCount !== undefined &&
          account.absenteeismOpsCount !== null
            ? Number(account.absenteeismOpsCount || 0)
            : Number(account.absenteeismCount || 0),

        absenteeismPercent: Number(account.absenteeismPercent || 0),

        attritionPastCount: Number(account.attritionPastCount || 0),
        attritionPastPercent: Number(account.attritionPastPercent || 0),

        opsPrf,
        projectedEmployeeNeeds,
        projected_employee_needs: projectedEmployeeNeeds,

        attritionFstToPstCount: Number(account.attritionFstToPstCount || 0),
        attritionFstToPstPercent: Number(account.attritionFstToPstPercent || 0),

        attritionNhoToFstPstCount: Number(
          account.attritionNhoToFstPstCount || 0
        ),
        attritionNhoToFstPstPercent: Number(
          account.attritionNhoToFstPstPercent || 0
        ),

        attritionInterviewToNhoCount: Number(
          account.attritionInterviewToNhoCount || 0
        ),
        attritionInterviewToNhoPercent: Number(
          account.attritionInterviewToNhoPercent || 0
        ),

        leadsToInterview: getBackendNumber(account, [
          "leadsToInterview",
          "leads_to_interview",
        ]),
        leads_to_interview: getBackendNumber(account, [
          "leadsToInterview",
          "leads_to_interview",
        ]),

        hiringRate: getBackendNumber(account, ["hiringRate", "hiring_rate"], 5),
        hiring_rate: getBackendNumber(
          account,
          ["hiringRate", "hiring_rate"],
          5
        ),

        pipelineStatus: account.pipelineStatus || "Pending",
        statusNote: account.headcountRemarks || account.departmentName || "-",
        owner: account.owner || "-",
        actionItems: account.actionItems || [],
        departmentName: account.departmentName || "",
        priorityLevel: account.priorityLevel || "",
        headcountRemarks: account.headcountRemarks || "",
        uploadedFile: account.uploadedFile || account.uploaded_file || "",
        uploadedBySibsId:
          account.uploadedBySibsId || account.uploaded_by_sibs_id || "",
        lastEditSibsId: account.lastEditSibsId || account.last_edit_sibs_id || "",
        lastEditName: account.lastEditName || account.last_edit_name || "",
      };

      return {
        ...row,
        pipelineStatus: account.pipelineStatus || calculatePipelineStatus(row),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWeek?.label, selectedClusters, remoteAccounts]);

  const hiringPlanAdjustedData = useMemo(() => {
    const percent = Number(selectedHiringPlanPercent || 5);
    const decimalPercent = percent > 0 ? percent / 100 : 0.05;

    return displayData.map((item) => {
      const projectedEmployeeNeeds = Number(
        item.projectedEmployeeNeeds ??
          item.projected_employee_needs ??
          item.opsPrf ??
          item.ops_prf ??
          0
      );

      const leadsToInterview =
        decimalPercent > 0
          ? Math.round(projectedEmployeeNeeds / decimalPercent)
          : 0;

      return {
        ...item,

        hiringPlanPercent: percent,
        hiring_plan_percent: percent,

        projectedEmployeeNeeds,
        projected_employee_needs: projectedEmployeeNeeds,

        leadsToInterview,
        leads_to_interview: leadsToInterview,

        hiringRate: percent,
        hiring_rate: percent,

        pipelineStatus: calculatePipelineStatus({
          ...item,
          projectedEmployeeNeeds,
          leadsToInterview,
          hiringRate: percent,
        }),
      };
    });
  }, [displayData, selectedHiringPlanPercent]);

  const managerDisplayData = useMemo(() => {
    if (weeklyAccess.hasFullAccess) {
      return hiringPlanAdjustedData;
    }

    const assignedAccounts = weeklyAccess.assignedAccounts || [];

    if (!assignedAccounts.length) {
      return [];
    }

    const existingAccountKeys = new Set(
      hiringPlanAdjustedData
        .map((item) =>
          String(getAccountIdFromAny(item) || item.account || "")
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    );

    const emptyAssignedRows = assignedAccounts
      .map((account) => {
        const accountId = getAccountIdFromAny(account);
        const accountName = getAccountNameFromAny(account);
        const ghlName = getGhlNameFromAny(account);
        const cluster = getClusterFromAny(account);

        const accountKey = String(accountId || accountName)
          .trim()
          .toLowerCase();

        if (!accountName || existingAccountKeys.has(accountKey)) {
          return null;
        }

        return {
          id: `assigned-empty-${accountId || accountName}`,
          backendAccountId: accountId,
          accountId,
          isAssignedEmptyRow: true,

          week: activeWeek?.label || "Current Week",
          weekId: activeWeek?.id || activeWeekId || "",

          cluster,
          account: accountName,

          requiredHeadcount: 0,
          actualHeadcount: 0,
          bufferHeadcount: 0,
          bufferPercent: 0,
          missingHeadcount: 0,

          scheduledCount: 0,
          presentCount: 0,

          absenteeismCount: 0,
          absenteeismPercent: 0,

          attritionPastCount: 0,
          attritionPastPercent: 0,

          opsPrf: 0,
          projectedEmployeeNeeds: 0,
          projected_employee_needs: 0,

          attritionFstToPstCount: 0,
          attritionFstToPstPercent: 0,

          attritionNhoToFstPstCount: 0,
          attritionNhoToFstPstPercent: 0,

          attritionInterviewToNhoCount: 0,
          attritionInterviewToNhoPercent: 0,

          leadsToInterview: 0,
          leads_to_interview: 0,

          hiringPlanPercent: Number(selectedHiringPlanPercent || 5),
          hiring_plan_percent: Number(selectedHiringPlanPercent || 5),
          hiringRate: Number(selectedHiringPlanPercent || 5),
          hiring_rate: Number(selectedHiringPlanPercent || 5),

          pipelineStatus: "Pending",
          statusNote: ghlName || "No weekly hiring plan record yet.",
          owner: "-",
          actionItems: [],
          departmentName: account.departmentName || account.department || "",
          priorityLevel: "",
          headcountRemarks: "",
          uploadedFile: "",
          uploadedBySibsId: "",
          lastEditSibsId: "",
          lastEditName: "",
        };
      })
      .filter(Boolean);

    return [...hiringPlanAdjustedData, ...emptyAssignedRows];
  }, [
    hiringPlanAdjustedData,
    weeklyAccess,
    activeWeek?.label,
    activeWeek?.id,
    activeWeekId,
    selectedHiringPlanPercent,
  ]);

  useEffect(() => {
    const nextInputs = {};

    managerDisplayData.forEach((item) => {
      nextInputs[item.id] = String(item.requiredHeadcount ?? 0);
    });

    setRequiredInputs(nextInputs);
  }, [managerDisplayData]);

  const filteredPlans = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return managerDisplayData.filter((item) => {
      const cluster = item.cluster || "Unassigned Cluster";
      const account = item.account || "Unassigned Account";
      const accountId = getAccountIdFromAny(item);

      const matchesAssignedAccount =
        weeklyAccess.hasFullAccess ||
        weeklyAccess.assignedAccountNames.has(account) ||
        (accountId && weeklyAccess.assignedAccountIds.has(accountId));

      const matchesAssignedCluster =
        weeklyAccess.hasFullAccess ||
        weeklyAccess.assignedClusterNames.has(cluster);

      const matchesUserAccess =
        weeklyAccess.hasFullAccess ||
        (matchesAssignedAccount && matchesAssignedCluster);

      const matchesCluster =
        isAllClustersSelected() || selectedClusters.includes(cluster);

      const matchesAccount =
        isAllAccountsSelected() || selectedAccounts.includes(account);

      const matchesKeyword =
        !keyword ||
        String(item.week || activeWeek?.label || "")
          .toLowerCase()
          .includes(keyword) ||
        cluster.toLowerCase().includes(keyword) ||
        account.toLowerCase().includes(keyword) ||
        String(item.pipelineStatus || "").toLowerCase().includes(keyword) ||
        String(item.statusNote || "").toLowerCase().includes(keyword) ||
        String(item.owner || "").toLowerCase().includes(keyword);

      return (
        matchesUserAccess &&
        matchesCluster &&
        matchesAccount &&
        matchesKeyword
      );
    });
  }, [
    managerDisplayData,
    activeWeek?.label,
    search,
    selectedClusters,
    selectedAccounts,
    weeklyAccess,
  ]);

  const activeWeekIndex = weeklyVersions.findIndex(
    (week) => week.id === activeWeekId
  );

  const previousWeek = weeklyVersions[activeWeekIndex + 1];

  const previousSelectedPlan = selectedPlan
    ? previousWeek?.records?.find(
        (record) =>
          record.account === selectedPlan.account &&
          record.cluster === selectedPlan.cluster
      )
    : null;

  function openStatusModal({
    type = "success",
    title = "",
    message = "",
    closeViewModalOnSuccess = false,
  }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });

    if (type === "success" && closeViewModalOnSuccess) {
      setSelectedPlan(null);
    }
  }

  function closeStatusModal() {
    setStatusModal((current) => ({
      ...current,
      open: false,
    }));
  }

  function handleRequiredInputChange(itemId, value) {
    setRequiredInputs((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  }

  function handleWeeklyPlanFileChange(itemId, file) {
    setWeeklyPlanFiles((prev) => ({
      ...prev,
      [itemId]: file,
    }));
  }

  async function handleSaveRequiredHeadcount(item) {
    if (!canEditRequiredHeadcount) {
      openStatusModal({
        type: "error",
        title: "Permission Denied",
        message: "You do not have permission to edit required headcount.",
      });
      return;
    }

    if (!activeWeekStartDate || !activeWeekEndDate) {
      openStatusModal({
        type: "error",
        title: "Unable to Save",
        message: "Missing weekly date range. Please select a valid weekly version.",
      });
      return;
    }

    const rawValue = requiredInputs[item.id];

    const requiredHeadcount =
      rawValue === "" || rawValue === null || rawValue === undefined
        ? null
        : Number(rawValue);

    if (requiredHeadcount !== null && !Number.isFinite(requiredHeadcount)) {
      openStatusModal({
        type: "error",
        title: "Invalid Input",
        message: "Invalid required headcount.",
      });
      return;
    }

    try {
      setSavingRequiredId(item.id);
      setRequiredSaveMessage("");

      await saveRequiredHeadcount({
        weekNumber: activeWeek?.weekNumber || null,
        weekLabel: activeWeek?.label || null,
        weekStart: activeWeekStartDate,
        weekEnd: activeWeekEndDate,
        clusterName: item.cluster,
        accountName: item.account,
        requiredHeadcount,
        actualHeadcount: Number(item.actualHeadcount || 0),
        priorityLevel: item.priorityLevel || null,
        remarks: item.headcountRemarks || null,
      });

      await fetchAccountsByCluster({ resetAccountFilter: false });

      openStatusModal({
        type: "success",
        title: "Required Headcount Saved",
        message: `Required headcount for ${item.account} was saved successfully.`,
        closeViewModalOnSuccess: true,
      });
    } catch (error) {
      console.error("SAVE REQUIRED HEADCOUNT ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Save Failed",
        message:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to save required headcount.",
      });
    } finally {
      setSavingRequiredId("");
    }
  }

  async function handleUpdateWeeklyPlanFile(item) {
    if (!canEditRequiredHeadcount) {
      openStatusModal({
        type: "error",
        title: "Permission Denied",
        message:
          "You do not have permission to update the weekly hiring plan file.",
      });
      return;
    }

    const file = weeklyPlanFiles[item.id];

    if (!file) {
      openStatusModal({
        type: "error",
        title: "No File Selected",
        message: "Please select a file before uploading.",
      });
      return;
    }

    if (!activeWeekStartDate || !activeWeekEndDate) {
      openStatusModal({
        type: "error",
        title: "Unable to Upload",
        message: "Missing weekly date range. Please select a valid weekly version.",
      });
      return;
    }

    try {
      setSavingFileId(item.id);

      await updateWeeklyHiringPlanFile({
        weekNumber: activeWeek?.weekNumber || null,
        weekLabel: activeWeek?.label || null,
        weekStart: activeWeekStartDate,
        weekEnd: activeWeekEndDate,
        clusterName: item.cluster,
        accountName: item.account,
        uploadedFile: file,
      });

      await fetchAccountsByCluster({ resetAccountFilter: false });

      setWeeklyPlanFiles((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

      openStatusModal({
        type: "success",
        title: "File Uploaded",
        message: `Weekly hiring plan file for ${item.account} was uploaded successfully.`,
        closeViewModalOnSuccess: true,
      });
    } catch (error) {
      console.error("UPDATE WEEKLY PLAN FILE ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Upload Failed",
        message:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to upload weekly hiring plan file.",
      });
    } finally {
      setSavingFileId("");
    }
  }

  async function handleOpenUploadedFile({ sibsId, filename }) {
    try {
      setOpeningFile(true);

      await openWeeklyHiringPlanFile({
        sibsId,
        filename,
      });
    } catch (error) {
      console.error("OPEN WEEKLY PLAN FILE ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Unable to Open File",
        message:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to open file.",
      });
    } finally {
      setOpeningFile(false);
    }
  }

  function handleOpenActionItemModal(item) {
    setActionItemTarget(item);
    setActionItemForm({
      ...initialActionItemForm,
      owner: item.owner || "",
    });
  }

  function handleCloseActionItemModal() {
    setActionItemTarget(null);
    setActionItemForm(initialActionItemForm);
  }

  function handleSubmitActionItem(e) {
    e.preventDefault();

    if (!actionItemTarget) return;

    const newActionItem = {
      id: Date.now(),
      actionItem: actionItemForm.actionItem.trim(),
      roleAccount: `${actionItemTarget.account} / ${actionItemTarget.cluster}`,
      owner: actionItemForm.owner.trim(),
      deadline: actionItemForm.deadline,
      status: actionItemForm.status,
      remarks: actionItemForm.remarks.trim(),
    };

    const updatedItem = {
      ...actionItemTarget,
      actionItems: [...(actionItemTarget.actionItems || []), newActionItem],
    };

    setSelectedPlan(updatedItem);
    handleCloseActionItemModal();
  }

  const filteredAccountOptions = useMemo(() => {
    const keyword = accountSearch.trim().toLowerCase();

    return (accountOptions || [])
      .filter((account) => account.id !== "All")
      .filter((account) => {
        if (!keyword) return true;

        const searchableText = [
          account.accountName,
          account.gy_acc_name,
          account.ghlName,
          account.gy_acc_ghl_name,
          account.clusterName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(keyword);
      });
  }, [accountOptions, accountSearch]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainScrollRef}
        className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-sibs-primary-1 sm:text-3xl">
                Weekly Hiring Plan
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Manage weekly manpower requirement, OPS PRF, hiring plan
                percentage, leads needed, and action items.
              </p>

              {!weeklyAccess.hasFullAccess && (
                <p className="mt-2 inline-flex rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  Manager View: showing assigned accounts only.
                </p>
              )}
            </div>
          </div>

          <WeeklyVersionTable
            weekDropdownRef={weekDropdownRef}
            clusterDropdownRef={clusterDropdownRef}
            accountDropdownRef={accountDropdownRef}
            activeWeek={activeWeek}
            activeWeekId={activeWeekId}
            setActiveWeekId={setActiveWeekId}
            weeksLoading={weeksLoading}
            weekSearch={weekSearch}
            setWeekSearch={setWeekSearch}
            showWeekDropdown={showWeekDropdown}
            setShowWeekDropdown={setShowWeekDropdown}
            filteredWeeklyVersions={filteredWeeklyVersions}
            selectedClusters={selectedClusters}
            setSelectedClusters={setSelectedClusters}
            showClusterDropdown={showClusterDropdown}
            setShowClusterDropdown={setShowClusterDropdown}
            selectedAccounts={selectedAccounts}
            setSelectedAccounts={setSelectedAccounts}
            showAccountDropdown={showAccountDropdown}
            setShowAccountDropdown={setShowAccountDropdown}
            accountSearch={accountSearch}
            setAccountSearch={setAccountSearch}
            accountsLoading={accountsLoading}
            filteredAccountOptions={filteredAccountOptions}
            selectedHiringPlanPercent={selectedHiringPlanPercent}
            setSelectedHiringPlanPercent={setSelectedHiringPlanPercent}
            search={search}
            setSearch={setSearch}
            isLocked={isLocked}
            canEditRequiredHeadcount={canEditRequiredHeadcount}
            isAllClustersSelected={isAllClustersSelected}
            isAllAccountsSelected={isAllAccountsSelected}
            handleToggleCluster={handleToggleCluster}
            handleToggleAccount={handleToggleAccount}
            user={user}
            assignedAccounts={user?.assignedAccounts || []}
          />

          <HeadcountTable filteredPlans={filteredPlans} />

          <PercentageRiskGraphTable filteredPlans={filteredPlans} />

          <WeeklyHiringAccountsTable
            accountsLoading={accountsLoading}
            filteredPlans={filteredPlans}
            onViewPlan={setSelectedPlan}
          />
        </div>
      </main>

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
      />

      <ViewPlanModal
        open={!!selectedPlan}
        item={selectedPlan}
        locked={isLocked}
        canEditRequiredHeadcount={canEditRequiredHeadcount}
        previousWeekItem={previousSelectedPlan}
        requiredInputValue={selectedPlan ? requiredInputs[selectedPlan.id] : ""}
        savingRequiredId={savingRequiredId}
        savingFileId={savingFileId}
        weeklyPlanFile={selectedPlan ? weeklyPlanFiles[selectedPlan.id] : null}
        existingUploadedFile={selectedPlan?.uploadedFile || ""}
        uploadedBySibsId={
          selectedPlan?.uploadedBySibsId || user?.username || user?.sibsId || ""
        }
        openingFile={openingFile}
        onRequiredInputChange={handleRequiredInputChange}
        onWeeklyPlanFileChange={handleWeeklyPlanFileChange}
        onSaveRequiredHeadcount={handleSaveRequiredHeadcount}
        onUpdateWeeklyPlanFile={handleUpdateWeeklyPlanFile}
        onOpenUploadedFile={handleOpenUploadedFile}
        onClose={() => setSelectedPlan(null)}
        onOpenActionItem={handleOpenActionItemModal}
      />

      <ActionItemModal
        open={!!actionItemTarget}
        item={actionItemTarget}
        form={actionItemForm}
        setForm={setActionItemForm}
        onClose={handleCloseActionItemModal}
        onSubmit={handleSubmitActionItem}
      />

      <KPISnapshotModal
        open={showKpiSnapshot}
        week={activeWeek}
        records={filteredPlans}
        onClose={() => setShowKpiSnapshot(false)}
      />
    </div>
  );
}