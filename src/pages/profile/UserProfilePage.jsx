import { useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";

import Header from "../../components/layout/Header";
import ProfileDropdown from "../../components/layout/profile/ProfileDropdown";
import StatusModal from "../../components/modals/StatusModal";
import ResignationModal from "../../components/modals/resignation/ResignationModal";
import { ViewResignationModal } from "../../components/modals/resignation-management/ResignationManagementModal";
import EmployeeProfileContent from "../../components/employee/profile/components/EmployeeProfileContent.jsx";
import EmployeeProfileContextPanel from "../../components/employee/profile/components/EmployeeProfileContextPanel.jsx";
import MyEmployeeProfileHeader from "../../components/employee/profile/components/EmployeeProfileHeader.jsx";
import EmployeeProfileNavigation from "../../components/employee/profile/components/EmployeeProfileNavigation.jsx";
import MyEmployeeProfilePictureModal from "../../components/employee/profile/components/EmployeeProfilePictureModal.jsx";

import { useUser } from "../../services/context/UserContext";
import { useResignationList } from "../../services/context/ResignationListContext";
import {
  getEmployeeById,
  getEmployeeProfileSections,
  updateEmployeeProfile,
  updateEmployeeProfileSection,
} from "../../lib/axios/getEmployee";
import {
  getMyEmployeeProfilePicture,
  uploadMyEmployeeProfilePicture,
} from "../../lib/axios/employeeProfile";
import { getMyResignationStatus } from "../../lib/axios/getMyResignationStatus.js";
import { buildChangedProfilePayload } from "../../lib/utils/employees/employeeProfilePayload.js";
import {
  buildEmployeeProfileSectionPayload,
  getStructuredProfileSection,
  mergeEmployeeProfileSections,
} from "../../lib/utils/employees/employeeProfileSectionsPayload.js";
import {
  getActivePrimaryKey,
  getActiveProfileLabel,
  getProfileSibsId,
} from "../../lib/utils/employees/employeeProfileHelpers.js";
import { buildEditableEmployee as buildRawEditableEmployee } from "../../lib/utils/employees/employeeProfileNormalizer.js";
import { sanitizeEmployeeNameFields } from "../../lib/utils/employees/employeeNameDisplay.js";
import { PROFILE_TABS } from "../../lib/utils/employees/employeeProfileSchemas.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

function buildEditableEmployee(employee) {
  return sanitizeEmployeeNameFields(buildRawEditableEmployee(employee));
}

const HEADER_PROFILE_PICTURE_UPDATED_EVENT = "sibs:profile-picture-updated";

const EMPLOYEE_PROFILE_TABS = PROFILE_TABS.filter((tab) => tab.key !== "notes");

const RESIGNATION_HISTORY_TAB = {
  key: "resignation-history",
  label: "Resignation History",
  icon: History,
};

const MY_PROFILE_QUICK_ACTIONS = [
  { label: "Request Profile Change", action: "request-change" },
  { label: "Export My Profile", action: "print" },
  { label: "Review My Documents", target: "documents" },
  { label: "Submit Resignation", action: "resignation" },
];

function cleanResignationText(value) {
  return String(value ?? "").trim();
}

function getResignationCaseId(item = {}) {
  return cleanResignationText(
    item.resignationId || item.resignation_id || item.rawId || item.id,
  ).replace(/^RES[-_:]/i, "") || "—";
}

function getResignationStatus(item = {}) {
  return (
    cleanResignationText(
      item.status || item.resignationStatus || item.resignation_status,
    ) || "Pending"
  );
}

function getResignationReason(item = {}) {
  const reason = cleanResignationText(
    item.reason || item.resignationReason || item.resignation_reason,
  );
  const specifyOthers = cleanResignationText(
    item.specifyOthers || item.specify_others || item.resignationSpecifyOthers,
  );

  if (/^other$/i.test(reason) && specifyOthers) return specifyOthers;
  return reason || specifyOthers || "—";
}

function getResignationDateValue(item = {}) {
  return (
    item.resignationDate ||
    item.resignation_date ||
    item.dateRequested ||
    item.requestDate ||
    item.createdAt ||
    item.created_at ||
    ""
  );
}

function getResignationLastWorkingDate(item = {}) {
  return (
    item.lastWorkingDate ||
    item.last_working_date ||
    item.resignationLastWorkingDate ||
    ""
  );
}

function formatResignationDate(value) {
  if (!value) return "—";

  const raw = String(value).trim();
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly
    ? new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 12))
    : new Date(raw);

  if (Number.isNaN(date.getTime())) return raw;

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getResignationStage(item = {}) {
  const explicit = cleanResignationText(
    item.currentApprover ||
      item.current_approver ||
      item.approver ||
      item.currentStage ||
      item.current_stage,
  );

  if (explicit && !/^assigned approver$/i.test(explicit)) return explicit;

  const meta = item.meta || item.raw?.meta || item.raw || {};
  const status = getResignationStatus(item).toLowerCase();

  if (["completed", "approved"].includes(status)) return "Completed";
  if (["declined", "rejected", "cancelled", "retained"].includes(status)) {
    return "Closed";
  }

  if (Number(meta.somIsApproved || meta.som_is_approved || 0) === 1) {
    return "Completed";
  }

  if (Number(meta.omIsApproved || meta.om_is_approved || 0) === 1) {
    return "Senior Operations Manager";
  }

  const hasTeamLeader = Boolean(
    cleanResignationText(meta.tlSibsId || meta.tl_sibs_id),
  );
  const teamLeaderApproved =
    Number(meta.tlIsApproved || meta.tl_is_approved || 0) === 1;
  const hideTeamLeader = Boolean(meta.hideTl || meta.hide_tl);

  if (hasTeamLeader && !hideTeamLeader && !teamLeaderApproved) {
    return "Team Leader";
  }

  return "Operations Manager";
}

function getResignationStatusClass(status = "") {
  const normalized = String(status).trim().toLowerCase();

  if (["completed", "approved"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (["declined", "rejected", "cancelled", "retained"].includes(normalized)) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (normalized.includes("notice")) {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function normalizeResignationHistory(result = {}) {
  const records = Array.isArray(result?.data) ? result.data.filter(Boolean) : [];
  const latest = result?.latest || null;
  const source = records.length ? records : latest ? [latest] : [];

  return [...source].sort((left, right) => {
    const leftTime = new Date(
      left?.createdAt || left?.created_at || getResignationDateValue(left) || 0,
    ).getTime();
    const rightTime = new Date(
      right?.createdAt || right?.created_at || getResignationDateValue(right) || 0,
    ).getTime();

    if (Number.isFinite(rightTime) && Number.isFinite(leftTime) && rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return Number(getResignationCaseId(right) || 0) - Number(getResignationCaseId(left) || 0);
  });
}

function ResignationHistorySection({ items = [], onView }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-xs font-bold text-[#042C51]">
          Resignation Application History
        </p>
        <p className="mt-1 text-[10px] font-semibold leading-4 text-[#667085]">
          Review your previous and current resignation applications. Select a record to open the complete case details.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E6ECF2]">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-[#F8FAFC]">
              <tr className="border-b border-[#E6ECF2]">
                {[
                  "Case ID",
                  "Filed Date",
                  "Last Working Day",
                  "Status",
                  "Reason",
                  "Approval Stage",
                ].map((label) => (
                  <th
                    key={label}
                    className="px-3 py-3 text-[10px] font-extrabold uppercase tracking-wide text-[#7B8DB3]"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F6] bg-white">
              {items.map((item, index) => {
                const status = getResignationStatus(item);
                return (
                  <tr
                    key={item?.id || item?.resignationId || `resignation-history-${index}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onView?.(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onView?.(item);
                      }
                    }}
                    className="cursor-pointer transition hover:bg-[#FFF9F6] focus-visible:bg-[#FFF9F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5C28]/30"
                  >
                    <td className="px-3 py-3 text-xs font-extrabold text-[#FF5C28]">
                      {getResignationCaseId(item)}
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-[#344054]">
                      {formatResignationDate(getResignationDateValue(item))}
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-[#344054]">
                      {formatResignationDate(getResignationLastWorkingDate(item))}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-extrabold uppercase ${getResignationStatusClass(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="max-w-[280px] px-3 py-3 text-xs font-semibold text-[#344054]">
                      <span className="line-clamp-2">{getResignationReason(item)}</span>
                    </td>
                    <td className="px-3 py-3 text-xs font-bold text-[#042C51]">
                      {getResignationStage(item)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 bg-[#F8FAFC] p-3 lg:hidden">
          {items.map((item, index) => {
            const status = getResignationStatus(item);
            return (
              <button
                key={item?.id || item?.resignationId || `resignation-history-mobile-${index}`}
                type="button"
                onClick={() => onView?.(item)}
                className="w-full rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition hover:border-[#FF5C28]/30 hover:bg-[#FFF9F6]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#8A98B8]">
                      Case ID
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-[#FF5C28]">
                      {getResignationCaseId(item)}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-extrabold uppercase ${getResignationStatusClass(status)}`}>
                    {status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#8A98B8]">Filed</p>
                    <p className="mt-1 font-semibold text-[#344054]">
                      {formatResignationDate(getResignationDateValue(item))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-[#8A98B8]">Last Working Day</p>
                    <p className="mt-1 font-semibold text-[#344054]">
                      {formatResignationDate(getResignationLastWorkingDate(item))}
                    </p>
                  </div>
                </div>

                <div className="mt-3 border-t border-[#EEF2F6] pt-3">
                  <p className="text-[10px] font-bold uppercase text-[#8A98B8]">Reason</p>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold text-[#344054]">
                    {getResignationReason(item)}
                  </p>
                  <p className="mt-2 text-[10px] font-bold text-[#042C51]">
                    Approval Stage: {getResignationStage(item)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function mergeProfilePicture(employee, profilePictureUrl) {
  if (!employee || !profilePictureUrl) return employee;

  return {
    ...employee,
    profilePictureUrl,
    profile_picture_url: profilePictureUrl,
  };
}

export default function UserProfilePage() {
  const {
    user: currentUser,
    loading: userLoading,
    refetchUser,
  } = useUser();
  const { openEditResignationModal } = useResignationList();

  const [employee, setEmployee] = useState(null);
  const [draftEmployee, setDraftEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("personal.basic");
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");
  const [profilePictureLoading, setProfilePictureLoading] = useState(false);
  const [openProfilePictureModal, setOpenProfilePictureModal] = useState(false);
  const [openProfileDropdown, setOpenProfileDropdown] = useState(false);
  const [openAddResignation, setOpenAddResignation] = useState(false);
  const [selectedResignation, setSelectedResignation] = useState(null);
  const [resignationHistory, setResignationHistory] = useState([]);
  const [resignationHistoryLoading, setResignationHistoryLoading] = useState(true);
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const currentSibsId = getProfileSibsId(currentUser);
  const displayEmployee = isEditing ? draftEmployee || employee : employee;
  const canEditDetails = false;
  const activePrimary = getActivePrimaryKey(activeTab);
  const activeSubTab = String(activeTab).includes(".")
    ? String(activeTab).split(".")[1]
    : "";
  const activeProfileLabel =
    activePrimary === "resignation-history"
      ? { primary: "Resignation History", secondary: "Application Records" }
      : getActiveProfileLabel(activeTab);
  const activeSectionSupportsSave =
    activePrimary === "personal" ||
    Boolean(getStructuredProfileSection(activePrimary));

  const visibleTabs = useMemo(() => {
    if (resignationHistory.length === 0) return EMPLOYEE_PROFILE_TABS;

    return EMPLOYEE_PROFILE_TABS.flatMap((tab) =>
      tab.key === "documents" ? [tab, RESIGNATION_HISTORY_TAB] : [tab],
    );
  }, [resignationHistory.length]);

  useEffect(() => {
    if (!openEditResignationModal) return;
    setOpenAddResignation(true);
  }, [openEditResignationModal]);

  async function refreshResignationHistory() {
    if (!currentUser || !currentSibsId) {
      setResignationHistory([]);
      setResignationHistoryLoading(false);
      return [];
    }

    setResignationHistoryLoading(true);

    try {
      const result = await getMyResignationStatus();
      const history = result?.success ? normalizeResignationHistory(result) : [];
      setResignationHistory(history);
      return history;
    } catch (error) {
      console.error("Failed to load resignation history:", error);
      setResignationHistory([]);
      return [];
    } finally {
      setResignationHistoryLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      if (!currentUser || !currentSibsId) {
        if (!cancelled) {
          setResignationHistory([]);
          setResignationHistoryLoading(false);
        }
        return;
      }

      setResignationHistoryLoading(true);

      try {
        const result = await getMyResignationStatus();
        if (cancelled) return;

        setResignationHistory(
          result?.success ? normalizeResignationHistory(result) : [],
        );
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load resignation history:", error);
        setResignationHistory([]);
      } finally {
        if (!cancelled) setResignationHistoryLoading(false);
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [currentSibsId, currentUser]);

  useEffect(() => {
    if (activeTab === RESIGNATION_HISTORY_TAB.key && resignationHistory.length === 0 && !resignationHistoryLoading) {
      setActiveTab("personal.basic");
    }
  }, [activeTab, resignationHistory.length, resignationHistoryLoading]);

  useEffect(() => {
    if (userLoading) return undefined;

    let cancelled = false;

    async function loadMyProfile() {
      if (!currentUser) {
        setEmployee(null);
        setProfileLoading(false);
        return;
      }

      const fallbackEmployee = buildEditableEmployee(currentUser);
      setEmployee(fallbackEmployee);

      if (!currentSibsId) {
        setProfileLoading(false);
        setStatusModal({
          open: true,
          type: "error",
          title: "Employee Profile Not Linked",
          message:
            "Your authenticated account does not contain an employee SIBS ID.",
        });
        return;
      }

      setProfileLoading(true);

      const [employeeResult, sectionsResult, pictureResult] =
        await Promise.allSettled([
          getEmployeeById(currentSibsId),
          getEmployeeProfileSections(currentSibsId),
          getMyEmployeeProfilePicture(),
        ]);

      if (cancelled) return;

      const employeeResponse =
        employeeResult.status === "fulfilled" ? employeeResult.value : null;
      const sectionsResponse =
        sectionsResult.status === "fulfilled" ? sectionsResult.value : null;
      const pictureResponse =
        pictureResult.status === "fulfilled" ? pictureResult.value : null;

      const baseEmployee =
        employeeResponse?.success && employeeResponse?.data
          ? buildEditableEmployee({
              ...currentUser,
              ...employeeResponse.data,
            })
          : fallbackEmployee;

      const mergedEmployee =
        sectionsResponse?.success && sectionsResponse?.data
          ? mergeEmployeeProfileSections(baseEmployee, sectionsResponse.data)
          : baseEmployee;

      const pictureUrl = pictureResponse?.success
        ? pictureResponse?.data?.profilePictureUrl || ""
        : "";

      setProfilePicture(pictureUrl ? `${pictureUrl}?v=${Date.now()}` : "");
      setEmployee(
        buildEditableEmployee(
          mergeProfilePicture(
            mergedEmployee,
            pictureUrl ? `${pictureUrl}?v=${Date.now()}` : "",
          ),
        ),
      );

      if (!employeeResponse?.success) {
        setStatusModal({
          open: true,
          type: "error",
          title: "Profile Record Not Fully Loaded",
          message:
            employeeResponse?.message ||
            "The page is showing the authenticated user data because the complete employee record could not be loaded.",
        });
      } else if (!sectionsResponse?.success) {
        setStatusModal({
          open: true,
          type: "error",
          title: "Structured Profile Not Loaded",
          message:
            sectionsResponse?.message ||
            "The employee record loaded, but some structured profile sections could not be loaded.",
        });
      }

      setProfileLoading(false);
    }

    void loadMyProfile();

    return () => {
      cancelled = true;
    };
  }, [currentSibsId, currentUser, userLoading]);

  function showFeedback(message, type = "success", title) {
    setStatusModal({
      open: true,
      type,
      title: title || (type === "error" ? "Action Failed" : "Action Complete"),
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal({
      open: false,
      type: "success",
      title: "",
      message: "",
    });
  }

  function openResignationModal() {
    setOpenProfileDropdown(false);
    setOpenAddResignation(true);
  }

  function openResignationDetails(item) {
    if (!item) return;

    setOpenProfileDropdown(false);
    setSelectedResignation(item);
  }

  function requestProfileChange() {
    setOpenProfileDropdown(false);
    showFeedback(
      "Please coordinate profile corrections with HR. Your current official values remain read-only until an authorized update is completed.",
      "success",
      "Request Profile Change",
    );
  }

  function startEditing() {
    if (!employee || isSaving || !canEditDetails) return;

    setOpenProfileDropdown(false);
    setDraftEmployee(buildEditableEmployee(employee));
    setIsEditing(true);
  }

  function cancelEditing() {
    if (isSaving) return;

    setDraftEmployee(null);
    setIsEditing(false);
  }

  async function saveProfileChanges() {
    if (!draftEmployee || !employee || isSaving) return;

    const sibsId = getProfileSibsId(employee);

    if (!sibsId) {
      showFeedback(
        "The employee SIBS ID is missing. The profile could not be saved.",
        "error",
        "Profile Update Failed",
      );
      return;
    }

    const payload = buildChangedProfilePayload(draftEmployee, employee);

    if (Object.keys(payload).length === 0) {
      setDraftEmployee(null);
      setIsEditing(false);
      showFeedback(
        "No changes were detected in the employee profile.",
        "success",
        "No Changes",
      );
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateEmployeeProfile(sibsId, payload);

      if (!result?.success || !result?.data) {
        showFeedback(
          result?.message || "Failed to update the employee profile.",
          "error",
          "Profile Update Failed",
        );
        return;
      }

      const updatedEmployee = buildEditableEmployee(
        mergeProfilePicture(
          mergeEmployeeProfileSections(result.data, employee),
          profilePicture,
        ),
      );

      setEmployee(updatedEmployee);
      setDraftEmployee(null);
      setIsEditing(false);

      const identityFields = ["firstName", "middleName", "lastName", "email"];
      const identityChanged = identityFields.some((field) => field in payload);

      if (identityChanged && typeof refetchUser === "function") {
        await refetchUser({ background: true });
      }

      showFeedback(
        result.message || "Employee profile updated successfully.",
        "success",
        "Profile Updated",
      );
    } catch (error) {
      console.error("Failed to update employee profile:", error);
      showFeedback(
        error?.message || "Failed to update the employee profile.",
        "error",
        "Profile Update Failed",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function saveStructuredProfileChanges(section) {
    if (!draftEmployee || !employee || isSaving) return;

    const sibsId = getProfileSibsId(employee);

    if (!sibsId) {
      showFeedback(
        "The employee SIBS ID is missing. The section could not be saved.",
        "error",
        "Section Update Failed",
      );
      return;
    }

    const payload = buildEmployeeProfileSectionPayload(section, draftEmployee);

    if (!payload) {
      showFeedback(
        "The selected profile section is not supported by this endpoint.",
        "error",
        "Section Update Failed",
      );
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateEmployeeProfileSection(sibsId, section, payload);

      if (!result?.success || !result?.data) {
        showFeedback(
          result?.message || "Failed to update the employee section.",
          "error",
          "Section Update Failed",
        );
        return;
      }

      const updatedEmployee = buildEditableEmployee(
        mergeProfilePicture(
          mergeEmployeeProfileSections(employee, result.data),
          profilePicture,
        ),
      );

      setEmployee(updatedEmployee);
      setDraftEmployee(null);
      setIsEditing(false);

      showFeedback(
        result.message || "Employee section saved successfully.",
        "success",
        "Section Updated",
      );
    } catch (error) {
      console.error("Failed to update employee profile section:", error);
      showFeedback(
        error?.message || "Failed to update the employee section.",
        "error",
        "Section Update Failed",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function saveChanges() {
    if (activePrimary === "personal") {
      return saveProfileChanges();
    }

    const structuredSection = getStructuredProfileSection(activePrimary);

    if (structuredSection) {
      return saveStructuredProfileChanges(structuredSection);
    }

    showFeedback(
      "This profile section is read-only because no persistent save endpoint is configured.",
      "error",
      "Section Is Read-Only",
    );

    setDraftEmployee(null);
    setIsEditing(false);
    return undefined;
  }

  function handleTabChange(nextTab) {
    if (isSaving || nextTab === activeTab) return;

    if (!visibleTabs.some((tab) => {
      if (tab.key === nextTab) return true;
      return tab.children?.some((child) => child.key === nextTab);
    })) {
      return;
    }

    if (isEditing) {
      showFeedback(
        "Save or cancel your changes before opening another profile section.",
        "error",
        "Unsaved Changes",
      );
      return;
    }

    setActiveTab(nextTab);
  }

  function updateDraftField(field, value) {
    setDraftEmployee((previous) => ({
      ...(previous || buildEditableEmployee(employee)),
      [field]: value,
    }));
  }

  function updateDraftList(listKey, nextList) {
    setDraftEmployee((previous) => ({
      ...(previous || buildEditableEmployee(employee)),
      [listKey]: nextList,
    }));
  }

  function updateEmployeeListImmediately(listKey, nextList) {
    setEmployee((previous) => ({ ...previous, [listKey]: nextList }));
  }

  function handleContextAction(action) {
    if (action === "print") {
      window.print();
      return;
    }

    if (action === "request-change") {
      requestProfileChange();
      return;
    }

    if (action === "resignation") {
      openResignationModal();
    }
  }

  async function handleUploadProfilePicture(file, modalStatus) {
    if (modalStatus?.type === "error") {
      showFeedback(
        modalStatus.message || "Unable to upload the profile picture.",
        "error",
        modalStatus.title || "Upload Failed",
      );
      return;
    }

    if (!file || profilePictureLoading) return;

    setProfilePictureLoading(true);

    try {
      const result = await uploadMyEmployeeProfilePicture(file);

      if (!result?.success) {
        showFeedback(
          result?.message || "Failed to upload the profile picture.",
          "error",
          "Upload Failed",
        );
        return;
      }

      const nextUrl = result?.data?.profilePictureUrl
        ? `${result.data.profilePictureUrl}?v=${Date.now()}`
        : "";

      setProfilePicture(nextUrl);
      setEmployee((previous) =>
        buildEditableEmployee(mergeProfilePicture(previous, nextUrl)),
      );
      setDraftEmployee((previous) =>
        previous
          ? buildEditableEmployee(mergeProfilePicture(previous, nextUrl))
          : previous,
      );

      window.dispatchEvent(
        new CustomEvent(HEADER_PROFILE_PICTURE_UPDATED_EVENT, {
          detail: { profilePictureUrl: nextUrl },
        }),
      );

      setOpenProfilePictureModal(false);

      showFeedback(
        result?.message || "Your profile picture has been updated.",
        "success",
        "Profile Picture Updated",
      );
    } catch (error) {
      console.error("UPLOAD PROFILE PICTURE ERROR:", error);
      showFeedback(
        error?.message || "Failed to upload the profile picture.",
        "error",
        "Upload Failed",
      );
    } finally {
      setProfilePictureLoading(false);
    }
  }

  const sectionProps = {
    employee,
    displayEmployee,
    isEditing,
    isSaving,
    onEdit:
      canEditDetails && activeSectionSupportsSave ? startEditing : undefined,
    onSave: saveChanges,
    onCancel: cancelEditing,
    onChange: updateDraftField,
    onListChange: updateDraftList,
    onDocumentsChange: (nextDocuments) =>
      updateEmployeeListImmediately("documents", nextDocuments),
    onCommitNote: (notes, notesHistory) =>
      setEmployee((previous) => ({
        ...previous,
        notes,
        notesHistory,
      })),
    onFeedback: showFeedback,
  };

  return (
    <div
      onClick={() => setOpenProfileDropdown(false)}
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#EEF2F6] font-jakarta"
    >
      <div className="shrink-0">
        <Header />
      </div>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden sibs-scrollbar bg-[#EEF2F6] px-3 py-4 sm:p-6">
        <div className="mx-auto w-full max-w-[1600px] space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-sm font-black text-[#042C51]">My Profile</h1>
              <p className="mt-0.5 text-[10px] font-semibold text-[#667085]">
                Employee self-service profile and official HRIS records
              </p>
            </div>

            <div className="hidden min-w-0 items-center gap-1.5 text-[10px] font-semibold text-[#667085] sm:flex">
              <span>SiBS HRIS Portal</span>
              <span>/</span>
              <span>Employee Self-Service</span>
              <span>/</span>
              <span className="font-black text-[#042C51]">My Profile</span>
            </div>
          </div>

          {userLoading || profileLoading ? (
            <div className="sibs-card p-6 text-sm font-semibold text-[#667085]">
              Loading your employee profile...
            </div>
          ) : !displayEmployee ? (
            <div className="sibs-card p-6 text-sm font-semibold text-[#667085]">
              Your employee profile could not be found.
            </div>
          ) : (
            <div className="sibs-page-header-in space-y-4 sm:space-y-5">
              <MyEmployeeProfileHeader
                employee={displayEmployee}
                apiUrl={API_URL}
                canEdit={canEditDetails && activeSectionSupportsSave}
                isEditing={isEditing}
                isSaving={isSaving}
                onEdit={startEditing}
                onCancel={cancelEditing}
                onSave={saveChanges}
                onRequestChange={requestProfileChange}
                onToggleMore={(event) => {
                  event?.stopPropagation?.();
                  setOpenProfileDropdown((previous) => !previous);
                }}
                moreOpen={openProfileDropdown}
                onAvatarClick={(event) => {
                  event?.stopPropagation?.();
                  setOpenProfilePictureModal(true);
                }}
                morePanel={
                  <div
                    className="sibs-profile-dropdown-panel absolute right-0 top-full z-[70] mt-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <ProfileDropdown
                      openModal={openResignationModal}
                      openDropdown={setOpenProfileDropdown}
                      onViewResignation={openResignationDetails}
                    />
                  </div>
                }
              />

              <EmployeeProfileNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
                tabs={visibleTabs}
              />

              <div className="sibs-page-card-in grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
                <section
                  key={activeTab}
                  className="sibs-profile-tab-panel min-w-0 rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
                >
                  <div className="mb-5 flex min-w-0 flex-col gap-3 border-b border-[#F1F5F9] pb-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="break-words text-sm font-black uppercase tracking-wider text-[#042C51]">
                        {activeProfileLabel.primary}
                        {activeProfileLabel.secondary
                          ? ` - ${activeProfileLabel.secondary}`
                          : ""}
                      </h2>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        {activePrimary === "resignation-history"
                          ? "Read-only resignation application history from the existing resignation workflow."
                          : isEditing
                            ? "Editable input mode. Save the profile to lock the current updates."
                            : "Official record values are shown from the existing employee data source."}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap sm:self-start">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isEditing
                            ? "animate-pulse bg-amber-400"
                            : "bg-[#042C51]"
                        }`}
                      />
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        {activePrimary === "resignation-history"
                          ? "View Only"
                          : isEditing
                            ? "Modified Draft"
                            : "Official Profile Record"}
                      </span>
                    </div>
                  </div>

                  {activePrimary === "resignation-history" ? (
                    <ResignationHistorySection
                      items={resignationHistory}
                      onView={openResignationDetails}
                    />
                  ) : (
                    <EmployeeProfileContent
                      activePrimary={activePrimary}
                      activeSubTab={activeSubTab}
                      sectionProps={sectionProps}
                    />
                  )}
                </section>

                <EmployeeProfileContextPanel
                  employee={employee}
                  onNavigate={handleTabChange}
                  onAction={handleContextAction}
                  showAuditTrail={false}
                  quickActions={MY_PROFILE_QUICK_ACTIONS}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <MyEmployeeProfilePictureModal
        open={openProfilePictureModal}
        employee={displayEmployee}
        apiUrl={API_URL}
        currentImage={profilePicture}
        onUploadImage={handleUploadProfilePicture}
        uploading={profilePictureLoading}
        onClose={() => setOpenProfilePictureModal(false)}
      />

      <ResignationModal
        open={Boolean(openAddResignation)}
        onClose={() => setOpenAddResignation(false)}
        onSuccess={async () => {
          await refreshResignationHistory();
          setOpenAddResignation(false);
        }}
        setStatusModal={setStatusModal}
      />

      <ViewResignationModal
        open={Boolean(selectedResignation)}
        item={selectedResignation}
        currentUser={currentUser}
        onClose={() => setSelectedResignation(null)}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
      />
    </div>
  );
}
