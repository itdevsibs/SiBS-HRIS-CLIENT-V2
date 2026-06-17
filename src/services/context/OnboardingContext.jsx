import React, { createContext, useContext, useState, useCallback, useMemo } from "react";  
import { getOnboardingRecords, updateOnboardingOutcome } from "../../lib/axios/onboarding";
import { usePagination } from "./PaginationContext";

const OnboardingContext = createContext(null);

export const OnboardingProvider = ({ children }) => {
   const [list, setList] = useState([]);
   const [loading, setLoading] = useState(false);
   const { setFilter } = usePagination("onboarding"); // Connecting to the "Pagination Brain"

   // 1. Fetching Logic
   const fetchList = useCallback(async () => {
     setLoading(true);
     const res = await getOnboardingRecords();
     if (res.success) setList(res.data);
     setLoading(false);
   }, []);

   // 2. Stats Aggregation (The "Math" section)
   const stats = useMemo(() => {
  const total = list.length;
  const trueHires = list.filter(i => i.finalOutcome === "True Hire").length;
  const pending = list.filter(i => i.finalOutcome === "Pending Start").length;
  const noShow = list.filter(i => i.finalOutcome === "No Show").length;
  const withdrawals = list.filter(i => i.finalOutcome === "Pre-start Withdrawal").length;

  const activeTotal = total - pending;
  const showRate = activeTotal > 0 ? Math.round((trueHires / activeTotal) * 100) : 0;

  return {
    total, trueHires, pending, noShow, withdrawals, showRate
  };
}, [list]);

   // 3. Update Action
   const updateOutcome = useCallback(async (id, data) => {
     const res = await updateOnboardingOutcome(id, data);
     if (res.success) fetchList(); // Refresh the list after update
     return res;
   }, [fetchList]);

   const value = {
     list,
     loading,
     stats,
     fetchList,
     updateOutcome
   };

   return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => useContext(OnboardingContext);