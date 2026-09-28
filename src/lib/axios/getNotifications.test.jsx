import { describe, expect, it, vi } from "vitest";
import api from "./api-template";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  getUnreadNotificationCount,
} from "./getNotifications";

describe("Notifications API Client (getNotifications)", () => {
  it("getNotifications queries /api/notifications with default limit", async () => {
    const mockPayload = {
      success: true,
      notifications: [{ id: 101, title: "Test Notification" }],
      unreadCount: 1,
      hasMore: false,
      nextCursor: null,
      serverEpochMs: 1790568600000,
      timeZone: "Asia/Manila",
    };

    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({
      data: mockPayload,
    });

    const result = await getNotifications({ limit: 30 });

    expect(getSpy).toHaveBeenCalledWith("/api/notifications", {
      params: { limit: 30 },
      skipAuthRedirect: true,
    });
    expect(result).toEqual(mockPayload);
    expect(result.unreadCount).toBe(1);

    getSpy.mockRestore();
  });

  it("markNotificationRead sends POST to /api/notifications/:id/read", async () => {
    const postSpy = vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { success: true, data: { auditLogId: 101, isRead: true } },
    });

    const result = await markNotificationRead(101);

    expect(postSpy).toHaveBeenCalledWith(
      "/api/notifications/101/read",
      {},
      { skipAuthRedirect: true },
    );
    expect(result.success).toBe(true);

    postSpy.mockRestore();
  });

  it("markAllNotificationsRead sends POST to /api/notifications/read-all", async () => {
    const postSpy = vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { success: true, data: { updated: 5, unreadCount: 0 } },
    });

    const result = await markAllNotificationsRead();

    expect(postSpy).toHaveBeenCalledWith(
      "/api/notifications/read-all",
      {},
      { skipAuthRedirect: true },
    );
    expect(result.success).toBe(true);

    postSpy.mockRestore();
  });

  it("dismissNotification sends POST to /api/notifications/:id/dismiss", async () => {
    const postSpy = vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { success: true, data: { auditLogId: 101, isDismissed: true } },
    });

    const result = await dismissNotification(101);

    expect(postSpy).toHaveBeenCalledWith(
      "/api/notifications/101/dismiss",
      {},
      { skipAuthRedirect: true },
    );
    expect(result.success).toBe(true);

    postSpy.mockRestore();
  });

  it("getUnreadNotificationCount queries /api/notifications/unread-count", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { success: true, unreadCount: 3 },
    });

    const result = await getUnreadNotificationCount();

    expect(getSpy).toHaveBeenCalledWith("/api/notifications/unread-count", {
      skipAuthRedirect: true,
    });
    expect(result.unreadCount).toBe(3);

    getSpy.mockRestore();
  });
});
