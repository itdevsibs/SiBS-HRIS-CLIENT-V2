import api from "./api-template";

export async function getKronosDatas(
  page = 1,
  search = "",
  account = "All",
  options = {},
) {
  try {
    const res = await api.get("/api/kronos-datas", {
      params: {
        page,
        search,
        department: options?.department || "All",
        account: account || "All",
        limit: options?.limit || 15,
        includeDepartments: options?.includeDepartments ? 1 : 0,
        includeAccounts: options?.includeAccounts ? 1 : 0,
      },
      withCredentials: true,
    });

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || [],
      departmentOptions: res.data?.departmentOptions || [],
      accountOptions: res.data?.accountOptions || [],
      selectedDepartment:
        res.data?.selectedDepartment || options?.department || "All",
      selectedAccount: res.data?.selectedAccount || account || "All",
      access: res.data?.access || {
        canFilterEmployees: false,
        role: "",
        tokenType: "",
        adminAccess: 0,
      },
      recordsPath: res.data?.recordsPath || "",
      raw: res.data?.raw || null,
      source: res.data?.source || "",
      pagination: res.data?.pagination || {
        totalPages: 1,
        currentPage: 1,
        total: 0,
        limit: options?.limit || 15,
      },
      message: res.data?.message || "",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios getKronosDatas API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: [],
      departmentOptions: [],
      accountOptions: [],
      selectedDepartment: options?.department || "All",
      selectedAccount: account || "All",
      access: {
        canFilterEmployees: false,
        role: "",
        tokenType: "",
        adminAccess: 0,
      },
      recordsPath: "",
      raw: null,
      source: "",
      pagination: {
        totalPages: 1,
        currentPage: 1,
        total: 0,
        limit: options?.limit || 15,
      },
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to fetch Kronos datas",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}

export async function getKronosDataById(sibsId) {
  try {
    const res = await api.get(`/api/kronos-datas/${sibsId}`, {
      withCredentials: true,
    });

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || null,
      source: res.data?.source || "",
      message: res.data?.message || "",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios getKronosDataById API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: null,
      source: "",
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to fetch Kronos data",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}