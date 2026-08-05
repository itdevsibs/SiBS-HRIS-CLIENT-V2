import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { UserProvider } from "./context/UserContext";
import { SidebarNotificationProvider } from "./context/SidebarNotificationContext";
import HeaderProvider from "./context/HeaderContext";
import { AdminProvider } from "./context/AdminContext";
import { PaginationProvider } from "./context/PaginationContext";

import JobDescriptionProvider from "./context/JobDescriptionContext";
import { RecruitmentSettingsProvider } from "./context/RecruitmentSettingsContext";
import { TalentPoolProvider } from "./context/TalentPoolContext";
import { CandidatePipelineProvider } from "./context/CandidatePipelineContext";
import { OffersProvider } from "./context/OffersContext";
import { HiringNeedsProvider } from "./context/HiringNeedsContext";
import { OnboardingProvider } from "./context/OnboardingContext";
import { SourcingProvider } from "./context/SourcingContext";
import { WorkforceHiringProvider } from "./context/WorkforceHiringContext";
import ActionItemsDataBridge from "./context/ActionItemsDataBridgeContext";

import { ResignationListProvider } from "./context/ResignationListContext";

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PaginationProvider>
        <HeaderProvider>
          <UserProvider>
            <SidebarNotificationProvider>
              <AdminProvider>
                <RecruitmentSettingsProvider>
                  <JobDescriptionProvider>
                    <TalentPoolProvider>
                      <CandidatePipelineProvider>
                        <OffersProvider>
                          <HiringNeedsProvider>
                            <OnboardingProvider>
                              <SourcingProvider>
                                <WorkforceHiringProvider>
                                  <ActionItemsDataBridge>
                                    <ResignationListProvider>
                                      {children}
                                    </ResignationListProvider>
                                  </ActionItemsDataBridge>
                                </WorkforceHiringProvider>
                              </SourcingProvider>
                            </OnboardingProvider>
                          </HiringNeedsProvider>
                        </OffersProvider>
                      </CandidatePipelineProvider>
                    </TalentPoolProvider>
                  </JobDescriptionProvider>
                </RecruitmentSettingsProvider>
              </AdminProvider>
            </SidebarNotificationProvider>
          </UserProvider>
        </HeaderProvider>
      </PaginationProvider>
    </QueryClientProvider>
  );
}