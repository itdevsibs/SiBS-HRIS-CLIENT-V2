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

// main function
export default function AvailablePositionsPage() {
  const mainRef = useRef(null);
  const { user } = useUser();
  const currentUserName = getUserDisplayName(user);

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
        const [metaResponse, positionsResponse, approvedJdResponse] =
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
          normalizeAvailablePositionRecords(
            positionsResponse.data,
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

      const matchesSearch = !keyword || text.includes(keyword);
      const matchesStatus =
        statusFilter === "All" ||
        normalizedPositionStatus === normalizedStatusFilter;
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
    scrollToTop("auto");

    const timer = window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search, statusFilter, departmentFilter, accountFilter, locationFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      scrollToTop("auto");
    }
  }, [currentPage, totalPages]);

  function handlePageChange(nextPage) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);

    if (safePage === currentPage) {
      scrollToTop("auto");

      window.setTimeout(() => {
        scrollToTop("auto");
      }, 0);

      return;
    }

    setCurrentPage(safePage);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
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

          <section className="sibs-profile-tab-panel sibs-page-card-in overflow-visible rounded-2xl border border-[#E6ECF2] bg-white font-jakarta shadow-sm">
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
                    onChange: setStatusFilter,
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
                isSaving={isSaving}
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
