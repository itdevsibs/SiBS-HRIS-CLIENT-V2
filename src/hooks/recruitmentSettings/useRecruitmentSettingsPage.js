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
      typeof window === "undefined" ||
      !("scrollRestoration" in window.history)
    ) {
      return undefined;
    }

    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousRestoration || "auto";
    };
  }, []);

  return {
    activeTab,
    handleBackToOverview,
    handleOpenSetting,
    mainRef,
    scrollToTop,
  };
}
