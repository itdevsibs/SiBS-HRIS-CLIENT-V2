import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Search,
  UserPlus,
  RefreshCw,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
} from "lucide-react";

import Header from "../../components/layout/Header";
import AdminLoginModal from "../../components/modals/AdminLoginModal";
import UserModal from "../../components/modals/users/UserModal";
import StatusModal from "../../components/modals/StatusModal";
import { useUser } from "../../services/context/UserContext";
import {
  PageHeaderHero,
  StatusBadge,
  TablePagination,
  TableEmptyRow,
  DataCard,
  ResponsiveTableShell,
} from "@/components/ui";

import {
  getUserAccess,
  searchUserAccessEmployees,
  addUserAccess,
  updateUserAccess,
  deleteUserAccess,
} from "../../lib/utils/getUserAccess";

const SUPER_ADMIN_ROLE = "super_admin";

function formatRole(role) {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "hr_admin":
      return "HR Admin";
    case "hr":
      return "Human Resource";
    case "ta":
      return "Talent Acquisition";
    case "employee":
      return "Employee";
    case "finance":
      return "Finance";
    case "manager":
      return "Manager";
    case "executive":
      return "Executive";
    default:
      return role || "-";
  }
}

function formatAdminAccess(adminAccess) {
  const accessValue = Array.isArray(adminAccess)
    ? Number(adminAccess[0])
    : Number(adminAccess);

  switch (accessValue) {
    case 1:
      return "Talent Acquisition";
    case 2:
      return "Human Resource";
    case 3:
      return "HR Admin";
    case 4:
      return "Finance";
    case 5:
      return "Manager";
    case 6:
      return "Executive";
    case 7:
      return "Super Admin";
    default:
      return "-";
  }
}

function getSingleAdminAccess(adminAccess) {
  if (Array.isArray(adminAccess)) {
    return String(adminAccess[0] || "");
  }

  if (typeof adminAccess === "string" && adminAccess.includes(",")) {
    return String(adminAccess.split(",")[0] || "").trim();
  }

  return String(adminAccess || "");
}

function getFullName(item) {
  return (
    `${item?.lastName || ""}${item?.lastName ? ", " : ""}${
      item?.firstName || ""
    }${item?.middleName ? " " + item.middleName : ""}`.trim() || "-"
  );
}

function getAccountId(account) {
  return String(
    account?.gy_acc_id ||
      account?.accountId ||
      account?.account_id ||
      account?.id ||
      ""
  ).trim();
}

function getAccountName(account) {
  return String(
    account?.gy_acc_name ||
      account?.accountName ||
      account?.account ||
      account?.account_name ||
      account?.name ||
      ""
  ).trim();
}

function getGhlName(account) {
  return String(
    account?.gy_acc_ghl_name ||
      account?.ghlName ||
      account?.ghl_name ||
      ""
  ).trim();
}

function normalizeAccountOption(account) {
  const accountId = getAccountId(account);
  const accountName = getAccountName(account);
  const ghlName = getGhlName(account);

  if (!accountId || !accountName) return null;

  return {
    accountId,
    account_id: accountId,
    gy_acc_id: accountId,

    accountName,
    account: accountName,
    gy_acc_name: accountName,

    ghlName,
    gy_acc_ghl_name: ghlName,

    departmentId:
      account?.departmentId ||
      account?.department_id ||
      account?.gy_dept_id ||
      "",
    departmentName:
      account?.departmentName ||
      account?.department ||
      account?.name_department ||
      "",
    clusterName: account?.clusterName || "",
  };
}

function normalizeAccountOptions(accounts = []) {
  const map = new Map();

  accounts.forEach((account) => {
    const normalized = normalizeAccountOption(account);

    if (!normalized) return;

    if (!map.has(normalized.accountId)) {
      map.set(normalized.accountId, normalized);
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.gy_acc_name.localeCompare(b.gy_acc_name)
  );
}

function getAssignedAccountIds(item) {
  if (Array.isArray(item?.assignedAccounts) && item.assignedAccounts.length) {
    return item.assignedAccounts
      .map((account) => getAccountId(account))
      .filter(Boolean);
  }

  if (item?.accountId) {
    return [String(item.accountId)];
  }

  if (item?.gy_acc_id) {
    return [String(item.gy_acc_id)];
  }

  return [];
}

function formatAssignedAccounts(item) {
  if (Array.isArray(item?.assignedAccounts) && item.assignedAccounts.length) {
    const names = item.assignedAccounts
      .map((account) => getAccountName(account))
      .filter(Boolean);

    return names.length ? names.join(", ") : getAccountName(item) || "-";
  }

  return getAccountName(item) || "-";
}

function buildFallbackAccountOptions(users = [], selectedUser = null) {
  const allAccounts = [];

  users.forEach((userItem) => {
    allAccounts.push(userItem);

    if (Array.isArray(userItem.assignedAccounts)) {
      allAccounts.push(...userItem.assignedAccounts);
    }

    if (Array.isArray(userItem.availableAccounts)) {
      allAccounts.push(...userItem.availableAccounts);
    }
  });

  if (selectedUser) {
    allAccounts.push(selectedUser);

    if (Array.isArray(selectedUser.assignedAccounts)) {
      allAccounts.push(...selectedUser.assignedAccounts);
    }

    if (Array.isArray(selectedUser.availableAccounts)) {
      allAccounts.push(...selectedUser.availableAccounts);
    }
  }

  return normalizeAccountOptions(allAccounts);
}

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { user, loading } = useUser();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [editForm, setEditForm] = useState({
    adminAccess: "",
    status: "active",
    accountIds: [],
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeResults, setEmployeeResults] = useState([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  const [addSaving, setAddSaving] = useState(false);

  const [addForm, setAddForm] = useState({
    gyEmpId: "",
    sibsId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    accountId: "",
    account: "",
    departmentId: "",
    department: "",
    adminAccess: "",
  });

  const [openActionId, setOpenActionId] = useState(null);
  const actionRef = useRef(null);
  const tableScrollRef = useRef(null);

  const [actionDropdown, setActionDropdown] = useState({
    open: false,
    userId: null,
    top: 0,
    left: 0,
  });

  const isSuperAdmin = user?.role === SUPER_ADMIN_ROLE;

  const editAccountOptions = useMemo(() => {
    if (accountOptions.length > 0) {
      return accountOptions;
    }

    return buildFallbackAccountOptions(users, selectedUser);
  }, [accountOptions, users, selectedUser]);

  const showStatusModal = (type, title, message) => {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  };

  const closeStatusModal = () => {
    setStatusModal((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const closeActionDropdown = () => {
    setOpenActionId(null);
    setActionDropdown({
      open: false,
      userId: null,
      top: 0,
      left: 0,
    });
  };

  const openDeleteModal = (item) => {
    setSelectedUser(item);
    setShowEditModal(false);
    setShowDeleteModal(true);
    closeActionDropdown();
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.role !== SUPER_ADMIN_ROLE) {
      navigate("/dashboard/admin", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionRef.current && !actionRef.current.contains(e.target)) {
        closeActionDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [page]);

  const fetchManagementUsers = async (
    currentPage = page,
    currentSearch = search
  ) => {
    if (!user || user.role !== SUPER_ADMIN_ROLE) {
      setPageLoading(false);
      return;
    }

    try {
      setPageLoading(true);

      const result = await getUserAccess(currentPage, currentSearch);

      if (!result?.success) {
        setUsers([]);
        setAccountOptions([]);
        setPagination({
          page: 1,
          limit: 15,
          total: 0,
          totalPages: 1,
        });
        return;
      }

      setUsers(result.data || []);

      const accountsFromApi =
        result.accountOptions ||
        result.accounts ||
        result.availableAccounts ||
        result.data?.[0]?.availableAccounts ||
        [];

      setAccountOptions(normalizeAccountOptions(accountsFromApi));

      setPagination(
        result.pagination || {
          page: currentPage,
          limit: 15,
          total: (result.data || []).length,
          totalPages: 1,
        }
      );
    } catch (error) {
      console.error("Fetch management users error:", error);
      setUsers([]);
      setAccountOptions([]);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === SUPER_ADMIN_ROLE) {
      fetchManagementUsers(page, search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, page, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const createPage = (p) => (
    <button
      key={p}
      type="button"
      onClick={() => setPage(p)}
      className={`rounded-md px-3 py-1 text-sm ${
        page === p
          ? "bg-[var(--sibs-primary-1)] text-white"
          : "border border-sibs-tertiary-8 text-sibs-tertiary-5 hover:bg-sibs-tertiary-9"
      }`}
    >
      {p}
    </button>
  );

  const renderPagination = () => {
    const totalPages = pagination.totalPages || 1;
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(createPage(i));
      }
    } else {
      pages.push(createPage(1));

      if (page > 3) {
        pages.push(
          <span key="start-ellipsis" className="px-2 text-sibs-tertiary-5">
            ...
          </span>
        );
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i += 1) {
        pages.push(createPage(i));
      }

      if (page < totalPages - 2) {
        pages.push(
          <span key="end-ellipsis" className="px-2 text-sibs-tertiary-5">
            ...
          </span>
        );
      }

      pages.push(createPage(totalPages));
    }

    return pages;
  };

  const handleToggleActionDropdown = (e, item) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownWidth = 176;
    const dropdownHeight = 96;

    const showAbove = window.innerHeight - rect.bottom < dropdownHeight + 16;
    const top = showAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8;
    const left = Math.max(12, rect.right - dropdownWidth);

    const isSameOpen = openActionId === item.id && actionDropdown.open;

    if (isSameOpen) {
      closeActionDropdown();
      return;
    }

    setOpenActionId(item.id);
    setActionDropdown({
      open: true,
      userId: item.id,
      top,
      left,
    });
  };

  const openEditModal = (item) => {
    setSelectedUser(item);

    setEditForm({
      adminAccess: getSingleAdminAccess(item.adminAccess),
      status: item.status || "active",
      accountIds: getAssignedAccountIds(item),
    });

    setShowDeleteModal(false);
    setShowEditModal(true);
    closeActionDropdown();
  };

  const closeEditModal = () => {
    if (saving) return;

    setShowEditModal(false);
    setSelectedUser(null);
    setEditForm({
      adminAccess: "",
      status: "active",
      accountIds: [],
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleEditAccount = (accountId) => {
    const stringAccountId = String(accountId || "");

    if (!stringAccountId) return;

    setEditForm((prev) => {
      const currentAccountIds = Array.isArray(prev.accountIds)
        ? prev.accountIds.map(String)
        : [];

      const alreadySelected = currentAccountIds.includes(stringAccountId);

      return {
        ...prev,
        accountIds: alreadySelected
          ? currentAccountIds.filter((id) => id !== stringAccountId)
          : [...currentAccountIds, stringAccountId],
      };
    });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    if (!selectedUser) return;

    if (!editForm.adminAccess) {
      showStatusModal("error", "Missing Fields", "Please select admin access.");
      return;
    }

    if (!editForm.accountIds || editForm.accountIds.length === 0) {
      showStatusModal(
        "error",
        "Missing Account",
        "Please assign at least one account."
      );
      return;
    }

    try {
      setSaving(true);

      const result = await updateUserAccess(selectedUser.id, {
        adminAccess: Number(editForm.adminAccess),
        status: editForm.status,
        accountIds: editForm.accountIds,
        departmentId: selectedUser.departmentId,
      });

      if (!result?.success) {
        showStatusModal(
          "error",
          "Update Failed",
          result?.message || "Failed to update user."
        );
        return;
      }

      await fetchManagementUsers(page, search);
      closeEditModal();

      showStatusModal(
        "success",
        "User Updated",
        result?.message || "User updated successfully."
      );
    } catch (error) {
      console.error("Save user error:", error);

      showStatusModal(
        "error",
        "Update Failed",
        error.response?.data?.message || "Failed to update user."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setDeleting(true);

      const result = await deleteUserAccess(selectedUser.id);

      if (!result?.success) {
        showStatusModal(
          "error",
          "Delete Failed",
          result?.message || "Failed to delete user."
        );
        return;
      }

      await fetchManagementUsers(page, search);
      closeDeleteModal();

      showStatusModal(
        "success",
        "User Deleted",
        result?.message || "User deleted successfully."
      );
    } catch (error) {
      console.error("Delete user error:", error);

      showStatusModal(
        "error",
        "Delete Failed",
        error.response?.data?.message || "Failed to delete user."
      );
    } finally {
      setDeleting(false);
    }
  };

  const resetAddForm = () => {
    setEmployeeSearch("");
    setEmployeeResults([]);
    setShowEmployeeDropdown(false);
    setAddForm({
      gyEmpId: "",
      sibsId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      accountId: "",
      account: "",
      departmentId: "",
      department: "",
      adminAccess: "",
    });
  };

  const openAddModal = () => {
    resetAddForm();
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (addSaving) return;

    setShowAddModal(false);
    resetAddForm();
  };

  const searchEmployees = async (keyword) => {
    try {
      setSearchingEmployees(true);

      const result = await searchUserAccessEmployees(keyword);

      if (!result?.success) {
        setEmployeeResults([]);
        return;
      }

      setEmployeeResults(result.data || []);
    } catch (error) {
      console.error("Employee search error:", error);
      setEmployeeResults([]);
    } finally {
      setSearchingEmployees(false);
    }
  };

  const handleEmployeeSearchChange = async (e) => {
    const value = e.target.value;

    setEmployeeSearch(value);
    setShowEmployeeDropdown(true);

    setAddForm((prev) => ({
      ...prev,
      gyEmpId: "",
      sibsId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      accountId: "",
      account: "",
      departmentId: "",
      department: "",
    }));

    if (!value.trim()) {
      setEmployeeResults([]);
      return;
    }

    await searchEmployees(value);
  };

  const handleSelectEmployee = (employee) => {
    setEmployeeSearch(employee.sibsId || "");
    setShowEmployeeDropdown(false);

    setAddForm((prev) => ({
      ...prev,
      gyEmpId: employee.gyEmpId || "",
      sibsId: employee.sibsId || "",
      firstName: employee.firstName || "",
      middleName: employee.middleName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      accountId: getAccountId(employee),
      account: getAccountName(employee),
      departmentId: employee.departmentId || employee.department_id || "",
      department: employee.department || employee.departmentName || "",
    }));
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;

    setAddForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    const selectedAccountIds =
      Array.isArray(addForm.accountIds) && addForm.accountIds.length > 0
        ? addForm.accountIds
        : addForm.accountId
          ? [addForm.accountId]
          : [];

    if (
      !addForm.gyEmpId ||
      !addForm.sibsId ||
      selectedAccountIds.length === 0 ||
      !addForm.adminAccess
    ) {
      showStatusModal(
        "error",
        "Missing Fields",
        "Please complete all required fields and select at least one account."
      );
      return;
    }

    try {
      setAddSaving(true);

      const result = await addUserAccess({
        gyEmpId: addForm.gyEmpId,
        sibsId: addForm.sibsId,
        accountId: selectedAccountIds[0],
        accountIds: selectedAccountIds,
        departmentId: addForm.departmentId,
        adminAccess: Number(addForm.adminAccess),
      });

      if (!result?.success) {
        showStatusModal(
          "error",
          "Add User Failed",
          result?.message || "Failed to add user."
        );
        return;
      }

      await fetchManagementUsers(page, search);
      closeAddModal();

      showStatusModal(
        "success",
        "User Added",
        result?.message || "User added successfully."
      );
    } catch (error) {
      console.error("Add user error:", error);

      showStatusModal(
        "error",
        "Add User Failed",
        error.response?.data?.message || "Failed to add user."
      );
    } finally {
      setAddSaving(false);
    }
  };

  const filteredUsers = users.filter((item) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return true;

    return [
      item.sibsId,
      item.firstName,
      item.middleName,
      item.lastName,
      item.email,
      getAccountName(item),
      formatAssignedAccounts(item),
      item.department,
      formatRole(item.role),
      formatAdminAccess(item.adminAccess),
    ]
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });

  if (loading || !user || !isSuperAdmin) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-[var(--sibs-tertiary-10)]">
        <Header />

        <main className="p-4 sm:p-6">
          <div className="mb-4 h-10 w-64 max-w-full animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-80 max-w-full animate-pulse rounded bg-gray-200" />
        </main>

        <AdminLoginModal />
      </div>
    );
  }

  return (
    <>
      <div className="sibs-dashboard-shell font-jakarta">
        <div className="shrink-0">
          <Header />
        </div>

        <main className="sibs-dashboard-main-wide">
          <div className="mx-auto w-full max-w-[1700px] space-y-5">
            <PageHeaderHero
              kicker="Super Admin System Control"
              title="User Management"
              description="Manage system user credentials, security roles, and administrative access permissions."
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => fetchManagementUsers(1, search)}
                    disabled={pageLoading}
                    title="Refresh Users"
                    className="sibs-btn-icon"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                        pageLoading ? "animate-spin text-sibs-orange" : ""
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={openAddModal}
                    className="sibs-btn-primary max-sm:flex-1"
                  >
                    <UserPlus className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-white" />
                    Add User
                  </button>
                </>
              }
            />

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                title="Total Users"
                value={pagination.total}
                tone="navy"
                delay={0}
              />

              <SummaryCard
                title="Active Accounts"
                value={users.filter((u) => u.status === "active").length}
                tone="emerald"
                delay={60}
              />

              <SummaryCard
                title="Super Admin"
                value={
                  users.filter(
                    (u) => Number(getSingleAdminAccess(u.adminAccess)) === 7
                  ).length
                }
                tone="orange"
                delay={120}
              />

              <SummaryCard
                title="HR Admin"
                value={
                  users.filter(
                    (u) => Number(getSingleAdminAccess(u.adminAccess)) === 3
                  ).length
                }
                tone="amber"
                delay={180}
              />
            </section>

          <div className="sibs-table-shell">
            <div className="border-b border-[#E6ECF2] p-3 sm:p-4">
              <div className="relative w-full sm:max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A98B8]"
                />

                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={handleSearchChange}
                  className="sibs-input-search"
                />
              </div>
            </div>

            <ResponsiveTableShell
              desktopContent={
                <div ref={tableScrollRef} className="max-h-[500px] overflow-auto">
                  <table className="w-full min-w-[1300px] text-sm">
                    <thead className="sticky top-0 z-10 sibs-table-head">
                      <tr>
                        <th className="sibs-table-th">SiBS ID</th>
                        <th className="sibs-table-th">Full Name</th>
                        <th className="sibs-table-th">Email</th>
                        <th className="sibs-table-th">Role</th>
                        <th className="sibs-table-th">Admin Access</th>
                        <th className="sibs-table-th">Assigned Accounts</th>
                        <th className="sibs-table-th">Department</th>
                        <th className="sibs-table-th">Status</th>
                        <th className="sibs-table-th">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pageLoading ? (
                        <tr>
                          <td
                            colSpan="9"
                            className="p-6 text-center text-sm font-semibold text-sibs-muted"
                          >
                            Loading users...
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <TableEmptyRow
                          colSpan={9}
                          title="No users found"
                          description="No user accounts match your current keyword."
                        />
                      ) : (
                        filteredUsers.map((item) => (
                          <UserTableRow
                            key={item.id}
                            item={item}
                            openActionId={openActionId}
                            actionRef={actionRef}
                            handleToggleActionDropdown={
                              handleToggleActionDropdown
                            }
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              }
              mobileContent={
                <div className="p-3">
                  {pageLoading ? (
                    <DataCard.Skeleton count={4} />
                  ) : filteredUsers.length === 0 ? (
                    <DataCard.Empty
                      title="No users found"
                      description="No user accounts match your current keyword."
                    />
                  ) : (
                    <div className="space-y-3">
                      {filteredUsers.map((item, index) => (
                        <UserMobileCard
                          key={item.id}
                          item={item}
                          index={index}
                          openActionId={openActionId}
                          actionRef={actionRef}
                          handleToggleActionDropdown={handleToggleActionDropdown}
                        />
                      ))}
                    </div>
                  )}
                </div>
              }
            />

            <div className="px-4 pb-3">
              <TablePagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalRecords={pagination.total}
                loadedCount={filteredUsers.length}
                recordLabel="users"
                onPageChange={(nextPage) => setPage(nextPage)}
                loading={pageLoading}
              />
            </div>
          </div>
          </div>
        </main>

        <AdminLoginModal />
      </div>

      {actionDropdown.open &&
        actionDropdown.userId &&
        createPortal(
          <div
            ref={actionRef}
            className="fixed z-[9999] w-44 overflow-hidden rounded-xl border border-sibs-tertiary-9 bg-white shadow-lg"
            style={{
              top: `${actionDropdown.top}px`,
              left: `${actionDropdown.left}px`,
            }}
          >
            <button
              type="button"
              onClick={() => {
                const selectedItem = users.find(
                  (userItem) => userItem.id === actionDropdown.userId
                );

                if (selectedItem) {
                  openEditModal(selectedItem);
                }
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition hover:bg-gray-50"
            >
              <Pencil size={16} />
              Edit User
            </button>

            <button
              type="button"
              onClick={() => {
                const selectedItem = users.find(
                  (userItem) => userItem.id === actionDropdown.userId
                );

                if (selectedItem) {
                  openDeleteModal(selectedItem);
                }
              }}
              disabled={deleting}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={16} />
              Delete User
            </button>
          </div>,
          document.body
        )}

      <UserModal
        mode="add"
        open={showAddModal}
        onClose={closeAddModal}
        onSubmit={handleAddUser}
        employeeSearch={employeeSearch}
        onEmployeeSearchChange={handleEmployeeSearchChange}
        showEmployeeDropdown={showEmployeeDropdown}
        setShowEmployeeDropdown={setShowEmployeeDropdown}
        employeeResults={employeeResults}
        searchingEmployees={searchingEmployees}
        onSelectEmployee={handleSelectEmployee}
        form={addForm}
        onChange={handleAddChange}
        accountOptions={editAccountOptions}
        saving={addSaving}
      />

      <UserModal
        mode="edit"
        open={showEditModal}
        onClose={closeEditModal}
        onSubmit={handleSaveUser}
        selectedUser={selectedUser}
        form={editForm}
        onChange={handleEditChange}
        onToggleAccount={handleToggleEditAccount}
        accountOptions={editAccountOptions}
        saving={saving}
        formatAdminAccess={formatAdminAccess}
      />

      <UserModal
        mode="delete"
        open={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirmDelete={handleDeleteUser}
        selectedUser={selectedUser}
        accountOptions={editAccountOptions}
        deleting={deleting}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
      />
    </>
  );
}

function UserTableRow({
  item,
  openActionId,
  actionRef,
  handleToggleActionDropdown,
}) {
  return (
    <tr className="border-t border-sibs-tertiary-9">
      <td className="p-3">{item.sibsId}</td>

      <td className="p-3 font-medium">{getFullName(item)}</td>

      <td className="p-3">{item.email || "-"}</td>

      <td className="p-3">{formatRole(item.role)}</td>

      <td className="p-3">
        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
          {formatAdminAccess(item.adminAccess)}
        </span>
      </td>

      <td className="p-3">
        <span className="line-clamp-2 max-w-[280px]">
          {formatAssignedAccounts(item)}
        </span>
      </td>

      <td className="p-3">{item.department || "-"}</td>

      <td className="p-3">
        <StatusBadge status={item.status} />
      </td>

      <td className="p-3">
        <div
          className="relative inline-block"
          ref={openActionId === item.id ? actionRef : null}
        >
          <button
            type="button"
            onClick={(e) => handleToggleActionDropdown(e, item)}
            className="inline-flex items-center justify-center rounded-lg border border-sibs-tertiary-8 px-3 py-2 text-sm font-medium text-sibs-primary-1 transition hover:bg-gray-50"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function UserMobileCard({
  item,
  index = 0,
  openActionId,
  actionRef,
  handleToggleActionDropdown,
}) {
  return (
    <DataCard index={index}>
      <DataCard.Header
        kicker={item.sibsId ? `SiBS ID: ${item.sibsId}` : undefined}
        title={getFullName(item)}
        subtitle={item.email || "—"}
        action={
          <div
            className="relative shrink-0"
            ref={openActionId === item.id ? actionRef : null}
          >
            <button
              type="button"
              onClick={(e) => handleToggleActionDropdown(e, item)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6]"
            >
              <MoreHorizontal size={17} />
            </button>
          </div>
        }
      />

      <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
        <InfoRow label="Role" value={formatRole(item.role)} />

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[#667085]">Admin Access</span>
          <span className="max-w-[170px] rounded-full bg-blue-50 px-2.5 py-0.5 text-right text-[11px] font-bold text-blue-700 border border-blue-200/60">
            {formatAdminAccess(item.adminAccess)}
          </span>
        </div>

        <InfoRow label="Accounts" value={formatAssignedAccounts(item)} />
        <InfoRow label="Department" value={item.department || "—"} />

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-dashed border-[#E6ECF2]">
          <span className="text-xs font-semibold text-[#667085]">Status</span>
          <StatusBadge status={item.status} />
        </div>
      </div>
    </DataCard>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs text-sibs-tertiary-5">{label}</span>

      <span className="break-words text-right text-sm font-medium text-sibs-primary-1">
        {value}
      </span>
    </div>
  );
}


function SummaryCard({ title, value, icon, tone = "navy", delay = 0 }) {
  const tones = {
    navy: {
      label: "text-[#042C51]",
      value: "text-[#042C51]",
      icon: "bg-[#EAF2FB] text-[#042C51]",
    },
    emerald: {
      label: "text-[#047857]",
      value: "text-[#047857]",
      icon: "bg-[#ECFDF3] text-[#059669]",
    },
    amber: {
      label: "text-[#B45309]",
      value: "text-[#F59E0B]",
      icon: "bg-[#FFFBEB] text-[#F59E0B]",
    },
    orange: {
      label: "text-[#C2410C]",
      value: "text-[#FF5C28]",
      icon: "bg-[#FFF3ED] text-[#FF5C28]",
    },
  };

  const selectedTone = tones[tone] || tones.navy;
  const IconComponent = icon;

  return (
    <article
      className="sibs-metric-card sibs-page-card-in flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5 font-jakarta"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 self-stretch flex flex-col justify-between h-full">
          <div>
            <p
              className={`m-0 truncate sibs-text-micro font-extrabold uppercase ${selectedTone.label}`}
            >
              {title}
            </p>

            <p
              className={`font-heading mt-1.5 2xl:mt-2 text-2xl 2xl:text-3xl font-bold leading-none tabular-nums tracking-tight ${selectedTone.value}`}
            >
              {value}
            </p>
          </div>
        </div>

        {IconComponent ? (
          <span
            className={`flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full ${selectedTone.icon}`}
          >
            <IconComponent className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
          </span>
        ) : null}
      </div>
    </article>
  );
}