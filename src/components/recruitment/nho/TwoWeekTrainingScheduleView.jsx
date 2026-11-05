import React, { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  FileText,
  FileCode,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Eye,
  X,
  LayoutGrid,
  List,
  Info,
} from "lucide-react";
import { generate2WeekTrainingSchedule } from "./scheduleUtils";

function TwoWeekTrainingScheduleView({
  schedule: initialSchedule,
  startDate = "2026-10-12",
  assignedTrainerId,
  assignedTrainerName,
  existingMaterials = [],
  shiftHours = "08:00 AM – 05:00 PM (Default)",
  trainingLocation = "Fintech Training Room 4A",
  traineeName,
}) {
  const scheduleData = React.useMemo(() => {
    if (initialSchedule && initialSchedule.length === 10) {
      return initialSchedule;
    }
    return generate2WeekTrainingSchedule(
      startDate,
      assignedTrainerId,
      assignedTrainerName,
      existingMaterials,
      shiftHours,
      trainingLocation
    );
  }, [initialSchedule, startDate, assignedTrainerId, assignedTrainerName, existingMaterials, shiftHours, trainingLocation]);

  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("cards");
  const [selectedDayNumber, setSelectedDayNumber] = useState(null);
  const [previewingMaterial, setPreviewingMaterial] = useState(null);

  const selectedDay = React.useMemo(() => {
    if (selectedDayNumber === null) return null;
    return scheduleData.find((d) => d.dayNumber === selectedDayNumber) || null;
  }, [scheduleData, selectedDayNumber]);

  const fstDays = React.useMemo(() => scheduleData.filter((d) => d.phase === "FST"), [scheduleData]);
  const pstDays = React.useMemo(() => scheduleData.filter((d) => d.phase === "PST"), [scheduleData]);

  const displayedDays = React.useMemo(() => {
    if (activeTab === "fst") return fstDays;
    if (activeTab === "pst") return pstDays;
    return scheduleData;
  }, [scheduleData, activeTab, fstDays, pstDays]);

  const totalMaterials = scheduleData.reduce((acc, d) => acc + d.materials.length, 0);

  const getMaterialIcon = (type) => {
    switch (type) {
      case "PDF Document":
        return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
      case "PowerPoint Presentation":
        return <FileCode className="w-4 h-4 text-amber-500 shrink-0" />;
      case "Word Document":
        return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
      case "Approved Training Resource Link":
        return <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-sibs-muted shrink-0" />;
    }
  };

  const handleNextDay = () => {
    if (selectedDayNumber === null) return;
    const next = selectedDayNumber >= 10 ? 1 : selectedDayNumber + 1;
    setSelectedDayNumber(next);
  };

  const handlePrevDay = () => {
    if (selectedDayNumber === null) return;
    const prev = selectedDayNumber <= 1 ? 10 : selectedDayNumber - 1;
    setSelectedDayNumber(prev);
  };

  const formatFullDate = (dateStr, dayOfWeek) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const mIdx = parseInt(parts[1], 10) - 1;
      const monthName = months[mIdx] || parts[1];
      return `${dayOfWeek}, ${monthName} ${parts[2]}, ${parts[0]}`;
    }
    return `${dayOfWeek}, ${dateStr}`;
  };

  return (
    <div className="space-y-3 font-jakarta">
      {/* Sleek Integrated Header & Responsive Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 p-3 bg-gradient-to-r from-sibs-navy/10 via-sibs-navy/5 to-orange-50/50 rounded-xl border border-sibs-border">
        <div className="space-y-0.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-sibs-navy text-white">
              2-Week Curriculum Schedule
            </span>
            <span className="sibs-text-xs font-bold text-sibs-navy">
              PST &amp; FST Training Matrix (10 Working Days)
            </span>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {totalMaterials} Assigned Materials
            </span>
          </div>
          <p className="sibs-text-micro text-sibs-muted">
            Click any day to inspect the <strong>assigned materials</strong> and <strong>designated trainer</strong>.
          </p>
        </div>

        {/* Action Controls: Tabs & View Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto shrink-0">
          {/* Phase Filter Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-white rounded-lg border border-sibs-border shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeTab === "all"
                  ? "bg-sibs-navy text-white shadow-xs"
                  : "text-sibs-muted hover:text-sibs-navy hover:bg-sibs-surface"
              }`}
            >
              All 10 Days
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("fst")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                activeTab === "fst"
                  ? "bg-blue-700 text-white shadow-xs"
                  : "text-blue-700 hover:bg-blue-50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Week 1: FST (5d)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pst")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                activeTab === "pst"
                  ? "bg-sibs-orange text-white shadow-xs"
                  : "text-orange-700 hover:bg-orange-50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-300" />
              Week 2: PST (5d)
            </button>
          </div>

          {/* View Mode Switcher (Cards vs Table) */}
          <div className="flex items-center gap-0.5 p-0.5 bg-white rounded-lg border border-sibs-border shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "cards"
                  ? "bg-sibs-navy text-white shadow-xs"
                  : "text-sibs-muted hover:bg-sibs-surface hover:text-sibs-navy"
              }`}
              title="Cards View"
              aria-label="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-sibs-navy text-white shadow-xs"
                  : "text-sibs-muted hover:bg-sibs-surface hover:text-sibs-navy"
              }`}
              title="Compact Table View"
              aria-label="Compact Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Compact Secondary Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-white rounded-lg border border-sibs-border text-[11px]">
        <div className="flex flex-wrap items-center gap-4 text-sibs-muted">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sibs-orange" />
            <span>
              Shift: <strong className="text-sibs-navy font-semibold">{shiftHours}</strong>
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sibs-muted" />
            <span>
              Room: <strong className="text-sibs-navy font-semibold">{trainingLocation}</strong>
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-sibs-navy" />
            <span>
              Trainer:{" "}
              <strong className="text-sibs-navy font-semibold">
                {assignedTrainerName || "Maria Elena Garcia (Senior Trainer)"}
              </strong>
            </span>
          </span>
        </div>

        <div className="text-[10px] text-sibs-muted">
          Showing <strong>{displayedDays.length}</strong> of 10 days
        </div>
      </div>

      {/* Fixed-Height Scrollable Schedule Container */}
      <div className="relative rounded-xl border border-sibs-border bg-sibs-surface p-3 shadow-2xs">
        <div className="max-h-[380px] sm:max-h-[420px] overflow-y-auto space-y-4 pr-1.5 focus:outline-none sibs-scrollbar">
          {viewMode === "cards" ? (
            <div className="space-y-4">
              {/* If viewing All or FST: render Week 1 FST section */}
              {(activeTab === "all" || activeTab === "fst") && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <h4 className="sibs-text-xs font-extrabold text-sibs-navy uppercase tracking-wider">
                        Week 1: Foundation Skills Training (FST)
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Days 1–5
                      </span>
                    </div>
                    <span className="sibs-text-micro text-sibs-muted font-medium">
                      Culture, Communication, Compliance &amp; Systems
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {fstDays.map((day) => renderDayCard(day))}
                  </div>
                </div>
              )}

              {/* If viewing All or PST: render Week 2 PST section */}
              {(activeTab === "all" || activeTab === "pst") && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sibs-orange" />
                      <h4 className="sibs-text-xs font-extrabold text-sibs-navy uppercase tracking-wider">
                        Week 2: Product Specific Training (PST)
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-orange-100 text-sibs-orange border border-orange-200">
                        Days 6–10
                      </span>
                    </div>
                    <span className="sibs-text-micro text-sibs-muted font-medium">
                      Fintech Product Matrix, Disputes, Sandbox &amp; Certification
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {pstDays.map((day) => renderDayCard(day))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto rounded-lg border border-sibs-border bg-white shadow-2xs">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-sibs-navy text-white text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-2.5 px-3">Day &amp; Phase</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Curriculum Module Title</th>
                    <th className="py-2.5 px-3">Designated Trainer</th>
                    <th className="py-2.5 px-3 text-center">Materials</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sibs-border/60">
                  {displayedDays.map((day) => {
                    const isFST = day.phase === "FST";
                    const isSelected = selectedDayNumber === day.dayNumber;
                    return (
                      <tr
                        key={day.dayNumber}
                        onClick={() => setSelectedDayNumber(day.dayNumber)}
                        className={`transition-colors cursor-pointer hover:bg-orange-50/40 ${
                          isSelected ? "bg-orange-50/80 font-medium" : "bg-white"
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sibs-navy">Day {day.dayNumber}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                                isFST
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-orange-100 text-sibs-orange border border-orange-200"
                              }`}
                            >
                              {day.phase}
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap text-sibs-muted font-medium">
                          {formatFullDate(day.date, day.dayOfWeek)}
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-bold text-sibs-navy leading-tight">
                            {day.title}
                          </div>
                          <div className="text-[10px] text-sibs-muted mt-0.5 line-clamp-1">
                            {day.topics.slice(0, 2).join(" • ")}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap text-sibs-navy">
                          <div className="flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-sibs-orange shrink-0" />
                            <span className="font-semibold text-sibs-navy">
                              {day.trainerName.split("(")[0].trim()}
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sibs-surface text-sibs-navy font-bold text-[10px] border border-sibs-border">
                            <FileText className="w-3 h-3 text-sibs-navy" />
                            <span>{day.materials.length} Items</span>
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDayNumber(day.dayNumber);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sibs-orange hover:bg-sibs-button-hover text-white font-bold text-[10px] transition-colors cursor-pointer shadow-2xs"
                          >
                            Inspect Day →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sibs-text-micro text-sibs-muted px-1">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-sibs-muted shrink-0" />
          <span>Click any day card or row to open full daily materials, slide decks, and trainer profiles.</span>
        </span>
        <span className="font-semibold text-sibs-navy">
          Scrollable matrix container · Fixed height
        </span>
      </div>

      {/* Interactive Day Inspection Modal */}
      {selectedDay && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-sibs-border overflow-hidden font-jakarta my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-5 bg-sibs-navy text-white">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                      selectedDay.phase === "FST"
                        ? "bg-blue-500 text-white"
                        : "bg-sibs-orange text-white"
                    }`}
                  >
                    Week {selectedDay.weekNumber} · {selectedDay.phase}
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    Day {selectedDay.dayNumber} of 10
                  </span>
                  <span className="text-xs text-slate-300">
                    • {formatFullDate(selectedDay.date, selectedDay.dayOfWeek)}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white">
                  {selectedDay.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDayNumber(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close modal"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto sibs-scrollbar">
              {/* Section 1: Designated Session Trainer */}
              <div className="p-4 bg-gradient-to-r from-orange-50/70 via-white to-slate-50 rounded-xl border border-orange-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-sibs-navy flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-sibs-orange" />
                    <span>Designated Session Trainer</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span>Confirmed Responsibility</span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-sibs-navy text-white flex items-center justify-center font-bold text-sm shadow-xs border-2 border-orange-200 shrink-0">
                      {selectedDay.trainerName.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-sibs-navy">
                        {selectedDay.trainerName}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-sibs-muted mt-0.5">
                        <span className="font-mono font-bold text-sibs-orange">
                          {selectedDay.trainerId}
                        </span>
                        <span>•</span>
                        <span>{selectedDay.trainerRole || "Senior Operations Trainer"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] space-y-0.5 self-end sm:self-auto bg-white/80 px-3 py-1.5 rounded-lg border border-sibs-border">
                    <div className="text-sibs-muted font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sibs-orange" />
                      <span>{selectedDay.shiftHours}</span>
                    </div>
                    <div className="text-sibs-navy font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sibs-muted" />
                      <span>{selectedDay.room}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Materials Assigned That Day */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-sibs-navy flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-sibs-orange" />
                    <span>Materials Assigned for Day {selectedDay.dayNumber} ({selectedDay.materials.length})</span>
                  </span>
                  <span className="sibs-text-micro text-sibs-muted font-medium">
                    Curriculum items for this specific session
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedDay.materials.map((material) => (
                    <div
                      key={material.id}
                      className="p-3 bg-white rounded-xl border border-sibs-border shadow-2xs hover:border-slate-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-sibs-surface border border-sibs-border shrink-0 mt-0.5">
                          {getMaterialIcon(material.type)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="sibs-text-xs font-bold text-sibs-navy">
                              {material.title}
                            </h5>
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-semibold bg-sibs-surface text-sibs-navy shrink-0">
                              {material.type}
                            </span>
                          </div>
                          {material.description && (
                            <p className="sibs-text-micro text-sibs-muted mt-0.5 leading-relaxed">
                              {material.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-sibs-muted mt-1">
                            <span>
                              Ref: <strong className="text-sibs-navy font-mono">{material.fileOrLinkRef}</strong>
                            </span>
                            {material.fileSize && <span>• Size: {material.fileSize}</span>}
                            <span>• Source: {material.source || "Catalog"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setPreviewingMaterial(material)}
                          className="px-2.5 py-1.5 rounded-lg bg-sibs-navy hover:bg-sibs-tertiary-2 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {selectedDay.materials.length === 0 && (
                    <div className="p-4 bg-sibs-surface rounded-xl border border-sibs-border text-center sibs-text-xs text-sibs-muted">
                      No materials assigned for this day yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Daily Topics & Competencies */}
              <div className="p-3.5 bg-sibs-surface rounded-xl border border-sibs-border space-y-2">
                <span className="sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-navy block">
                  Session Learning Objectives &amp; Focus Topics:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-sibs-navy">
                  {selectedDay.topics.map((topic, tIdx) => (
                    <li
                      key={tIdx}
                      className="flex items-start gap-2 bg-white p-2 rounded-lg border border-sibs-border/80"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-sibs-orange mt-1.5 shrink-0" />
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer with Previous / Next Day Steppers */}
            <div className="p-4 bg-sibs-surface border-t border-sibs-border flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevDay}
                className="px-3 py-1.5 rounded-lg border border-sibs-border bg-white hover:bg-sibs-surface text-xs font-bold text-sibs-navy flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Day</span>
              </button>

              <span className="text-xs font-bold text-sibs-navy">
                Day {selectedDay.dayNumber} of 10 ({selectedDay.phase})
              </span>

              <button
                type="button"
                onClick={handleNextDay}
                className="px-3 py-1.5 rounded-lg border border-sibs-border bg-white hover:bg-sibs-surface text-xs font-bold text-sibs-navy flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Next Day</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Quick Preview Modal */}
      {previewingMaterial && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
        >
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-sibs-border p-6 space-y-4 font-jakarta animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-50 text-sibs-orange">
                  {getMaterialIcon(previewingMaterial.type)}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-sibs-navy">
                    {previewingMaterial.title}
                  </h4>
                  <span className="text-[10px] text-sibs-muted font-mono">
                    {previewingMaterial.fileOrLinkRef}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingMaterial(null)}
                className="p-1 rounded-lg hover:bg-sibs-surface text-sibs-muted cursor-pointer"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-sibs-surface rounded-xl border border-sibs-border space-y-2 text-xs text-sibs-navy">
              <div className="flex items-center justify-between pb-2 border-b border-sibs-border text-[11px]">
                <span className="text-sibs-muted font-semibold">Document Format:</span>
                <span className="font-bold text-sibs-navy">{previewingMaterial.type}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-sibs-border text-[11px]">
                <span className="text-sibs-muted font-semibold">Allocated Size:</span>
                <span className="font-bold text-sibs-navy">{previewingMaterial.fileSize || "Standard"}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-sibs-border text-[11px]">
                <span className="text-sibs-muted font-semibold">Assigned By:</span>
                <span className="font-bold text-sibs-navy">{previewingMaterial.assignedBy}</span>
              </div>
              <p className="text-[11px] text-sibs-muted leading-relaxed pt-1">
                {previewingMaterial.description ||
                  "Full curriculum document prepared for trainee self-paced study and classroom coaching."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPreviewingMaterial(null)}
                className="px-4 py-2 rounded-xl border border-sibs-border text-xs font-semibold text-sibs-navy hover:bg-sibs-surface cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Accessing material: ${previewingMaterial.fileOrLinkRef}`);
                  setPreviewingMaterial(null);
                }}
                className="sibs-btn-primary"
              >
                Open Full Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderDayCard(day) {
    const isFST = day.phase === "FST";
    const isSelected = selectedDayNumber === day.dayNumber;
    return (
      <div
        key={day.dayNumber}
        onClick={() => setSelectedDayNumber(day.dayNumber)}
        className={`group relative flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-0.5 ${
          isSelected
            ? "border-sibs-orange ring-2 ring-sibs-orange/25 bg-white"
            : isFST
            ? "border-blue-200/90 bg-white hover:border-blue-400"
            : "border-orange-200/90 bg-white hover:border-orange-400"
        }`}
      >
        {/* Card Header: Day Badge, Phase Badge & Formatted Date */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs text-sibs-navy">
                Day {day.dayNumber}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                  isFST
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-orange-100 text-sibs-orange border border-orange-200"
                }`}
              >
                {day.phase}
              </span>
            </div>

            {/* Complete date */}
            <div className="text-[10px] text-sibs-muted font-bold flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3 text-sibs-muted shrink-0" />
              <span>{formatFullDate(day.date, day.dayOfWeek)}</span>
            </div>
          </div>

          {/* Module Title */}
          <h5 className="text-xs font-bold text-sibs-navy leading-snug group-hover:text-sibs-orange transition-colors">
            {day.title}
          </h5>

          {/* Topic Pills Preview */}
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {day.topics.slice(0, 2).map((t, tIdx) => (
              <span
                key={tIdx}
                className="px-1.5 py-0.2 rounded bg-sibs-surface text-sibs-navy text-[9.5px] truncate max-w-[200px]"
              >
                {t}
              </span>
            ))}
            {day.topics.length > 2 && (
              <span className="text-[9px] text-sibs-muted font-bold">
                +{day.topics.length - 2} more
              </span>
            )}
          </div>
        </div>

        {/* Card Footer: Designated Trainer & Materials Info */}
        <div className="mt-3 pt-2.5 border-t border-sibs-border flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
          {/* Designated Trainer info */}
          <div className="flex items-center gap-1.5 text-sibs-navy min-w-0">
            <div className="w-5 h-5 rounded-full bg-sibs-navy text-white flex items-center justify-center text-[9px] font-bold shrink-0">
              {day.trainerName.split(" ")[0][0]}
            </div>
            <span className="font-semibold text-sibs-navy truncate" title={day.trainerName}>
              {day.trainerName.split("(")[0].trim()}
            </span>
          </div>

          {/* Materials Badge & Action */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sibs-surface text-sibs-navy font-bold text-[10px] border border-sibs-border">
              <FileText className="w-3 h-3 text-sibs-orange" />
              <span>{day.materials.length} Materials</span>
            </span>

            <span className="text-[10px] font-bold text-sibs-orange group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>View</span>
              <span>→</span>
            </span>
          </div>
        </div>

        {/* Selected checkmark indicator */}
        {isSelected && (
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-sibs-orange text-white flex items-center justify-center text-[9px] shadow-xs">
            ✓
          </div>
        )}
      </div>
    );
  }
}

export default TwoWeekTrainingScheduleView;
