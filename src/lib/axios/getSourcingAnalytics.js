import api from "./api-template";

/* =========================================
   SOURCING ANALYTICS API
   Backend route:
   /api/sourcing-analytics
========================================= */

const BASE_PATH = "/api/sourcing-analytics";

function getApiErrorMessage(error, fallback = "Request failed.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function createApiError(error, fallback = "Request failed.") {
  const apiError = new Error(getApiErrorMessage(error, fallback));

  apiError.status = error?.response?.status || 500;
  apiError.response = error?.response;
  apiError.originalError = error;

  return apiError;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeDate(value) {
  const text = cleanText(value);

  if (!text) return "";

  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);

  return match?.[1] || text;
}

function normalizeSourceOption(option = {}) {
  if (typeof option === "string") {
    const text = cleanText(option);

    return text
      ? {
          id: text,
          value: text,
          label: text,
        }
      : null;
  }

  const value = cleanText(
    option.value ||
      option.optionValue ||
      option.option_value ||
      option.label ||
      option.optionLabel ||
      option.option_label,
  );

  const label = cleanText(
    option.label ||
      option.optionLabel ||
      option.option_label ||
      value,
  );

  if (!value && !label) return null;

  return {
    ...option,
    id: option.id || value || label,
    value: value || label,
    label: label || value,
  };
}

function normalizeCostEntry(entry = {}) {
  const dateFrom = normalizeDate(
    entry.dateFrom ||
      entry.date_from ||
      entry.dateSpent ||
      entry.date_spent,
  );

  const dateTo = normalizeDate(
    entry.dateTo ||
      entry.date_to ||
      entry.dateSpent ||
      entry.date_spent,
  );

  return {
    ...entry,

    id: entry.id,

    source: cleanText(entry.source),
    description: cleanText(entry.description),
    amount: Number(entry.amount || 0),

    dateFrom,
    date_from: dateFrom,

    dateTo,
    date_to: dateTo,

    // Keep temporary compatibility with components that still read dateSpent.
    dateSpent: dateFrom,
    date_spent: dateFrom,

    status: cleanText(entry.status),

    createdAt: entry.createdAt || entry.created_at || null,
    created_at: entry.created_at || entry.createdAt || null,

    updatedAt: entry.updatedAt || entry.updated_at || null,
    updated_at: entry.updated_at || entry.updatedAt || null,
  };
}

function normalizePublicSubmission(submission = {}) {
  const hearAboutUs = normalizeArray(
    submission.hearAboutUs ||
      submission.hear_about_us,
  );

  const submittedAt =
    submission.submittedAt ||
    submission.submitted_at ||
    submission.createdAt ||
    submission.created_at ||
    null;

  const status = cleanText(
    submission.status ||
      submission.currentStage ||
      submission.current_stage ||
      submission.currentPipelineStage ||
      submission.current_pipeline_stage ||
      submission.pipelineStatus ||
      submission.pipeline_status,
  );

  return {
    ...submission,

    id:
      submission.id ||
      submission.recordId ||
      submission.record_id,

    candidateId:
      submission.candidateId ||
      submission.candidate_id ||
      "",

    candidate_id:
      submission.candidate_id ||
      submission.candidateId ||
      "",

    name:
      submission.name ||
      submission.fullName ||
      submission.full_name ||
      "Unnamed Applicant",

    fullName:
      submission.fullName ||
      submission.full_name ||
      submission.name ||
      "Unnamed Applicant",

    full_name:
      submission.full_name ||
      submission.fullName ||
      submission.name ||
      "Unnamed Applicant",

    email: cleanText(submission.email),

    hearAboutUs,
    hear_about_us: hearAboutUs,

    status,
    currentStage: status,
    current_stage: status,
    currentPipelineStage: status,
    current_pipeline_stage: status,

    submittedAt,
    submitted_at: submittedAt,

    lastActivity:
      submission.lastActivity ||
      submission.last_activity ||
      submittedAt,

    last_activity:
      submission.last_activity ||
      submission.lastActivity ||
      submittedAt,
  };
}

function normalizeAnalyticsPayload(payload = {}) {
  const root =
    payload?.data &&
    !Array.isArray(payload.data) &&
    typeof payload.data === "object"
      ? payload.data
      : {};

  const publicSubmissions = normalizeArray(
    payload.publicSubmissions ||
      payload.public_submissions ||
      root.publicSubmissions ||
      root.public_submissions,
  ).map(normalizePublicSubmission);

  const sourceCostEntries = normalizeArray(
    payload.sourceCostEntries ||
      payload.source_cost_entries ||
      payload.costEntries ||
      root.sourceCostEntries ||
      root.source_cost_entries ||
      root.costEntries,
  ).map(normalizeCostEntry);

  const sourcingOptions = normalizeArray(
    payload.sourcingOptions ||
      payload.sourcing_options ||
      payload.options ||
      root.sourcingOptions ||
      root.sourcing_options ||
      root.options,
  )
    .map(normalizeSourceOption)
    .filter(Boolean);

  return {
    ...payload,

    success: payload?.success !== false,

    data: {
      ...root,
      publicSubmissions,
      sourceCostEntries,
      sourcingOptions,
    },

    publicSubmissions,
    public_submissions: publicSubmissions,

    sourceCostEntries,
    source_cost_entries: sourceCostEntries,
    costEntries: sourceCostEntries,

    sourcingOptions,
    sourcing_options: sourcingOptions,
    options: sourcingOptions,
  };
}

function normalizeEntryResponse(payload = {}) {
  const entry =
    payload?.sourceCostEntry ||
    payload?.entry ||
    payload?.data ||
    null;

  const normalizedEntry =
    entry && typeof entry === "object"
      ? normalizeCostEntry(entry)
      : null;

  return {
    ...payload,
    data: normalizedEntry,
    entry: normalizedEntry,
    sourceCostEntry: normalizedEntry,
  };
}

function validateCostPayload(payload = {}) {
  const source = cleanText(
    payload.source ||
      payload.sourcingOption ||
      payload.sourcing_option,
  );

  const description = cleanText(payload.description);

  const amount = Number(
    String(payload.amount ?? "")
      .replace(/,/g, "")
      .replace(/[₱\s]/g, ""),
  );

  const dateFrom = normalizeDate(
    payload.dateFrom ||
      payload.date_from ||
      payload.dateSpent ||
      payload.date_spent,
  );

  const dateTo = normalizeDate(
    payload.dateTo ||
      payload.date_to ||
      payload.dateSpent ||
      payload.date_spent,
  );

  if (!source) {
    throw new Error("Sourcing option is required.");
  }

  if (!description) {
    throw new Error("Description is required.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  if (!dateFrom) {
    throw new Error("Date From is required.");
  }

  if (!dateTo) {
    throw new Error("Date To is required.");
  }

  if (dateTo < dateFrom) {
    throw new Error("Date To cannot be earlier than Date From.");
  }

  return {
    source,
    description,
    amount,
    dateFrom,
    dateTo,
  };
}

/* =========================================
   GET ANALYTICS
========================================= */

export async function getSourcingAnalyticsData() {
  try {
    const response = await api.get(BASE_PATH, {
      withCredentials: true,
    });

    return normalizeAnalyticsPayload(response.data);
  } catch (error) {
    if (error?.response?.status !== 401) {
      console.error("GET SOURCING ANALYTICS ERROR:", error);
    }

    throw createApiError(
      error,
      "Failed to load sourcing analytics.",
    );
  }
}

/* =========================================
   GET ACTIVE SOURCE OPTIONS
========================================= */

export async function getSourcingOptions() {
  try {
    const response = await api.get(`${BASE_PATH}/options`, {
      withCredentials: true,
    });

    const payload = response.data || {};

    const options = normalizeArray(
      payload.sourcingOptions ||
        payload.sourcing_options ||
        payload.options ||
        payload.data,
    )
      .map(normalizeSourceOption)
      .filter(Boolean);

    return {
      ...payload,
      success: payload?.success !== false,
      data: options,
      sourcingOptions: options,
      sourcing_options: options,
      options,
    };
  } catch (error) {
    console.error("GET SOURCING OPTIONS ERROR:", error);

    throw createApiError(
      error,
      "Failed to load sourcing options.",
    );
  }
}

/* =========================================
   CREATE SOURCE COST
========================================= */

export async function createSourceCostEntry(payload = {}) {
  try {
    const cleanPayload = validateCostPayload(payload);

    const response = await api.post(
      `${BASE_PATH}/cost-entries`,
      cleanPayload,
      {
        withCredentials: true,
      },
    );

    return normalizeEntryResponse(response.data);
  } catch (error) {
    console.error("CREATE SOURCE COST ENTRY ERROR:", error);

    if (
      error instanceof Error &&
      !error?.response
    ) {
      throw error;
    }

    throw createApiError(
      error,
      "Failed to add source cost entry.",
    );
  }
}

/* =========================================
   UPDATE SOURCE COST
========================================= */

export async function updateSourceCostEntry(id, payload = {}) {
  try {
    const entryId = cleanText(id);

    if (!entryId) {
      throw new Error("Source cost entry ID is required.");
    }

    const cleanPayload = validateCostPayload(payload);

    const response = await api.patch(
      `${BASE_PATH}/cost-entries/${encodeURIComponent(entryId)}`,
      cleanPayload,
      {
        withCredentials: true,
      },
    );

    return normalizeEntryResponse(response.data);
  } catch (error) {
    console.error("UPDATE SOURCE COST ENTRY ERROR:", error);

    if (
      error instanceof Error &&
      !error?.response
    ) {
      throw error;
    }

    throw createApiError(
      error,
      "Failed to update source cost entry.",
    );
  }
}

/* =========================================
   DELETE SOURCE COST
========================================= */

export async function deleteSourceCostEntry(id) {
  try {
    const entryId = cleanText(id);

    if (!entryId) {
      throw new Error("Source cost entry ID is required.");
    }

    const response = await api.delete(
      `${BASE_PATH}/cost-entries/${encodeURIComponent(entryId)}`,
      {
        withCredentials: true,
      },
    );

    return response.data;
  } catch (error) {
    console.error("DELETE SOURCE COST ENTRY ERROR:", error);

    if (
      error instanceof Error &&
      !error?.response
    ) {
      throw error;
    }

    throw createApiError(
      error,
      "Failed to remove source cost entry.",
    );
  }
}

/* =========================================
   COMPATIBILITY EXPORTS
   These aliases reduce changes while the
   existing frontend is being migrated.
========================================= */

export const getSourcingAnalytics =
  getSourcingAnalyticsData;

export const fetchSourcingAnalytics =
  getSourcingAnalyticsData;

export const addSourceCost =
  createSourceCostEntry;

export const createSourcingCostEntry =
  createSourceCostEntry;

export const editSourceCost =
  updateSourceCostEntry;

export const updateSourcingCostEntry =
  updateSourceCostEntry;

export const removeSourceCost =
  deleteSourceCostEntry;

export const deleteSourcingCostEntry =
  deleteSourceCostEntry;

/*
 * Temporary compatibility only.
 * The production Sample Data button will be removed later.
 * Calling this now simply reloads backend data and does not
 * write sample rows into localStorage.
 */
export async function loadSourcingSampleData() {
  return getSourcingAnalyticsData();
}

export default {
  getSourcingAnalyticsData,
  getSourcingAnalytics,
  fetchSourcingAnalytics,
  getSourcingOptions,
  createSourceCostEntry,
  createSourcingCostEntry,
  addSourceCost,
  updateSourceCostEntry,
  updateSourcingCostEntry,
  editSourceCost,
  deleteSourceCostEntry,
  deleteSourcingCostEntry,
  removeSourceCost,
  loadSourcingSampleData,
};
