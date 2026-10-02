import { useEffect, useLayoutEffect, useRef } from "react";

import { useRecruitmentSettings } from "../../services/context/RecruitmentSettingsContext";

const RECRUITMENT_SETTINGS_OVERVIEW = "Overview";

export function useRecruitmentSettingsPage() {
  const mainRef = useRef(null);

  const {
    activeTab,
    setActiveTab,
  } = useRecruitmentSettings();

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }
    });
  }

  function forceScrollToTop() {
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  function handleOpenSetting(settingKey) {
    if (!settingKey) return;

    setActiveTab(settingKey);
    forceScrollToTop();
  }

  function handleBackToOverview() {
    setActiveTab(RECRUITMENT_SETTINGS_OVERVIEW);
    forceScrollToTop();
  }

  useLayoutEffect(() => {
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "manual";
    }

    forceScrollToTop();
  }, []);

  useEffect(() => {
    setActiveTab(RECRUITMENT_SETTINGS_OVERVIEW);
  }, [setActiveTab]);

  return {
    activeTab,
    handleBackToOverview,
    handleOpenSetting,
    mainRef,
  };
}
