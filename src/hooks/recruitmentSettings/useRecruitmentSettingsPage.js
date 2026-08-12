import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useRecruitmentSettings } from "../../services/context/RecruitmentSettingsContext";

export function useRecruitmentSettingsPage() {
  const mainRef = useRef(null);

  const {
    activeTab,
    setActiveTab,
    recruitmentTabs,
    handleSaveSettings,
  } = useRecruitmentSettings();

  const [pageStatusModal, setPageStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const settingsTabs = useMemo(() => {
    const tabs = Array.isArray(recruitmentTabs) ? recruitmentTabs : [];

    return [
      "Update Headcounts",
      ...tabs.filter(
        (tab) => tab !== "Update Headcounts" && tab !== "Headcount Requests",
      ),
    ];
  }, [recruitmentTabs]);

  function openPageStatusModal({ type = "success", title = "", message = "" }) {
    setPageStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closePageStatusModal() {
    setPageStatusModal((previous) => ({
      ...previous,
      open: false,
    }));
  }

  async function handleSyncConfigurations() {
    try {
      const result = handleSaveSettings?.();

      if (result && typeof result.then === "function") {
        await result;
      }

      openPageStatusModal({
        type: "success",
        title: "Configurations Synced",
        message: "Recruitment settings were synced successfully.",
      });
    } catch (error) {
      console.error("SYNC RECRUITMENT SETTINGS ERROR:", error);

      openPageStatusModal({
        type: "error",
        title: "Sync Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to sync recruitment settings.",
      });
    }
  }

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
    setActiveTab("Update Headcounts");
  }, [setActiveTab]);

  return {
    activeTab,
    closePageStatusModal,
    handleSyncConfigurations,
    mainRef,
    pageStatusModal,
    setActiveTab,
    settingsTabs,
  };
}
