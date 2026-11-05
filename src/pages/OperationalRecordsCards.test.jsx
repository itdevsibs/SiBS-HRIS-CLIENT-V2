import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LeavesPage from "./leaves/LeavesPage";
import AttendancePage from "./attendance/AttendancePage";

const requests = vi.hoisted(() => ({
  leaves: vi.fn(),
  attendance: vi.fn(),
  attendanceCount: vi.fn(),
  attendanceOptions: vi.fn(),
}));

vi.mock("../components/layout/Header", () => ({ default: () => null }));
vi.mock("../services/context/UserContext", () => ({
  useUser: () => ({ user: { role: "employee", sibs_id: "1001" } }),
}));
vi.mock("../services/context/SidebarNotificationContext", () => ({
  useSidebarNotifications: () => ({ markNotificationSeen: vi.fn() }),
}));
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useLocation: () => ({ pathname: "/leaves", state: null, key: "test" }),
  useNavigate: () => vi.fn(),
}));
vi.mock("../services/context/PaginationContext", () => ({
  usePagination: () => ({
    page: 1, search: "", searchInput: "", loading: false,
    pagination: { currentPage: 1, totalPages: 1, total: 0 },
    filterValues: {}, setLoading: vi.fn(), setSearchInput: vi.fn(),
    setSearch: vi.fn(), setPagination: vi.fn(), setPage: vi.fn(),
    setDateRange: vi.fn(),
  }),
  PaginationDateRangeFilter: () => null,
}));
vi.mock("../lib/axios/getLeaves", () => ({ getLeaves: requests.leaves }));
vi.mock("../lib/axios/getAttendance", () => ({
  getAttendance: requests.attendance,
  getAttendanceCount: requests.attendanceCount,
  getAttendanceOptions: requests.attendanceOptions,
}));
vi.mock("../lib/axios/socket", () => ({
  socket: { connected: false, on: vi.fn(), off: vi.fn(), emit: vi.fn(), connect: vi.fn() },
}));
vi.mock("../components/tables/Leaves/LeavesTable", () => ({
  default: () => <section>Leave Records</section>,
}));
vi.mock("../components/tables/AttendanceEmployeeDetailsModal", () => ({ default: () => null }));

describe("operational records pages", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete Element.prototype.scrollTo;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("requestAnimationFrame", (callback) => callback());
    Element.prototype.scrollTo = vi.fn();
    requests.leaves.mockResolvedValue({ success: true, data: [], pagination: { currentPage: 1, totalPages: 1, total: 0 } });
    requests.attendance.mockResolvedValue({ success: true, data: [], pagination: { currentPage: 1, totalPages: 1, total: 0 } });
    requests.attendanceCount.mockResolvedValue({ success: true, total: 0 });
    requests.attendanceOptions.mockResolvedValue({ success: true, departments: [], accounts: [] });
  });

  it("shows leave records without the six page-summary cards", async () => {
    render(<LeavesPage />);
    await waitFor(() => expect(requests.leaves).toHaveBeenCalled());
    expect(screen.getByText("Leave Records")).toBeInTheDocument();
    for (const label of ["Loaded Leaves", "Page Leave Days", "Page Remaining"]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  it("shows attendance records without the four page-summary cards", async () => {
    render(<AttendancePage />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Attendance Records" })).toBeInTheDocument());
    for (const label of ["Loaded Attendance", "Pending Review", "Computed Work Hours"]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });
});
