import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/layout/Header";
import api from "../../lib/axios/api-template";
import StatusModal from "../../components/modals/StatusModal";
import PercentageRiskGraphTable from "../../components/tables/WeeklyHiringPlan/PercentageRiskGraphTable";
import WeeklyHiringAccountsTable from "../../components/tables/WeeklyHiringPlan/WeeklyHiringAccountsTable";
import WeeklyVersionTable from "../../components/tables/WeeklyHiringPlan/WeeklyVersionTable";
import HeadcountTable from "../../components/tables/WeeklyHiringPlan/HeadcountTable";
import {
  ActionItemModal,
  KpiSnapshotModal,
  ViewPlanModal,
} from "../../components/modals/weeklyHiringPlan/WeeklyHiringPlanModal";
import {
  getWeeklyHiringPlanAccounts,
  getWeeklyHiringPlanWeeks,
} from "../../lib/axios/getWeeklyHiringPlan";
import { useUser } from "../../services/context/UserContext";

const initialActionItemForm = {
  actionItem: "",
  owner: "",
  deadline: "",
  status: "Pending",
  remarks: "",
};

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

  /*
    Excel logic:
    Even if Actual HC is equal to or higher than Required HC,
    the account is still At Risk when OPS PRF / Leads Needed exists.
  */
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

        const mergedAccounts = results.flat();
        const uniqueMap = new Map();

        mergedAccounts.forEach((account) => {
          const accountId = Number(account?.id || 0);
          const accountName = String(account?.accountName || "").trim();
          const clusterName = String(
            account?.clusterName ||
              account?.cluster ||
              account?.ghlName ||
              account?.gy_acc_ghl_name ||
              ""
          ).trim();

          if (!accountId || !accountName) return;

          const key = `${accountId}-${accountName.toLowerCase()}-${clusterName.toLowerCase()}`;

          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, account);
          }
        });

        accounts = Array.from(uniqueMap.values());
      }

      const uniqueAccountOptionsMap = new Map();

      (accounts || []).forEach((account) => {
        const accountId = Number(account?.id || 0);
        const accountName = String(account?.accountName || "").trim();

        if (!accountId || !accountName) return;

        const key = accountName.toLowerCase();

        if (!uniqueAccountOptionsMap.has(key)) {
          uniqueAccountOptionsMap.set(key, account);
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
    if (activeWeekStartDate && activeWeekEndDate) {
      fetchAccountsByCluster();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClusters, activeWeekStartDate, activeWeekEndDate]);

  const displayData = useMemo(() => {
    return (remoteAccounts || []).map((account, index) => {
      const accountName = account.accountName || "Unassigned Account";

      const accountCluster =
        account.clusterName ||
        account.cluster ||
        account.ghlName ||
        account.gy_acc_ghl_name ||
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

      /*
        Backend-owned values:
        Buffer Count, Buffer %, Missing Headcount, OPS PRF,
        Projected Employee Needs, Leads to Interview, and Hiring Rate
        are calculated by weeklyHiringPlan.js.
        Frontend only displays the backend response.
      */
      const bufferHeadcount = getBackendNumber(account, [
        "bufferHeadcount",
        "buffer_headcount",
        "buffer_head_count",
      ]);

      const bufferPercent = getBackendNumber(account, [
        "bufferPercent",
        "buffer_percent",
      ]);

      const missingHeadcount = getBackendNumber(account, [
        "missingHeadcount",
        "missing_headcount",
        "missing_head_count",
      ]);

      const calculated = {
        opsPrf: getBackendNumber(account, ["opsPrf", "ops_prf"]),
        leadsToInterview: getBackendNumber(account, [
          "leadsToInterview",
          "leads_to_interview",
        ]),
        hiringRate: getBackendNumber(account, ["hiringRate", "hiring_rate"], 5),

        absenteeismCount:
          account.absenteeismOpsCount !== undefined &&
          account.absenteeismOpsCount !== null
            ? Number(account.absenteeismOpsCount || 0)
            : Number(account.absenteeismCount || 0),

        attritionPastCount: Number(account.attritionPastCount || 0),
      };

      const projectedEmployeeNeeds = getBackendNumber(
        account,
        [
          "projectedEmployeeNeeds",
          "projected_employee_needs",
          "projectedNeeds",
          "projected_needs",
        ],
        calculated.opsPrf
      );

      const row = {
        id: `db-${accountCluster}-${account.id || index}`,
        backendAccountId: account.id,
        week: activeWeek?.label || "Current Week",
        cluster: accountCluster,
        account: accountName,

        requiredHeadcount,
        actualHeadcount,

        bufferHeadcount,
        bufferPercent,
        missingHeadcount,
        missingHeadcount: requiredHeadcount + bufferHeadcount - actualHeadcount,

        scheduledCount: Number(account.scheduledCount || 0),
        presentCount: Number(account.presentCount || 0),

        absenteeismCount: calculated.absenteeismCount,
        absenteeismPercent: Number(account.absenteeismPercent || 0),

        attritionPastCount: calculated.attritionPastCount,
        attritionPastPercent: Number(account.attritionPastPercent || 0),

        opsPrf: calculated.opsPrf,
        projectedEmployeeNeeds,

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

        leadsToInterview: calculated.leadsToInterview,
        hiringRate: calculated.hiringRate,

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
        lastEditSibsId:
          account.lastEditSibsId || account.last_edit_sibs_id || "",
        lastEditName:
          account.lastEditName || account.last_edit_name || "",
      };

      return {
        ...row,
        pipelineStatus: account.pipelineStatus || calculatePipelineStatus(row),
      };
    });
  }, [activeWeek?.label, selectedClusters, remoteAccounts]);

  useEffect(() => {
    const nextInputs = {};

    displayData.forEach((item) => {
      nextInputs[item.id] = String(item.requiredHeadcount ?? 0);
    });

    setRequiredInputs(nextInputs);
  }, [displayData]);

  const filteredPlans = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return displayData.filter((item) => {
      const cluster = item.cluster || "Unassigned Cluster";
      const account = item.account || "Unassigned Account";

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
        String(item.pipelineStatus || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.statusNote || "")
          .toLowerCase()
          .includes(keyword) ||
        String(item.owner || "")
          .toLowerCase()
          .includes(keyword);

      return matchesCluster && matchesAccount && matchesKeyword;
    });
  }, [
    displayData,
    activeWeek?.label,
    search,
    selectedClusters,
    selectedAccounts,
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

  async function handleSaveRequiredHeadcount(item) {
    if (!canEditRequiredHeadcount) {
      const message = "You do not have permission to edit required headcount.";
      setRequiredSaveMessage(message);
      openStatusModal({
        type: "error",
        title: "Permission Denied",
        message,
      });
      return;
    }


    if (!activeWeekStartDate || !activeWeekEndDate) {
      const message = "Missing weekly date range. Please select a valid weekly version.";
      setRequiredSaveMessage(message);
      openStatusModal({
        type: "error",
        title: "Unable to Save",
        message,
      });
      return;
    }

    const rawValue = requiredInputs[item.id];

    const requiredHeadcount =
      rawValue === "" || rawValue === null || rawValue === undefined
        ? null
        : Number(rawValue);

    if (requiredHeadcount !== null && !Number.isFinite(requiredHeadcount)) {
      const message = "Invalid required headcount.";
      setRequiredSaveMessage(message);
      openStatusModal({
        type: "error",
        title: "Invalid Input",
        message,
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

      const refreshedAccounts = await fetchAccountsByCluster({
        resetAccountFilter: false,
      });

      const refreshedAccount = (refreshedAccounts || []).find((account) => {
        const accountName = account.accountName || "Unassigned Account";
        const accountCluster =
          account.clusterName ||
          account.cluster ||
          account.ghlName ||
          account.gy_acc_ghl_name ||
          (isAllClustersSelected()
            ? "Unassigned"
            : selectedClusters.length === 1
              ? selectedClusters[0]
              : "Unassigned");

        return (
          String(accountName).toLowerCase() ===
            String(item.account).toLowerCase() &&
          String(accountCluster).toLowerCase() ===
            String(item.cluster).toLowerCase()
        );
      });

      if (refreshedAccount) {
        setSelectedPlan((current) => {
          if (!current) return current;

          const sameSelectedPlan =
            String(current.account).toLowerCase() ===
              String(item.account).toLowerCase() &&
            String(current.cluster).toLowerCase() ===
              String(item.cluster).toLowerCase();

          if (!sameSelectedPlan) return current;

          return {
            ...current,
            requiredHeadcount: getBackendNumber(refreshedAccount, [
              "requiredHeadcount",
              "required_headcount",
            ]),
            actualHeadcount: getBackendNumber(refreshedAccount, [
              "actualHeadcount",
              "actual_headcount",
            ]),
            bufferHeadcount: getBackendNumber(refreshedAccount, [
              "bufferHeadcount",
              "buffer_headcount",
              "buffer_head_count",
            ]),
            bufferPercent: getBackendNumber(refreshedAccount, [
              "bufferPercent",
              "buffer_percent",
            ]),
            missingHeadcount: getBackendNumber(refreshedAccount, [
              "missingHeadcount",
              "missing_headcount",
              "missing_head_count",
            ]),
            absenteeismCount:
              refreshedAccount.absenteeismOpsCount !== undefined &&
              refreshedAccount.absenteeismOpsCount !== null
                ? Number(refreshedAccount.absenteeismOpsCount || 0)
                : Number(refreshedAccount.absenteeismCount || 0),
            attritionPastCount: Number(refreshedAccount.attritionPastCount || 0),
            opsPrf: getBackendNumber(refreshedAccount, ["opsPrf", "ops_prf"]),
            projectedEmployeeNeeds: getBackendNumber(
              refreshedAccount,
              [
                "projectedEmployeeNeeds",
                "projected_employee_needs",
                "projectedNeeds",
                "projected_needs",
              ],
              getBackendNumber(refreshedAccount, ["opsPrf", "ops_prf"])
            ),
            leadsToInterview: getBackendNumber(refreshedAccount, [
              "leadsToInterview",
              "leads_to_interview",
            ]),
            hiringRate: getBackendNumber(
              refreshedAccount,
              ["hiringRate", "hiring_rate"],
              5
            ),
            pipelineStatus:
              refreshedAccount.pipelineStatus || current.pipelineStatus,
            priorityLevel: refreshedAccount.priorityLevel || null,
            headcountRemarks: refreshedAccount.headcountRemarks || null,
            uploadedFile:
              refreshedAccount.uploadedFile || refreshedAccount.uploaded_file || current.uploadedFile || "",
            uploadedBySibsId:
              refreshedAccount.uploadedBySibsId ||
              refreshedAccount.uploaded_by_sibs_id ||
              current.uploadedBySibsId ||
              "",
            lastEditSibsId:
              refreshedAccount.lastEditSibsId ||
              refreshedAccount.last_edit_sibs_id ||
              current.lastEditSibsId ||
              "",
            lastEditName:
              refreshedAccount.lastEditName ||
              refreshedAccount.last_edit_name ||
              current.lastEditName ||
              "",
            statusNote:
              refreshedAccount.headcountRemarks ||
              refreshedAccount.departmentName ||
              current.statusNote ||
              "-",
          };
        });
      }

      setWeeklyPlanFiles((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

      const message = `Required headcount for ${item.account} was saved successfully.`;
      openStatusModal({
        type: "success",
        title: "Required Headcount Saved",
        message,
        closeViewModalOnSuccess: true,
      });
    } catch (error) {
      console.error("SAVE REQUIRED HEADCOUNT ERROR:", error);

      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to save required headcount.";

      setRequiredSaveMessage(message);
      openStatusModal({
        type: "error",
        title: "Save Failed",
        message,
      });
    } finally {
      setSavingRequiredId("");
    }
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

  async function handleUpdateWeeklyPlanFile(item) {
    if (!canEditRequiredHeadcount) {
      openStatusModal({
        type: "error",
        title: "Permission Denied",
        message: "You do not have permission to update the weekly hiring plan file.",
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

    const selectedFile = weeklyPlanFiles[item.id];

    if (!selectedFile) {
      openStatusModal({
        type: "error",
        title: "No File Selected",
        message: "Please choose a file before clicking Update File.",
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
      setSavingFileId(item.id);

      await updateWeeklyHiringPlanFile({
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
        uploadedFile: selectedFile,
      });

      const refreshedAccounts = await fetchAccountsByCluster({
        resetAccountFilter: false,
      });

      const refreshedAccount = (refreshedAccounts || []).find((account) => {
        const accountName = account.accountName || "Unassigned Account";
        const accountCluster =
          account.clusterName ||
          account.cluster ||
          account.ghlName ||
          account.gy_acc_ghl_name ||
          (isAllClustersSelected()
            ? "Unassigned"
            : selectedClusters.length === 1
              ? selectedClusters[0]
              : "Unassigned");

        return (
          String(accountName).toLowerCase() === String(item.account).toLowerCase() &&
          String(accountCluster).toLowerCase() === String(item.cluster).toLowerCase()
        );
      });

      if (refreshedAccount) {
        setSelectedPlan((current) => {
          if (!current) return current;

          const sameSelectedPlan =
            String(current.account).toLowerCase() === String(item.account).toLowerCase() &&
            String(current.cluster).toLowerCase() === String(item.cluster).toLowerCase();

          if (!sameSelectedPlan) return current;

          return {
            ...current,
            uploadedFile:
              refreshedAccount.uploadedFile || refreshedAccount.uploaded_file || "",
            uploadedBySibsId:
              refreshedAccount.uploadedBySibsId ||
              refreshedAccount.uploaded_by_sibs_id ||
              current.uploadedBySibsId ||
              "",
            lastEditSibsId:
              refreshedAccount.lastEditSibsId ||
              refreshedAccount.last_edit_sibs_id ||
              current.lastEditSibsId ||
              "",
            lastEditName:
              refreshedAccount.lastEditName ||
              refreshedAccount.last_edit_name ||
              current.lastEditName ||
              "",
          };
        });
      }

      setWeeklyPlanFiles((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

      openStatusModal({
        type: "success",
        title: "File Updated",
        message: `Weekly hiring plan file for ${item.account} was updated successfully.`,
        closeViewModalOnSuccess: true,
      });
    } catch (error) {
      console.error("UPDATE WEEKLY HIRING PLAN FILE ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Upload Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to update weekly hiring plan file.",
      });
    } finally {
      setSavingFileId("");
    }
  }

  async function handleOpenUploadedFile({ sibsId, filename }) {
    try {
      setOpeningFile(true);
      await openWeeklyHiringPlanFile({ sibsId, filename });
    } catch (error) {
      console.error("OPEN WEEKLY HIRING PLAN FILE ERROR:", error);
      openStatusModal({
        type: "error",
        title: "Unable to Open File",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to open uploaded weekly hiring plan file.",
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
                Manage weekly manpower requirement, OPS PRF, leads needed, and
                action items.
              </p>
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
            search={search}
            setSearch={setSearch}
            isLocked={isLocked}
            canEditRequiredHeadcount={canEditRequiredHeadcount}
            isAllClustersSelected={isAllClustersSelected}
            isAllAccountsSelected={isAllAccountsSelected}
            handleToggleCluster={handleToggleCluster}
            handleToggleAccount={handleToggleAccount}
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
        uploadedBySibsId={selectedPlan?.uploadedBySibsId || user?.username || user?.sibsId || ""}
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

      <KpiSnapshotModal
        open={showKpiSnapshot}
        week={activeWeek}
        records={filteredPlans}
        onClose={() => setShowKpiSnapshot(false)}
      />
    </div>
  );
}