import React, { useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useHiringNeeds } from "../../../services/context/HiringNeedsContext";
import { usePagination } from "../../../services/context/PaginationContext";
import HiringNeedsMobileCard from "./HiringNeedsMobileCard";

function formatDate(date) {
  if (!date) return "—";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric" });
}

function getStatusClass(status) {
  switch (status) {
    case "Approved": return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Not Approved": return "border-red-200 bg-red-50 text-red-700";
    case "For Approval": return "border-amber-200 bg-amber-50 text-amber-700";
    default: return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

export default function HiringNeedsTable({ onView }) {
  const { list, loading } = useHiringNeeds();
  const { page, setPage, setPagination, pagination, search, filterValues } =
    usePagination("hiring-needs");
  
  const limit = pagination?.limit || 15;

  const filteredList = useMemo(() => {
    const keyword = (search || "").toLowerCase();
    const statusF = filterValues?.status || "All";
    const siteF = filterValues?.site || "All";
    const reasonF = filterValues?.reason || "All";

    return list.filter((item) => {
      const matchesSearch = !keyword || 
        String(item.id || "").toLowerCase().includes(keyword) ||
        String(item.positionTitle || "").toLowerCase().includes(keyword) ||
        String(item.departmentAccount || "").toLowerCase().includes(keyword);

      const matchesStatus = statusF === "All" || item.approvalStatus === statusF;
      const matchesSite = siteF === "All" || item.locationSite === siteF;
      const matchesReason = reasonF === "All" || item.reasonForHiring === reasonF;

      return matchesSearch && matchesStatus && matchesSite && matchesReason;
    });
  }, [list, search, filterValues]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredList.slice(start, start + limit);
  }, [filteredList, page, limit]);

  useEffect(() => {
    setPagination({
      total: filteredList.length,
      totalPages: Math.ceil(filteredList.length / limit) || 1
    });
  }, [filteredList.length, limit, setPagination]);

  const totalPages = Math.ceil(filteredList.length / limit) || 1;

  return (
    <div className="px-4 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">

      {/* Mobile View */}
      <div className="space-y-3 lg:hidden">
        {loading ? (
          <div className="py-12 text-center text-sm font-bold text-gray-500">Loading...</div>
        ) : paginatedData.length > 0 ? (
          paginatedData.map((item) => (
            <HiringNeedsMobileCard key={item.id} item={item} onView={onView} />
          ))
        ) : (
          <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
            No records found.
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          {/* Note: table borders simplified to remove the "double border" look */}       
          <table className="w-full min-w-[1450px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
            <thead>
              <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-[#174A7C] whitespace-nowrap">
                <th className="px-5 py-4 first:rounded-tl-2xl">PRF ID</th>
                <th className="px-5 py-4">Department / Account</th>
                <th className="px-5 py-4">Job Description</th>
                <th className="px-5 py-4 text-center">Headcount</th>
                <th className="px-5 py-4">Reason for Hiring</th>
                <th className="px-5 py-4">Location / Site</th>
                <th className="px-5 py-4">Date Needed</th>
                <th className="px-5 py-4 text-center">Approval</th>
                <th className="px-5 py-4 text-right last:rounded-tr-2xl">Actions</th>      
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-5 py-12 text-center text-sm font-bold text-gray-500">Loading...</td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="transition hover:bg-[#FAFBFC]">
                    {/* PRF ID with distinct styling */}
                    <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-bold text-sibs-primary-1">
                      {item.id}
                    </td>

                    {/* Department with font weight matching Talent Pool */}
                    <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-bold text-[#101828]">
                      {item.departmentAccount || "—"}
                    </td>

                    {/* Job Description Title + Code Stack */}
                    <td className="border-b border-[#E6ECF2] px-5 py-5">
                      <p className="text-sm font-bold text-[#101828]">
                        {item.jobDescriptionTitle || "—"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5"> 
                        {item.jdCode || "—"}
                      </p>
                    </td>

                    <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-extrabold text-sibs-primary-1">
                      {item.headcount}
                    </td>

                    <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                      {item.reasonForHiring}
                    </td>

                    <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                      {item.locationSite}
                    </td>

                    <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                      {formatDate(item.dateNeeded)}
                    </td>

                    <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">      
                      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold ${getStatusClass(item.approvalStatus)}`}>
                        {item.approvalStatus}
                      </span>
                    </td>

                    <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">        
                      <button
                        onClick={() => onView(item)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm"
                      >
                        <Eye size={15} /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={10} className="px-5 py-12 text-center text-sm font-bold text-gray-500">No results found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer - Perfectly aligned */}
      <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <p className="text-sm font-semibold text-sibs-tertiary-5">
          Showing {paginatedData.length} of {filteredList.length} records
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white text-gray-500 transition hover:bg-gray-50 disabled:opacity-30"  
          >
            <ChevronLeft size={16} />
          </button>
          <button className="flex h-9 min-w-[36px] items-center justify-center rounded-xl bg-sibs-primary-1 px-3 text-sm font-bold text-white shadow-sm">
            {page}
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white text-gray-500 transition hover:bg-gray-50 disabled:opacity-30"  
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}