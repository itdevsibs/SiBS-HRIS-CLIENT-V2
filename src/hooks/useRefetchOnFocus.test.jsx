import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useRefetchOnFocus from "./useRefetchOnFocus";

describe("useRefetchOnFocus", () => {
  it("coalesces focus and visibility refreshes until the pending refresh settles", async () => {
    let finish;
    const callback = vi.fn(() => new Promise((resolve) => { finish = resolve; }));
    const { unmount } = renderHook(() => useRefetchOnFocus(callback));
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(callback).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(callback).toHaveBeenCalledTimes(2);
    unmount();
    await act(async () => finish());
    window.dispatchEvent(new Event("focus"));
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("allows a later refresh after a rejected request and uses the current callback", async () => {
    const callback = vi.fn().mockRejectedValue(new Error("offline"));
    const nextCallback = vi.fn();
    const { rerender } = renderHook(({ refresh }) => useRefetchOnFocus(refresh), {
      initialProps: { refresh: callback },
    });
    await act(async () => window.dispatchEvent(new Event("focus")));
    rerender({ refresh: nextCallback });
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(nextCallback).toHaveBeenCalledTimes(1);
  });

  it("ignores visibility events while hidden", () => {
    const callback = vi.fn();
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    renderHook(() => useRefetchOnFocus(callback));
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(callback).not.toHaveBeenCalled();
    visibility.mockRestore();
  });
});
