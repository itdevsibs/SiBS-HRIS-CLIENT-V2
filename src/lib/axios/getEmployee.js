import api from "./api-template";

export function getEmployeePdsPreviewUrl(sibsId) {
  const safeId = String(sibsId || "").trim();
  if (!safeId) return "";

  const baseURL = String(api.defaults?.baseURL || "")
    .trim()
    .replace(/\/+$/, "");
  const path = `/api/employees/${encodeURIComponent(safeId)}/pds.pdf`;
  const query = `_t=${Date.now()}`;

  return baseURL ? `${baseURL}${path}?${query}` : `${path}?${query}`;
}

export async function getEmployee(
  page = 1,
  search = "",
  account = "All",
  options = {},
) {
  const requestConfig = {
    params: {
      page,
      search,
      department: options?.department || "All",
      account: account || "All",
      includeDepartments: options?.includeDepartments ? 1 : 0,
      includeAccounts: options?.includeAccounts ? 1 : 0,
    },
    withCredentials: true,
  };

  const mapResponse = (res) => ({
    success: res.data?.success ?? true,
    data: res.data?.data || [],
    departmentOptions: res.data?.departmentOptions || [],
    accountOptions: res.data?.accountOptions || [],
    selectedDepartment:
      res.data?.selectedDepartment || options?.department || "All",
    selectedAccount: res.data?.selectedAccount || account || "All",
    access: res.data?.access || null,
    pagination: res.data?.pagination || {
      totalPages: 1,
      currentPage: 1,
      total: 0,
    },
    message: res.data?.message || "",
    status: res.status,
  });

  try {
    const res = await api.get("/api/employees", requestConfig);
    return mapResponse(res);
  } catch (err) {
    let finalError = err;

    /*
     * An assigned user's admin access can be changed while an older admin JWT
     * is still active. In that case /api/employees can correctly reject the
     * stale Manager/TL/WFM claim with 403 even though assigned_accounts now
     * grants HR/HR Admin/Super Admin/SOM access.
     *
     * Refresh the authenticated session once so the server can rebuild the JWT
     * from the current assigned_accounts record, then retry this read request.
     * A legitimate 403 remains a 403 after the single retry.
     */
    if (err?.response?.status === 403) {
      try {
        const refreshResponse = await api.post(
          "/api/users/refresh",
          {},
          {
            withCredentials: true,
            skipAuthRedirect: true,
          },
        );

        if (refreshResponse?.data?.success !== false) {
          const retryResponse = await api.get("/api/employees", requestConfig);
          return mapResponse(retryResponse);
        }
      } catch (retryError) {
        finalError = retryError;
      }
    }

    console.error(
      "Axios getEmployee API error:",
      finalError?.response?.status,
      finalError?.response?.data || finalError?.message,
    );

    return {
      success: false,
      data: [],
      departmentOptions: [],
      accountOptions: [],
      selectedDepartment: options?.department || "All",
      selectedAccount: account || "All",
      access: finalError?.response?.data?.access || null,
      pagination: {
        totalPages: 1,
        currentPage: 1,
        total: 0,
      },
      message:
        finalError?.response?.data?.message ||
        finalError?.response?.data?.error ||
        "Failed to fetch employees",
      status: finalError?.response?.status || 500,
      error: finalError,
    };
  }
}

export async function getEmployeeById(sibsId) {
  try {
    const res = await api.get(`/api/employees/${encodeURIComponent(sibsId)}`, {
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
      "Axios getEmployeeById API error:",
      err?.response?.status,
      err?.message,
    );

    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to fetch employee",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}

export async function updateEmployeeProfile(sibsId, payload = {}) {
  try {
    const normalizedSibsId = String(sibsId || "").trim();

    if (!normalizedSibsId) {
      return {
        success: false,
        data: null,
        message: "A valid employee SIBS ID is required",
        status: 400,
      };
    }

    const res = await api.put(
      `/api/employees/${encodeURIComponent(normalizedSibsId)}/profile`,
      payload,
      {
        withCredentials: true,
      },
    );

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || null,
      message: res.data?.message || "Employee profile updated successfully",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios updateEmployeeProfile API error:",
      err?.response?.status,
      err?.response?.data?.message || err?.message,
    );

    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to update employee profile",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}


const EMPLOYEE_PROFILE_SECTION_NAMES = new Set([
  "family",
  "education",
  "eligibility",
  "experience",
  "training",
  "skills",
  "references",
  "application",
]);

export async function getEmployeeProfileSections(sibsId) {
  try {
    const normalizedSibsId = String(sibsId || "").trim();

    if (!normalizedSibsId) {
      return {
        success: false,
        data: null,
        message: "A valid employee SIBS ID is required",
        status: 400,
      };
    }

    const res = await api.get(
      `/api/employees/${encodeURIComponent(normalizedSibsId)}/profile-sections`,
      { withCredentials: true },
    );

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || null,
      message: res.data?.message || "",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios getEmployeeProfileSections API error:",
      err?.response?.status,
      err?.response?.data?.message || err?.message,
    );

    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to load employee profile sections",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}

export async function updateEmployeeProfileSection(
  sibsId,
  section,
  payload = {},
) {
  try {
    const normalizedSibsId = String(sibsId || "").trim();
    const normalizedSection = String(section || "").trim().toLowerCase();

    if (!normalizedSibsId) {
      return {
        success: false,
        data: null,
        message: "A valid employee SIBS ID is required",
        status: 400,
      };
    }

    if (!EMPLOYEE_PROFILE_SECTION_NAMES.has(normalizedSection)) {
      return {
        success: false,
        data: null,
        message: "Unsupported employee profile section",
        status: 400,
      };
    }

    const res = await api.put(
      `/api/employees/${encodeURIComponent(normalizedSibsId)}/profile-sections/${encodeURIComponent(normalizedSection)}`,
      payload,
      { withCredentials: true },
    );

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || null,
      message: res.data?.message || "Employee section saved successfully",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios updateEmployeeProfileSection API error:",
      err?.response?.status,
      err?.response?.data?.message || err?.message,
    );

    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to update employee profile section",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}


export async function getEmployeeProfileDocuments(sibsId) {
  try {
    const normalizedSibsId = String(sibsId || "").trim();

    if (!normalizedSibsId) {
      return {
        success: false,
        data: [],
        requirementGroups: [],
        message: "A valid employee SIBS ID is required",
        status: 400,
      };
    }

    const res = await api.get(
      `/api/employees/${encodeURIComponent(normalizedSibsId)}/profile-documents`,
      { withCredentials: true },
    );

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || [],
      folderStatus: res.data?.folderStatus || null,
      sources: res.data?.sources || null,
      requirementGroups: Array.isArray(res.data?.requirementGroups)
        ? res.data.requirementGroups
        : [],
      message: res.data?.message || "",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios getEmployeeProfileDocuments API error:",
      err?.response?.status,
      err?.response?.data?.message || err?.message,
    );

    return {
      success: false,
      data: [],
      requirementGroups: [],
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to load employee documents",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}

export async function uploadEmployeeProfileDocument(
  sibsId,
  file,
  documentType,
) {
  try {
    const normalizedSibsId = String(sibsId || "").trim();
    const normalizedDocumentType = String(documentType || "").trim();

    if (!normalizedSibsId || !file || !normalizedDocumentType) {
      return {
        success: false,
        data: null,
        message: "Employee, file, and document type are required",
        status: 400,
      };
    }

    const res = await api.post(
      `/api/employees/${encodeURIComponent(normalizedSibsId)}/profile-documents`,
      file,
      {
        params: {
          documentType: normalizedDocumentType,
          originalName: file.name,
        },
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        withCredentials: true,
        transformRequest: [(data) => data],
      },
    );

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || null,
      message: res.data?.message || "Employee document uploaded successfully",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios uploadEmployeeProfileDocument API error:",
      err?.response?.status,
      err?.response?.data?.message || err?.message,
    );

    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to upload employee document",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}

const EMPLOYEE_DOCUMENT_MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function uploadEmployeePreEmploymentRequirement(
  sibsId,
  requirementId,
  file,
) {
  try {
    const normalizedSibsId = String(sibsId || "").trim();
    const normalizedRequirementId = String(requirementId || "").trim();

    if (!normalizedSibsId || !normalizedRequirementId || !file) {
      return {
        success: false,
        data: null,
        message: "Employee, requirement, and file are required",
        status: 400,
      };
    }

    if (Number(file.size || 0) > EMPLOYEE_DOCUMENT_MAX_FILE_SIZE) {
      return {
        success: false,
        data: null,
        message: "The maximum file size is 10 MB",
        status: 400,
      };
    }

    const res = await api.post(
      `/api/employees/${encodeURIComponent(
        normalizedSibsId,
      )}/profile-documents/requirements/${encodeURIComponent(
        normalizedRequirementId,
      )}`,
      file,
      {
        params: { originalName: file.name },
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        withCredentials: true,
        transformRequest: [(data) => data],
      },
    );

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || null,
      message: res.data?.message || "Pre-employment file uploaded successfully",
      status: res.status,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to upload pre-employment file",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}

export async function deleteEmployeePreEmploymentRequirement(
  sibsId,
  requirementId,
) {
  try {
    const normalizedSibsId = String(sibsId || "").trim();
    const normalizedRequirementId = String(requirementId || "").trim();

    if (!normalizedSibsId || !normalizedRequirementId) {
      return {
        success: false,
        data: null,
        message: "A valid employee and requirement are required",
        status: 400,
      };
    }

    const res = await api.delete(
      `/api/employees/${encodeURIComponent(
        normalizedSibsId,
      )}/profile-documents/requirements/${encodeURIComponent(
        normalizedRequirementId,
      )}`,
      { withCredentials: true },
    );

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || null,
      message: res.data?.message || "Pre-employment file permanently deleted",
      status: res.status,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to delete pre-employment file",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}

export async function deleteEmployeeRecruitmentDocument(sibsId, document) {
  try {
    const normalizedSibsId = String(sibsId || "").trim();
    const sourceKey = String(document?.sourceKey || document?.source_key || "").trim();
    const sourceRecordId = String(
      document?.sourceRecordId || document?.source_record_id || "",
    ).trim();
    const externalKey = String(
      document?.externalKey ?? document?.external_key ?? "",
    ).trim();

    if (!normalizedSibsId || !sourceKey || !sourceRecordId || !externalKey) {
      return {
        success: false,
        data: null,
        message: "A valid managed recruitment document is required",
        status: 400,
      };
    }

    const res = await api.delete(
      `/api/employees/${encodeURIComponent(
        normalizedSibsId,
      )}/profile-documents/external/${encodeURIComponent(
        sourceKey,
      )}/${encodeURIComponent(sourceRecordId)}/${encodeURIComponent(
        externalKey,
      )}`,
      { withCredentials: true },
    );

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || null,
      message: res.data?.message || "Recruitment document permanently deleted",
      status: res.status,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to delete recruitment document",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}

async function getBlobErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data;

  if (responseData instanceof Blob) {
    try {
      const raw = await responseData.text();
      const parsed = JSON.parse(raw);
      return parsed?.message || parsed?.error || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }

  return responseData?.message || responseData?.error || fallbackMessage;
}

export async function fetchEmployeeDocumentFile(
  sibsId,
  document,
  { download = false } = {},
) {
  try {
    const normalizedSibsId = String(sibsId || "").trim();
    const sourceKey = String(
      document?.sourceKey || document?.source_key || "employee-profile",
    ).trim();
    let endpoint = "";

    if (!normalizedSibsId || !document) {
      return {
        success: false,
        blob: null,
        message: "A valid employee and document are required",
        status: 400,
      };
    }

    if (!sourceKey || sourceKey === "employee-profile") {
      const normalizedDocumentId = Number(document?.id ?? document);

      if (!Number.isInteger(normalizedDocumentId) || normalizedDocumentId <= 0) {
        return {
          success: false,
          blob: null,
          message: "A valid employee profile document ID is required",
          status: 400,
        };
      }

      endpoint = `/api/employees/${encodeURIComponent(
        normalizedSibsId,
      )}/profile-documents/${normalizedDocumentId}/file`;
    } else {
      const sourceRecordId = String(
        document?.sourceRecordId || document?.source_record_id || "",
      ).trim();
      const externalKey = String(
        document?.externalKey ?? document?.external_key ?? "",
      ).trim();

      if (
        !["talent-pool", "candidate-pipeline"].includes(sourceKey) ||
        !sourceRecordId ||
        !externalKey
      ) {
        return {
          success: false,
          blob: null,
          message: "A valid external employee document reference is required",
          status: 400,
        };
      }

      endpoint = `/api/employees/${encodeURIComponent(
        normalizedSibsId,
      )}/profile-documents/external/${encodeURIComponent(
        sourceKey,
      )}/${encodeURIComponent(sourceRecordId)}/${encodeURIComponent(
        externalKey,
      )}/file`;
    }

    const res = await api.get(endpoint, {
      params: { download: download ? 1 : 0 },
      responseType: "blob",
      withCredentials: true,
    });

    return {
      success: true,
      blob: res.data,
      contentType: res.headers?.["content-type"] || res.data?.type || "",
      message: "",
      status: res.status,
    };
  } catch (err) {
    const message = await getBlobErrorMessage(
      err,
      "Failed to open employee document",
    );

    console.error(
      "Axios fetchEmployeeDocumentFile API error:",
      err?.response?.status,
      message,
    );

    return {
      success: false,
      blob: null,
      message,
      status: err?.response?.status || 500,
      error: err,
    };
  }
}

export async function fetchEmployeeProfileDocumentFile(
  sibsId,
  documentId,
  { download = false } = {},
) {
  try {
    const normalizedSibsId = String(sibsId || "").trim();
    const normalizedDocumentId = Number(documentId);

    if (!normalizedSibsId || !Number.isInteger(normalizedDocumentId)) {
      return {
        success: false,
        blob: null,
        message: "A valid employee and document ID are required",
        status: 400,
      };
    }

    const res = await api.get(
      `/api/employees/${encodeURIComponent(normalizedSibsId)}/profile-documents/${normalizedDocumentId}/file`,
      {
        params: { download: download ? 1 : 0 },
        responseType: "blob",
        withCredentials: true,
      },
    );

    return {
      success: true,
      blob: res.data,
      contentType: res.headers?.["content-type"] || res.data?.type || "",
      message: "",
      status: res.status,
    };
  } catch (err) {
    const message = await getBlobErrorMessage(
      err,
      "Failed to open employee document",
    );

    console.error(
      "Axios fetchEmployeeProfileDocumentFile API error:",
      err?.response?.status,
      message,
    );

    return {
      success: false,
      blob: null,
      message,
      status: err?.response?.status || 500,
      error: err,
    };
  }
}

export async function deleteEmployeeProfileDocument(sibsId, documentId) {
  try {
    const normalizedSibsId = String(sibsId || "").trim();
    const normalizedDocumentId = Number(documentId);

    if (!normalizedSibsId || !Number.isInteger(normalizedDocumentId)) {
      return {
        success: false,
        data: null,
        message: "A valid employee and document ID are required",
        status: 400,
      };
    }

    const res = await api.delete(
      `/api/employees/${encodeURIComponent(normalizedSibsId)}/profile-documents/${normalizedDocumentId}`,
      { withCredentials: true },
    );

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || null,
      message: res.data?.message || "Employee document permanently deleted",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios deleteEmployeeProfileDocument API error:",
      err?.response?.status,
      err?.response?.data?.message || err?.message,
    );

    return {
      success: false,
      data: null,
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to delete employee document",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}

export async function getSupervisorResignations() {
  try {
    const res = await api.get("/api/employees/supervisor/list", {
      withCredentials: true,
    });

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || [],
      message: res.data?.message || "",
      status: res.status,
    };
  } catch (error) {
    console.error(
      "Axios getSupervisorResignations API error:",
      error?.response?.status,
      error?.message,
    );

    return {
      success: false,
      data: [],
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to load resignation records",
      status: error?.response?.status || 500,
      error,
    };
  }
}

export async function saveSupervisorResignation(payload = {}) {
  try {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, value);
      }
    });

    const res = await api.post("/api/resignation/supervisor", formData, {
      withCredentials: true,
    });

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || null,
      message: res.data?.message || "Resignation submitted successfully",
      status: res.status,
    };
  } catch (error) {
    console.error(
      "Axios saveSupervisorResignation API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to submit resignation.",
      status: error?.response?.status || 500,
      error,
    };
  }
}

export async function updateSupervisorResignation({
  id,
  commentSpoken,
  commentRetain,
  employeeRetained,
}) {
  try {
    const res = await api.put(
      `/api/resignation/supervisor/${id}`,
      {
        commentSpoken,
        commentRetain,
        employeeRetained,
      },
      {
        withCredentials: true,
      },
    );

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || null,
      message: res.data?.message || "Resignation updated successfully",
      status: res.status,
    };
  } catch (error) {
    console.error(
      "Axios updateSupervisorResignation API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update resignation",
      status: error?.response?.status || 500,
      error,
    };
  }
}

export async function getSupervisorAttritions() {
  try {
    const res = await api.get("/api/attrition", {
      withCredentials: true,
    });

    return {
      success: res.data?.success ?? true,
      data: res.data?.data || [],
      message: res.data?.message || "",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios getSupervisorAttritions API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      data: [],
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to load attritions",
      status: err?.response?.status || 500,
      error: err,
    };
  }
}

export async function getEmployeePdsPdf(sibsId) {
  const safeId = String(sibsId || "").trim();
  if (!safeId) {
    return {
      success: false,
      data: null,
      filename: "",
      status: 400,
      message: "A valid employee SIBS ID is required.",
    };
  }

  try {
    const response = await api.get(
      `/api/employees/${encodeURIComponent(safeId)}/pds.pdf`,
      { withCredentials: true, responseType: "blob" },
    );
    const contentType = String(response.headers?.["content-type"] || "");
    if (
      !contentType.toLowerCase().includes("application/pdf") ||
      !response.data?.size
    ) {
      throw new Error("The server did not return a valid PDF.");
    }

    const contentDisposition = String(
      response.headers?.["content-disposition"] || "",
    );
    const match = contentDisposition.match(
      /filename\*?=(?:UTF-8''|"?)([^";]+)/i,
    );
    let filename = match?.[1] || "";
    try {
      filename = decodeURIComponent(filename);
    } catch {
      filename = "";
    }
    filename = filename.replace(/["\\/\r\n]/g, "").trim();
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._ -]*\.pdf$/i.test(filename)) {
      filename = `${safeId}_Employee_PDS.pdf`;
    }

    return {
      success: true,
      data: response.data,
      filename,
      status: response.status,
      message: "Employee PDS generated.",
    };
  } catch (error) {
    let responseMessage = "";
    const errorBlob = error?.response?.data;
    if (errorBlob instanceof Blob) {
      try {
        const parsed = JSON.parse(await errorBlob.text());
        responseMessage = parsed?.message || parsed?.error || "";
      } catch {
        responseMessage = "";
      }
    }

    return {
      success: false,
      data: null,
      filename: "",
      status: error?.response?.status || 500,
      message:
        responseMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Unable to generate the employee PDS.",
    };
  }
}
