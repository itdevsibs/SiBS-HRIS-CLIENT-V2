import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getEmployeeById } from "../../lib/axios/getEmployee";
import {
  buildEditableEmployee,
} from "../../lib/utils/employees/employeeProfileNormalizer.js";
import { canEditProfileDetails } from "../../lib/utils/employees/employeeProfilePermissions.js";
import {
  getActivePrimaryKey,
  getActiveProfileLabel,
  getActiveSecondaryKey,
} from "../../lib/utils/employees/employeeProfileHelpers.js";

const INITIAL_STATUS_MODAL = {
  open: false,
  type: "success",
  title: "",
  message: "",
};

export default function useEmployeeProfile(currentUser) {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [draftEmployee, setDraftEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("personal.basic");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [openProfilePictureModal, setOpenProfilePictureModal] = useState(false);
  const [openProfileDropdown, setOpenProfileDropdown] = useState(false);
  const [openAddResignation, setOpenAddResignation] = useState(false);
  const [statusModal, setStatusModal] = useState(INITIAL_STATUS_MODAL);

  useEffect(() => {
    let active = true;

    async function fetchEmployee() {
      try {
        const sibsId =
          sessionStorage.getItem("selectedEmployeeId") ||
          sessionStorage.getItem("selectedCandidateId");

        if (!sibsId) {
          navigate("/employee", { replace: true });
          return;
        }

        const result = await getEmployeeById(sibsId);

        if (!active) return;

        if (!result?.success || !result?.data) {
          navigate("/employee", { replace: true });
          return;
        }

        setEmployee(buildEditableEmployee(result.data));
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (active) navigate("/employee", { replace: true });
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchEmployee();

    return () => {
      active = false;
    };
  }, [navigate]);

  const displayEmployee = isEditing ? draftEmployee || employee : employee;
  const canEditDetails = canEditProfileDetails(currentUser);
  const activePrimary = getActivePrimaryKey(activeTab);
  const activeSubTab = getActiveSecondaryKey(activeTab);
  const activeProfileLabel = getActiveProfileLabel(activeTab);

  function showFeedback(message, type = "success", title) {
    setStatusModal({
      open: true,
      type,
      title: title || (type === "error" ? "Action Failed" : "Action Complete"),
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal(INITIAL_STATUS_MODAL);
  }

  function openResignationModal() {
    setOpenProfileDropdown(false);
    setOpenAddResignation(true);
  }

  function startEditing() {
    setOpenProfileDropdown(false);
    setDraftEmployee(buildEditableEmployee(employee));
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftEmployee(null);
    setIsEditing(false);
  }

  function saveLocalChanges() {
    if (!draftEmployee) return;

    setEmployee(buildEditableEmployee(draftEmployee));
    setDraftEmployee(null);
    setIsEditing(false);

    showFeedback(
      "Profile changes were updated locally. Connect the employee update endpoint to persist them to the database.",
      "success",
      "Profile Updated",
    );
  }

  function handleTabChange(nextTab) {
    if (nextTab === activeTab) return;

    if (
      isEditing &&
      !window.confirm(
        "You have unsaved changes. Discard them and open another profile section?",
      )
    ) {
      return;
    }

    if (isEditing) cancelEditing();
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

  function commitNote(notes, notesHistory) {
    setEmployee((previous) => ({
      ...previous,
      notes,
      notesHistory,
    }));
  }

  function handleContextAction(action) {
    if (action === "print") {
      window.print();
      return;
    }

    if (action === "sync") {
      showFeedback(
        "The current employee state is ready for synchronization. Connect this action to your employee refresh endpoint.",
        "success",
        "Sync Ready",
      );
    }
  }

  const sectionProps = {
    employee,
    displayEmployee,
    isEditing,
    canEditDetails,
    onEdit: canEditDetails ? startEditing : undefined,
    onSave: saveLocalChanges,
    onCancel: cancelEditing,
    onChange: updateDraftField,
    onListChange: updateDraftList,
    onDocumentsChange: (nextDocuments) =>
      updateEmployeeListImmediately("documents", nextDocuments),
    onCommitNote: commitNote,
    onFeedback: showFeedback,
  };

  return {
    employee,
    displayEmployee,
    draftEmployee,
    activeTab,
    activePrimary,
    activeSubTab,
    activeProfileLabel,
    loading,
    isEditing,
    canEditDetails,
    openProfilePictureModal,
    openProfileDropdown,
    openAddResignation,
    statusModal,
    sectionProps,
    navigate,
    setOpenProfilePictureModal,
    setOpenProfileDropdown,
    setOpenAddResignation,
    setStatusModal,
    showFeedback,
    closeStatusModal,
    openResignationModal,
    startEditing,
    cancelEditing,
    saveLocalChanges,
    handleTabChange,
    updateDraftField,
    updateDraftList,
    updateEmployeeListImmediately,
    commitNote,
    handleContextAction,
  };
}
