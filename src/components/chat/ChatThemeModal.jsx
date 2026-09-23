import React, { useRef, useState } from "react";
import {
  Check,
  Image as ImageIcon,
  Loader2,
  Palette,
  RefreshCw,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";

import {
  BUILTIN_THEME_PRESETS,
  PRESET_SOLID_COLORS,
  getChatThemeBackgroundStyle,
  isChatThemeCustom,
  isChatThemeDark,
} from "../../lib/utils/chat/chatTheme";
import { useChat } from "../../services/context/ChatContext";
import ImageCropAdjuster from "./ImageCropAdjuster";

export default function ChatThemeModal({
  open = false,
  onClose = () => {},
  conversation = null,
}) {
  const chat = useChat();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("presets"); // "presets" | "colors" | "custom"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customFile, setCustomFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  if (!open || !conversation) return null;

  const currentTheme = conversation.theme || { type: "DEFAULT", key: "default" };

  const handleSelectPreset = async (preset) => {
    try {
      setLoading(true);
      setError("");
      if (preset.key === "default") {
        await chat.resetConversationTheme(conversation.id);
      } else {
        await chat.setConversationTheme(conversation.id, {
          themeType: "PRESET",
          themeKey: preset.key,
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update chat theme.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectColor = async (hexColor) => {
    try {
      setLoading(true);
      setError("");
      await chat.setConversationTheme(conversation.id, {
        themeType: "COLOR",
        themeColor: hexColor,
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update chat theme.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Please select an image smaller than 5 MB.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Only JPG, PNG, and WEBP images are supported.");
      return;
    }

    setError("");
    setCustomFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUploadCustomWallpaper = async (croppedFile) => {
    const fileToUpload = croppedFile || customFile;
    if (!fileToUpload) return;

    try {
      setLoading(true);
      setError("");
      await chat.uploadConversationThemeImage(conversation.id, fileToUpload);
      setCustomFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to upload wallpaper image.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    try {
      setLoading(true);
      setError("");
      await chat.resetConversationTheme(conversation.id);
      setCustomFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to reset theme.");
    } finally {
      setLoading(false);
    }
  };

  // Preview styling for the live preview bubble card
  const activePreviewStyle = previewUrl
    ? {
        backgroundImage: `url("${previewUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : getChatThemeBackgroundStyle(currentTheme);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-lg max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-sibs-border overflow-hidden font-jakarta">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sibs-border px-5 py-4 bg-slate-50/75">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sibs-navy text-white shadow-xs">
              <Palette size={18} />
            </div>
            <div>
              <h3 className="font-heading text-sm sm:text-base font-bold text-sibs-navy">
                Chat Theme & Wallpaper
              </h3>
              <p className="text-[11px] text-sibs-muted line-clamp-1">
                Personalize background for {conversation.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sibs-muted hover:bg-slate-200/60 hover:text-sibs-navy transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Preview Card (hidden during active crop adjustment to keep controls fully visible) */}
        {!(activeTab === "custom" && customFile) ? (
          <div className="p-4 sm:p-5 border-b border-sibs-border bg-slate-100/50">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sibs-muted mb-2 flex items-center gap-1.5">
              <Sparkles size={12} className="text-sibs-orange" />
              Live Preview
            </div>
            <div
              data-chat-custom-theme={isChatThemeCustom(currentTheme) || Boolean(previewUrl) ? "true" : "false"}
              data-chat-theme-dark={isChatThemeDark(currentTheme) ? "true" : "false"}
              className="relative h-28 w-full rounded-xl overflow-hidden border border-sibs-border p-3 flex flex-col justify-end shadow-inner transition-all duration-300"
              style={activePreviewStyle}
            >
              {/* Contrast readability overlay if wallpaper/pattern is set */}
              <div className="pointer-events-none absolute inset-0 bg-slate-900/10" />

              {/* Mock message bubble */}
              <div className="relative z-10 flex flex-col gap-1.5 max-w-[88%]">
                <div className="self-center">
                  <span className="chat-theme-date-pill">Today 10:45 AM</span>
                </div>
                <div className="self-start">
                  <p className="chat-theme-sender-name">Sarah Jenkins</p>
                  <div className="rounded-2xl rounded-tl-sm bg-white/95 backdrop-blur-xs px-3 py-1.5 text-[11px] font-semibold text-slate-800 shadow-xs border border-white/60">
                    Hey! How does this new theme look?
                  </div>
                </div>
                <div className="self-end rounded-2xl rounded-tr-sm bg-sibs-navy text-white px-3 py-1.5 text-[11px] font-semibold shadow-xs">
                  Looks awesome! Crisp and clear ✨
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Navigation Tabs */}
        <div className="flex border-b border-sibs-border px-4 sm:px-5 pt-3 gap-2 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === "presets"
                ? "border-sibs-navy text-sibs-navy"
                : "border-transparent text-sibs-muted hover:text-sibs-navy"
            }`}
          >
            Curated Themes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("colors")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === "colors"
                ? "border-sibs-navy text-sibs-navy"
                : "border-transparent text-sibs-muted hover:text-sibs-navy"
            }`}
          >
            Solid Colors
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === "custom"
                ? "border-sibs-navy text-sibs-navy"
                : "border-transparent text-sibs-muted hover:text-sibs-navy"
            }`}
          >
            Custom Wallpaper
          </button>
        </div>

        {/* Error message */}
        {error ? (
          <div className="mx-4 sm:mx-5 mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[11px] font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {/* Body content based on tab */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 max-h-[360px] sibs-scrollbar">
          {/* TAB 1: PRESETS */}
          {activeTab === "presets" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BUILTIN_THEME_PRESETS.map((preset) => {
                const isSelected =
                  currentTheme.type === preset.type &&
                  (currentTheme.key === preset.key ||
                    (preset.key === "default" && currentTheme.type === "DEFAULT"));

                const swatchStyle =
                  preset.pattern === "doodle"
                    ? {
                        backgroundColor: preset.backgroundColor,
                        backgroundImage: `radial-gradient(#7e7769 1px, transparent 1px)`,
                        backgroundSize: "8px 8px",
                      }
                    : preset.gradient
                    ? { background: preset.gradient }
                    : { backgroundColor: preset.background || "#F4F7FA" };

                return (
                  <button
                    key={preset.key}
                    type="button"
                    disabled={loading}
                    onClick={() => void handleSelectPreset(preset)}
                    className={`group relative flex flex-col items-center p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? "border-sibs-navy ring-2 ring-sibs-navy/20 bg-slate-50"
                        : "border-sibs-border hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div
                      className="relative h-14 w-full rounded-lg shadow-inner overflow-hidden border border-black/5"
                      style={swatchStyle}
                    >
                      {isSelected ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sibs-navy shadow-xs">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <span className="mt-2 text-xs font-bold text-sibs-navy truncate w-full text-center">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-sibs-muted truncate w-full text-center">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: SOLID COLORS */}
          {activeTab === "colors" && (
            <div className="space-y-4">
              <p className="text-xs text-sibs-muted">
                Choose a minimal, solid background tint for high contrast and readability:
              </p>
              <div className="grid grid-cols-4 gap-3">
                {PRESET_SOLID_COLORS.map((color) => {
                  const isSelected =
                    currentTheme.type === "COLOR" &&
                    currentTheme.color?.toLowerCase() === color.value.toLowerCase();

                  return (
                    <button
                      key={color.value}
                      type="button"
                      disabled={loading}
                      onClick={() => void handleSelectColor(color.value)}
                      className={`group flex flex-col items-center p-2 rounded-xl border transition ${
                        isSelected
                          ? "border-sibs-navy ring-2 ring-sibs-navy/20 bg-slate-50"
                          : "border-sibs-border hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      <div
                        className="relative h-12 w-full rounded-lg shadow-inner flex items-center justify-center border border-black/5"
                        style={{ backgroundColor: color.value }}
                      >
                        {isSelected ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sibs-navy shadow-xs">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        ) : null}
                      </div>
                      <span className="mt-1.5 text-[11px] font-bold text-slate-700 truncate w-full text-center">
                        {color.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM PHOTO WALLPAPER */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              <p className="text-xs text-sibs-muted">
                Upload your own photo or custom background image (JPG, PNG, WEBP up to 5 MB):
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {customFile ? (
                <ImageCropAdjuster
                  file={customFile}
                  loading={loading}
                  onCancel={() => {
                    setCustomFile(null);
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl("");
                  }}
                  onApply={(croppedFile) => void handleUploadCustomWallpaper(croppedFile)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-sibs-navy/50 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sibs-navy mb-2">
                    <ImageIcon size={22} />
                  </div>
                  <p className="text-xs font-bold text-sibs-navy">
                    Click to select an image from your device
                  </p>
                  <p className="text-[10px] text-sibs-muted mt-1">
                    Supports JPG, PNG, or WEBP up to 5 MB
                  </p>
                </button>
              )}

              {currentTheme.type === "IMAGE" && !customFile ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check size={15} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800">
                      Custom wallpaper currently applied
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-bold text-sibs-navy hover:underline"
                  >
                    Change photo
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-sibs-border px-5 py-3.5 bg-slate-50/75">
          <button
            type="button"
            disabled={loading || currentTheme.type === "DEFAULT"}
            onClick={() => void handleResetToDefault()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3 py-1.5 text-xs font-bold text-sibs-muted hover:text-sibs-navy hover:border-slate-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw size={12} />
            Reset to Default
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-sibs-navy px-4 py-1.5 text-xs font-bold text-white hover:bg-sibs-navy/90 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
