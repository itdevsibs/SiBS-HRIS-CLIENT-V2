import api from "./api-template";

/* =========================================================
   APPROVAL REQUEST API
   Modules:
   - Attrition
   - Weekly Hiring Plan
   - Job Description
   - Hiring Needs

   Attrition tab displays merged:
   - Resignation approvals
   - Attrition approvals
========================================================= */

const APPROVAL_MODULES = [
  "Attrition",
  "Weekly Hiring Plan",
  "Job Description",
  "Hiring Needs",
];

const DEFAULT_COUNTS = {
  total: 0,
  pending: 0,
  forReview: 0,
  approved: 0,
  rejected: 0,
};

const DEFAULT_PAGINATION = {
  totalPages: 1,
  currentPage: 1,
  total: 0,
  limit: 200,
};

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */

function normalizeError(error, fallbackMessage = "Request failed.") {
  return {
    success: false,
    data: [],
    counts: DEFAULT_COUNTS,
    pagination: DEFAULT_PAGINATION,
    message:
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallbackMessage,
    status: error?.response?.status || 500,
  };
}

function cleanParams(params = {}) {
  const cleaned = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (value === "All") return;

    cleaned[key] = value;
  });

  return cleaned;
}

/* ---------------------------------------------------------
   Main Approval Request Fetchers
--------------------------------------------------------- */

export async function getApprovalRequests({
  page = 1,
  search = "",
  module = "",
  status = "",
  type = "",
  limit = 200,
} = {}) {
  try {
    const res = await api.get("/api/approval-requests", {
      params: cleanParams({
        page,
        search,
        module,
        status,
        type,
        limit,
      }),
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error("GET APPROVAL REQUESTS ERROR:", error);

    return normalizeError(error, "Failed to load approval requests.");
  }
}

export async function getApprovalRequestById(id) {
  try {
    if (!id) {
      return {
        success: false,
        data: null,
        message: "Approval request ID is required.",
        status: 400,
      };
    }

    const res = await api.get(`/api/approval-requests/${id}`, {
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error("GET APPROVAL REQUEST BY ID ERROR:", error);

    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load approval request.",
      status: error?.response?.status || 500,
    };
  }
}

export async function getApprovalRequestCounts({
  module = "",
  search = "",
  status = "",
  type = "",
} = {}) {
  try {
    const res = await api.get("/api/approval-requests/counts", {
      params: cleanParams({
        module,
        search,
        status,
        type,
      }),
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error("GET APPROVAL REQUEST COUNTS ERROR:", error);

    return {
      success: false,
      data: DEFAULT_COUNTS,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load approval request counts.",
      status: error?.response?.status || 500,
    };
  }
}

export async function getApprovalRequestModules() {
  try {
    const res = await api.get("/api/approval-requests/modules", {
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error("GET APPROVAL REQUEST MODULES ERROR:", error);

    return {
      success: true,
      data: APPROVAL_MODULES,
      message: "Approval modules loaded locally.",
      status: error?.response?.status || 200,
    };
  }
}

/* ---------------------------------------------------------
   Module Specific Fetchers
--------------------------------------------------------- */

export async function getAttritionApprovalRequests({
  page = 1,
  search = "",
  status = "",
  type = "",
  limit = 200,
} = {}) {
  try {
    const res = await api.get("/api/approval-requests/attrition", {
      params: cleanParams({
        page,
        search,
        status,
        type,
        limit,
      }),
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error("GET ATTRITION APPROVAL REQUESTS ERROR:", error);

    return normalizeError(
      error,
      "Failed to load attrition approval requests.",
    );
  }
}

export async function getWeeklyHiringPlanApprovalRequests({
  page = 1,
  search = "",
  status = "",
  type = "",
  limit = 200,
} = {}) {
  const params = cleanParams({
    page,
    search,
    status,
    type,
    limit,
  });

  try {
    const res = await api.get("/api/approval-requests/weekly-hiring-plan", {
      params,
      withCredentials: true,
    });

    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data;
    }

    throw new Error(
      res.data?.message || "Weekly Hiring Plan module endpoint returned no data.",
    );
  } catch (moduleError) {
    console.error(
      "GET WEEKLY HIRING PLAN MODULE ENDPOINT ERROR:",
      moduleError,
    );

    try {
      const fallbackRes = await api.get("/api/approval-requests", {
        params: cleanParams({
          page,
          search,
          module: "Weekly Hiring Plan",
          status,
          type,
          limit,
        }),
        withCredentials: true,
      });

      return fallbackRes.data;
    } catch (fallbackError) {
      console.error(
        "GET WEEKLY HIRING PLAN FALLBACK APPROVAL REQUESTS ERROR:",
        fallbackError,
      );

      return normalizeError(
        fallbackError,
        "Failed to load Weekly Hiring Plan approval requests.",
      );
    }
  }
}

export async function getJobDescriptionApprovalRequests({
  page = 1,
  search = "",
  status = "",
  type = "",
  limit = 200,
} = {}) {
  try {
    const res = await api.get("/api/approval-requests/job-description", {
      params: cleanParams({
        page,
        search,
        status,
        type,
        limit,
      }),
      withCredentials: true,
    });

    console.log("jd approval data", res.data)

    return res.data;
  } catch (error) {
    console.error("GET JOB DESCRIPTION APPROVAL REQUESTS ERROR:", error);

    return normalizeError(
      error,
      "Failed to load Job Description approval requests.",
    );
  }
}

export async function getHiringNeedsApprovalRequests({
  page = 1,
  search = "",
  status = "",
  type = "",
  limit = 200,
} = {}) {
  try {
    const res = await api.get("/api/approval-requests/hiring-needs", {
      params: cleanParams({
        page,
        search,
        status,
        type,
        limit,
      }),
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error("GET HIRING NEEDS APPROVAL REQUESTS ERROR:", error);

    return normalizeError(
      error,
      "Failed to load Hiring Needs approval requests.",
    );
  }
}

/* ---------------------------------------------------------
   Module Resolver
--------------------------------------------------------- */

export async function getApprovalRequestsByModule(moduleName, params = {}) {
  switch (moduleName) {
    case "Attrition":
      return getAttritionApprovalRequests(params);

    case "Weekly Hiring Plan":
      return getWeeklyHiringPlanApprovalRequests(params);

    case "Job Description":
      return getJobDescriptionApprovalRequests(params);

    case "Hiring Needs":
      return getHiringNeedsApprovalRequests(params);

    default:
      return getApprovalRequests({
        ...params,
        module: moduleName,
      });
  }
}

/* ---------------------------------------------------------
   Generic Approval Actions
--------------------------------------------------------- */

export async function approveApprovalRequest(id, payload = {}) {
  try {
    if (!id) {
      return {
        success: false,
        message: "Approval request ID is required.",
        status: 400,
      };
    }

    const res = await api.patch(
      `/api/approval-requests/${id}/approve`,
      {
        remarks: payload.remarks || "",
        module: payload.module || "",
        type: payload.type || "",
        requestType: payload.requestType || payload.type || "",
        source: payload.source || "",

        personallySpoken: payload.personallySpoken || "",
        employeeRetained: payload.employeeRetained || "",
        actionTaken: payload.actionTaken || "",

        employeeSibsId: payload.employeeSibsId || "",

        tlIsApproved: Number(payload.tlIsApproved ?? 0),
        tlIsDeclined: Number(payload.tlIsDeclined ?? 0),
        tlRemarks: payload.tlRemarks || "",

        omIsApproved: Number(payload.omIsApproved ?? 0),
        omIsDeclined: Number(payload.omIsDeclined ?? 0),
        omRemarks: payload.omRemarks || "",

        somIsApproved: Number(payload.somIsApproved ?? 0),
        somIsDeclined: Number(payload.somIsDeclined ?? 0),
        somRemarks: payload.somRemarks || "",
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return res.data;
  } catch (error) {
    console.error("APPROVE APPROVAL REQUEST ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to approve approval request.",
      status: error?.response?.status || 500,
    };
  }
}

export async function rejectApprovalRequest(id, payload = {}) {
  try {
    if (!id) {
      return {
        success: false,
        message: "Approval request ID is required.",
        status: 400,
      };
    }

    const res = await api.patch(
      `/api/approval-requests/${id}/reject`,
      {
        remarks: payload.remarks || "",
        module: payload.module || "",
        type: payload.type || "",
        requestType: payload.requestType || payload.type || "",
        source: payload.source || "",

        personallySpoken: payload.personallySpoken || "",
        employeeRetained: payload.employeeRetained || "",
        actionTaken: payload.actionTaken || "",

        employeeSibsId: payload.employeeSibsId || "",

        tlIsApproved: Number(payload.tlIsApproved ?? 0),
        tlIsDeclined: Number(payload.tlIsDeclined ?? 0),
        tlRemarks: payload.tlRemarks || "",

        omIsApproved: Number(payload.omIsApproved ?? 0),
        omIsDeclined: Number(payload.omIsDeclined ?? 0),
        omRemarks: payload.omRemarks || "",

        somIsApproved: Number(payload.somIsApproved ?? 0),
        somIsDeclined: Number(payload.somIsDeclined ?? 0),
        somRemarks: payload.somRemarks || "",
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return res.data;
  } catch (error) {
    console.error("REJECT APPROVAL REQUEST ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to reject approval request.",
      status: error?.response?.status || 500,
    };
  }
}

export async function updateApprovalRequestStatus(id, payload = {}) {
  try {
    if (!id) {
      return {
        success: false,
        message: "Approval request ID is required.",
        status: 400,
      };
    }

    const res = await api.patch(
      `/api/approval-requests/${id}/status`,
      {
        status: payload.status || "",
        remarks: payload.remarks || "",
        module: payload.module || "",
        type: payload.type || "",
        requestType: payload.requestType || payload.type || "",
        source: payload.source || "",
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return res.data;
  } catch (error) {
    console.error("UPDATE APPROVAL REQUEST STATUS ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update approval request status.",
      status: error?.response?.status || 500,
    };
  }
}

/* ---------------------------------------------------------
   Module Specific Actions
--------------------------------------------------------- */

export async function approveAttritionModuleRequest(id, payload = {}) {
  try {
    if (!id) {
      return {
        success: false,
        message: "Approval request ID is required.",
        status: 400,
      };
    }

    const res = await api.patch(
      `/api/approval-requests/attrition/${id}/approve`,
      {
        remarks: payload.remarks || "",
        module: payload.module || "Attrition",
        type: payload.type || "",
        requestType: payload.requestType || payload.type || "",
        source: payload.source || "",

        personallySpoken: payload.personallySpoken || "",
        employeeRetained: payload.employeeRetained || "",
        actionTaken: payload.actionTaken || "",

        employeeSibsId: payload.employeeSibsId || "",

        tlIsApproved: Number(payload.tlIsApproved ?? 0),
        tlIsDeclined: Number(payload.tlIsDeclined ?? 0),
        tlRemarks: payload.tlRemarks || "",

        omIsApproved: Number(payload.omIsApproved ?? 0),
        omIsDeclined: Number(payload.omIsDeclined ?? 0),
        omRemarks: payload.omRemarks || "",

        somIsApproved: Number(payload.somIsApproved ?? 0),
        somIsDeclined: Number(payload.somIsDeclined ?? 0),
        somRemarks: payload.somRemarks || "",
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return res.data;
  } catch (error) {
    console.error("APPROVE ATTRITION MODULE REQUEST ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to approve attrition module request.",
      status: error?.response?.status || 500,
    };
  }
}

export async function rejectAttritionModuleRequest(id, payload = {}) {
  try {
    if (!id) {
      return {
        success: false,
        message: "Approval request ID is required.",
        status: 400,
      };
    }

    const res = await api.patch(
      `/api/approval-requests/attrition/${id}/reject`,
      {
        remarks: payload.remarks || "",
        module: payload.module || "Attrition",
        type: payload.type || "",
        requestType: payload.requestType || payload.type || "",
        source: payload.source || "",

        personallySpoken: payload.personallySpoken || "",
        employeeRetained: payload.employeeRetained || "",
        actionTaken: payload.actionTaken || "",

        employeeSibsId: payload.employeeSibsId || "",

        tlIsApproved: Number(payload.tlIsApproved ?? 0),
        tlIsDeclined: Number(payload.tlIsDeclined ?? 0),
        tlRemarks: payload.tlRemarks || "",

        omIsApproved: Number(payload.omIsApproved ?? 0),
        omIsDeclined: Number(payload.omIsDeclined ?? 0),
        omRemarks: payload.omRemarks || "",

        somIsApproved: Number(payload.somIsApproved ?? 0),
        somIsDeclined: Number(payload.somIsDeclined ?? 0),
        somRemarks: payload.somRemarks || "",
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return res.data;
  } catch (error) {
    console.error("REJECT ATTRITION MODULE REQUEST ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to reject attrition module request.",
      status: error?.response?.status || 500,
    };
  }
}

export async function approveWeeklyHiringPlanRequest(id, payload = {}) {
  try {
    if (!id) {
      return {
        success: false,
        message: "Approval request ID is required.",
        status: 400,
      };
    }

    const approvedRequiredHeadcount =
      payload.approvedRequiredHeadcount ??
      payload.approved_required_headcount ??
      payload.finalRequiredHeadcount ??
      payload.final_required_headcount ??
      payload.hrEditedRequiredHeadcount ??
      payload.hr_edited_required_headcount ??
      "";

    const res = await api.patch(
      `/api/approval-requests/weekly-hiring-plan/${id}/approve`,
      {
        remarks: payload.remarks || "",

        module: payload.module || "Weekly Hiring Plan",
        type: payload.type || "",
        requestType: payload.requestType || payload.type || "",
        source: payload.source || "",

        requiredHeadcount: payload.requiredHeadcount ?? "",
        requestedRequiredHeadcount: payload.requestedRequiredHeadcount ?? "",
        requested_required_headcount:
          payload.requested_required_headcount ??
          payload.requestedRequiredHeadcount ??
          "",

        approvedRequiredHeadcount,
        approved_required_headcount: approvedRequiredHeadcount,
        finalRequiredHeadcount: approvedRequiredHeadcount,
        final_required_headcount: approvedRequiredHeadcount,
        hrEditedRequiredHeadcount: approvedRequiredHeadcount,
        hr_edited_required_headcount: approvedRequiredHeadcount,
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return res.data;
  } catch (error) {
    console.error("APPROVE WEEKLY HIRING PLAN REQUEST ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to approve Weekly Hiring Plan request.",
      status: error?.response?.status || 500,
    };
  }
}

export async function rejectWeeklyHiringPlanRequest(id, payload = {}) {
  try {
    const res = await api.patch(
      `/api/approval-requests/weekly-hiring-plan/${id}/reject`,
      {
        remarks: payload.remarks || "",
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return res.data;
  } catch (error) {
    console.error("REJECT WEEKLY HIRING PLAN REQUEST ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to reject Weekly Hiring Plan request.",
      status: error?.response?.status || 500,
    };
  }
}

export async function approveJobDescriptionRequest(id, payload = {}) {
  try {
    const res = await api.patch(
      `/api/approval-requests/job-description/${id}/approve`,
      {
        remarks: payload.remarks || "",
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return res.data;
  } catch (error) {
    console.error("APPROVE JOB DESCRIPTION REQUEST ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to approve Job Description request.",
      status: error?.response?.status || 500,
    };
  }
}

export async function rejectJobDescriptionRequest(id, payload = {}) {
  try {
    const res = await api.patch(
      `/api/approval-requests/job-description/${id}/reject`,
      {
        remarks: payload.remarks || "",
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return res.data;
  } catch (error) {
    console.error("REJECT JOB DESCRIPTION REQUEST ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to reject Job Description request.",
      status: error?.response?.status || 500,
    };
  }
}

export async function approveHiringNeedsRequest(id, payload = {}) {
  try {
    const res = await api.patch(
      `/api/approval-requests/hiring-needs/${id}/approve`,
      {
        remarks: payload.remarks || "",
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return res.data;
  } catch (error) {
    console.error("APPROVE HIRING NEEDS REQUEST ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to approve Hiring Needs request.",
      status: error?.response?.status || 500,
    };
  }
}

export async function rejectHiringNeedsRequest(id, payload = {}) {
  try {
    const res = await api.patch(
      `/api/approval-requests/hiring-needs/${id}/reject`,
      {
        remarks: payload.remarks || "",
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return res.data;
  } catch (error) {
    console.error("REJECT HIRING NEEDS REQUEST ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to reject Hiring Needs request.",
      status: error?.response?.status || 500,
    };
  }
}

/* ---------------------------------------------------------
   Module Action Resolvers
--------------------------------------------------------- */

export async function approveRequestByModule(moduleName, id, payload = {}) {
  switch (moduleName) {
    case "Attrition":
      return approveAttritionModuleRequest(id, payload);

    case "Weekly Hiring Plan":
      return approveWeeklyHiringPlanRequest(id, payload);

    case "Job Description":
      return approveJobDescriptionRequest(id, payload);

    case "Hiring Needs":
      return approveHiringNeedsRequest(id, payload);

    default:
      return approveApprovalRequest(id, {
        ...payload,
        module: moduleName,
      });
  }
}

export async function rejectRequestByModule(moduleName, id, payload = {}) {
  switch (moduleName) {
    case "Attrition":
      return rejectAttritionModuleRequest(id, payload);

    case "Weekly Hiring Plan":
      return rejectWeeklyHiringPlanRequest(id, payload);

    case "Job Description":
      return rejectJobDescriptionRequest(id, payload);

    case "Hiring Needs":
      return rejectHiringNeedsRequest(id, payload);

    default:
      return rejectApprovalRequest(id, {
        ...payload,
        module: moduleName,
      });
  }
}

/* ---------------------------------------------------------
   Bulk Placeholders
--------------------------------------------------------- */

export async function bulkApproveApprovalRequests(payload = {}) {
  try {
    const res = await api.patch(
      "/api/approval-requests/bulk/approve",
      {
        ids: Array.isArray(payload.ids) ? payload.ids : [],
        module: payload.module || "",
        remarks: payload.remarks || "",
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return res.data;
  } catch (error) {
    console.error("BULK APPROVE APPROVAL REQUESTS ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to bulk approve approval requests.",
      status: error?.response?.status || 500,
    };
  }
}

export async function bulkRejectApprovalRequests(payload = {}) {
  try {
    const res = await api.patch(
      "/api/approval-requests/bulk/reject",
      {
        ids: Array.isArray(payload.ids) ? payload.ids : [],
        module: payload.module || "",
        remarks: payload.remarks || "",
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return res.data;
  } catch (error) {
    console.error("BULK REJECT APPROVAL REQUESTS ERROR:", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to bulk reject approval requests.",
      status: error?.response?.status || 500,
    };
  }
}

export default {
  getApprovalRequests,
  getApprovalRequestById,
  getApprovalRequestCounts,
  getApprovalRequestModules,

  getAttritionApprovalRequests,
  getWeeklyHiringPlanApprovalRequests,
  getJobDescriptionApprovalRequests,
  getHiringNeedsApprovalRequests,
  getApprovalRequestsByModule,

  approveApprovalRequest,
  rejectApprovalRequest,
  updateApprovalRequestStatus,

  approveAttritionModuleRequest,
  rejectAttritionModuleRequest,

  approveWeeklyHiringPlanRequest,
  rejectWeeklyHiringPlanRequest,

  approveJobDescriptionRequest,
  rejectJobDescriptionRequest,

  approveHiringNeedsRequest,
  rejectHiringNeedsRequest,

  approveRequestByModule,
  rejectRequestByModule,

  bulkApproveApprovalRequests,
  bulkRejectApprovalRequests,
};