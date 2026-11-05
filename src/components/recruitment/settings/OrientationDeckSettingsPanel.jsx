import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  FileText,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useUser } from "@/services/context/UserContext";
import OrientationQuizEditor from "@/components/recruitment/nho/OrientationQuizEditor";
import {
  getStoredOrientationDeckConfig,
  saveStoredOrientationDeckConfig,
  validateOrientationDeckConfig,
} from "@/components/recruitment/nho/nhoInitialData";

export default function OrientationDeckSettingsPanel() {
  const navigate = useNavigate();
  const userCtx = useUser();
  const hrisUser = userCtx?.user;
  const userEmail =
    [hrisUser?.first_name || hrisUser?.firstName, hrisUser?.last_name || hrisUser?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    hrisUser?.email ||
    "Alena Batacan (TA Lead)";

  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [orientationConfig, setOrientationConfig] = useState(() =>
    getStoredOrientationDeckConfig()
  );
  const [orientationErrors, setOrientationErrors] = useState([]);
  const [selectedSlideIdx, setSelectedSlideIdx] = useState(0);
  const [isEditingSlide, setIsEditingSlide] = useState(false);
  const [editingSlideData, setEditingSlideData] = useState(null);
  const [isAddingNewSlide, setIsAddingNewSlide] = useState(false);
  const [newSlideData, setNewSlideData] = useState({
    num: (orientationConfig.slides?.length || 0) + 1,
    title: "",
    kicker: "Operational Guidelines",
    body: "",
  });
  const [deckVersionInput, setDeckVersionInput] = useState(
    orientationConfig.version || "v1.0-sample"
  );
  const [passingScoreInput, setPassingScoreInput] = useState(
    orientationConfig.passingScorePct || 80
  );

  const handleDeckFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      const nowStr =
        new Date().toISOString().slice(0, 10) +
        " " +
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      const updated = {
        ...orientationConfig,
        deckFileName: file.name,
        deckFileSize: sizeStr,
        uploadedBy: userEmail,
        uploadedAt: nowStr,
        version: deckVersionInput,
      };
      setOrientationConfig(updated);
      showToast(
        `Orientation presentation deck "${file.name}" selected in draft. Publish to apply.`
      );
    }
  };

  const handleStartEditSlide = (slide, idx) => {
    setSelectedSlideIdx(idx);
    setEditingSlideData({ ...slide });
    setIsEditingSlide(true);
    setIsAddingNewSlide(false);
  };

  const handleSaveSlideEdit = () => {
    if (!editingSlideData) return;
    const updatedSlides = orientationConfig.slides.map((s, idx) =>
      idx === selectedSlideIdx ? { ...editingSlideData } : s
    );
    const updated = {
      ...orientationConfig,
      slides: updatedSlides,
      version: deckVersionInput,
      passingScorePct: passingScoreInput,
    };
    setOrientationConfig(updated);
    setIsEditingSlide(false);
    showToast(
      `Slide ${editingSlideData.num} updated in draft. Publish to apply.`
    );
  };

  const handleAddNewSlide = () => {
    if (!newSlideData.title.trim()) {
      showToast("Please enter a slide title before adding.");
      return;
    }
    const newSlide = {
      ...newSlideData,
      num: orientationConfig.slides.length + 1,
    };
    const updatedSlides = [...orientationConfig.slides, newSlide];
    const updated = {
      ...orientationConfig,
      slides: updatedSlides,
      version: deckVersionInput,
      passingScorePct: passingScoreInput,
    };
    setOrientationConfig(updated);
    setIsAddingNewSlide(false);
    setNewSlideData({
      num: updatedSlides.length + 1,
      title: "",
      kicker: "Operational Guidelines",
      body: "",
    });
    setSelectedSlideIdx(updatedSlides.length - 1);
    showToast(`Slide ${newSlide.num} added to orientation deck!`);
  };

  const handleDeleteSlide = (idx) => {
    if (orientationConfig.slides.length <= 1) {
      showToast("At least one slide is required in the orientation deck.");
      return;
    }
    const filtered = orientationConfig.slides
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, num: i + 1 }));
    const updated = {
      ...orientationConfig,
      slides: filtered,
    };
    setOrientationConfig(updated);
    setSelectedSlideIdx(Math.max(0, idx - 1));
    showToast("Slide removed and presentation order re-indexed.");
  };

  const handleMoveSlide = (fromIdx, direction) => {
    const toIdx = direction === "up" ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= orientationConfig.slides.length) return;
    const slidesCopy = [...orientationConfig.slides];
    const temp = slidesCopy[fromIdx];
    slidesCopy[fromIdx] = slidesCopy[toIdx];
    slidesCopy[toIdx] = temp;
    const renumbered = slidesCopy.map((s, i) => ({ ...s, num: i + 1 }));
    const updated = {
      ...orientationConfig,
      slides: renumbered,
    };
    setOrientationConfig(updated);
    setSelectedSlideIdx(toIdx);
    showToast(`Slide moved ${direction}.`);
  };

  const handleSaveAllConfig = () => {
    const updated = {
      ...orientationConfig,
      version: deckVersionInput,
      passingScorePct: passingScoreInput,
    };
    setOrientationConfig(updated);
    const errors = validateOrientationDeckConfig(updated);
    setOrientationErrors(errors);
    if (errors.length) {
      showToast("Resolve the orientation settings errors before publishing.");
      return;
    }
    if (!saveStoredOrientationDeckConfig(updated)) {
      setOrientationErrors([
        "Could not save orientation settings in this browser. Your draft is still available; please try again.",
      ]);
      return;
    }
    showToast("Orientation deck and quiz published to the applicant portal.");
  };

  const activeSlide =
    orientationConfig.slides?.[selectedSlideIdx] ||
    orientationConfig.slides?.[0];

  return (
    <div className="space-y-4">
      {toastMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-[#E6ECF2] shadow-xs space-y-6">
        <div className="pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] bg-blue-50 text-[#042C51] font-extrabold px-2.5 py-1 rounded-md border border-blue-200 uppercase tracking-wider inline-block">
                ORIENTATION &amp; NHO WORKFLOWS
              </span>
              <span className="text-[10px] bg-orange-50 text-[#FF5C28] font-bold px-2 py-0.5 rounded border border-orange-200">
                Active Version: {orientationConfig.version || "v1.0-sample"}
              </span>
            </div>
            <h2 className="text-xl font-black text-[#042C51]">
              Orientation Presentation Deck &amp; Knowledge Check Settings
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Upload new PPT/PDF slide decks, edit orientation slides in real-time,
              configure quiz benchmark criteria, and preview the candidate experience.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => navigate("/public/applicant-portal")}
              className="px-3.5 py-2 rounded-xl border border-[#BECBDA] bg-white hover:bg-slate-50 text-[#042C51] font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#042C51]" />
              <span>Preview in Applicant Portal</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAllConfig}
              className="px-4 py-2 bg-[#FF5C28] hover:bg-[#e04f20] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Publish Deck Settings</span>
            </button>
          </div>
        </div>

        {orientationErrors.length > 0 && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800"
          >
            <p className="font-bold mb-2">Review before publishing</p>
            <ul className="list-disc pl-5 space-y-1">
              {orientationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: FILE ASSETS & SLIDE LIST (4 COLS) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Core PPT Presentation Asset
                </span>
                <span className="text-[9.5px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Presentation Draft
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200/80 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-200 text-[#FF5C28] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4
                    className="text-xs font-bold text-[#042C51] truncate"
                    title={
                      orientationConfig.deckFileName ||
                      "SiBS_NHO_Core_Orientation_Deck_2026.pptx"
                    }
                  >
                    {orientationConfig.deckFileName ||
                      "SiBS_NHO_Core_Orientation_Deck_2026.pptx"}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    Size: {orientationConfig.deckFileSize || "14.2 MB"} ·{" "}
                    {orientationConfig.uploadedBy
                      ? `Uploaded by ${orientationConfig.uploadedBy}`
                      : "Alena Batacan (TA Lead)"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Last Updated:{" "}
                    {orientationConfig.uploadedAt || "2026-10-01 09:15 AM"}
                  </p>
                </div>
              </div>

              <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border border-dashed border-[#FF5C28]/60 bg-orange-50/50 hover:bg-orange-50 text-[#FF5C28] text-xs font-bold transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Upload / Replace PPT File (.pptx, .pdf)</span>
                <input
                  type="file"
                  accept=".pptx,.ppt,.pdf,.key"
                  onChange={handleDeckFileUpload}
                  className="sr-only"
                />
              </label>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Deck Version
                  </label>
                  <input
                    type="text"
                    value={deckVersionInput}
                    onChange={(e) => setDeckVersionInput(e.target.value)}
                    placeholder="e.g. v1.2-approved"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-[#042C51]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Benchmark Score (%)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={passingScoreInput}
                    onChange={(e) =>
                      setPassingScoreInput(Number(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-[#042C51]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Orientation Slides ({orientationConfig.slides?.length || 0})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewSlide(true);
                    setIsEditingSlide(false);
                    setNewSlideData({
                      num: (orientationConfig.slides?.length || 0) + 1,
                      title: "",
                      kicker: "Operational Standards",
                      body: "",
                    });
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF5C28] hover:text-[#e04f20] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Slide</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                {orientationConfig.slides?.map((slide, idx) => {
                  const isSelected =
                    selectedSlideIdx === idx && !isAddingNewSlide;
                  return (
                    <div
                      key={slide.num}
                      onClick={() => {
                        setSelectedSlideIdx(idx);
                        setIsAddingNewSlide(false);
                        setIsEditingSlide(false);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? "bg-[#042C51] text-white border-[#042C51] shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 text-[#042C51]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {slide.num}
                        </span>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold truncate leading-tight">
                            {slide.title}
                          </h5>
                          <span
                            className={`text-[10px] font-medium block truncate ${
                              isSelected ? "text-slate-300" : "text-slate-400"
                            }`}
                          >
                            {slide.kicker}
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSlide(idx, "up")}
                          className={`p-1 rounded transition-colors ${
                            idx === 0
                              ? "opacity-30 cursor-not-allowed"
                              : isSelected
                                ? "hover:bg-white/20 text-white"
                                : "hover:bg-slate-100 text-slate-500"
                          }`}
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === orientationConfig.slides.length - 1}
                          onClick={() => handleMoveSlide(idx, "down")}
                          className={`p-1 rounded transition-colors ${
                            idx === orientationConfig.slides.length - 1
                              ? "opacity-30 cursor-not-allowed"
                              : isSelected
                                ? "hover:bg-white/20 text-white"
                                : "hover:bg-slate-100 text-slate-500"
                          }`}
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(idx)}
                          className={`p-1 rounded transition-colors ${
                            isSelected
                              ? "hover:bg-rose-500/30 text-rose-300"
                              : "hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          }`}
                          title="Delete Slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SLIDE EDITOR & PREVIEW (8 COLS) */}
          <div className="lg:col-span-8 space-y-5">
            {isAddingNewSlide ? (
              <div className="p-5 rounded-2xl border border-orange-200 bg-orange-50/40 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-orange-100">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#FF5C28] text-white flex items-center justify-center text-xs font-black">
                      {newSlideData.num}
                    </span>
                    <h4 className="text-sm font-black text-[#042C51]">
                      Add New Orientation Slide
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewSlide(false)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-white/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Category / Kicker
                    </label>
                    <input
                      type="text"
                      value={newSlideData.kicker}
                      onChange={(e) =>
                        setNewSlideData((prev) => ({
                          ...prev,
                          kicker: e.target.value,
                        }))
                      }
                      placeholder="e.g. Workplace Standards, Data Protection"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#042C51]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Slide Title
                    </label>
                    <input
                      type="text"
                      value={newSlideData.title}
                      onChange={(e) =>
                        setNewSlideData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="e.g. Clean Desk Policy & Station Security"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#042C51]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Slide Body Content
                    </label>
                    <textarea
                      rows={5}
                      value={newSlideData.body}
                      onChange={(e) =>
                        setNewSlideData((prev) => ({
                          ...prev,
                          body: e.target.value,
                        }))
                      }
                      placeholder="Enter detailed policy text, operating standards, or instructions..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-normal text-slate-800 leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-orange-100">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewSlide(false)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewSlide}
                    className="px-5 py-2 bg-[#FF5C28] hover:bg-[#e04f20] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save New Slide</span>
                  </button>
                </div>
              </div>
            ) : isEditingSlide && editingSlideData ? (
              <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#042C51] text-white flex items-center justify-center text-xs font-black">
                      {editingSlideData.num}
                    </span>
                    <h4 className="text-sm font-black text-[#042C51]">
                      Edit Slide {editingSlideData.num}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingSlide(false)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-white/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Category / Kicker
                    </label>
                    <input
                      type="text"
                      value={editingSlideData.kicker}
                      onChange={(e) =>
                        setEditingSlideData((prev) =>
                          prev ? { ...prev, kicker: e.target.value } : null
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#042C51]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Slide Title
                    </label>
                    <input
                      type="text"
                      value={editingSlideData.title}
                      onChange={(e) =>
                        setEditingSlideData((prev) =>
                          prev ? { ...prev, title: e.target.value } : null
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#042C51]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Slide Body Content
                    </label>
                    <textarea
                      rows={6}
                      value={editingSlideData.body}
                      onChange={(e) =>
                        setEditingSlideData((prev) =>
                          prev ? { ...prev, body: e.target.value } : null
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-normal text-slate-800 leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingSlide(false)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSlideEdit}
                    className="px-5 py-2 bg-[#042C51] hover:bg-[#073866] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Update Slide</span>
                  </button>
                </div>
              </div>
            ) : (
              activeSlide && (
                <div className="rounded-2xl border border-[#E6ECF2] bg-white shadow-xs overflow-hidden space-y-4">
                  <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Slide Preview · {selectedSlideIdx + 1} of{" "}
                        {orientationConfig.slides.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleStartEditSlide(activeSlide, selectedSlideIdx)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#042C51] transition-colors cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#FF5C28]" />
                      <span>Edit This Slide</span>
                    </button>
                  </div>

                  <div className="p-6 sm:p-8 space-y-5 max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider text-[#FF5C28]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C28]" />
                      {activeSlide.kicker}
                    </span>

                    <h3 className="text-xl font-black text-[#042C51] tracking-tight">
                      {activeSlide.title}
                    </h3>

                    <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                      {activeSlide.body}
                    </p>
                  </div>
                </div>
              )
            )}

            <OrientationQuizEditor
              config={{
                ...orientationConfig,
                passingScorePct: passingScoreInput,
              }}
              onChange={setOrientationConfig}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
