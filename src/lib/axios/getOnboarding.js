import api from "./api-template";

/* =========================================
   ONBOARDING API
========================================= */

function getApiErrorMessage(
  error,
  fallback = "Request failed.",
) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function errorResponse(
  error,
  fallback = "Request failed.",
  data = null,
) {
  return {
    success: false,
    data,
    records:
      Array.isArray(data)
        ? data
        : [],
    record: null,
    message: getApiErrorMessage(
      error,
      fallback,
    ),
  };
}

function unwrapRecordsPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.records)) {
    return payload.records;
  }

  if (
    Array.isArray(payload?.onboarding)
  ) {
    return payload.onboarding;
  }

  if (
    Array.isArray(
      payload?.data?.records,
    )
  ) {
    return payload.data.records;
  }

  if (
    Array.isArray(
      payload?.data?.onboarding,
    )
  ) {
    return payload.data.onboarding;
  }

  return [];
}

function unwrapSinglePayload(payload) {
  if (!payload) {
    return null;
  }

  if (
    payload?.data &&
    !Array.isArray(payload.data)
  ) {
    return payload.data;
  }

  if (payload?.record) {
    return payload.record;
  }

  if (payload?.onboarding) {
    return payload.onboarding;
  }

  return null;
}

/* =========================================
   GET ONBOARDING RECORDS
========================================= */

export async function getOnboardingRecords(
  params = {},
) {
  try {
    const {
      page = 1,
      limit = 500,
      search = "",
      showStatus = "All",
      finalOutcome = "All",
      outcome = "",
    } = params;

    const response = await api.get(
      "/api/onboarding",
      {
        params: {
          page,
          limit,
          search,
          showStatus,
          finalOutcome:
            outcome ||
            finalOutcome,
          forcePipelineSync: 1,
          _t: Date.now(),
        },
        withCredentials: true,
      },
    );

    const rows =
      unwrapRecordsPayload(
        response.data,
      );

    return {
      success: Boolean(
        response.data?.success ??
          true,
      ),
      data: rows,
      records: rows,
      syncSummary:
        response.data?.syncSummary ||
        null,
      pagination:
        response.data?.pagination ||
        {
          page,
          limit,
          total: rows.length,
          totalPages: 1,
        },
      counts:
        response.data?.counts ||
        {},
      message:
        response.data?.message ||
        "Onboarding records loaded.",
    };
  } catch (error) {
    console.error(
      "Axios getOnboardingRecords API error:",
      error?.response?.status,
      error?.response?.data ||
        error?.message,
    );

    return errorResponse(
      error,
      "Failed to load onboarding records.",
      [],
    );
  }
}

/* =========================================
   GET SINGLE ONBOARDING RECORD
========================================= */

export async function getOnboardingRecord(
  id,
) {
  try {
    if (!id) {
      return {
        success: false,
        data: null,
        record: null,
        message:
          "Onboarding record ID is required.",
      };
    }

    const response = await api.get(
      `/api/onboarding/${encodeURIComponent(
        id,
      )}`,
      {
        withCredentials: true,
        params: {
          _t: Date.now(),
        },
      },
    );

    const record =
      unwrapSinglePayload(
        response.data,
      );

    return {
      success: Boolean(
        response.data?.success ??
          true,
      ),
      data: record,
      record,
      message:
        response.data?.message ||
        "Onboarding record loaded.",
    };
  } catch (error) {
    console.error(
      "Axios getOnboardingRecord API error:",
      error?.response?.status,
      error?.response?.data ||
        error?.message,
    );

    return errorResponse(
      error,
      "Failed to load onboarding record.",
    );
  }
}

/* =========================================
   GET ONBOARDING-READY CANDIDATES
========================================= */

export async function getAcceptedOffers() {
  try {
    const response = await api.get(
      "/api/onboarding/accepted-offers",
      {
        params: {
          forcePipelineSync: 1,
          _t: Date.now(),
        },
        withCredentials: true,
      },
    );

    const rows =
      unwrapRecordsPayload(
        response.data,
      );

    return {
      success: Boolean(
        response.data?.success ??
          true,
      ),
      data: rows,
      records: rows,
      message:
        response.data?.message ||
        "Onboarding-ready candidates loaded.",
    };
  } catch (error) {
    console.error(
      "Axios getAcceptedOffers API error:",
      error?.response?.status,
      error?.response?.data ||
        error?.message,
    );

    return errorResponse(
      error,
      "Failed to load onboarding-ready candidates.",
      [],
    );
  }
}

/* =========================================
   CREATE ONBOARDING RECORD
========================================= */

export async function createOnboardingRecord(
  payload = {},
) {
  try {
    const response = await api.post(
      "/api/onboarding",
      payload,
      {
        withCredentials: true,
      },
    );

    const record =
      unwrapSinglePayload(
        response.data,
      );

    return {
      success: Boolean(
        response.data?.success ??
          true,
      ),
      data: record,
      record,
      message:
        response.data?.message ||
        "Onboarding record created.",
    };
  } catch (error) {
    console.error(
      "Axios createOnboardingRecord API error:",
      error?.response?.status,
      error?.response?.data ||
        error?.message,
    );

    return errorResponse(
      error,
      "Failed to create onboarding record.",
    );
  }
}

/* =========================================
   UPDATE ONBOARDING RECORD
========================================= */

export async function updateOnboardingRecord(
  id,
  payload = {},
) {
  try {
    if (!id) {
      return {
        success: false,
        data: null,
        record: null,
        message:
          "Onboarding record ID is required.",
      };
    }

    const response = await api.patch(
      `/api/onboarding/${encodeURIComponent(
        id,
      )}`,
      payload,
      {
        withCredentials: true,
      },
    );

    const record =
      unwrapSinglePayload(
        response.data,
      );

    return {
      success: Boolean(
        response.data?.success ??
          true,
      ),
      data: record,
      record,
      message:
        response.data?.message ||
        "Onboarding record updated.",
    };
  } catch (error) {
    console.error(
      "Axios updateOnboardingRecord API error:",
      error?.response?.status,
      error?.response?.data ||
        error?.message,
    );

    return errorResponse(
      error,
      "Failed to update onboarding record.",
    );
  }
}

/* =========================================
   UPDATE OUTCOME
========================================= */

export async function updateOnboardingOutcome(
  id,
  payload = {},
) {
  try {
    if (!id) {
      return {
        success: false,
        data: null,
        record: null,
        message:
          "Onboarding record ID is required.",
      };
    }

    const response = await api.patch(
      `/api/onboarding/${encodeURIComponent(
        id,
      )}/outcome`,
      payload,
      {
        withCredentials: true,
      },
    );

    const record =
      unwrapSinglePayload(
        response.data,
      );

    return {
      success: Boolean(
        response.data?.success ??
          true,
      ),
      data: record,
      record,
      message:
        response.data?.message ||
        "Onboarding outcome updated.",
    };
  } catch (error) {
    console.error(
      "Axios updateOnboardingOutcome API error:",
      error?.response?.status,
      error?.response?.data ||
        error?.message,
    );

    return errorResponse(
      error,
      "Failed to update onboarding outcome.",
    );
  }
}

/* =========================================
   DELETE / ARCHIVE
========================================= */

export async function deleteOnboardingRecord(
  id,
) {
  try {
    if (!id) {
      return {
        success: false,
        data: null,
        message:
          "Onboarding record ID is required.",
      };
    }

    const response = await api.delete(
      `/api/onboarding/${encodeURIComponent(
        id,
      )}`,
      {
        withCredentials: true,
      },
    );

    return {
      success: Boolean(
        response.data?.success ??
          true,
      ),
      data:
        response.data?.data ||
        null,
      message:
        response.data?.message ||
        "Onboarding record deleted.",
    };
  } catch (error) {
    console.error(
      "Axios deleteOnboardingRecord API error:",
      error?.response?.status,
      error?.response?.data ||
        error?.message,
    );

    return errorResponse(
      error,
      "Failed to delete onboarding record.",
    );
  }
}

const onboardingApi = {
  getOnboardingRecords,
  getOnboardingRecord,
  getAcceptedOffers,
  createOnboardingRecord,
  updateOnboardingRecord,
  updateOnboardingOutcome,
  deleteOnboardingRecord,
};

export default onboardingApi;
