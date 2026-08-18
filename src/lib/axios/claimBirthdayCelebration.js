import api from "./api-template.js";

export function createBirthdayCelebrationClaimer(apiClient = api) {
  return async function claimBirthdayCelebration({ signal } = {}) {
    try {
      const response = await apiClient.post(
        "/api/users/me/birthday-celebration/claim",
        {},
        {
          signal,
          timeout: 3500,
          skipAuthRedirect: true,
          withCredentials: true,
        },
      );
      return {
        success: response.data?.success === true,
        show: response.data?.show === true,
      };
    } catch {
      return { success: false, show: false };
    }
  };
}

export const claimBirthdayCelebration = createBirthdayCelebrationClaimer();
