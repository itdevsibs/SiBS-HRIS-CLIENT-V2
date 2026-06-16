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
import { TalentPoolProvider } from "./context/TalentPoolContext";
import { HiringNeedsProvider } from "./context/HiringNeedsContext";

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
                  <TalentPoolProvider>
                    <CandidatePipelineProvider>
                      <OffersProvider>
                        <ResignationListProvider>
                          <HiringNeedsProvider>
                            {children}
                            </HiringNeedsProvider>
                        </ResignationListProvider>
                      </OffersProvider>
                    </CandidatePipelineProvider>
                  </TalentPoolProvider>
                </RecruitmentSettingsProvider>
              </JobDescriptionProvider>
            </AdminProvider>
          </UserProvider>
        </HeaderProvider>
      </PaginationProvider>
    </QueryClientProvider>
  );
}
