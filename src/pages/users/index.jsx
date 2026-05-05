import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "@/lib/router";
import {
  Shield,
  Search,
  UserPlus,
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

export default function UserManagementPage() {
  const router = useRouter();
  const { user, loading } = useUser();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
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
      router.replace("/login");
      return;
    }

    if (user.role !== SUPER_ADMIN_ROLE) {
      router.replace("/dashboard/admin");
    }
  }, [user, loading, router]);

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
    currentSearch = search,
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
        setPagination({
          page: 1,
          limit: 15,
          total: 0,
          totalPages: 1,
        });
        return;
      }

      setUsers(result.data || []);
      setPagination(
        result.pagination || {
          page: currentPage,
          limit: 15,
          total: (result.data || []).length,
          totalPages: 1,
        },
      );
    } catch (error) {
      console.error("Fetch management users error:", error);
      setUsers([]);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === SUPER_ADMIN_ROLE) {
      fetchManagementUsers(page, search);
    }
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
      for (let i = 1; i <= totalPages; i++) {
        pages.push(createPage(i));
      }
    } else {
      pages.push(createPage(1));

      if (page > 3) {
        pages.push(
          <span key="start-ellipsis" className="px-2 text-sibs-tertiary-5">
            ...
          </span>,
        );
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(createPage(i));
      }

      if (page < totalPages - 2) {
        pages.push(
          <span key="end-ellipsis" className="px-2 text-sibs-tertiary-5">
            ...
          </span>,
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
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    if (!selectedUser) return;

    if (!editForm.adminAccess) {
      showStatusModal(
        "error",
        "Missing Fields",
        "Please select admin access.",
      );
      return;
    }

    try {
      setSaving(true);

      const result = await updateUserAccess(selectedUser.id, {
        adminAccess: Number(editForm.adminAccess),
        status: editForm.status,
        accountId: selectedUser.accountId,
        departmentId: selectedUser.departmentId,
      });

      if (!result?.success) {
        showStatusModal(
          "error",
          "Update Failed",
          result?.message || "Failed to update user.",
        );
        return;
      }

      await fetchManagementUsers(page, search);
      closeEditModal();

      showStatusModal(
        "success",
        "User Updated",
        result?.message || "User updated successfully.",
      );
    } catch (error) {
      console.error("Save user error:", error);

      showStatusModal(
        "error",
        "Update Failed",
        error.response?.data?.message || "Failed to update user.",
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
          result?.message || "Failed to delete user.",
        );
        return;
      }

      await fetchManagementUsers(page, search);
      closeDeleteModal();

      showStatusModal(
        "success",
        "User Deleted",
        result?.message || "User deleted successfully.",
      );
    } catch (error) {
      console.error("Delete user error:", error);

      showStatusModal(
        "error",
        "Delete Failed",
        error.response?.data?.message || "Failed to delete user.",
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
      accountId: employee.accountId || "",
      account: employee.account || "",
      departmentId: employee.departmentId || "",
      department: employee.department || "",
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

    if (
      !addForm.gyEmpId ||
      !addForm.sibsId ||
      !addForm.accountId ||
      !addForm.departmentId ||
      !addForm.adminAccess
    ) {
      showStatusModal(
        "error",
        "Missing Fields",
        "Please complete all required fields.",
      );
      return;
    }

    try {
      setAddSaving(true);

      const result = await addUserAccess({
        gyEmpId: addForm.gyEmpId,
        sibsId: addForm.sibsId,
        accountId: addForm.accountId,
        departmentId: addForm.departmentId,
        adminAccess: Number(addForm.adminAccess),
      });

      if (!result?.success) {
        showStatusModal(
          "error",
          "Add User Failed",
          result?.message || "Failed to add user.",
        );
        return;
      }

      await fetchManagementUsers(page, search);
      closeAddModal();

      showStatusModal(
        "success",
        "User Added",
        result?.message || "User added successfully.",
      );
    } catch (error) {
      console.error("Add user error:", error);

      showStatusModal(
        "error",
        "Add User Failed",
        error.response?.data?.message || "Failed to add user.",
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
      item.account,
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--sibs-tertiary-10)]">
        <Header />

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Shield size={28} className="shrink-0 text-sibs-primary-1" />

                <h1 className="truncate text-2xl font-bold text-sibs-primary-1 sm:text-4xl">
                  User Management
                </h1>
              </div>

              <p className="mt-1 text-sm text-sibs-tertiary-5">
                Manage system users and access roles
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--sibs-primary-1)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 sm:w-auto"
            >
              <UserPlus size={16} />
              Add User
            </button>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard title="Total Users" value={pagination.total} />

            <SummaryCard
              title="Active"
              value={users.filter((u) => u.status === "active").length}
            />

            <SummaryCard
              title="Super Admin"
              value={
                users.filter(
                  (u) => Number(getSingleAdminAccess(u.adminAccess)) === 7,
                ).length
              }
            />

            <SummaryCard
              title="HR Admin"
              value={
                users.filter(
                  (u) => Number(getSingleAdminAccess(u.adminAccess)) === 3,
                ).length
              }
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-sibs-tertiary-9 bg-white shadow-sm">
            <div className="border-b border-sibs-tertiary-9 p-4">
              <div className="relative w-full sm:max-w-sm">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                />

                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full rounded-lg border border-sibs-tertiary-8 px-10 py-2 text-sm text-sibs-primary-1 outline-none focus:border-[var(--sibs-primary-1)]"
                />
              </div>
            </div>

            <div className="hidden md:block">
              <div
                ref={tableScrollRef}
                className="max-h-[500px] overflow-auto"
              >
                <table className="w-full min-w-[1300px] text-sm">
                  <thead className="sticky top-0 z-10 bg-[var(--sibs-tertiary-9)]">
                    <tr>
                      <th className="p-3 text-left">SiBS ID</th>
                      <th className="p-3 text-left">Full Name</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Role</th>
                      <th className="p-3 text-left">Admin Access</th>
                      <th className="p-3 text-left">Account</th>
                      <th className="p-3 text-left">Department</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageLoading ? (
                      <tr>
                        <td
                          colSpan="9"
                          className="p-6 text-center text-gray-500"
                        >
                          Loading users...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan="9"
                          className="p-6 text-center text-gray-500"
                        >
                          No users found
                        </td>
                      </tr>
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
            </div>

            <div className="block md:hidden">
              {pageLoading ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  No users found
                </div>
              ) : (
                <div className="divide-y divide-sibs-tertiary-9">
                  {filteredUsers.map((item) => (
                    <UserMobileCard
                      key={item.id}
                      item={item}
                      openActionId={openActionId}
                      actionRef={actionRef}
                      handleToggleActionDropdown={handleToggleActionDropdown}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-sibs-tertiary-9 px-4 py-3 lg:grid lg:grid-cols-3 lg:items-center">
              <p className="text-center text-sm text-sibs-tertiary-5 lg:text-left">
                Showing page {pagination.page} of {pagination.totalPages}
              </p>

              <p className="text-center text-sm text-sibs-tertiary-5">
                Total Users: {pagination.total || 0}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1 || pageLoading}
                  className="rounded-md border border-sibs-tertiary-8 px-3 py-1 text-sm disabled:opacity-50"
                >
                  Previous
                </button>

                <div className="hidden items-center gap-2 sm:flex">
                  {renderPagination()}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(prev + 1, pagination.totalPages || 1),
                    )
                  }
                  disabled={page === pagination.totalPages || pageLoading}
                  className="rounded-md border border-sibs-tertiary-8 px-3 py-1 text-sm disabled:opacity-50"
                >
                  Next
                </button>
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
                  (userItem) => userItem.id === actionDropdown.userId,
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
                  (userItem) => userItem.id === actionDropdown.userId,
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
          document.body,
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
        saving={saving}
        formatAdminAccess={formatAdminAccess}
      />

      <UserModal
        mode="delete"
        open={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirmDelete={handleDeleteUser}
        selectedUser={selectedUser}
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

      <td className="p-3 font-medium">
        {`${item.lastName || ""}${item.lastName ? ", " : ""}${
          item.firstName || ""
        }${item.middleName ? " " + item.middleName : ""}`.trim() || "-"}
      </td>

      <td className="p-3">{item.email || "-"}</td>

      <td className="p-3">{formatRole(item.role)}</td>

      <td className="p-3">
        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
          {formatAdminAccess(item.adminAccess)}
        </span>
      </td>

      <td className="p-3">{item.account || "-"}</td>

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
  openActionId,
  actionRef,
  handleToggleActionDropdown,
}) {
  const fullName =
    `${item.lastName || ""}${item.lastName ? ", " : ""}${
      item.firstName || ""
    }${item.middleName ? " " + item.middleName : ""}`.trim() || "-";

  return (
    <div className="bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-sibs-tertiary-5">
            SiBS ID: {item.sibsId || "-"}
          </p>

          <h3 className="mt-1 break-words text-base font-bold text-sibs-primary-1">
            {fullName}
          </h3>

          <p className="mt-1 break-words text-xs text-sibs-tertiary-5">
            {item.email || "-"}
          </p>
        </div>

        <div
          className="relative shrink-0"
          ref={openActionId === item.id ? actionRef : null}
        >
          <button
            type="button"
            onClick={(e) => handleToggleActionDropdown(e, item)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sibs-tertiary-8 text-sibs-primary-1 transition hover:bg-gray-50"
          >
            <MoreHorizontal size={17} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm">
        <InfoRow label="Role" value={formatRole(item.role)} />

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-sibs-tertiary-5">Admin Access</span>

          <span className="max-w-[170px] rounded-full bg-blue-100 px-3 py-1 text-right text-xs font-medium text-blue-700">
            {formatAdminAccess(item.adminAccess)}
          </span>
        </div>

        <InfoRow label="Account" value={item.account || "-"} />
        <InfoRow label="Department" value={item.department || "-"} />

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-sibs-tertiary-5">Status</span>
          <StatusBadge status={item.status} />
        </div>
      </div>
    </div>
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

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
        status === "active"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {status === "active" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-xl border border-sibs-tertiary-9 bg-white p-4 shadow-sm">
      <p className="truncate text-xs text-sibs-tertiary-5 sm:text-sm">
        {title}
      </p>

      <h2 className="mt-1 text-xl font-bold text-sibs-primary-1 sm:text-2xl">
        {value}
      </h2>
    </div>
  );
}