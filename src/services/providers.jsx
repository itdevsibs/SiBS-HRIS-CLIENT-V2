import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "./context/UserContext";
import HeaderProvider from "./context/HeaderContext";
import { AdminProvider } from "./context/AdminContext";
import { PaginationProvider } from "./context/PaginationContext";
import { ResignationListProvider } from "./context/ResignationListContext";
import JobDescriptionProvider from "./context/JobDescriptionContext";
import { CandidatePipelineProvider } from "./context/CandidatePipelineContext";
import { RecruitmentSettingsProvider } from "./context/RecruitmentSettingsContext";
import { OffersProvider } from "./context/OffersContext";

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PaginationProvider>
        <HeaderProvider>
          <UserProvider>
            <AdminProvider>
              <JobDescriptionProvider>
                <RecruitmentSettingsProvider>
                  <CandidatePipelineProvider>
                    <OffersProvider>
                      <ResignationListProvider>
                        {children}
                      </ResignationListProvider>
                    </OffersProvider>
                  </CandidatePipelineProvider>
                </RecruitmentSettingsProvider>
              </JobDescriptionProvider>
            </AdminProvider>
          </UserProvider>
        </HeaderProvider>
      </PaginationProvider>
    </QueryClientProvider>
  );
}
