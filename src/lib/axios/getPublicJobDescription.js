import axios from "axios";

/* =====================================================
   PUBLIC JOB DESCRIPTION API

   IMPORTANT:
   - No JWT
   - No cookies
   - No api-template
   - No global HRIS 401/403 logout interceptor
   - Safe for public pages and new tabs
===================================================== */

function cleanText(value = "") {
  return String(value ?? "").trim();
}

function getPublicApiBaseURL() {
  const rawBaseURL =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000";

  return String(rawBaseURL)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/?$/, "");
}

const publicJobDescriptionApi = axios.create({
  baseURL: getPublicApiBaseURL(),
  withCredentials: false,
  headers: {
    Accept: "application/json",
  },
});

function getApiErrorMessage(error, fallback) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function normalizePagination(
  pagination,
  {
    page = 1,
    limit = 100,
    total = 0,
  } = {},
) {
  const currentPage = Number(
    pagination?.currentPage ||
      pagination?.page ||
      page ||
      1,
  );

  const normalizedLimit = Number(
    pagination?.limit ||
      limit ||
      100,
  );

  const normalizedTotal = Number(
    pagination?.total ??
      total ??
      0,
  );

  const totalPages = Number(
    pagination?.totalPages ||
      Math.max(
        Math.ceil(
          normalizedTotal /
            Math.max(
              normalizedLimit,
              1,
            ),
        ),
        1,
      ),
  );

  return {
    ...(pagination || {}),
    total: normalizedTotal,
    totalPages,
    currentPage,
    page: currentPage,
    limit: normalizedLimit,
  };
}

/* =====================================================
   GET PUBLIC APPROVED JOB DESCRIPTIONS

   GET /api/public/job-description/approved
===================================================== */

export async function getPublicApprovedJobDescriptions({
  page = 1,
  limit = 500,
  search = "",
} = {}) {
  try {
    const normalizedPage = Math.max(
      Number(page) || 1,
      1,
    );

    const normalizedLimit = Math.min(
      Math.max(
        Number(limit) || 500,
        1,
      ),
      500,
    );

    const response =
      await publicJobDescriptionApi.get(
        "/api/public/job-description/approved",
        {
          params: {
            page: normalizedPage,
            limit: normalizedLimit,
            search: cleanText(search),
          },
        },
      );

    const responseData =
      response?.data || {};

    if (!responseData?.success) {
      return {
        success: false,
        data: [],
        pagination: null,
        message:
          responseData?.error ||
          responseData?.message ||
          "Failed to load public job descriptions.",
      };
    }

    const data = Array.isArray(
      responseData.data,
    )
      ? responseData.data
      : [];

    return {
      success: true,
      data,
      pagination: normalizePagination(
        responseData.pagination,
        {
          page: normalizedPage,
          limit: normalizedLimit,
          total: data.length,
        },
      ),
      message:
        responseData?.message ||
        "Public job descriptions loaded successfully.",
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      pagination: null,
      status:
        error?.response?.status ||
        500,
      message: getApiErrorMessage(
        error,
        "Failed to load public job descriptions.",
      ),
    };
  }
}

/* =====================================================
   GET SINGLE PUBLIC JOB DESCRIPTION

   GET /api/public/job-description/:id
===================================================== */

export async function getPublicJobDescriptionById(
  id,
) {
  const normalizedId = Number(id);

  if (
    !Number.isInteger(
      normalizedId,
    ) ||
    normalizedId <= 0
  ) {
    return {
      success: false,
      data: null,
      status: 400,
      message:
        "Invalid job description ID.",
    };
  }

  try {
    const response =
      await publicJobDescriptionApi.get(
        `/api/public/job-description/${encodeURIComponent(
          normalizedId,
        )}`,
      );

    const responseData =
      response?.data || {};

    if (
      !responseData?.success ||
      !responseData?.data
    ) {
      return {
        success: false,
        data: null,
        status:
          response?.status || 404,
        message:
          responseData?.error ||
          responseData?.message ||
          "Failed to load public job description.",
      };
    }

    return {
      success: true,
      data: responseData.data,
      message:
        responseData?.message ||
        "Public job description loaded successfully.",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      status:
        error?.response?.status ||
        500,
      message: getApiErrorMessage(
        error,
        "Failed to load public job description.",
      ),
    };
  }
}

export default {
  getPublicApprovedJobDescriptions,
  getPublicJobDescriptionById,
};