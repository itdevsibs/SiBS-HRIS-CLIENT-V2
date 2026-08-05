import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";
import StatusModal from "../../components/modals/StatusModal";
import {
  Database,
  Plus,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import {
  createAvailablePosition,
  getAvailablePositionMeta,
  getAvailablePositions,
  updateAvailablePosition,
  updateAvailablePositionStatus,
} from "../../lib/axios/getAvailablePosition";
import { getAvailablePositionApprovalUsers } from "../../lib/axios/getAvailablePositionApprovalSettings";
import {
  approveAvailablePositionRequest,
  getAvailablePositionApprovalRequests,
  rejectAvailablePositionRequest,
} from "../../lib/axios/getApprovalRequest";
import { getApprovedJobDescriptions } from "../../lib/axios/getJobDescription";
import {
  cleanText,
  getUserDisplayName,
  sameText,
} from "../../lib/utils/availablePositions/availablePositionsHelpers";
import {
  emptyForm,
  LOCATION_SITE_OPTIONS,
  POSITIONS_PER_PAGE,
  STATUS_FILTER_OPTIONS,
  STATUS_OPTIONS,
} from "../../lib/utils/availablePositions/availablePositionsConstants";
import PositionFormModal from "../../components/modals/availablePositions/PositionFormModal";
import ConfirmationModal from "../../components/modals/availablePositions/ConfirmationModal";
import AvailablePositionsTable from "../../components/tables/availablePositions/AvailablePositionsTable";
import PaginationTable from "../../services/pagination/PaginationTable";
import {
  normalizeAvailablePositionRecord,
  normalizeAvailablePositionRecords,
} from "../../lib/utils/availablePositions/availablePositionId";
import {
  getAvailablePositionSearchText,
} from "../../lib/utils/availablePositions/availablePositionsPresentation";

function normalizeSibsId(value = "") {
  return cleanText(value).replace(/^SIBS[-_ ]?/i, "");
}

function getCurrentUserSibsId(user = {}) {
  return normalizeSibsId(
    user?.sibsId ||
      user?.sibs_id ||
      user?.employeeSibsId ||
      user?.employee_sibs_id ||
      user?.gy_emp_code ||
      user?.gy_user_code ||
      user?.userCode ||
      user?.user_code ||
      user?.employeeCode ||
      user?.employee_code ||
      user?.username ||
      "",
  );
}

function getApprovalSettingsRows(responseData) {
  const rows =
    responseData?.data?.users ||
    responseData?.data?.rows ||
    responseData?.data ||
    responseData?.users ||
    responseData?.rows ||
    responseData ||
    [];

  return Array.isArray(rows) ? rows : [];
}

function getApprovalSettingsSibsId(row = {}) {
  return normalizeSibsId(
    row?.sibsId ||
      row?.sibs_id ||
      row?.employeeSibsId ||
      row?.employee_sibs_id ||
      row?.gy_emp_code ||
      row?.gy_user_code ||
      row?.userCode ||
      row?.user_code ||
      row?.username,
  );
}

function getRequestValue(request = {}, keys = [], fallback = "") {
  const raw = request.raw || {};

  for (const key of keys) {
    const value = request[key] ?? raw[key];

    if (cleanText(value)) return value;
  }

  return fallback;
}

function normalizeApprovalStatus(value = "") {
  const status = cleanText(value).toLowerCase();

  if (!status) return "Approved";
  if (status === "pending") return "For Approval";
  if (status === "for review") return "For Approval";
  if (status === "for approval") return "For Approval";
  if (status === "approved") return "Approved";
  if (status === "rejected" || status === "declined") return "Rejected";

  return cleanText(value);
}

function normalizeAvailablePositionApprovalRequest(request = {}) {
  const raw = request.raw || {};
  const recordId = getRequestValue(
    request,
    [
      "rawId",
      "raw_id",
      "availablePositionId",
      "available_position_id",
      "positionRecordId",
      "position_record_id",
    ],
    "",
  );
  const positionId = getRequestValue(
    request,
    ["positionId", "position_id"],
    recordId || request.id || "",
  );

  return normalizeAvailablePositionRecord({
    ...raw,
    ...request,
    id: recordId || request.id,
    rawId: recordId || request.rawId || request.raw_id || "",
    raw_id: recordId || request.raw_id || request.rawId || "",
    positionId,
    position_id: positionId,
    positionTitle: getRequestValue(
      request,
      ["positionTitle", "position_title", "title"],
      request.title || "",
    ),
    position_title: getRequestValue(
      request,
      ["position_title", "positionTitle", "title"],
      request.title || "",
    ),
    jdCode: getRequestValue(request, ["jdCode", "jd_code"], ""),
    jd_code: getRequestValue(request, ["jd_code", "jdCode"], ""),
    documentTitle: getRequestValue(
      request,
      ["documentTitle", "document_title"],
      "",
    ),
    document_title: getRequestValue(
      request,
      ["document_title", "documentTitle"],
      "",
    ),
    department: getRequestValue(request, ["department", "departmentName"], ""),
    accountName: getRequestValue(
      request,
      ["accountName", "account_name", "account"],
      "",
    ),
    account_name: getRequestValue(
      request,
      ["account_name", "accountName", "account"],
      "",
    ),
    locationSite: getRequestValue(
      request,
      ["locationSite", "location_site"],
      "",
    ),
    location_site: getRequestValue(
      request,
      ["location_site", "locationSite"],
      "",
    ),
    status: getRequestValue(
      request,
      ["positionStatus", "position_status"],
      "Inactive",
    ),
    approvalRequestId: request.id || request.requestId || request.request_id || "",
    approval_request_id:
      request.id || request.request_id || request.requestId || "",
    approvalStatus: normalizeApprovalStatus(
      request.status ||
        request.approvalStatus ||
        request.approval_status ||
        request.recruitmentSettingsStatus ||
        request.recruitment_settings_status,
    ),
    approval_status: normalizeApprovalStatus(
      request.status ||
        request.approval_status ||
        request.approvalStatus ||
        request.recruitment_settings_status ||
        request.recruitmentSettingsStatus,
    ),
    requestedBy: request.requestedBy || request.requested_by || "",
    requested_by: request.requested_by || request.requestedBy || "",
    dateRequested: request.dateRequested || request.requestDate || "",
    date_requested: request.date_requested || request.dateRequested || "",
  });
}

function getAvailablePositionMergeKey(position = {}) {
  return cleanText(
    position.rawId ||
      position.raw_id ||
      position.sourcePositionId ||
      position.source_position_id ||
      position.positionId ||
      position.position_id ||
      position.id,
  ).toLowerCase();
}

function getAvailablePositionApprovalRequestId(position = {}) {
  const raw = position.raw || {};

  return cleanText(
    position.approvalRequestId ||
      position.approval_request_id ||
      position.requestId ||
      position.request_id ||
      raw.approvalRequestId ||
      raw.approval_request_id ||
      "",
  );
}

function mergeAvailablePositionApprovalRequests(positions = [], requests = []) {
  const merged = normalizeAvailablePositionRecords(positions);

  requests.forEach((request) => {
    const approvalPosition = normalizeAvailablePositionApprovalRequest(request);
    const approvalKey = getAvailablePositionMergeKey(approvalPosition);
    const matchIndex = merged.findIndex(
      (position) => getAvailablePositionMergeKey(position) === approvalKey,
    );

    if (matchIndex >= 0) {
      merged[matchIndex] = {
        ...merged[matchIndex],
        approvalRequestId: approvalPosition.approvalRequestId,
        approval_request_id: approvalPosition.approval_request_id,
        approvalStatus: approvalPosition.approvalStatus,
        approval_status: approvalPosition.approval_status,
      };
      return;
    }

    merged.unshift(approvalPosition);
  });

  return merged;
}

const AVAILABLE_POSITION_STATUS_TABS = [
  { label: "All Positions", value: "All" },
  { label: "For Approval", value: "For Approval" },
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
  { label: "Archived", value: "Archived" },
];

// main function
export default function AvailablePositionsPage() {
  const mainRef = useRef(null);
  const { user } = useUser();
  const currentUserName = getUserDisplayName(user);
  const currentUserSibsId = useMemo(() => getCurrentUserSibsId(user), [user]);

  const [positionList, setPositionList] = useState([]);
  const [meta, setMeta] = useState({
    statusOptions: [],
    departments: [],
    accounts: [],
  });

  const [approvedJdPositions, setApprovedJdPositions] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canApproveAvailablePositions, setCanApproveAvailablePositions] =
    useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [positionForm, setPositionForm] = useState(emptyForm);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  function openStatusModal(type, title, message) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal((prev) => ({
      ...prev,
      open: false,
    }));
  }

  const databaseStatusOptions = STATUS_OPTIONS;
  const activeStatus = "Active";
  const inactiveStatus = "Inactive";

  const statusFilterOptions = useMemo(() => {
    return STATUS_FILTER_OPTIONS.map((status) => ({
      id: status,
      value: status,
      label: status === "All" ? "All Statuses" : status,
    }));
  }, []);

  const departmentOptions = useMemo(() => {
    return Array.isArray(meta.departments) ? meta.departments : [];
  }, [meta.departments]);

  const accountOptions = useMemo(() => {
    return Array.isArray(meta.accounts) ? meta.accounts : [];
  }, [meta.accounts]);

  const filteredAccountOptions = useMemo(() => {
    if (departmentFilter === "All") return accountOptions;

    return accountOptions.filter(
      (account) => String(account.departmentId) === String(departmentFilter),
    );
  }, [accountOptions, departmentFilter]);

  const departmentFilterOptions = useMemo(() => {
    return [
      {
        id: "All",
        value: "All",
        label: "All Departments",
      },
      ...departmentOptions.map((department) => ({
        id: department.departmentId,
        value: department.departmentId,
        label: department.departmentName,
      })),
    ];
  }, [departmentOptions]);

  const accountFilterOptions = useMemo(() => {
    return [
      {
        id: "All",
        value: "All",
        label: "All Accounts",
      },
      ...filteredAccountOptions.map((account) => ({
        id: account.accountId,
        value: account.accountId,
        label: account.accountName,
        description: account.accountGhlName || "",
        searchText: [
          account.accountId,
          account.accountName,
          account.accountGhlName,
          account.departmentId,
        ]
          .filter(Boolean)
          .join(" "),
      })),
    ];
  }, [filteredAccountOptions]);

  const locationFilterOptions = useMemo(() => {
    return [
      {
        id: "All",
        value: "All",
        label: "All Locations",
      },
      ...LOCATION_SITE_OPTIONS.map((location) => ({
        id: location,
        value: location,
        label: location,
      })),
    ];
  }, []);

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }

      if (typeof window !== "undefined") {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }

      if (typeof document !== "undefined") {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    });
  }

  const refreshPositions = useCallback(
    async ({ showPageLoading = true } = {}) => {
      if (showPageLoading) {
        setIsLoading(true);
      }

      setLoadError("");

      try {
        const [
          metaResponse,
          positionsResponse,
          approvedJdResponse,
          approvalRequestsResponse,
        ] =
          await Promise.all([
            getAvailablePositionMeta(),
            getAvailablePositions({
              page: 1,
              limit: 500,
              search: "",
              status: "All",
              departmentId: "All",
              accountId: "All",
            }),
            getApprovedJobDescriptions({
              page: 1,
              limit: 500,
              search: "",
            }),
            getAvailablePositionApprovalRequests({
              page: 1,
              limit: 500,
              search: "",
              status: "",
              type: "Available Position",
            }),
          ]);

        if (!metaResponse?.success) {
          throw new Error(
            metaResponse?.message || "Failed to load position metadata.",
          );
        }

        if (!positionsResponse?.success) {
          throw new Error(
            positionsResponse?.message || "Failed to load available positions.",
          );
        }

        setMeta({
          // Keep the frontend status list fixed and independent from
          // legacy status values returned by the API.
          statusOptions: [...STATUS_OPTIONS],
          departments: Array.isArray(metaResponse.data?.departments)
            ? metaResponse.data.departments.filter(Boolean)
            : [],
          accounts: Array.isArray(metaResponse.data?.accounts)
            ? metaResponse.data.accounts.filter(Boolean)
            : [],
        });

        setPositionList(
          mergeAvailablePositionApprovalRequests(
            positionsResponse.data,
            approvalRequestsResponse?.success &&
              Array.isArray(approvalRequestsResponse.data)
              ? approvalRequestsResponse.data
              : [],
          ),
        );

        setApprovedJdPositions(
          approvedJdResponse?.success && Array.isArray(approvedJdResponse.data)
            ? approvedJdResponse.data
            : [],
        );
      } catch (error) {
        console.error("Load available positions error:", error);

        setLoadError(error?.message || "Failed to load available positions.");
        setPositionList([]);
        setApprovedJdPositions([]);
        setMeta({
          statusOptions: [...STATUS_OPTIONS],
          departments: [],
          accounts: [],
        });

        if (showPageLoading) {
          openStatusModal(
            "error",
            "Unable to load positions",
            error?.message || "Failed to load available positions.",
          );
        }
      } finally {
        if (showPageLoading) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function checkApprovalAccess() {
      const cleanUserSibsId = normalizeSibsId(currentUserSibsId);

      if (!cleanUserSibsId) {
        if (!cancelled) {
          setCanApproveAvailablePositions(false);
        }

        return;
      }

      try {
        const result = await getAvailablePositionApprovalUsers();
        const rows = getApprovalSettingsRows(result);
        const allowed = rows.some(
          (row) =>
            getApprovalSettingsSibsId(row).toLowerCase() ===
            cleanUserSibsId.toLowerCase(),
        );

        if (!cancelled) {
          setCanApproveAvailablePositions(allowed);
        }
      } catch (error) {
        console.error("CHECK AVAILABLE POSITION APPROVAL ACCESS ERROR:", error);

        if (!cancelled) {
          setCanApproveAvailablePositions(false);
        }
      }
    }

    checkApprovalAccess();

    return () => {
      cancelled = true;
    };
  }, [currentUserSibsId]);

  useLayoutEffect(() => {
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "manual";
    }

    scrollToTop("auto");

    const timer = window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    refreshPositions();
  }, [refreshPositions]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || isSaving) return;

    try {
      setIsRefreshing(true);

      await refreshPositions({
        showPageLoading: false,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [
    isRefreshing,
    isSaving,
    refreshPositions,
  ]);

  function requestConfirm({ title, message, confirmLabel, onConfirm }) {
    setConfirmState({ title, message, confirmLabel, onConfirm });
  }

  function closeConfirm() {
    if (isSaving) return;
    setConfirmState(null);
  }

  function handleAvailablePositionApproval(position, action) {
    if (!canApproveAvailablePositions) {
      openStatusModal(
        "error",
        "Not Allowed",
        "Only users added in Recruitment Settings > Approval Rules > Available Positions can approve or reject this request.",
      );
      return;
    }

    const approvalRequestId = getAvailablePositionApprovalRequestId(position);

    if (!approvalRequestId) {
      openStatusModal(
        "error",
        "Invalid Request",
        "The Available Position approval request ID is missing.",
      );
      return;
    }

    requestConfirm({
      title:
        action === "approve"
          ? "Approve Available Position"
          : "Reject Available Position",
      message:
        action === "approve"
          ? `${position.positionTitle || "This position"} will be approved and refreshed in the Available Positions table.`
          : `${position.positionTitle || "This position"} will be rejected and refreshed in the Available Positions table.`,
      confirmLabel: action === "approve" ? "Approve" : "Reject",
      onConfirm: async () => {
        setIsSaving(true);

        try {
          const response =
            action === "approve"
              ? await approveAvailablePositionRequest(approvalRequestId)
              : await rejectAvailablePositionRequest(approvalRequestId);

          if (!response?.success) {
            openStatusModal(
              "error",
              "Approval Update Failed",
              response?.message ||
                "Failed to update the Available Position approval request.",
            );
            return;
          }

          await refreshPositions({ showPageLoading: false });

          openStatusModal(
            "success",
            action === "approve" ? "Position Approved" : "Position Rejected",
            response?.message ||
              `The Available Position request was ${
                action === "approve" ? "approved" : "rejected"
              } successfully.`,
          );
        } catch (error) {
          console.error("Available Position approval action error:", error);

          openStatusModal(
            "error",
            "Approval Update Failed",
            error?.response?.data?.message ||
              error?.message ||
              "Failed to update the Available Position approval request.",
          );
        } finally {
          setIsSaving(false);
          setConfirmState(null);
        }
      },
    });
  }

  function buildAddForm() {
    return {
      ...emptyForm,
      status: "Active",
    };
  }

  function resetForm() {
    if (formMode === "edit" && editTarget) {
      setPositionForm({
        jdId: editTarget.jdId || editTarget.jd_id || "",
        jd_id: editTarget.jd_id || editTarget.jdId || "",

        jdCode: editTarget.jdCode || editTarget.jd_code || "",
        jd_code: editTarget.jd_code || editTarget.jdCode || "",

        documentTitle:
          editTarget.documentTitle || editTarget.document_title || "",
        document_title:
          editTarget.document_title || editTarget.documentTitle || "",

        positionTitle: editTarget.positionTitle || "",
        departmentId: editTarget.departmentId || "",
        department: editTarget.department || "",
        accountId: editTarget.accountId || "",
        accountName: editTarget.accountName || "",
        accountGhlName: editTarget.accountGhlName || "",
        description: editTarget.description || "",
        preferredSkills: editTarget.preferredSkills || "",
        locationSite: editTarget.locationSite || "",
        status: editTarget.status || "",
        remarks: editTarget.remarks || "",
      });
      return;
    }

    setPositionForm(buildAddForm());
  }

  function openAddModal() {
    setFormMode("add");
    setEditTarget(null);
    setPositionForm(buildAddForm());
    setShowFormModal(true);
  }

  function openEditModal(position) {
    setFormMode("edit");
    setEditTarget(position);
    setPositionForm({
      jdId: position.jdId || position.jd_id || "",
      jd_id: position.jd_id || position.jdId || "",

      jdCode: position.jdCode || position.jd_code || "",
      jd_code: position.jd_code || position.jdCode || "",

      documentTitle: position.documentTitle || position.document_title || "",
      document_title: position.document_title || position.documentTitle || "",

      positionTitle: position.positionTitle || "",
      departmentId: position.departmentId || "",
      department: position.department || "",
      accountId: position.accountId || "",
      accountName: position.accountName || "",
      accountGhlName: position.accountGhlName || "",
      description: position.description || "",
      preferredSkills: position.preferredSkills || "",
      locationSite: position.locationSite || "",
      status: position.status || "",
      remarks: position.remarks || "",
    });
    setShowFormModal(true);
  }

  function closeFormModal() {
    if (isSaving) return;

    setShowFormModal(false);
    setFormMode("add");
    setEditTarget(null);
    setPositionForm(emptyForm);
  }

  function closeFormAfterSave() {
    setShowFormModal(false);
    setFormMode("add");
    setEditTarget(null);
    setPositionForm(emptyForm);
  }

  async function verifySavedPosition(payload = {}) {
    try {
      const result = await getAvailablePositions({
        page: 1,
        limit: 500,
        search: "",
        status: "All",
        departmentId: "All",
        accountId: "All",
      });

      const rows = normalizeAvailablePositionRecords(
        result?.data,
      );

      if (result?.success) {
        setPositionList(rows);
      }

      return rows.some((position) => {
        const sameJd =
          payload.jdId || payload.jd_id || payload.jdCode || payload.jd_code
            ? String(position.jdId || position.jd_id || "") ===
            String(payload.jdId || payload.jd_id || "") ||
            sameText(
              position.jdCode || position.jd_code,
              payload.jdCode || payload.jd_code,
            )
            : false;

        const samePosition = sameText(
          position.positionTitle,
          payload.positionTitle,
        );

        const sameLocation = sameText(
          position.locationSite,
          payload.locationSite,
        );

        return samePosition && sameLocation && (sameJd || !payload.jdId);
      });
    } catch (error) {
      console.error("Verify saved available position error:", error);
      return false;
    }
  }

  async function savePosition() {
    if (isSaving) return;

    setIsSaving(true);

    const payload = {
      jdId: positionForm.jdId || positionForm.jd_id || null,
      jd_id: positionForm.jd_id || positionForm.jdId || null,

      jdCode: cleanText(positionForm.jdCode || positionForm.jd_code),
      jd_code: cleanText(positionForm.jd_code || positionForm.jdCode),

      documentTitle: cleanText(
        positionForm.documentTitle || positionForm.document_title,
      ),
      document_title: cleanText(
        positionForm.document_title || positionForm.documentTitle,
      ),

      positionTitle: cleanText(positionForm.positionTitle),
      departmentId: positionForm.departmentId,
      department: cleanText(positionForm.department),
      accountId: positionForm.accountId,
      accountName: cleanText(positionForm.accountName),
      accountGhlName: cleanText(positionForm.accountGhlName),

      description: cleanText(positionForm.description),
      preferredSkills: cleanText(positionForm.preferredSkills),
      locationSite: positionForm.locationSite,
      status: positionForm.status,
      remarks: cleanText(positionForm.remarks),

      createdBy: currentUserName,
      updatedBy: currentUserName,
    };

    try {
      const response =
        formMode === "edit" && editTarget
          ? await updateAvailablePosition(editTarget.id, payload)
          : await createAvailablePosition(payload);

      if (!response?.success) {
        const wasActuallySaved = await verifySavedPosition(payload);

        if (!wasActuallySaved) {
          openStatusModal(
            "error",
            "Position not saved",
            response?.message || "Failed to save available position.",
          );
          return;
        }

        closeFormAfterSave();
        scrollToTop("auto");

        openStatusModal(
          "success",
          formMode === "edit" ? "Position updated" : "Position saved",
          "The available position was saved successfully.",
        );

        return;
      }

      if (response.data) {
        setPositionList((prev) => {
          const savedItem =
            normalizeAvailablePositionRecord(
              response.data,
            );

          if (formMode === "edit" && editTarget) {
            return prev.map((item) =>
              String(item.id) === String(savedItem.id) ? savedItem : item,
            );
          }

          return [
            savedItem,
            ...prev.filter((item) => String(item.id) !== String(savedItem.id)),
          ];
        });
      }

      closeFormAfterSave();
      scrollToTop("auto");

      window.setTimeout(() => {
        scrollToTop("auto");
      }, 0);

      openStatusModal(
        "success",
        formMode === "edit" ? "Position updated" : "Position saved",
        formMode === "edit"
          ? "The available position was updated successfully."
          : "The available position was saved successfully.",
      );

      void refreshPositions({ showPageLoading: false });
    } catch (error) {
      console.error("Save available position error:", error);

      const wasActuallySaved = await verifySavedPosition(payload);

      if (wasActuallySaved) {
        closeFormAfterSave();
        scrollToTop("auto");

        openStatusModal(
          "success",
          formMode === "edit" ? "Position updated" : "Position saved",
          "The available position was saved successfully.",
        );

        return;
      }

      openStatusModal(
        "error",
        "Position not saved",
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save available position.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmitPosition(e) {
    e.preventDefault();

    if (!cleanText(positionForm.positionTitle)) {
      openStatusModal(
        "error",
        "Required field missing",
        "Position Title is required.",
      );
      return;
    }

    if (!positionForm.jdId && !positionForm.jd_id && !positionForm.jdCode) {
      openStatusModal(
        "error",
        "Approved JD Required",
        "Please select a position from the approved JD dropdown.",
      );
      return;
    }

    if (!positionForm.departmentId) {
      openStatusModal(
        "error",
        "Required field missing",
        "Department is required.",
      );
      return;
    }

    if (!positionForm.accountId) {
      openStatusModal(
        "error",
        "Required field missing",
        "Account is required.",
      );
      return;
    }

    if (!positionForm.status) {
      openStatusModal("error", "Required field missing", "Status is required.");
      return;
    }

    if (!positionForm.locationSite) {
      openStatusModal(
        "error",
        "Required field missing",
        "Location / Site is required.",
      );
      return;
    }

    requestConfirm({
      title: formMode === "edit" ? "Update Position" : "Save Position",
      message:
        cleanText(positionForm.status) === cleanText(activeStatus)
          ? `${positionForm.positionTitle} will be visible in the Public Form and Talent Pool form.`
          : `${positionForm.positionTitle} will not be visible to applicants unless status is ${activeStatus || "configured as visible"
          }.`,
      confirmLabel: formMode === "edit" ? "Update" : "Save",
      onConfirm: savePosition,
    });
  }

  function handleSetStatus(position, nextStatus) {
    if (!nextStatus) {
      openStatusModal(
        "error",
        "Status option missing",
        "Status option is missing from the database.",
      );
      return;
    }

    requestConfirm({
      title: "Update Position Status",
      message:
        nextStatus === activeStatus
          ? `${position.positionTitle} will be shown in the Public Form and Talent Pool form.`
          : `${position.positionTitle} will be hidden from applicant-facing forms.`,
      confirmLabel: `Set ${nextStatus}`,
      onConfirm: async () => {
        setIsSaving(true);

        try {
          const response = await updateAvailablePositionStatus(position.id, {
            status: nextStatus,
            updatedBy: currentUserName,
          });

          if (!response?.success) {
            openStatusModal(
              "error",
              "Status not updated",
              response?.message || "Failed to update position status.",
            );
            return;
          }

          await refreshPositions({ showPageLoading: false });

          scrollToTop("auto");

          window.setTimeout(() => {
            scrollToTop("auto");
          }, 0);

          openStatusModal(
            "success",
            "Status updated",
            `The position status was updated to ${nextStatus}.`,
          );
        } catch (error) {
          console.error("Update position status error:", error);
          openStatusModal(
            "error",
            "Status not updated",
            error?.message || "Failed to update position status.",
          );
        } finally {
          setIsSaving(false);
        }
      },
    });
  }

  function handleDepartmentFilterChange(value) {
    setDepartmentFilter(value);
    setAccountFilter("All");
  }

  function handleStatusFilterChange(value) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("All");
    setDepartmentFilter("All");
    setAccountFilter("All");
    setLocationFilter("All");
    setCurrentPage(1);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  const filteredPositions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const normalizedStatusFilter = String(statusFilter || "").toLowerCase();

    return positionList.filter((position) => {
      const text =
        getAvailablePositionSearchText(position);

      const normalizedPositionStatus = String(
        position.status || "",
      ).toLowerCase();
      const normalizedApprovalStatus = String(
        normalizeApprovalStatus(
          position.approvalStatus ||
            position.approval_status,
        ),
      ).toLowerCase();

      const matchesSearch = !keyword || text.includes(keyword);
      const matchesStatus =
        statusFilter === "All" ||
        normalizedPositionStatus === normalizedStatusFilter ||
        normalizedApprovalStatus === normalizedStatusFilter;
      const matchesDepartment =
        departmentFilter === "All" ||
        String(position.departmentId) === String(departmentFilter);
      const matchesAccount =
        accountFilter === "All" ||
        String(position.accountId) === String(accountFilter);
      const matchesLocation =
        locationFilter === "All" || position.locationSite === locationFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDepartment &&
        matchesAccount &&
        matchesLocation
      );
    });
  }, [
    positionList,
    search,
    statusFilter,
    departmentFilter,
    accountFilter,
    locationFilter,
  ]);

  const statusCounts = useMemo(() => {
    return positionList.reduce(
      (counts, position) => {
        const operationalStatus = cleanText(position.status);
        const approvalStatus = normalizeApprovalStatus(
          position.approvalStatus || position.approval_status,
        );
        const nextCounts = {
          ...counts,
          All: counts.All + 1,
        };

        if (operationalStatus) {
          nextCounts[operationalStatus] =
            Number(nextCounts[operationalStatus] || 0) + 1;
        }

        if (approvalStatus && approvalStatus !== operationalStatus) {
          nextCounts[approvalStatus] =
            Number(nextCounts[approvalStatus] || 0) + 1;
        }

        return nextCounts;
      },
      {
        All: 0,
        "For Approval": 0,
        Active: 0,
        Inactive: 0,
        Approved: 0,
        Rejected: 0,
        Archived: 0,
      },
    );
  }, [positionList]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPositions.length / POSITIONS_PER_PAGE),
  );

  const paginatedPositions = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (safePage - 1) * POSITIONS_PER_PAGE;
    const end = start + POSITIONS_PER_PAGE;

    return filteredPositions.slice(start, end);
  }, [filteredPositions, currentPage, totalPages]);

  const showingFrom =
    filteredPositions.length > 0
      ? (currentPage - 1) * POSITIONS_PER_PAGE + 1
      : 0;

  const showingTo = Math.min(
    currentPage * POSITIONS_PER_PAGE,
    filteredPositions.length,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, departmentFilter, accountFilter, locationFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handlePageChange(nextPage) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    setCurrentPage(safePage);
  }

  const hasActiveFilters =
    search.trim() ||
    statusFilter !== "All" ||
    departmentFilter !== "All" ||
    accountFilter !== "All" ||
    locationFilter !== "All";

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainRef}
        className="sibs-dashboard-main-wide"
      >
        <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
          <section className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-5 font-jakarta shadow-sm sm:p-6">
            <span className="sibs-top-accent" aria-hidden="true" />

            <div className="mt-1 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-[#042C51]">
                  <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
                  Recruitment View
                </span>

                <h1 className="break-words text-xl font-extrabold text-[#042C51] sm:text-2xl">
                  Available Positions
                </h1>

                <p className="max-w-3xl text-xs font-semibold leading-relaxed text-[#667085] sm:text-sm">
                  Manage canonical roles, organizational mapping, linked Job Descriptions, and applicant visibility.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 self-end md:self-auto">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isSaving}
                  aria-label="Refresh available positions"
                  title="Refresh available positions"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={
                      isRefreshing ? "animate-spin" : ""
                    }
                  />
                </button>

                <button
                  type="button"
                  onClick={openAddModal}
                  disabled={
                    isSaving ||
                    !databaseStatusOptions.length ||
                    !departmentOptions.length ||
                    !accountOptions.length
                  }
                  className="sibs-button-primary inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E04F20] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus size={16} />
                  Add New Position
                </button>
              </div>
            </div>
          </section>

          {loadError ? (
            <section className="rounded-xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-700">
              {loadError}
            </section>
          ) : null}

          {!isLoading &&
          !loadError &&
          !departmentOptions.length ? (
            <section className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs font-bold text-amber-700">
              No departments were returned by the
              Available Positions metadata API.
            </section>
          ) : null}

          {!isLoading &&
          !loadError &&
          !accountOptions.length ? (
            <section className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs font-bold text-amber-700">
              No accounts were returned by the Available
              Positions metadata API.
            </section>
          ) : null}

          <section className="sibs-profile-tab-panel sibs-page-card-in sibs-card overflow-visible rounded-2xl border border-[#E6ECF2] bg-white font-jakarta shadow-sm">
            <div className="border-b border-[#E6ECF2] bg-white px-4 py-5 sm:px-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="sibs-section-title">
                    Available Position Records
                  </h2>

                  <p className="sibs-section-subtitle">
                    Search and filter positions by title,
                    department, account, status, and site.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-[#042C51]">
                  {filteredPositions.length} Records
                </span>
              </div>
            </div>

            <div className="relative z-[90] space-y-5 overflow-visible p-4 sm:p-5">
              <PaginationTable
                filterLayout="ta-inline"
                showFilterPanel={false}
                showFilterHeader={false}
                showPagination={false}
                loading={isLoading}
                searchValue={search}
                searchPlaceholder="Search position, JD, department, account, or skills..."
                onSearchChange={setSearch}
                dropdownFilters={[
                  {
                    key: "status",
                    value: statusFilter,
                    options: statusFilterOptions,
                    onChange: handleStatusFilterChange,
                    includeAll: false,
                    allLabel: "All Statuses",
                    label: "Status",
                    placeholder: "All Statuses",
                    searchable: false,
                    disabled: isLoading,
                  },
                  {
                    key: "department",
                    value: departmentFilter,
                    options: departmentFilterOptions,
                    onChange: handleDepartmentFilterChange,
                    includeAll: false,
                    allLabel: "All Departments",
                    label: "Department",
                    placeholder: "Search departments...",
                    searchable: true,
                    disabled: isLoading,
                  },
                  {
                    key: "account",
                    value: accountFilter,
                    options: accountFilterOptions,
                    onChange: setAccountFilter,
                    includeAll: false,
                    allLabel: "All Accounts",
                    label: "Account",
                    placeholder: "Search accounts...",
                    searchable: true,
                    disabled:
                      isLoading ||
                      (departmentFilter !== "All" &&
                        !filteredAccountOptions.length),
                  },
                  {
                    key: "location",
                    value: locationFilter,
                    options: locationFilterOptions,
                    onChange: setLocationFilter,
                    includeAll: false,
                    allLabel: "All Locations",
                    label: "Location",
                    placeholder: "Search locations...",
                    searchable: true,
                    disabled: isLoading,
                  },
                ]}
                rightContent={
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    disabled={!hasActiveFilters || isLoading}
                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#E6ECF2] bg-white px-3 text-xs font-extrabold text-[#98A2B3] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#E6ECF2] disabled:hover:bg-white disabled:hover:text-[#98A2B3] xl:w-auto"
                  >
                    <RotateCcw size={14} />
                    Clear
                  </button>
                }
                className="border-0 bg-transparent p-0 shadow-none"
              />

              <AvailablePositionsTable
                isLoading={isLoading}
                paginatedPositions={paginatedPositions}
                filteredPositionsCount={
                  filteredPositions.length
                }
                showingFrom={showingFrom}
                showingTo={showingTo}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onEdit={openEditModal}
                onSetStatus={handleSetStatus}
                onApproveRequest={(position) =>
                  handleAvailablePositionApproval(position, "approve")
                }
                onRejectRequest={(position) =>
                  handleAvailablePositionApproval(position, "reject")
                }
                isSaving={isSaving}
                canApproveAvailablePositions={canApproveAvailablePositions}
                statusTabs={AVAILABLE_POSITION_STATUS_TABS}
                statusFilter={statusFilter}
                statusCounts={statusCounts}
                onStatusFilterChange={handleStatusFilterChange}
                activeStatus={activeStatus}
                inactiveStatus={inactiveStatus}
              />
            </div>
          </section>

          <section className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-4">
            <h3 className="text-xs font-extrabold text-[#042C51]">
              Database Mapping Rule
            </h3>

            <p className="mt-1 text-xs font-semibold leading-5 text-[#042C51]/75">
              Departments and accounts are loaded from the
              database. Account choices depend on the selected
              department. Active positions appear in
              applicant-facing forms, while Inactive and Archived
              positions remain unavailable.
            </p>
          </section>
        </div>
      </main>

      <PositionFormModal
        open={showFormModal}
        mode={formMode}
        form={positionForm}
        setForm={setPositionForm}
        onClose={closeFormModal}
        onSubmit={handleSubmitPosition}
        onReset={resetForm}
        meta={meta}
        approvedJdPositions={approvedJdPositions}
        isSaving={isSaving}
      />

      <ConfirmationModal
        open={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        isSaving={isSaving}
        onCancel={closeConfirm}
        onConfirm={() => {
          const action =
            confirmState?.onConfirm;

          setConfirmState(null);

          if (typeof action === "function") {
            action();
          }
        }}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
        variant="center"
        lockScroll
      />
    </div>
  );
}
