import React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import UserDropdown from "./UserDropdown.jsx";

const session = vi.hoisted(() => ({ user: { sibs_id: "6784", role: "employee" } }));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("../../../lib/axios/api-template", () => ({ default: { post: vi.fn() }, handleLogout: vi.fn() }));
vi.mock("../../../services/context/UserContext", () => ({ useUser: () => ({ user: session.user, setUser: vi.fn(), refetchUser: vi.fn() }) }));
vi.mock("../../../services/context/HeaderContext", () => ({ useHeader: () => ({ setAdminLogin: vi.fn() }) }));
vi.mock("../../../services/context/AdminContext", () => ({ useAdmin: () => ({ getAccessLabel: () => "Admin", ADMIN_ROLES: [] }) }));

function setup() {
  const result = render(<UserDropdown avatar="TS" formattedName="Test User" email="test@example.com" />);
  return { ...result, avatar: result.container.querySelector('[data-collectible-avatar]') || result.getByText('TS') };
}

describe("Developer Easter eggs", () => {
  beforeEach(() => {
    session.user = { sibs_id: "6784", role: "employee" };
    vi.spyOn(Date, "now").mockReturnValue(1000);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("keeps single-click menu behavior and opens the animation on the third avatar click", () => {
    const { avatar } = setup();
    fireEvent.click(avatar);
    expect(screen.getByRole("menu")).not.toBeNull();
    expect(screen.queryByLabelText("MR. SIBS Easter egg")).toBeNull();
    fireEvent.click(avatar);
    fireEvent.click(avatar);
    expect(screen.queryByRole("menu")).toBeNull();
    const effect = screen.getByLabelText("MR. SIBS Easter egg");
    expect(effect.querySelectorAll(".developer-easter-egg-particle")).toHaveLength(24);
    expect(effect.querySelector(".developer-easter-egg-particles").getAttribute("aria-hidden")).toBe("true");
    expect(effect.querySelector("iframe")).toBeNull();
    expect(effect.getAttribute("data-easter-egg-theme")).toBe("mrsibs");
    const video = effect.querySelector("video");
    expect(video.getAttribute("src")).toBe("/assets/easter-eggs/mr-sibs-crowning-alpha.webm");
    expect(video.muted).toBe(true);
    expect(video.autoplay).toBe(true);
    expect(video.hasAttribute("playsinline")).toBe(true);
    expect(effect.parentElement).toBe(document.body);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).not.toBe("hidden");
    expect(effect.querySelector("button")).toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByLabelText("MR. SIBS Easter egg")).toBeNull();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("does not combine slow clicks or clicks on the name into the secret gesture", () => {
    const { avatar } = setup();
    fireEvent.click(avatar);
    Date.now.mockReturnValue(2500);
    fireEvent.click(avatar);
    fireEvent.click(avatar);
    fireEvent.click(screen.getByRole("button", { name: /User menu/ }));
    expect(screen.queryByLabelText("MR. SIBS Easter egg")).toBeNull();
  });

  it("does not enable an Easter egg for an unassigned employee or matching database ID", () => {
    session.user = { sibs_id: "9999", id: "6496", role: "employee" };
    const { avatar } = setup();
    for (let i = 0; i < 3; i++) fireEvent.click(avatar);
    expect(screen.queryByLabelText("MR. SIBS Easter egg")).toBeNull();
  });

  it.each([
    ["6496", "THE ENGINEER", "6496_crister_the_engineer_alpha.webm", "engineer"],
    ["6495", "BACKEND GOD", "6495_allen_backend_god_alpha.webm", "backend_god"],
    ["6099", "THE QUEEN MANAGER", "6099_miss_the_queen_manager_alpha.webm", "queen_manager"],
    ["6892", "THE GAMBLER", "6892_dwight_the_gambler_alpha.webm", "gambler"],
    ["6890", "THE SLEEPER", "6890_paul_the_sleeper_alpha.webm", "sleeper"],
    ["6891", "CARZIQO DONATER", "6891_mars_carziqo_donater_alpha.webm", "carziqo_donater"],
  ])("plays only the selected employee's video for %s", (id, title, filename, theme) => {
    session.user = { sibs_id: id, role: "employee" };
    const { avatar } = setup();
    expect(document.querySelectorAll("video")).toHaveLength(0);
    for (let i = 0; i < 3; i++) fireEvent.click(avatar);
    const overlay = screen.getByRole("status");
    const videos = document.querySelectorAll("video");
    expect(videos).toHaveLength(1);
    expect(videos[0].getAttribute("src")).toBe("/assets/easter-eggs/" + filename);
    expect(overlay.textContent).toContain(title);
    expect(overlay.getAttribute("data-easter-egg-theme")).toBe(theme);
    expect(overlay.querySelector("button")).toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.querySelectorAll("video")).toHaveLength(0);
  });

  it("has no close button and returns focus after dismissing the overlay", () => {
    const { avatar } = setup();
    const trigger = screen.getByRole("button", { name: /User menu/ });
    trigger.focus();
    for (let i = 0; i < 3; i++) fireEvent.click(avatar);
    const overlay = screen.getByLabelText("MR. SIBS Easter egg");
    expect(overlay.querySelector("button")).toBeNull();
    expect(document.activeElement).toBe(overlay);
    fireEvent.click(overlay);
    expect(screen.queryByLabelText("MR. SIBS Easter egg")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("pauses video when hidden and resumes when visible", () => {
    const visibility = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    const { avatar } = setup();
    for (let i = 0; i < 3; i++) fireEvent.click(avatar);
    const video = screen.getByLabelText("MR. SIBS Easter egg").querySelector("video");
    fireEvent.loadedData(video);
    expect(video.play).toHaveBeenCalled();
    video.play.mockClear();
    visibility.mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(video.pause).toHaveBeenCalled();
    expect(video.closest("section").hasAttribute("data-paused")).toBe(true);
    visibility.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    expect(video.play).toHaveBeenCalledOnce();
    expect(video.closest("section").hasAttribute("data-paused")).toBe(false);
  });

  it("shows the final frame without autoplay for reduced motion", () => {
    window.matchMedia.mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const { avatar } = setup();
    for (let i = 0; i < 3; i++) fireEvent.click(avatar);
    const video = screen.getByLabelText("MR. SIBS Easter egg").querySelector("video");
    Object.defineProperty(video, "duration", { value: 7.93 });
    expect(document.querySelector(".developer-easter-egg-particles")).toBeNull();
    fireEvent.loadedMetadata(video);
    expect(video.autoplay).toBe(false);
    expect(video.currentTime).toBeCloseTo(7.88);
    expect(video.play).not.toHaveBeenCalled();
  });

  it("reveals the reference title, holds the finale, then fades before dismissing", () => {
    vi.useFakeTimers();
    const { avatar } = setup();
    for (let i = 0; i < 3; i++) fireEvent.click(avatar);
    const effect = screen.getByLabelText("MR. SIBS Easter egg");
    const video = effect.querySelector("video");
    const heading = effect.querySelector(".developer-easter-egg-heading");
    expect(heading.classList.contains("is-visible")).toBe(false);
    video.currentTime = 6.85;
    fireEvent.timeUpdate(video);
    expect(heading.classList.contains("is-visible")).toBe(true);
    expect(heading.textContent).toContain("THE CELESTIAL CROWNING");
    fireEvent.ended(video);
    expect(video.loop).toBe(false);
    expect(effect.hasAttribute("data-finale")).toBe(true);
    act(() => vi.advanceTimersByTime(2999));
    expect(screen.getByLabelText("MR. SIBS Easter egg")).toBe(effect);
    act(() => vi.advanceTimersByTime(1));
    expect(effect.hasAttribute("data-exiting")).toBe(true);
    act(() => vi.advanceTimersByTime(349));
    expect(screen.getByLabelText("MR. SIBS Easter egg")).toBe(effect);
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByLabelText("MR. SIBS Easter egg")).toBeNull();
  });

  it("dismisses a video that cannot load", () => {
    const { avatar } = setup();
    for (let i = 0; i < 3; i++) fireEvent.click(avatar);
    fireEvent.error(screen.getByLabelText("MR. SIBS Easter egg").querySelector("video"));
    expect(screen.queryByLabelText("MR. SIBS Easter egg")).toBeNull();
  });

  it("uses the selected developer's theme and duration-relative gallery timing", () => {
    vi.useFakeTimers();
    session.user = { sibs_id: "6495", role: "employee" };
    const { avatar } = setup();
    for (let i = 0; i < 3; i++) fireEvent.click(avatar);
    const effect = screen.getByRole("status");
    const video = effect.querySelector("video");
    const heading = effect.querySelector(".developer-easter-egg-heading");
    expect(effect.style.getPropertyValue("--easter-egg-title")).toBe("#4bdf91");
    expect(heading.textContent).toContain("DIGITAL ASCENSION");
    Object.defineProperty(video, "duration", { value: 8.04 });
    video.currentTime = 6.5;
    fireEvent.timeUpdate(video);
    expect(heading.classList.contains("is-visible")).toBe(false);
    video.currentTime = 6.54;
    fireEvent.timeUpdate(video);
    expect(heading.classList.contains("is-visible")).toBe(true);
    fireEvent.ended(video);
    act(() => vi.advanceTimersByTime(2999));
    expect(screen.getByRole("status")).toBe(effect);
    act(() => vi.advanceTimersByTime(1));
    act(() => vi.advanceTimersByTime(350));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("preserves the remaining finale hold while the tab is hidden", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const visibility = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    const { avatar } = setup();
    for (let i = 0; i < 3; i++) fireEvent.click(avatar);
    const effect = screen.getByRole("status");
    fireEvent.ended(effect.querySelector("video"));
    act(() => vi.advanceTimersByTime(1000));
    visibility.mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(5000));
    expect(effect.hasAttribute("data-exiting")).toBe(false);
    visibility.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(1999));
    expect(effect.hasAttribute("data-exiting")).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(effect.hasAttribute("data-exiting")).toBe(true);
    act(() => vi.advanceTimersByTime(350));
    expect(screen.queryByRole("status")).toBeNull();
  });
});
