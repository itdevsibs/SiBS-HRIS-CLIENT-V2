const RECRUITMENT_SETTINGS_STORAGE_KEY = "sibs_recruitment_settings_temp";

export const DEFAULT_OFFER_APPROVERS = ["Raul Nadela", "Haasanor"];

export function safeReadRecruitmentSettings() {
  try {
    const raw = localStorage.getItem(RECRUITMENT_SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function safeWriteRecruitmentSettings(settings) {
  try {
    localStorage.setItem(
      RECRUITMENT_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );
  } catch {
    // localStorage only
  }
}

export function getOfferApprovalUsers() {
  const settings = safeReadRecruitmentSettings();

  const configuredUsers =
    settings?.approvalRules?.offerApprovalUsers ||
    settings?.offerApprovalUsers ||
    [];

  if (Array.isArray(configuredUsers) && configuredUsers.length > 0) {
    return configuredUsers
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.name || item?.fullName || item?.username || "";
      })
      .filter(Boolean);
  }

  return DEFAULT_OFFER_APPROVERS;
}

export function saveOfferApprovalUsers(users = []) {
  const settings = safeReadRecruitmentSettings();

  const cleanedUsers = users
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  const nextSettings = {
    ...settings,
    approvalRules: {
      ...(settings.approvalRules || {}),
      offerApprovalUsers: cleanedUsers,
    },
  };

  safeWriteRecruitmentSettings(nextSettings);

  return nextSettings;
}

export function canUserApproveOffer(currentUserName) {
  const approvalUsers = getOfferApprovalUsers();

  return approvalUsers.some(
    (name) =>
      String(name).trim().toLowerCase() ===
      String(currentUserName || "")
        .trim()
        .toLowerCase(),
  );
}
