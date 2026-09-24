import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Music, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { getChatAttachmentUrl } from "@/lib/axios/sibsChat";

function cleanText(value) {
  return String(value ?? "").trim();
}

/**
 * Format raw seconds into a readable MM:SS timestamp.
 *
 * @param {number|string} value
 * @returns {string}
 */
export function formatAudioTime(value) {
  const seconds = Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = String(wholeSeconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function formatFileSize(bytes) {
  const safeBytes = Number(bytes) || 0;
  if (safeBytes <= 0) return "";
  if (safeBytes < 1024 * 1024) {
    return `${(safeBytes / 1024).toFixed(0)} KB`;
  }
  return `${(safeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function fetchCompleteAudio(sourceUrl, signal) {
  const requestOptions = {
    credentials: "include",
    cache: "no-store",
    signal,
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  };

  const response = await fetch(sourceUrl, requestOptions);
  if (!response.ok) {
    throw new Error(`Unable to load audio (${response.status}).`);
  }

  const blob = await response.blob();
  if (!blob.size) {
    throw new Error("The audio file is empty.");
  }
  return blob;
}

export default function ChatAudioPlayer({ attachment, mine = false }) {
  const audioRef = useRef(null);
  const objectUrlRef = useRef("");

  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  const sourceUrl = useMemo(() => {
    const url = getChatAttachmentUrl(attachment?.url);
    if (!url) return "";
    return `${url}${url.includes("?") ? "&" : "?"}full=1`;
  }, [attachment?.url]);

  const fileName = useMemo(() => {
    return (
      cleanText(attachment?.originalName) ||
      cleanText(attachment?.file_name) ||
      "Audio message"
    );
  }, [attachment?.file_name, attachment?.originalName]);

  const fileSizeLabel = useMemo(() => {
    return formatFileSize(attachment?.fileSize || attachment?.file_size);
  }, [attachment?.fileSize, attachment?.file_size]);

  useEffect(() => {
    if (!sourceUrl) {
      setAudioUrl("");
      setLoading(false);
      return undefined;
    }

    const abortController = new AbortController();
    setLoading(true);
    setError("");

    fetchCompleteAudio(sourceUrl, abortController.signal)
      .then((blob) => {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        const nextUrl = URL.createObjectURL(blob);
        objectUrlRef.current = nextUrl;
        setAudioUrl(nextUrl);
        setLoading(false);
      })
      .catch((fetchError) => {
        if (abortController.signal.aborted) return;
        // Graceful fallback to direct URL if blob fetch fails
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = "";
        }
        setAudioUrl(sourceUrl);
        setLoading(false);
        if (fetchError?.name !== "AbortError") {
          // If direct URL also fails, onError on <audio> will set the visible error
        }
      });

    return () => {
      abortController.abort();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = "";
      }
    };
  }, [sourceUrl]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
    } else {
      try {
        await audio.play();
      } catch (playError) {
        setError(playError?.message || "Unable to play audio.");
      }
    }
  }

  function handleSeek(event) {
    const audio = audioRef.current;
    if (!audio) return;

    const nextTime = parseFloat(event.target.value);
    if (Number.isFinite(nextTime)) {
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    setMuted(!muted);
  }

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const safeCurrentTime = Number.isFinite(currentTime) && currentTime >= 0 ? currentTime : 0;

  return (
    <div
      className={`font-jakarta min-w-[270px] sm:min-w-[310px] max-w-[360px] rounded-xl border p-2.5 shadow-xs transition ${
        mine
          ? "border-orange-200/80 bg-white text-sibs-navy"
          : "border-sibs-border bg-white text-sibs-navy"
      }`}
    >
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const nextDuration = Number(event.currentTarget.duration || 0);
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
          setMuted(Boolean(event.currentTarget.muted));
        }}
        onDurationChange={(event) => {
          const nextDuration = Number(event.currentTarget.duration || 0);
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setLoading(false);
          setError("Audio unavailable");
        }}
      />

      {/* Header: Title and File Size */}
      <div className="flex items-center gap-2 mb-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-sibs-orange">
          <Music size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-sibs-navy" title={fileName}>
            {fileName}
          </p>
          {fileSizeLabel ? (
            <p className="text-[10px] font-semibold text-sibs-muted">
              {fileSizeLabel}
            </p>
          ) : null}
        </div>
        {error ? (
          <span className="text-[10px] font-bold text-red-600 shrink-0">
            {error}
          </span>
        ) : null}
      </div>

      {/* Controls Bar: Play Button + Scrubber + Time + Mute */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loading || Boolean(error)}
          onClick={() => void togglePlayback()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sibs-orange text-white shadow-xs transition hover:bg-sibs-button-hover active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={playing ? "Pause audio" : "Play audio"}
          title={playing ? "Pause" : "Play"}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : playing ? (
            <Pause size={14} fill="currentColor" />
          ) : (
            <Play size={14} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        {/* Scrubber slider */}
        <input
          type="range"
          min="0"
          max={safeDuration || 0}
          step="0.05"
          value={safeDuration ? safeCurrentTime : 0}
          onChange={handleSeek}
          disabled={loading || !safeDuration || Boolean(error)}
          aria-label="Audio playback progress"
          className="h-1.5 flex-1 cursor-pointer rounded-lg bg-slate-200 accent-sibs-orange disabled:cursor-default disabled:opacity-60"
        />

        {/* Elapsed / Total Duration */}
        <span className="shrink-0 text-[10px] font-bold tabular-nums text-sibs-muted">
          {formatAudioTime(safeCurrentTime)} / {formatAudioTime(safeDuration)}
        </span>

        {/* Mute Button */}
        <button
          type="button"
          disabled={loading || Boolean(error)}
          onClick={toggleMute}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sibs-muted hover:text-sibs-navy transition"
          aria-label={muted ? "Unmute audio" : "Mute audio"}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>
    </div>
  );
}
