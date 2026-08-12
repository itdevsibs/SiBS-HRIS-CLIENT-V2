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
  updateApplicantLead,
  updateApplicantLeadStatus,
} from "../../lib/axios/getApplicantLeads";
import {
  filterApplicantLeads,
  getApplicantLeadMetrics,
  getApplicantLeadUserDisplayName,
} from "../../lib/utils/applicantLeads/applicantLeadsHelpers";

const ApplicantLeadsContext = createContext(null);

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
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState(EMPTY_APPLICANT_LEAD_FORM);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lookupOptions, setLookupOptions] = useState(DEFAULT_LOOKUP_OPTIONS);

  const filteredLeads = useMemo(
    () =>
      filterApplicantLeads({
        leads,
        searchTerm,
        statusFilter,
        sourceFilter,
        siteFilter,
        departmentFilter,
      }),
    [
      departmentFilter,
      leads,
      searchTerm,
      siteFilter,
      sourceFilter,
      statusFilter,
    ],
  );

  const metrics = useMemo(() => getApplicantLeadMetrics(leads), [leads]);

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
    setFormData({
      firstName: lead.firstName || "",
      lastName: lead.lastName || "",
      middleName: lead.middleName || "",
      suffix: lead.suffix || "",
      cpNum: lead.cpNum,
      email: lead.email,
      departmentId: lead.departmentId || "",
      department: lead.department,
      accountId: lead.accountId || "",
      specificAccount: lead.specificAccount,
      sourcingId: lead.sourcingId || "",
      source: lead.source,
      preferredSite: lead.preferredSite,
      status: lead.status,
      notes: lead.notes || "",
    });
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
    const result = await updateApplicantLeadStatus(lead.leadId || lead.id, {
      status: "Application Link Sent",
    });

    if (!result.success) {
      showToast(result.message || "Failed to update applicant lead status.");
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
    showToast(result.message || `Application link marked as sent for ${lead.fullName}.`);
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("All");
    setSourceFilter("All");
    setSiteFilter("All");
    setDepartmentFilter("All");
  }

  async function refreshApplicantLeads() {
    const result = await loadApplicantLeads();
    showToast(
      result.success
        ? "Applicant leads data refreshed."
        : result.message || "Failed to refresh applicant leads.",
    );
  }

  function showTalentPoolHandoffMessage() {
    showToast("Talent Pool handoff is ready for backend wiring.");
  }

  const value = useMemo(
    () => ({
      leads,
      filteredLeads,
      metrics,
      currentAccountName,
      isLoading,
      isSaving,
      errorMessage,
      departmentOptions: lookupOptions.departments,
      accountOptions: lookupOptions.accounts,
      sourceOptions: lookupOptions.sources,
      siteOptions: lookupOptions.sites,
      statusOptions: lookupOptions.statuses,

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
      filteredLeads,
      formData,
      isLoading,
      isSaving,
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
