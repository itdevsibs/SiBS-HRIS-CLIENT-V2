import React, { useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileAudio,
  FileText,
  Pause,
  Play,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import { CandidateProfilePanel } from "./CandidateProfileField";

const API_BASE_URL = String(
  import.meta.env.VITE_API_URL || "http://localhost:5000",
)
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

function normalizeFileUrl(url) {
  const cleanUrl = String(url || "").trim();
  if (!cleanUrl || cleanUrl === "#") return "";
  if (
    /^https?:\/\//i.test(cleanUrl) ||
    cleanUrl.startsWith("blob:") ||
    cleanUrl.startsWith("data:")
  ) {
    return cleanUrl;
  }
  const cleanPath = cleanUrl.replace(/^\/+/, "");
  return `${API_BASE_URL}/${cleanPath}`;
}

function CustomAudioPlayer({ src, fileName }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }

  function handleTimeUpdate() {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  }

  function handleLoadedMetadata() {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  }

  function handleSeek(e) {
    if (!audioRef.current) return;
    const seekTime = Number(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  return (
    <div className="flex min-h-[76px] flex-col justify-between rounded-xl border border-[#DCE6F1] bg-[#F8FAFC] p-2.5">
      {src ? (
        <audio
          ref={audioRef}
          src={src}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!src}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF5C28] text-white shadow-xs transition hover:bg-[#E95324] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            title={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? (
              <Pause size={12} />
            ) : (
              <Play size={12} className="ml-0.5" />
            )}
          </button>

          <div className="min-w-0">
            <p
              title={fileName || "Voice Recording Sample"}
              className="truncate text-xs font-extrabold text-[#042C51]"
            >
              {fileName || "Voice Recording Sample"}
            </p>
            <p className="text-[10px] font-semibold text-[#667085] tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
        </div>

        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#FFF0EB] text-[#FF5C28]">
          <Volume2 size={13} />
        </span>
      </div>

      <input
        type="range"
        min="0"
        max={duration || 100}
        value={currentTime}
        disabled={!src}
        onChange={handleSeek}
        className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#D6E0EA] accent-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-40"
      />
    </div>
  );
}

export default function CandidateProfileAttachments({ data }) {
  const references = Array.isArray(data.references) ? data.references : [];
  const isConsentAccepted =
    data.consentAccepted === true ||
    data.consentAccepted === 1 ||
    data.consentAccepted === "1" ||
    data.consentAccepted === "true" ||
    data.consentAccepted === "Yes";

  const resolvedAudioUrl = normalizeFileUrl(data.audioUrl);
  const resolvedAttachmentUrl = normalizeFileUrl(data.attachmentUrl);
  const hasAudio = Boolean(resolvedAudioUrl || data.audioFileName);
  const hasAttachment = Boolean(resolvedAttachmentUrl || data.attachmentFileName);

  return (
    <CandidateProfilePanel title="References, Media & Legal Declarations">
      <div className="space-y-4 pb-1">
        {/* =====================================================
            CHARACTER REFERENCES
        ===================================================== */}
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
            Character References
          </p>

          {references.length > 0 ? (
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {references.map((ref, index) => (
                <div
                  key={`ref-${index}`}
                  className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 shadow-xs transition hover:border-[#D6E0EA] hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex rounded-md bg-[#FFF0EB] px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wider text-[#FF5C28]">
                      Reference {index + 1}
                    </span>
                  </div>

                  <p className="mt-2 truncate text-xs font-extrabold text-[#042C51]">
                    {ref.name || "—"}
                  </p>

                  <div className="mt-2 space-y-1 border-t border-[#EEF2F6] pt-2 text-[10px] font-semibold text-[#667085]">
                    <p className="truncate">
                      <span className="text-[#98A2B3]">Phone:</span>{" "}
                      <span className="text-[#344054] font-bold">
                        {ref.phone || "—"}
                      </span>
                    </p>
                    <p className="truncate">
                      <span className="text-[#98A2B3]">Relationship:</span>{" "}
                      <span className="text-[#344054]">
                        {ref.relationship || "—"}
                      </span>
                    </p>
                    <p className="truncate">
                      <span className="text-[#98A2B3]">Company:</span>{" "}
                      <span className="text-[#344054]">
                        {ref.company || "—"}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 rounded-xl border border-dashed border-[#D6E0EA] bg-[#F8FAFC] p-4 text-center">
              <p className="text-xs font-bold text-[#98A2B3]">
                No character references provided.
              </p>
            </div>
          )}
        </div>

        {/* =====================================================
            MEDIA, RESUME & DECLARATIONS
        ===================================================== */}
        <div className="border-t border-[#E6ECF2] pt-4">
          <p className="mb-2 text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
            Media, Attachments &amp; Consent
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Audio Player Card */}
            <div className="flex h-full flex-col justify-between rounded-xl border border-[#E6ECF2] bg-white p-3 shadow-xs">
              <div>
                <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                  <FileAudio size={12} className="text-[#FF5C28]" />
                  <span>Audio Introduction</span>
                </div>

                <div className="mt-2.5">
                  {hasAudio ? (
                    <CustomAudioPlayer
                      src={resolvedAudioUrl}
                      fileName={data.audioFileName}
                    />
                  ) : (
                    <div className="flex min-h-[76px] items-center justify-center rounded-xl border border-dashed border-[#D6E0EA] bg-[#F8FAFC] text-center">
                      <p className="text-xs font-bold text-[#98A2B3]">
                        No audio file attached
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resume / Attachment Card */}
            <div className="flex h-full flex-col justify-between rounded-xl border border-[#E6ECF2] bg-white p-3 shadow-xs">
              <div>
                <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                  <FileText size={12} className="text-[#042C51]" />
                  <span>Attachment / Resume</span>
                </div>

                <div className="mt-2.5">
                  {hasAttachment ? (
                    <div className="flex min-h-[76px] items-center justify-between gap-2 rounded-xl border border-[#DCE6F1] bg-[#F8FAFC] p-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E9F0FC] text-[#042C51]">
                          <FileText size={16} />
                        </span>
                        <div className="min-w-0">
                          <p
                            title={data.attachmentFileName || "Resume File"}
                            className="max-w-[140px] truncate text-xs font-extrabold text-[#042C51] xl:max-w-[170px]"
                          >
                            {data.attachmentFileName || "Resume / Document"}
                          </p>
                          <p className="text-[10px] font-semibold text-[#667085]">
                            Uploaded Document
                          </p>
                        </div>
                      </div>

                      {resolvedAttachmentUrl ? (
                        <a
                          href={resolvedAttachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Download or view attachment"
                          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-[#D6E0EA] bg-white px-2.5 text-[10px] font-extrabold text-[#042C51] shadow-xs transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
                        >
                          <Download size={11} />
                          <span>View</span>
                        </a>
                      ) : (
                        <span className="inline-flex shrink-0 items-center rounded-md bg-[#E9F0FC] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#042C51]">
                          File
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex min-h-[76px] items-center justify-center rounded-xl border border-dashed border-[#D6E0EA] bg-[#F8FAFC] text-center">
                      <p className="text-xs font-bold text-[#98A2B3]">
                        No attachment uploaded
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Terms & Privacy Declaration Card */}
            <div className="flex h-full flex-col justify-between rounded-xl border border-[#E6ECF2] bg-white p-3 shadow-xs">
              <div>
                <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  <span>Legal &amp; Privacy Consent</span>
                </div>

                <div className="mt-2.5 flex min-h-[76px] items-center justify-between gap-2 rounded-xl border border-[#DCE6F1] bg-[#F8FAFC] p-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <CheckCircle2 size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-extrabold text-[#042C51]">
                        {isConsentAccepted ? "Consent Accepted" : "Not Provided"}
                      </p>
                      <p className="text-[10px] font-semibold text-[#667085]">
                        {isConsentAccepted
                          ? "Terms & Privacy Verified"
                          : "Pending Confirmation"}
                      </p>
                    </div>
                  </div>

                  {isConsentAccepted ? (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-emerald-700">
                      VERIFIED
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CandidateProfilePanel>
  );
}
