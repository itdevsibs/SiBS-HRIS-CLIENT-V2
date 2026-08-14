import api from "./api-template";

const REQUEST_TIMEOUT = 15000;
const SEND_EMAIL_TIMEOUT = 45000;
const BASE_PATH = "/api/applicant-leads";

function normalizeApiError(err, fallbackMessage) {
  const isTimeout =
    err?.code === "ECONNABORTED" ||
    String(err?.message || "").toLowerCase().includes("timeout");

  return {
    success: false,
    data: null,
    message: isTimeout
      ? "The request took too long. Please try again."
      : err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        fallbackMessage,
    status: err?.response?.status || 500,
  };
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function getFullName(row = {}) {
  const fullName = cleanText(row.fullName || row.full_name || row.name);

  if (fullName) return fullName;

  return [
    row.first_name || row.firstName,
    row.middle_name || row.middleName,
    row.last_name || row.lastName,
    row.suffix,
  ]
    .map(cleanText)
    .filter(Boolean)
    .join(" ");
}

function getDateOnly(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function normalizeLookupOption(row = {}) {
  const id = row.id ?? row.value ?? row.key ?? "";
  const label =
    cleanText(row.label || row.name || row.source || row.department || row.account) ||
    cleanText(id);

  return {
    ...row,
    id,
    value: id || label,
    label,
  };
}

export function normalizeApplicantLead(row = {}) {
  const id = row.id ?? row.lead_id ?? row.leadId;
  const leadId = row.lead_id || row.leadId || row.id;

  return {
    id,
    leadId,
    firstName: row.first_name || row.firstName || "",
    lastName: row.last_name || row.lastName || "",
    middleName: row.middle_name || row.middleName || "",
    suffix: row.suffix || "",
    fullName: getFullName(row),
    cpNum: row.cp_number || row.cpNum || row.cellphone || "",
    email: row.email_address || row.email || row.emailAddress || "",
    department:
      row.department_name ||
      row.department ||
      row.departmentName ||
      row.department_id ||
      "",
    departmentId: row.department_id || row.departmentId || "",
    specificAccount:
      row.account_name ||
      row.specificAccount ||
      row.account ||
      row.accountName ||
      row.account_id ||
      "",
    accountId: row.account_id || row.accountId || "",
    source:
      row.sourcing_name ||
      row.source ||
      row.sourcing ||
      row.sourcingName ||
      row.sourcing_id ||
      "",
    sourcingId: row.sourcing_id || row.sourcingId || "",
    preferredSite:
      row.preferred_location ||
      row.preferredSite ||
      row.preferredLocation ||
      "",
    status: row.status || "New Lead",
    referralCode: row.referral_code || row.referralCode || "",
    talentPoolApplicationId:
      row.talent_pool_application_id ||
      row.talentPoolApplicationId ||
      "",
    movedToTalentPoolBySibsId:
      row.moved_to_talent_pool_by_sibs_id ||
      row.movedToTalentPoolBySibsId ||
      "",
    movedToTalentPoolAt:
      row.moved_to_talent_pool_at ||
      row.movedToTalentPoolAt ||
      "",
    notes: row.remarks || row.notes || "",
    inputtedBy:
      row.logged_by_name ||
      row.inputtedBy ||
      row.loggedBy ||
      "",
    loggedByName: row.logged_by_name || row.loggedByName || "",
    loggedBySibsId: row.logged_by_sibs_id || row.loggedBySibsId || "",
    dateLogged: getDateOnly(row.created_at || row.createdAt || row.dateLogged),
    lastContactDate: getDateOnly(
      row.last_contact_date || row.lastContactDate || row.updated_at,
    ),
    raw: row,
  };
}

export function normalizeApplicantLeads(rows = []) {
  return rows.map(normalizeApplicantLead);
}

export function buildApplicantLeadPayload(formData = {}, user = {}) {
  const loggedBySibsId =
    user?.sibsId ||
    user?.sibs_id ||
    user?.employee_sibs_id ||
    user?.employeeSibsId ||
    user?.id ||
    "";

  return {
    first_name: cleanText(formData.firstName),
    last_name: cleanText(formData.lastName),
    middle_name: cleanText(formData.middleName),
    suffix: cleanText(formData.suffix),
    cp_number: cleanText(formData.cpNum),
    email_address: cleanText(formData.email),
    department_id: formData.departmentId || formData.department_id || null,
    account_id: formData.accountId || formData.account_id || null,
    sourcing_id: formData.sourcingId || formData.sourcing_id || null,
    preferred_location: cleanText(formData.preferredSite),
    status: cleanText(formData.status) || "New Lead",
    remarks: cleanText(formData.notes),
    logged_by_sibs_id: cleanText(loggedBySibsId),

    department_name: cleanText(formData.department),
    account_name: cleanText(formData.specificAccount),
    sourcing_name: cleanText(formData.source),
  };
}

function unwrapApplicantLeadResponse(resData, fallback = []) {
  const data = resData?.data ?? resData?.rows ?? resData?.applicantLeads ?? resData;
  return Array.isArray(data) ? data : fallback;
}

export async function getApplicantLeads(params = {}) {
  try {
    const res = await api.get(BASE_PATH, {
      params,
      withCredentials: true,
      timeout: REQUEST_TIMEOUT,
    });

    const rows = unwrapApplicantLeadResponse(res.data);

    return {
      success: res.data?.success !== false,
      data: normalizeApplicantLeads(rows),
      message: res.data?.message || "Applicant leads loaded.",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios getApplicantLeads API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      ...normalizeApiError(err, "Failed to load applicant leads."),
      data: [],
    };
  }
}

export async function getApplicantLeadOptions() {
  try {
    const res = await api.get(`${BASE_PATH}/options`, {
      withCredentials: true,
      timeout: REQUEST_TIMEOUT,
    });

    const data = res.data?.data || {};

    return {
      success: res.data?.success !== false,
      data: {
        departments: (data.departments || []).map(normalizeLookupOption),
        accounts: (data.accounts || []).map(normalizeLookupOption),
        sources: (data.sources || []).map(normalizeLookupOption),
      },
      message: res.data?.message || "Applicant lead options loaded.",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios getApplicantLeadOptions API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      ...normalizeApiError(err, "Failed to load applicant lead options."),
      data: {
        departments: [],
        accounts: [],
        sources: [],
      },
    };
  }
}

export async function createApplicantLead(payload) {
  try {
    const res = await api.post(BASE_PATH, payload, {
      withCredentials: true,
      timeout: REQUEST_TIMEOUT,
    });

    return {
      success: res.data?.success !== false,
      data: normalizeApplicantLead(res.data?.data || res.data?.lead || res.data),
      message: res.data?.message || "Applicant lead saved.",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios createApplicantLead API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return normalizeApiError(err, "Failed to save applicant lead.");
  }
}

export async function updateApplicantLead(id, payload) {
  try {
    const res = await api.put(`${BASE_PATH}/${encodeURIComponent(id)}`, payload, {
      withCredentials: true,
      timeout: REQUEST_TIMEOUT,
    });

    return {
      success: res.data?.success !== false,
      data: normalizeApplicantLead(res.data?.data || res.data?.lead || res.data),
      message: res.data?.message || "Applicant lead updated.",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios updateApplicantLead API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return normalizeApiError(err, "Failed to update applicant lead.");
  }
}

export async function updateApplicantLeadStatus(id, payload) {
  try {
    const res = await api.patch(
      `${BASE_PATH}/${encodeURIComponent(id)}/status`,
      payload,
      {
        withCredentials: true,
        timeout: REQUEST_TIMEOUT,
      },
    );

    return {
      success: res.data?.success !== false,
      data: normalizeApplicantLead(res.data?.data || res.data?.lead || res.data),
      message: res.data?.message || "Applicant lead status updated.",
      status: res.status,
    };
  } catch (err) {
    console.error(
      "Axios updateApplicantLeadStatus API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return normalizeApiError(err, "Failed to update applicant lead status.");
  }
}

export async function sendApplicantLeadApplicationLink(id) {
  try {
    const res = await api.post(
      `${BASE_PATH}/${encodeURIComponent(id)}/send-application-link`,
      {},
      {
        withCredentials: true,
        timeout: SEND_EMAIL_TIMEOUT,
      },
    );

    return {
      success: res.data?.success !== false,
      data: normalizeApplicantLead(res.data?.data || res.data?.lead || res.data),
      message: res.data?.message || "Application link email sent.",
      status: res.status,
      email: res.data?.email || null,
    };
  } catch (err) {
    console.error(
      "Axios sendApplicantLeadApplicationLink API error:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return normalizeApiError(err, "Failed to send application link email.");
  }
}

export default {
  getApplicantLeads,
  getApplicantLeadOptions,
  createApplicantLead,
  updateApplicantLead,
  updateApplicantLeadStatus,
  sendApplicantLeadApplicationLink,
};
