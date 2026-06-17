import React from "react";
import { Search, Filter } from "lucide-react";
import { usePagination } from "../../../services/context/PaginationContext";

export default function OnboardingFilters() {
  const { searchInput, setSearchInput, filterValues, setFilter, commitSearch, resetFilters } = usePagination("onboarding");

  const handleClearFilters = () => {
    setSearchInput("");
    resetFilters();
    setFilter("showStatus", "All Status");
    setFilter("outcome", "All Outcomes");
    setFilter("owner", "All Owners");
  };

  return (
    <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_190px_230px_190px_auto] xl:items-end">
        {/* 1. Search */}
        <div>
          <label className="mb-1. block text-sm font-bold text-[#101828]">Search</label>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commitSearch()}
              placeholder="Search candidate, role, account..."
              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>

        {/* 2. Custom Selects (Outcome, Show Status, Owner) */}
        <div className="w-full">
          <label className="mb-1 block text-sm font-bold text-[#101828]">Show Status</label>
          <select 
            value={filterValues.showStatus || "All Status"}
            onChange={(e) => setFilter("showStatus", e.target.value)}
            className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1"
          >
            <option value="All Status">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Show">Show</option>
            <option value="No Show">No Show</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>

        <div className="w-full">
          <label className="mb-1 block text-sm font-bold text-[#101828]">Outcome</label>
          <select 
            value={filterValues.outcome || "All Outcomes"}    
            onChange={(e) => setFilter("outcome", e.target.value)} 
            className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1"
          >
            <option value="All Outcomes">All Outcomes</option>    
            <option value="Pending Start">Pending Start</option>  
            <option value="True Hire">True Hire</option>
            <option value="No Show">No Show</option>
            <option value="Pre-start Withdrawal">Pre-start Withdrawal</option>
          </select>
        </div>

        <div className="w-full">
          <label className="mb-1 block text-sm font-bold text-[#101828]">Owner</label>
          <select 
            value={filterValues.owner || "All Owners"}
            onChange={(e) => setFilter("owner", e.target.value)} 
            className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1"
          >
            <option value="All Owners">All Owners</option>
            <option value="Maria Reyes">Maria Reyes</option>        
            <option value="John Dela Cruz">John Dela Cruz</option>  
            <option value="Kim Domingo">Kim Domingo</option>        
            <option value="Paul Garcia">Paul Garcia</option>        
          </select>
        </div>

        <button 
          onClick={handleClearFilters} 
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
        >
          <Filter size={17} /> Clear
        </button>
      </div>
    </div>
  );
}