import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useUser } from "./UserContext";
import {
  APPLICANT_LEAD_SITE_OPTIONS,
  APPLICANT_LEAD_STATUS_OPTIONS,
  EMPTY_APPLICANT_LEAD_FORM,
} from "../../lib/utils/applicantLeads/applicantLeadsConstants";
import {
  buildApplicantLeadPayload,
  createApplicantLead,
  getApplicantLeadOptions,
  getApplicantLeads,
  sendApplicantLeadApplicationLink,
  updateApplicantLead,
} from "../../lib/axios/getApplicantLeads";
import {
  isApplicantLeadFormEdited,
  getApplicantLeadEditSnapshot,
} from "../../lib/utils/applicantLeads/applicantLeadFormDirty";
import {
  filterApplicantLeads,
  getApplicantLeadMetrics,
  getApplicantLeadUserDisplayName,
} from "../../lib/utils/applicantLeads/applicantLeadsHelpers";

const ApplicantLeadsContext = createContext(null);
const MOVED_TO_TALENT_POOL_STATUS = "Moved to Talent Pool Archive";

function cleanText(value) {
  return String(value ?? "").trim();
}

function isMovedToTalentPoolLead(lead = {}) {
  const status = cleanText(lead.status).toLowerCase();

  return (
    Boolean(cleanText(lead.talentPoolApplicationId)) ||
    status === MOVED_TO_TALENT_POOL_STATUS.toLowerCase()
  );
}

function buildCountSummary(items = [], getKey) {
  const counts = new Map();

  items.forEach((item) => {
    const key = cleanText(getKey(item)) || "Unassigned";
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((first, second) => second.total - first.total || first.label.localeCompare(second.label));
}

function toLookupOptions(values = []) {
  return values.map((value) => ({
    id: "",
    value,
    label: value,
  }));
}

const DEFAULT_LOOKUP_OPTIONS = {
  departments: [],
  accounts: [],
  sources: [],
  sites: toLookupOptions(APPLICANT_LEAD_SITE_OPTIONS),
  statuses: toLookupOptions(APPLICANT_LEAD_STATUS_OPTIONS),
};

function mergeLookupOptions(currentOptions, incomingOptions = {}) {
  return {
    ...currentOptions,
    departments: incomingOptions.departments?.length
      ? incomingOptions.departments
      : currentOptions.departments,
    accounts: incomingOptions.accounts?.length
      ? incomingOptions.accounts
      : currentOptions.accounts,
    sources: incomingOptions.sources?.length
      ? incomingOptions.sources
      : currentOptions.sources,
  };
}

function getOptionLabel(option) {
  return String(option?.label || option?.name || option?.value || option || "");
}

function getOptionId(option) {
  return String(option?.id || "");
}

function getEmptyApplicantLeadForm(options = DEFAULT_LOOKUP_OPTIONS) {
  const department = options.departments?.[0];
  const account = options.accounts?.[0];

  return {
    ...EMPTY_APPLICANT_LEAD_FORM,
    departmentId: getOptionId(department),
    department: getOptionLabel(department),
    accountId: getOptionId(account),
    specificAccount: getOptionLabel(account),
    sourcingId: "",
    source: "",
  };
}

export function ApplicantLeadsProvider({ children }) {
  const { user } = useUser();
  const currentAccountName = useMemo(
    () => getApplicantLeadUserDisplayName(user),
    [user],
  );

  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [siteFilter, setSiteFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [leadView, setLeadView] = useState("active");
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState(EMPTY_APPLICANT_LEAD_FORM);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sendingApplicationLinkLead, setSendingApplicationLinkLead] = useState(null);
  const [applicationLinkSendStatus, setApplicationLinkSendStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [lookupOptions, setLookupOptions] = useState(DEFAULT_LOOKUP_OPTIONS);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const activeLeads = useMemo(
    () => leads.filter((lead) => !isMovedToTalentPoolLead(lead)),
    [leads],
  );
  const archivedLeads = useMemo(
    () => leads.filter(isMovedToTalentPoolLead),
    [leads],
  );
  const leadsForCurrentView = leadView === "archive" ? archivedLeads : activeLeads;

  const filteredLeads = useMemo(
    () =>
      filterApplicantLeads({
        leads: leadsForCurrentView,
        searchTerm,
        statusFilter,
        sourceFilter,
        siteFilter,
        departmentFilter,
      }),
    [
      departmentFilter,
      leadsForCurrentView,
      searchTerm,
      siteFilter,
      sourceFilter,
      statusFilter,
    ],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    sourceFilter,
    siteFilter,
    departmentFilter,
    leadView,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedLeads = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredLeads.slice(startIndex, startIndex + pageSize);
  }, [filteredLeads, safeCurrentPage, pageSize]);

  const metrics = useMemo(() => getApplicantLeadMetrics(leads), [leads]);
  const channelSourceSummary = useMemo(
    () => buildCountSummary(leads, (lead) => lead.source),
    [leads],
  );
  const accountLeadSummary = useMemo(
    () => buildCountSummary(leads, (lead) => lead.specificAccount),
    [leads],
  );

  const loadApplicantLeadOptions = useCallback(async () => {
    const result = await getApplicantLeadOptions();

    if (result.success) {
      setLookupOptions((current) =>
        mergeLookupOptions(current, result.data || {}),
      );
    }

    return result;
  }, []);

  const loadApplicantLeads = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setIsLoading(true);
      }

      const result = await getApplicantLeads();

      if (result.success) {
        setLeads(result.data || []);
        setErrorMessage("");
      } else {
        setErrorMessage(result.message || "Failed to load applicant leads.");

        if (!silent) {
          setLeads([]);
        }
      }

      setIsLoading(false);
      return result;
    },
    [],
  );

  useEffect(() => {
    void loadApplicantLeadOptions();
    void loadApplicantLeads();
  }, [loadApplicantLeadOptions, loadApplicantLeads]);

  function showToast(message) {
    setToastMessage(message);

    if (typeof window !== "undefined") {
      window.setTimeout(() => setToastMessage(""), 3000);
    }
  }

  async function openAddModal() {
    setEditingLead(null);
    const result = await loadApplicantLeadOptions();
    const nextOptions = result.success
      ? mergeLookupOptions(lookupOptions, result.data || {})
      : lookupOptions;

    setFormData(getEmptyApplicantLeadForm(nextOptions));
    setShowLeadModal(true);
  }

  function openEditModal(lead) {
    setEditingLead(lead);
    setFormData(getApplicantLeadEditSnapshot(lead));
    setShowLeadModal(true);
  }

  function closeLeadModal() {
    setShowLeadModal(false);
  }

  async function handleSaveLead(event) {
    event.preventDefault();

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.cpNum.trim()
    ) {
      showToast("Please enter First Name, Last Name, and CP Number.");
      return;
    }

    setIsSaving(true);
    const payload = buildApplicantLeadPayload(formData, user);

    if (editingLead) {
      if (!isApplicantLeadFormEdited(formData, editingLead)) {
        setIsSaving(false);
        showToast("No changes to update.");
        return;
      }

      const result = await updateApplicantLead(editingLead.leadId || editingLead.id, payload);

      if (!result.success) {
        setIsSaving(false);
        showToast(result.message || "Failed to update applicant lead.");
        return;
      }

      setLeads((current) =>
        current.map((lead) =>
          lead.id === editingLead.id
            ? {
                ...lead,
                ...result.data,
              }
            : lead,
        ),
      );
      showToast(result.message || `Updated applicant lead for ${formData.firstName}.`);
    } else {
      const result = await createApplicantLead(payload);

      if (!result.success) {
        setIsSaving(false);
        showToast(result.message || "Failed to save applicant lead.");
        return;
      }

      setLeads((current) => [result.data, ...current]);
      showToast(result.message || `New applicant lead logged for ${formData.firstName}.`);
    }

    setIsSaving(false);
    setShowLeadModal(false);
  }

  async function markApplicationLinkSent(lead) {
    setSendingApplicationLinkLead(lead);
    setApplicationLinkSendStatus("sending");
    const result = await sendApplicantLeadApplicationLink(lead.leadId || lead.id);

    if (!result.success) {
      setSendingApplicationLinkLead(null);
      setApplicationLinkSendStatus("");
      showToast(result.message || "Failed to send application link email.");
      return;
    }

    setLeads((current) =>
      current.map((item) =>
        item.id === lead.id
          ? {
              ...item,
              ...result.data,
            }
          : item,
      ),
    );
    setApplicationLinkSendStatus("sent");

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setSendingApplicationLinkLead(null);
        setApplicationLinkSendStatus("");
        showToast(result.message || `Application link email sent to ${lead.fullName}.`);
      }, 1400);
    } else {
      setSendingApplicationLinkLead(null);
      setApplicationLinkSendStatus("");
    }
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("All");
    setSourceFilter("All");
    setSiteFilter("All");
    setDepartmentFilter("All");
  }

  async function refreshApplicantLeads() {
    setIsManualRefreshing(true);
    try {
      const result = await loadApplicantLeads();
      if (!result.success && result.message) {
        showToast(result.message);
      }
    } finally {
      setIsManualRefreshing(false);
    }
  }

  function showTalentPoolHandoffMessage() {
    showToast("Talent Pool handoff is ready for backend wiring.");
  }

  const value = useMemo(
    () => ({
      leads,
      activeLeads,
      archivedLeads,
      filteredLeads,
      paginatedLeads,
      currentPage: safeCurrentPage,
      setCurrentPage,
      pageSize,
      setPageSize,
      totalPages,
      totalRecords: filteredLeads.length,
      metrics,
      channelSourceSummary,
      accountLeadSummary,
      currentAccountName,
      isLoading,
      isSaving,
      isManualRefreshing,
      sendingApplicationLinkLead,
      isSendingApplicationLink: Boolean(sendingApplicationLinkLead),
      applicationLinkSendStatus,
      errorMessage,
      departmentOptions: lookupOptions.departments,
      accountOptions: lookupOptions.accounts,
      sourceOptions: lookupOptions.sources,
      siteOptions: lookupOptions.sites,
      statusOptions: lookupOptions.statuses,
      leadView,
      setLeadView,
      activeLeadCount: activeLeads.length,
      archivedLeadCount: archivedLeads.length,

      searchTerm,
      setSearchTerm,
      statusFilter,
      setStatusFilter,
      sourceFilter,
      setSourceFilter,
      siteFilter,
      setSiteFilter,
      departmentFilter,
      setDepartmentFilter,
      clearFilters,

      showLeadModal,
      editingLead,
      formData,
      setFormData,
      openAddModal,
      openEditModal,
      closeLeadModal,
      handleSaveLead,
      markApplicationLinkSent,
      refreshApplicantLeads,
      loadApplicantLeadOptions,
      showTalentPoolHandoffMessage,

      toastMessage,
    }),
    [
      currentAccountName,
      departmentFilter,
      errorMessage,
      editingLead,
      activeLeads,
      archivedLeads,
      channelSourceSummary,
      accountLeadSummary,
      filteredLeads,
      paginatedLeads,
      safeCurrentPage,
      pageSize,
      totalPages,
      formData,
      isLoading,
      isSaving,
      isManualRefreshing,
      leadView,
      sendingApplicationLinkLead,
      applicationLinkSendStatus,
      leads,
      lookupOptions,
      metrics,
      searchTerm,
      showLeadModal,
      siteFilter,
      sourceFilter,
      statusFilter,
      toastMessage,
      loadApplicantLeadOptions,
    ],
  );

  return (
    <ApplicantLeadsContext.Provider value={value}>
      {children}
    </ApplicantLeadsContext.Provider>
  );
}

export function useApplicantLeadsContext() {
  const context = useContext(ApplicantLeadsContext);

  if (!context) {
    throw new Error(
      "useApplicantLeadsContext must be used inside ApplicantLeadsProvider",
    );
  }

  return context;
}
