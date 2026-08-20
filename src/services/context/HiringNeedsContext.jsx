import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  getHiringNeeds,
  getHiringNeedJobDescriptions,
  updateHiringNeedApproval,
} from "../../lib/axios/getHiringNeeds";
import { usePagination } from "./PaginationContext";
import { useUser } from "./UserContext";

const HiringNeedsContext = createContext(null);

const reasonForHiringOptions = [
  "New Position",
  "Ramp-up",
  "Forecasted Growth",
];

function normalizeStatus(status) {
  if (!status) return "For Approval";

  const value = String(status).trim();
  const lowerValue = value.toLowerCase();

  if (
    lowerValue === "pending" ||
    lowerValue === "for validation" ||
    lowerValue === "under review" ||
    lowerValue === "for approval"
  ) {
    return "For Approval";
  }

  if (lowerValue === "approved") return "Approved";

  if (
    lowerValue === "rejected" ||
    lowerValue === "declined" ||
    lowerValue === "not approved"
  ) {
    return "Not Approved";
  }

  return value;
}

function normalizeItem(item = {}) {
  const jd = item.jobDescription;

  const rawId =
    item.rawId ||
    item.dbId ||
    item.hiringNeedId ||
    item.hiring_need_id ||
    item.prfRawId ||
    item.id ||
    item.prfId ||
    item.prf_id ||
    "";

  const jobDescriptionTitle =
    item.jobDescriptionTitle ||
    item.job_description_title ||
    item.roleTitle ||
    item.role_title ||
    (jd && typeof jd === "object" ? jd.roleTitle || jd.title : "") ||
    "";

  const jdCode =
    item.jdCode ||
    item.jd_code ||
    item.jobDescriptionCode ||
    item.job_description_code ||
    "";

  const departmentAccount =
    item.departmentAccount ||
    item.department_account ||
    (item.department && item.account
      ? `${item.department} / ${item.account}`
      : item.department || item.account || "");

  return {
    ...item,

    rawId,
    id: item.id || item.prfId || item.prf_id || rawId || "—",

    positionTitle:
      item.positionTitle ||
      item.position_title ||
      item.roleTitle ||
      item.role_title ||
      "",

    departmentAccount,

    jobDescriptionId:
      item.jobDescriptionId ||
      item.job_description_id ||
      item.jobDescriptionDbId ||
      item.jdId ||
      item.jd_id ||
      "",

    jdLinkStatus:
      item.jdLinkStatus || item.jd_link_status || "Linked",

    jd_link_status:
      item.jd_link_status || item.jdLinkStatus || "Linked",

    jobDescriptionTitle,

    jdCode,

    jobDescriptionText: jdCode
      ? `${jdCode} — ${jobDescriptionTitle || "Job Description"}`
      : jobDescriptionTitle,

    headcount: item.headcount || item.requiredHeadcount || item.required_hc || 0,

    reasonForHiring:
      item.reasonForHiring || item.reason_for_hiring || item.reason || "",

    assignment: item.assignment || "",
    assignmentOther: item.assignmentOther || item.assignment_other || "",

    locationSite: item.locationSite || item.location_site || item.site || "",

    dateNeeded: item.dateNeeded || item.date_needed || "",

    preparedBy:
      item.preparedBy ||
      item.prepared_by ||
      item.requestedBy ||
      item.requested_by ||
      "",

    preparedById:
      item.preparedById ||
      item.prepared_by_id ||
      item.requestedById ||
      item.requested_by_id ||
      "",

    approvalStatus: normalizeStatus(
      item.approvalStatus || item.approval_status || item.status,
    ),

    approvalDate:
      item.approvalDate ||
      item.approval_date ||
      item.approvedAt ||
      item.approved_at ||
      "",

    approvalRemarks:
      item.approvalRemarks ||
      item.approval_remarks ||
      item.remarks ||
      item.approveRemarks ||
      "",

    approvedBy:
      item.approvedBy ||
      item.approved_by ||
      item.approvedByName ||
      item.approved_by_name ||
      item.approverName ||
      item.approver_name ||
      item.approver ||
      "",

    approverName:
      item.approverName ||
      item.approver_name ||
      item.approvedByName ||
      item.approved_by_name ||
      "",

    approverSibsId:
      item.approverSibsId ||
      item.approver_sibs_id ||
      item.approvedBySibsId ||
      item.approved_by_sibs_id ||
      "",

    createdAt: item.createdAt || item.created_at || "",
    updatedAt: item.updatedAt || item.updated_at || "",
  };
}

function getUserDisplayName(user = {}) {
  return (
    user.fullName ||
    user.name ||
    user.employeeName ||
    user.displayName ||
    user.username ||
    user.sibs_id ||
    user.sibsId ||
    user.userCode ||
    "HR Admin"
  );
}

function getUserSibsId(user = {}) {
  return (
    user.sibs_id ||
    user.sibsId ||
    user.userCode ||
    user.username ||
    user.employeeCode ||
    ""
  );
}

export const HiringNeedsProvider = ({ children }) => {
  const { user } = useUser();

  const [list, setList] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobDescriptionLoading, setJobDescriptionLoading] = useState(false);
  const [error, setError] = useState(null);

  const { setSearchInput, setFilter } = usePagination("hiring-needs");

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getHiringNeeds();
      const data = res?.success ? res.data : Array.isArray(res) ? res : [];

      setList(data.map(normalizeItem));
    } catch (err) {
      console.error("Fetch Hiring Needs Error:", err);
      setError("Failed to fetch hiring needs.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJobDescriptions = useCallback(async () => {
    setJobDescriptionLoading(true);

    try {
      const res = await getHiringNeedJobDescriptions();
      const data = res?.success ? res.data : Array.isArray(res) ? res : [];

      setJobDescriptions(data);
    } catch (err) {
      console.error("Fetch Job Descriptions Error:", err);
    } finally {
      setJobDescriptionLoading(false);
    }
  }, []);

  const approveHiringNeedRequest = useCallback(
    async ({ item, status = "Approved", remarks = "" }) => {
      const targetId =
        item?.rawId ||
        item?.dbId ||
        item?.hiringNeedId ||
        item?.hiring_need_id ||
        item?.prfRawId ||
        item?.prfId ||
        item?.prf_id ||
        item?.id;

      if (!targetId) {
        throw new Error("Unable to determine the PRF record ID.");
      }

      const approverName = getUserDisplayName(user);
      const approverSibsId = getUserSibsId(user);

      const res = await updateHiringNeedApproval(targetId, {
        status,
        remarks,

        approvedBy: approverSibsId || approverName,
        approverName,
        approverSibsId,

        approverRole:
          user?.role ||
          user?.userRole ||
          user?.user_role ||
          user?.adminRole ||
          user?.admin_role ||
          "",

        approverRoleName:
          user?.roleName ||
          user?.role_name ||
          user?.accessRole ||
          user?.access_role ||
          "",

        approverAdminLevel:
          user?.admin_level ??
          user?.adminLevel ??
          user?.is_admin ??
          user?.isAdmin ??
          "",

        approverDepartment: user?.department || "",
        approverAccount: user?.account || "",
        approverPosition: user?.position || user?.designation || "",
      });

      if (res?.success === false) {
        throw new Error(res?.message || "Failed to update approval status.");
      }

      await fetchList();

      return res;
    },
    [fetchList, user],
  );

  const stats = useMemo(
    () => ({
      total: list.length,
      totalHeadcount: list.reduce(
        (sum, item) => sum + Number(item.headcount || 0),
        0,
      ),
      forApproval: list.filter(
        (item) => item.approvalStatus === "For Approval",
      ).length,
      approved: list.filter((item) => item.approvalStatus === "Approved")
        .length,
      notApproved: list.filter(
        (item) => item.approvalStatus === "Not Approved",
      ).length,
    }),
    [list],
  );

  const requisitionByReason = useMemo(() => {
    const reasonMap = new Map();

    list.forEach((item) => {
      const reason = item.reasonForHiring || "Unspecified";
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
    });

    const colors = ["#2563EB", "#06B6D4", "#22C55E", "#F97316", "#EF4444"];

    return Array.from(reasonMap.keys()).map((reason, index) => ({
      label: reason,
      value: reasonMap.get(reason),
      color: colors[index % colors.length],
    }));
  }, [list]);

  const requisitionByDepartment = useMemo(() => {
    const deptMap = new Map();

    list.forEach((item) => {
      const dept = item.departmentAccount?.split(" / ")[0] || "Unspecified";
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    });

    const colors = [
      "#6366F1",
      "#EC4899",
      "#F59E0B",
      "#10B981",
      "#3B82F6",
      "#8B5CF6",
    ];

    return Array.from(deptMap.keys()).map((dept, index) => ({
      label: dept,
      value: deptMap.get(dept),
      color: colors[index % colors.length],
    }));
  }, [list]);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setFilter("status", "All");
    setFilter("site", "All");
    setFilter("reason", "All");
  }, [setSearchInput, setFilter]);

  const value = useMemo(
    () => ({
      list,
      jobDescriptions,
      loading,
      jobDescriptionLoading,
      error,

      stats,
      requisitionByReason,
      requisitionByDepartment,

      clearFilters,
      fetchList,
      fetchJobDescriptions,
      approveHiringNeedRequest,

      normalizeStatus,
      reasonForHiringOptions,
    }),
    [
      list,
      jobDescriptions,
      loading,
      jobDescriptionLoading,
      error,
      stats,
      requisitionByReason,
      requisitionByDepartment,
      clearFilters,
      fetchList,
      fetchJobDescriptions,
      approveHiringNeedRequest,
    ],
  );

  return (
    <HiringNeedsContext.Provider value={value}>
      {children}
    </HiringNeedsContext.Provider>
  );
};

export const useHiringNeeds = () => {
  const context = useContext(HiringNeedsContext);

  if (!context) {
    throw new Error("useHiringNeeds must be used within a HiringNeedsProvider");
  }

  return context;
};

export default HiringNeedsContext;
