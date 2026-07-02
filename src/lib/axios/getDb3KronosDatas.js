import api from "./api-template";

const DEFAULT_LIMIT = 25;

export async function getDb3KronosDatas(
  page = 1,
  search = "",
  options = {},
) {
  try {
    const res = await api.get("/api/db3/datas", {
      params: {
        page,
        search,
        limit: options?.limit || DEFAULT_LIMIT,
        ...options?.params,
      },
      withCredentials: true,
    });

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || [],
      recordsPath: res.data?.recordsPath || "",
      raw: res.data?.raw || null,
      pagination: res.data?.pagination || {
        totalPages: 1,
        currentPage: 1,
        total: 0,
        limit: options?.limit || DEFAULT_LIMIT,
      },
      message: res.data?.message || "",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios getDb3KronosDatas API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: [],
      recordsPath: "",
      raw: null,
      pagination: {
        totalPages: 1,
        currentPage: 1,
        total: 0,
        limit: options?.limit || DEFAULT_LIMIT,
      },
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to fetch DB3 Kronos datas",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}

export async function getDb3KronosDataById(id) {
  try {
    const res = await api.get(`/api/db3/datas/${id}`, {
      withCredentials: true,
    });

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || null,
      message: res.data?.message || "",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios getDb3KronosDataById API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to fetch DB3 Kronos record",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}

export async function postDb3KronosDatas(payload = {}, options = {}) {
  try {
    const res = await api.post("/api/db3/datas", payload, {
      params: {
        page: options?.page || 1,
        search: options?.search || "",
        limit: options?.limit || DEFAULT_LIMIT,
        ...options?.params,
      },
      withCredentials: true,
    });

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || [],
      recordsPath: res.data?.recordsPath || "",
      raw: res.data?.raw || null,
      pagination: res.data?.pagination || {
        totalPages: 1,
        currentPage: 1,
        total: 0,
        limit: options?.limit || DEFAULT_LIMIT,
      },
      message: res.data?.message || "DB3 Kronos request submitted successfully",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios postDb3KronosDatas API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: [],
      recordsPath: "",
      raw: null,
      pagination: {
        totalPages: 1,
        currentPage: 1,
        total: 0,
        limit: options?.limit || DEFAULT_LIMIT,
      },
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to submit DB3 Kronos request",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}