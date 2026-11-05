import { useState, useEffect, useMemo, useRef } from "react";
import { useNHO } from "../NHOContext";
import {
  calculateQuizScore,
  getCurrentOrientationAnswers,
  getOrientationQuizKey,
  INITIAL_ORIENTATION_DECK_CONFIG,
  getStoredOrientationDeckConfig,
  ORIENTATION_CONFIG_STORAGE_KEY,
  INITIAL_ORIENTATION_SLIDES
} from "../nhoInitialData";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BookOpen,
  Check,
  ArrowRight,
  Award,
  HelpCircle,
  ShieldCheck
} from "lucide-react";
function NHOOrientationViewer({ onProceedToRequirements } = {}) {
  const {
    activeApplicant,
    updateOrientationSlide,
    submitQuizAnswer,
    completeOrientation,
    showToast
  } = useNHO();
  const [deckConfig, setDeckConfig] = useState(() => getStoredOrientationDeckConfig());
  useEffect(() => {
    const handleConfigUpdate = () => {
      setDeckConfig(getStoredOrientationDeckConfig());
    };
    window.addEventListener("sibs_nho_orientation_config_updated", handleConfigUpdate);
    const handleStorage = (event) => {
      if (event.key === ORIENTATION_CONFIG_STORAGE_KEY) handleConfigUpdate();
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("sibs_nho_orientation_config_updated", handleConfigUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);
  const slides = deckConfig.slides && deckConfig.slides.length > 0 ? deckConfig.slides : INITIAL_ORIENTATION_SLIDES;
  const totalSlides = slides.length;
  const isCompleted = activeApplicant.orientationStatus === "Completed";
  const quizStages = isCompleted && activeApplicant.orientationQuizStages || deckConfig.quizStages || [];
  const quizQuestions = isCompleted && activeApplicant.orientationQuizQuestions || deckConfig.quizQuestions || [];
  const currentAnswers = () => isCompleted ? activeApplicant.orientationQuizAnswers || {} : getCurrentOrientationAnswers(activeApplicant, deckConfig);
  const [viewMode, setViewMode] = useState(() => {
    if (activeApplicant?.orientationStatus === "Completed") return "final";
    return "slide";
  });
  const [currentSlide, setCurrentSlide] = useState(activeApplicant.orientationCurrentSlide || 1);
  const [activeStageId, setActiveStageId] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState(currentAnswers);
  const [acknowledgmentChecked, setAcknowledgmentChecked] = useState(Boolean(activeApplicant.orientationAcknowledged));
  useEffect(() => {
    if (!isCompleted && !activeApplicant.orientationSlidesViewed.includes(currentSlide)) {
      updateOrientationSlide(activeApplicant.id, currentSlide);
    }
  }, [currentSlide, activeApplicant.id]);
  useEffect(() => {
    if (activeApplicant?.orientationCurrentSlide) {
      setCurrentSlide(activeApplicant.orientationCurrentSlide);
    }
    if (activeApplicant?.orientationQuizAnswers) {
      setQuizAnswers(currentAnswers());
    }
    if (typeof activeApplicant?.orientationAcknowledged === "boolean") {
      setAcknowledgmentChecked(activeApplicant.orientationAcknowledged);
    }
    if (activeApplicant?.orientationStatus === "Completed") {
      setViewMode("final");
    }
  }, [activeApplicant?.id]);
  const quizConfigKey = getOrientationQuizKey(deckConfig);
  const previousConfigKey = useRef(quizConfigKey);
  useEffect(() => {
    const changed = previousConfigKey.current !== quizConfigKey;
    previousConfigKey.current = quizConfigKey;
    if (activeApplicant.orientationStatus === "Completed") return;
    const savedKey = activeApplicant.orientationQuizConfigKey ?? getOrientationQuizKey(INITIAL_ORIENTATION_DECK_CONFIG);
    if (!changed && savedKey === quizConfigKey) return;
    setQuizAnswers(getCurrentOrientationAnswers(activeApplicant, deckConfig));
    setCurrentSlide(1);
    setViewMode("slide");
  }, [quizConfigKey, activeApplicant.id]);
  const maxViewedSlide = Math.max(
    currentSlide,
    ...activeApplicant.orientationSlidesViewed || [1]
  );
  const currentSlideCheckpoint = useMemo(() => {
    return quizStages.find((st) => st.triggerAfterSlide === currentSlide);
  }, [currentSlide, quizStages]);
  const stageQuestions = useMemo(() => {
    return quizQuestions.filter((q) => q.stageId === activeStageId);
  }, [activeStageId, quizQuestions]);
  const isCurrentStageAnswered = useMemo(() => {
    if (!stageQuestions.length) return false;
    return stageQuestions.every((q) => quizAnswers[quizQuestions.findIndex((item) => item.id === q.id)] !== void 0);
  }, [stageQuestions, quizAnswers]);
  const totalAnsweredCount = Object.keys(quizAnswers).length;
  const allQuestionsAnswered = quizQuestions.length > 0 && quizQuestions.every((_, idx) => quizAnswers[idx] !== void 0);
  const scoreResult = useMemo(() => {
    if (isCompleted && activeApplicant.orientationQuizScore !== void 0) return {
      score: activeApplicant.orientationQuizScore,
      total: activeApplicant.orientationQuizTotal ?? quizQuestions.length,
      percentage: activeApplicant.orientationQuizPercentage ?? 0,
      passed: activeApplicant.orientationQuizPassed ?? false
    };
    return calculateQuizScore(quizAnswers, { ...deckConfig, quizQuestions });
  }, [quizAnswers, deckConfig, isCompleted, activeApplicant, quizQuestions]);
  const handleNextSlide = () => {
    if (currentSlideCheckpoint) {
      setActiveStageId(currentSlideCheckpoint.id);
      setViewMode("checkpoint");
      return;
    }
    const next = currentSlide + 1;
    if (next <= totalSlides) {
      setCurrentSlide(next);
      try {
        updateOrientationSlide(activeApplicant.id, next);
      } catch (e) {
        console.warn("Could not sync orientation slide to context", e);
      }
    }
  };
  const handlePrevSlide = () => {
    const prev = Math.max(1, currentSlide - 1);
    setCurrentSlide(prev);
    try {
      updateOrientationSlide(activeApplicant.id, prev);
    } catch (e) {
      console.warn("Could not sync orientation slide to context", e);
    }
  };
  const handleJumpToSlide = (slideNum) => {
    if (slideNum > maxViewedSlide) {
      showToast("Please review the slides in sequential order without skipping ahead.", "info");
      return;
    }
    setCurrentSlide(slideNum);
    setViewMode("slide");
    try {
      updateOrientationSlide(activeApplicant.id, slideNum);
    } catch (e) {
      console.warn("Could not sync orientation slide to context", e);
    }
  };
  const handleSelectAnswer = (qIdx, optIdx) => {
    try {
      const result = submitQuizAnswer(activeApplicant.id, qIdx, optIdx);
      if (result.success) setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
    } catch (e) {
      console.warn("Could not sync quiz answer to context", e);
    }
  };
  const handleContinueFromCheckpoint = () => {
    if (!isCurrentStageAnswered) {
      showToast("Please answer all question(s) in this checkpoint to proceed.", "error");
      return;
    }
    const activeStage = quizStages.find((st) => st.id === activeStageId);
    const triggerSlide = activeStage ? activeStage.triggerAfterSlide : currentSlide;
    if (activeStageId < quizStages.length) {
      const nextSlide = Math.min(totalSlides, triggerSlide + 1);
      setCurrentSlide(nextSlide);
      setViewMode("slide");
      try {
        updateOrientationSlide(activeApplicant.id, nextSlide);
      } catch (e) {
        console.warn("Could not sync orientation slide", e);
      }
    } else {
      setViewMode("final");
    }
  };
  const handleConfirmCompletion = () => {
    if (!allQuestionsAnswered) {
      showToast(`Please answer all ${quizQuestions.length} checkpoint questions first.`, "error");
      return;
    }
    if (!acknowledgmentChecked) {
      showToast("Please check the final orientation policy acknowledgment checkbox.", "error");
      return;
    }
    const res = completeOrientation(activeApplicant.id, acknowledgmentChecked);
    if (res?.success !== false) {
      showToast("Orientation completed & acknowledged successfully!", "success");
    }
  };
  const compositeProgress = useMemo(() => {
    if (activeApplicant.orientationStatus === "Completed") return 100;
    if (viewMode === "final") return 95;
    const slideWeight = currentSlide / totalSlides * 60;
    const quizWeight = totalAnsweredCount / quizQuestions.length * 40;
    return Math.min(90, Math.round(slideWeight + quizWeight));
  }, [activeApplicant.orientationStatus, viewMode, currentSlide, totalSlides, totalAnsweredCount]);
  return <div className="bg-white rounded-2xl border border-sibs-border shadow-xs overflow-hidden flex flex-col font-jakarta relative">
      {
    /* Top Accent Gradient Bar */
  }
      <div className="h-[3px] bg-gradient-to-r from-sibs-navy via-sibs-tertiary-2 to-sibs-orange" />

      {
    /* Sample Content Disclaimer Banner */
  }
      <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-950 text-[11px] flex items-center justify-between">
        <span className="font-semibold flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Notice: Company-specific policy statements are sample prototype content until actual SiBS orientation material is formally approved.</span>
        </span>
        <span className="font-mono text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded font-bold">
          {deckConfig.version || "v1.0-sample"}
        </span>
      </div>

      {
    /* Header Bar */
  }
      <div className="p-4 sm:p-5 bg-sibs-navy text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sibs-orange">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Interactive SiBS Orientation &amp; Interspersed Quizzes</h2>
            <span className="text-[11px] text-slate-300">
              {viewMode === "slide" && `Slide ${currentSlide} of ${totalSlides} \xB7 Presentation Mode`}
              {viewMode === "checkpoint" && `Checkpoint Quiz: Part ${activeStageId} of ${quizStages.length} \xB7 Stage Knowledge Check`}
              {viewMode === "final" && "Final Scoring & Policy Acknowledgment"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeApplicant.orientationStatus === "Completed" ? <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/30">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Orientation Completed (Score: {activeApplicant.orientationQuizScore ?? 6}/{activeApplicant.orientationQuizTotal ?? 6})</span>
            </span> : viewMode === "checkpoint" ? <span className="px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-200 font-bold text-xs flex items-center gap-1.5 border border-orange-500/30">
              <Sparkles className="w-4 h-4 text-sibs-orange" />
              <span>Checkpoint Part {activeStageId}/4 ({isCurrentStageAnswered ? "Answered" : "In Progress"})</span>
            </span> : viewMode === "final" ? <span className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-200 font-bold text-xs flex items-center gap-1.5 border border-blue-500/30">
              <Award className="w-4 h-4 text-blue-300" />
              <span>Score Review: {totalAnsweredCount}/{quizQuestions.length} Answered</span>
            </span> : <span className="px-3 py-1.5 rounded-xl bg-white/10 text-slate-200 font-bold text-xs">
              Slide {currentSlide}/{totalSlides}
            </span>}
        </div>
      </div>

      {
    /* Progress Bar */
  }
      <div className="w-full bg-sibs-border h-1.5">
        <div
    className="h-full transition-all duration-300 bg-gradient-to-r from-sibs-navy via-sibs-orange to-sibs-orange"
    style={{ width: `${compositeProgress}%` }}
  />
      </div>

      {
    /* VIEW MODE 1: SLIDE PRESENTATION */
  }
      {viewMode === "slide" && <div className="flex min-h-[400px] flex-col justify-between space-y-8 p-6 sm:p-8 lg:p-10">
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-wider text-sibs-orange">
                <span className="h-1.5 w-1.5 rounded-full bg-sibs-orange" />
                {slides[currentSlide - 1]?.kicker || "SiBS Orientation"}
              </span>
              <span className="text-[11px] font-bold text-slate-400">· Slide {currentSlide} of {totalSlides}</span>
              {currentSlideCheckpoint && <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[9.5px] font-bold text-blue-800">
                  <Sparkles className="w-3 h-3 text-sibs-orange" />
                  Quiz Checkpoint Follows
                </span>}
            </div>

            <h1 className="text-xl md:text-2xl font-extrabold text-sibs-navy tracking-tight">
              {slides[currentSlide - 1]?.title}
            </h1>
            <p className="text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-line font-normal">
              {slides[currentSlide - 1]?.body}
            </p>
          </div>

          {
    /* Navigation Controls */
  }
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sibs-border pt-6">
            <button
    type="button"
    onClick={handlePrevSlide}
    disabled={currentSlide === 1}
    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
  >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Slide</span>
            </button>

            {
    /* Slide Indicators: strictly sequential without shortcuts */
  }
            <div className="order-3 flex w-full items-center justify-center gap-2 sm:order-none sm:w-auto" aria-label="Orientation slide navigation">
              {slides.map((s) => {
    const canJump = s.num <= maxViewedSlide;
    const hasStage = quizStages.some((st) => st.triggerAfterSlide === s.num);
    return <button
      key={s.num}
      type="button"
      disabled={!canJump}
      onClick={() => handleJumpToSlide(s.num)}
      className={`h-2.5 rounded-full transition-all relative ${s.num === currentSlide ? "bg-sibs-orange w-8 shadow-xs cursor-default" : canJump ? hasStage ? "bg-sibs-navy w-3.5 opacity-90 hover:opacity-100 cursor-pointer" : "bg-sibs-navy w-2.5 opacity-70 hover:opacity-100 cursor-pointer" : "bg-slate-200 w-2.5 cursor-not-allowed opacity-40"}`}
      title={canJump ? hasStage ? `Slide ${s.num} (Has Quiz Checkpoint)` : `Go to slide ${s.num}` : `Complete slide ${s.num - 1} first`}
      aria-label={`Go to slide ${s.num}`}
      aria-current={s.num === currentSlide ? "step" : void 0}
    />;
  })}
            </div>

            {
    /* Primary Action Button: Triggers checkpoint quiz or next slide */
  }
            {currentSlideCheckpoint ? <button
    type="button"
    onClick={handleNextSlide}
    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover text-white font-bold text-xs shadow-xs cursor-pointer transition-all animate-pulse"
  >
                <span>Take Part {currentSlideCheckpoint.id} Checkpoint Quiz ({currentSlideCheckpoint.questionCount} {currentSlideCheckpoint.questionCount === 1 ? "Question" : "Questions"})</span>
                <ArrowRight className="w-4 h-4" />
              </button> : currentSlide < totalSlides ? <button
    type="button"
    onClick={handleNextSlide}
    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sibs-navy hover:bg-sibs-tertiary-2 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
  >
                <span>Next Slide</span>
                <ChevronRight className="w-4 h-4" />
              </button> : <button
    type="button"
    onClick={() => setViewMode("final")}
    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sibs-navy hover:bg-sibs-tertiary-2 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
  >
                <span>Review Final Scores &amp; Acknowledgment</span>
                <ArrowRight className="w-4 h-4" />
              </button>}
          </div>
        </div>}

      {
    /* VIEW MODE 2: INTERSPERSED CHECKPOINT QUIZ */
  }
      {viewMode === "checkpoint" && (() => {
    const activeStage = quizStages.find((st) => st.id === activeStageId) || quizStages[0];
    return <div className="p-6 md:p-8 space-y-6">
            {
      /* Checkpoint Header Banner */
    }
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sibs-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-sibs-orange uppercase tracking-wider">
                    Orientation Stage Checkpoint · Part {activeStage.id} of {quizStages.length}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    (Triggered after Slide {activeStage.triggerAfterSlide})
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-sibs-navy mt-0.5">
                  {activeStage.title}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Answer the question(s) below to confirm your understanding before unlocking the next section of the orientation deck.
                </p>
              </div>

              <button
      type="button"
      onClick={() => handleJumpToSlide(activeStage.triggerAfterSlide)}
      className="text-xs font-bold text-sibs-navy hover:text-sibs-orange flex items-center gap-1.5 px-3 py-2 rounded-xl border border-sibs-border-subtle bg-white hover:bg-sibs-surface shadow-xs cursor-pointer transition-colors self-start sm:self-auto shrink-0"
    >
                <ChevronLeft className="w-4 h-4" />
                <span>Review Slide {activeStage.triggerAfterSlide}</span>
              </button>
            </div>

            {
      /* Questions for This Stage */
    }
            <div className="space-y-6">
              {stageQuestions.map((q, idx) => {
      const questionGlobalIdx = quizQuestions.findIndex((item) => item.id === q.id);
      const selectedOpt = quizAnswers[questionGlobalIdx];
      const isAnswered = selectedOpt !== void 0;
      return <div key={q.id} className="p-6 rounded-2xl bg-sibs-surface border border-sibs-border space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-sibs-orange uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Part {activeStage.id} · Question {idx + 1} of {stageQuestions.length}</span>
                      </span>
                      {isAnswered ? <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          <span>Answer Recorded</span>
                        </span> : <span className="text-[10.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Answer Required
                        </span>}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-sibs-navy leading-relaxed">
                      {q.question}
                    </h3>

                    <div className="space-y-2.5 text-xs">
                      {q.options.map((opt, optIdx) => {
        const isSelected = selectedOpt === optIdx;
        return <button
          key={optIdx}
          type="button"
          onClick={() => handleSelectAnswer(questionGlobalIdx, optIdx)}
          className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${isSelected ? "bg-white border-sibs-orange ring-2 ring-sibs-orange/20 font-bold text-sibs-navy shadow-xs" : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"}`}
        >
                            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5 ${isSelected ? "border-sibs-orange bg-sibs-orange text-white" : "border-slate-300 text-slate-500"}`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1 leading-normal font-medium">{opt}</span>
                          </button>;
      })}
                    </div>
                  </div>;
    })}
            </div>

            {
      /* Checkpoint Navigation Footer */
    }
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-sibs-border">
              <button
      type="button"
      onClick={() => handleJumpToSlide(activeStage.triggerAfterSlide)}
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
    >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Slide {activeStage.triggerAfterSlide}</span>
              </button>

              <button
      type="button"
      onClick={handleContinueFromCheckpoint}
      disabled={!isCurrentStageAnswered}
      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
    >
                <span>
                  {activeStageId < quizStages.length ? `Save & Continue to Part ${activeStageId + 1} (Slide ${activeStage.triggerAfterSlide + 1})` : "Complete Checkpoints & View Final Results"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>;
  })()}

      {
    /* VIEW MODE 3: FINAL SCORING & POLICY ACKNOWLEDGMENT */
  }
      {viewMode === "final" && <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sibs-border">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider block text-sibs-orange">
                Final Orientation Review &amp; Sign-Off
              </span>
              <h2 className="text-xl font-extrabold text-sibs-navy">
                Orientation Checkpoints Scoring &amp; Policy Acknowledgment
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Your checkpoint score is a benchmark of your performance. Confirm the policy acknowledgment to proceed to Step 2.
              </p>
            </div>

            <button
    type="button"
    onClick={() => handleJumpToSlide(totalSlides)}
    className="text-xs font-bold text-sibs-navy hover:text-sibs-orange flex items-center gap-1.5 px-3 py-2 rounded-xl border border-sibs-border-subtle bg-white hover:bg-sibs-surface shadow-xs cursor-pointer transition-colors self-start sm:self-auto"
  >
              <ChevronLeft className="w-4 h-4" />
              <span>Review Slide Deck</span>
            </button>
          </div>

          {
    /* Cumulative Score Card (benchmark only) */
  }
          <div className="p-6 rounded-2xl border shadow-xs space-y-4 bg-sibs-surface border-sibs-border">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold shrink-0 shadow-xs bg-sibs-navy text-white">
                <span className="text-base leading-none">{scoreResult.score}/{scoreResult.total}</span>
                <span className="text-[9.5px] uppercase font-bold tracking-wider mt-0.5">{scoreResult.percentage}%</span>
              </div>
              <div>
                <h4 className="text-base font-extrabold text-sibs-navy">
                  Overall Checkpoints Score: {scoreResult.score}/{scoreResult.total} ({scoreResult.percentage}%)
                </h4>
                <p className="text-[12px] font-medium mt-1 text-slate-500">
                  This score is recorded as a performance benchmark and synchronized with the Talent Acquisition NHO registry.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-sibs-border">
              {quizStages.map((stage) => {
    const stageQs = quizQuestions.filter((q) => q.stageId === stage.id);
    let stageScore = 0;
    stageQs.forEach((q) => {
      if (quizAnswers[quizQuestions.findIndex((item) => item.id === q.id)] === q.correctOptionIndex) stageScore++;
    });
    return <div key={stage.id} className="p-3.5 rounded-xl border bg-white border-sibs-border flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-sibs-orange">Part {stage.id}</span>
                      <h5 className="text-xs font-bold text-sibs-navy line-clamp-1" title={stage.title}>{stage.title}</h5>
                    </div>
                    <div className="pt-1 border-t border-slate-100">
                      <span className="text-xs font-extrabold text-sibs-navy">Score: {stageScore}/{stageQs.length}</span>
                    </div>
                  </div>;
  })}
            </div>
          </div>

          {
    /* Final Policy Acknowledgment & Submission */
  }
          <div className={`p-6 border rounded-2xl space-y-4 transition-all ${allQuestionsAnswered ? "bg-orange-50/70 border-orange-200 ring-2 ring-orange-200/50" : "bg-slate-50 border-slate-200 opacity-80"}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 text-orange-950">
                <ShieldCheck className="w-4 h-4 text-sibs-orange" />
                <span>Final Orientation Acknowledgment &amp; Policy Sign-Off</span>
                {allQuestionsAnswered && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                    All Checkpoints Answered ({totalAnsweredCount}/{quizQuestions.length})
                  </span>}
              </h4>
              {!allQuestionsAnswered && <span className="text-[11px] text-slate-500 font-medium">
                  Please answer all {quizQuestions.length} questions to unlock
                </span>}
            </div>

            <label className={`flex items-start gap-3 ${allQuestionsAnswered ? "cursor-pointer" : "cursor-not-allowed"}`}>
              <input
    type="checkbox"
    checked={acknowledgmentChecked}
    disabled={!allQuestionsAnswered || activeApplicant.orientationStatus === "Completed"}
    onChange={(e) => setAcknowledgmentChecked(e.target.checked)}
    className="mt-0.5 rounded border-slate-300 text-sibs-orange focus:ring-sibs-orange w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
  />
              <span className="text-xs leading-relaxed font-medium text-slate-800">
                I hereby confirm that I have personally reviewed all {totalSlides} slides of the SiBS New Hire Orientation, answered all interspersed checkpoint quizzes, and agree to uphold all company policies, workplace standards, information security protocols, and attendance procedures.
              </span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {activeApplicant.orientationStatus === "Completed" && <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Orientation Confirmed &amp; Synchronized with TA Registry</span>
                </span>}
              <div className="flex items-center gap-3 ml-auto">
                <button
    type="button"
    onClick={handleConfirmCompletion}
    disabled={!allQuestionsAnswered || !acknowledgmentChecked || activeApplicant.orientationStatus === "Completed"}
    className="px-6 py-2.5 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover disabled:opacity-40 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
  >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {activeApplicant.orientationStatus === "Completed" ? "Orientation Confirmed" : "Confirm Orientation Completion & Submit Score"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {activeApplicant.orientationStatus === "Completed" && <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-300 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-emerald-950">Orientation Completed!</h4>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">
                      Quiz Score: <strong>{activeApplicant.orientationQuizScore ?? 6}/{activeApplicant.orientationQuizTotal ?? 6} ({activeApplicant.orientationQuizPercentage ?? 100}%)</strong> · Completed {activeApplicant.orientationCompletedAt || "Today"}. Requirement submission is now unlocked.
                    </p>
                  </div>
                </div>

                {onProceedToRequirements && <button
    type="button"
    onClick={onProceedToRequirements}
    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover text-white text-xs font-extrabold shadow-xs cursor-pointer transition-all animate-bounce"
  >
                    <span>Proceed to Step 2: Passing of Requirements</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>}
              </div>
            </div>}
        </div>}
    </div>;
}
export {
  NHOOrientationViewer as default
};
