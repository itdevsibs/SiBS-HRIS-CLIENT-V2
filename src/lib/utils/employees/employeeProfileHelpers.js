import { PROFILE_TABS } from "./employeeProfileSchemas.js";

export function cleanText(value) {
  return String(value ?? "").trim();
}

export function firstValue(...values) {
  return values.find((value) => cleanText(value)) || "";
}

export function normalizeList(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [trimmed];
    }
  }

  return [];
}

function formatNamePart(value) {
  const cleaned = cleanText(value).toLowerCase();
  if (!cleaned) return "";

  return cleaned.replace(/(^|[\s'-])([a-z])/g, (match, separator, letter) => {
    return `${separator}${letter.toUpperCase()}`;
  });
}

export function getFullName(employee) {
  const lastName = cleanText(employee?.lastName).toUpperCase();
  const firstName = formatNamePart(employee?.firstName);
  const middleName = formatNamePart(employee?.middleName);
  const extension = cleanText(employee?.nameExtension).toUpperCase();
  const givenNames = [firstName, middleName, extension].filter(Boolean).join(" ");

  if (lastName && givenNames) return `${lastName}, ${givenNames}`;
  if (lastName) return lastName;
  return givenNames;
}

export function getProfileSibsId(employee) {
  const value = firstValue(
    employee?.sibsId,
    employee?.sibs_id,
    employee?.employeeSibsId,
    employee?.employee_sibs_id,
    employee?.gy_emp_code,
    employee?.gy_user_code,
    employee?.username,
    employee?.candidateCode,
    employee?.candidate_code,
  );

  const cleaned = cleanText(value);
  if (!cleaned || cleaned.includes("@")) return "";
  return cleaned;
}

export function getEmployeeInitials(employee) {
  const first = cleanText(employee?.firstName)?.[0] || "";
  const last = cleanText(employee?.lastName)?.[0] || "";
  return `${first}${last}`.toUpperCase() || "S";
}

export function getProfileImageUrl(employee, apiUrl) {
  const directUrl = firstValue(
    employee?.profilePictureUrl,
    employee?.profile_picture_url,
    employee?.profileUrl,
    employee?.profile_url,
    employee?.profileImageUrl,
    employee?.profile_image_url,
    employee?.avatarUrl,
    employee?.avatar_url,
    employee?.photoUrl,
    employee?.photo_url,
    employee?.imageUrl,
    employee?.image_url,
  );

  if (directUrl) return directUrl;

  const filename = firstValue(
    employee?.profileFilename,
    employee?.profile_filename,
    employee?.profilePicture,
    employee?.profile_picture,
    employee?.profileImage,
    employee?.profile_image,
    employee?.avatar,
    employee?.photo,
    employee?.image,
    employee?.employeePhoto,
    employee?.employee_photo,
    employee?.employeePicture,
    employee?.employee_picture,
  );

  if (!filename) return "";
  if (String(filename).startsWith("http")) return filename;

  return `${apiUrl}/api/employee-profile/file/${encodeURIComponent(filename)}`;
}

export function formatDisplayDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatLongDisplayDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getRegularizationDate(employee) {
  const explicitDate = firstValue(
    employee?.regularizationDate,
    employee?.regularization_date,
    employee?.regularizedDate,
    employee?.regularized_date,
    employee?.dateOfRegularization,
    employee?.date_of_regularization,
    employee?.regular_date,
    employee?.gy_reg_date,
    employee?.gy_emp_regdate,
  );

  if (explicitDate) return explicitDate;

  const hireDateVal = firstValue(
    employee?.hireDate,
    employee?.hire_date,
    employee?.dateHired,
    employee?.date_hired,
    employee?.gy_emp_hiredate,
  );

  if (!hireDateVal) return "";

  const hireDateObj = new Date(hireDateVal);
  if (Number.isNaN(hireDateObj.getTime())) return "";

  const regDateObj = new Date(hireDateObj);
  regDateObj.setMonth(regDateObj.getMonth() + 6);
  return regDateObj.toISOString();
}

export function toInputDate(value) {
  if (!value) return "";
  const rawValue = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) return rawValue;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return rawValue.slice(0, 10);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getCurrentDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return !["", "—", "-", "n/a", "null", "undefined"].includes(
    cleanText(value).toLowerCase(),
  );
}

export function getActivePrimaryKey(activeTab) {
  return String(activeTab || "personal.basic").split(".")[0];
}

export function getActiveSecondaryKey(activeTab) {
  const parts = String(activeTab || "personal.basic").split(".");
  return parts.length > 1 ? parts[1] : "";
}

export function getActiveProfileLabel(activeTab) {
  const [primaryKey, childKey] = String(activeTab || "personal.basic").split(".");
  const primary = PROFILE_TABS.find((tab) => tab.key === primaryKey);
  const child = primary?.children?.find(
    (item) => item.key === `${primaryKey}.${childKey}`,
  );

  return {
    primary: primary?.label || "Employee Profile",
    secondary: child?.label || "",
  };
}

