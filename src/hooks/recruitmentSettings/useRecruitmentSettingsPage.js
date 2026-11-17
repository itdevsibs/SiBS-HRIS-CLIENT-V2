import { useCallback, useLayoutEffect, useRef } from "react";

import { useRecruitmentSettings } from "../../services/context/RecruitmentSettingsContext";

const RECRUITMENT_SETTINGS_OVERVIEW = "Overview";

export function useRecruitmentSettingsPage() {
  const mainRef = useRef(null);

  const {
    activeTab,
    setActiveTab,
  } = useRecruitmentSettings();

  const scrollToTop = useCallback(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, []);

  const handleOpenSetting = useCallback(
    (settingKey) => {
      if (!settingKey) return;

      setActiveTab(settingKey);
      scrollToTop();
    },
    [setActiveTab, scrollToTop],
  );

  const handleBackToOverview = useCallback(() => {
    setActiveTab(RECRUITMENT_SETTINGS_OVERVIEW);
    scrollToTop();
  }, [setActiveTab, scrollToTop]);

  useLayoutEffect(() => {
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  return {
    activeTab,
    handleBackToOverview,
    handleOpenSetting,
    mainRef,
    scrollToTop,
  };
}
