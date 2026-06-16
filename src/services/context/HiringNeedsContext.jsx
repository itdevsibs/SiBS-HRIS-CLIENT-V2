import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  getHiringNeeds,
  getHiringNeedJobDescriptions,
} from "../../lib/axios/getHiringNeeds";
import { usePagination } from "./PaginationContext";

const HiringNeedsContext = createContext(null);
const reasonForHiringOptions = ["New Position", "Ramp-up", "Forecasted Growth"];


/**
 * Normalizes the status of a Personnel Requisition.
 */
function normalizeStatus(status) {
  if (!status) return "For Approval";
  const s = String(status).trim();
  if (["Pending", "For Validation", "Under Review"].includes(s)) return "For Approval";
  if (s === "Approved") return "Approved";
  if (["Rejected", "Not Approved"].includes(s)) return "Not Approved";
  return s;
}

/**
 * Normalizes a single hiring need item from the API response.
 */
function normalizeItem(item) {
  const jd = item.jobDescription;
  const jobDescriptionTitle =
    item.jobDescriptionTitle ||
    (jd && typeof jd === "object" ? (jd.roleTitle || jd.title) : "") ||
    "";

  return {
    ...item,
    id: item.id || item.prfId || "—",
    positionTitle: item.positionTitle || item.roleTitle || "",
    departmentAccount: item.departmentAccount || (item.department && item.account
       ? `${item.department} / ${item.account}` : ""),
    jobDescriptionTitle,
    jobDescriptionText: item.jdCode ? `${item.jdCode} — ${jobDescriptionTitle}` :
       jobDescriptionTitle,
    headcount: item.headcount || 0,
    reasonForHiring: item.reasonForHiring || "",
    approvalStatus: normalizeStatus(item.approvalStatus),
    dateNeeded: item.dateNeeded || "",
    preparedBy: item.preparedBy || "",
    locationSite: item.locationSite || "",
    createdAt: item.createdAt || "",
  };
}

export const HiringNeedsProvider = ({ children }) => {
   const [list, setList] = useState([]);
   const [jobDescriptions, setJobDescriptions] = useState([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);
   const { setSearchInput, commitSearch, setFilter } =
      usePagination("hiring-needs");

   const fetchList = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const res = await getHiringNeeds();
       const data = res?.success ? res.data : (Array.isArray(res) ? res : []);
       setList(data.map(normalizeItem));
     } catch (err) {
       setError("Failed to fetch hiring needs.");
       console.error(err);
     } finally {
       setLoading(false);
     }
   }, []);

   const fetchJobDescriptions = useCallback(async () => {
     try {
       const res = await getHiringNeedJobDescriptions();
       setJobDescriptions(res?.success ? res.data : (Array.isArray(res) ? res : []));
     } catch (err) {
       console.error("Fetch Job Descriptions Error:", err);
     }
   }, []);

   // 1. Move Stats Logic here
   const stats = useMemo(() => ({
     total: list.length,
     totalHeadcount: list.reduce((sum, item) => sum + Number(item.headcount || 0), 0),
     forApproval: list.filter(i => i.approvalStatus === "For Approval").length,
     approved: list.filter(i => i.approvalStatus === "Approved").length,
     notApproved: list.filter(i => i.approvalStatus === "Not Approved").length,
   }), [list]);

   // 2. Move Chart Logic here
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
     // Extract department from "Operations / Account Name" string
     const dept = item.departmentAccount?.split(" / ")[0] || "Unspecified";
     deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
     });

     const colors = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];        
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
   }, [setSearchInput, setFilter, commitSearch]);

   const value = useMemo(() => ({
     list,
     jobDescriptions,
     loading,
     error,
     stats,               // Provide to consumers
     requisitionByReason, // Provide to consumers
     requisitionByDepartment,
     clearFilters,
     fetchList,
     fetchJobDescriptions,
     normalizeStatus,
     reasonForHiringOptions
   }), [list, jobDescriptions, loading, error, stats, requisitionByReason, requisitionByDepartment, fetchList, fetchJobDescriptions, clearFilters]);

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