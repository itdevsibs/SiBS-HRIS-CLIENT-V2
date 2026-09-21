import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";

import { getChatAttachmentUrl } from "@/lib/axios/sibsChat";

function cleanText(value) {
  return String(value ?? "").trim();
}

function formatMediaTime(value) {
  const seconds = Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = String(wholeSeconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function parseContentRangeTotal(value) {
  const match = String(value || "").match(/bytes\s+\d+-\d+\/(\d+)/i);
  const total = Number(match?.[1] || 0);
  return Number.isFinite(total) && total > 0 ? total : 0;
}

async function fetchCompleteVideo(sourceUrl, signal) {
  const requestOptions = {
    credentials: "include",
    cache: "no-store",
    signal,
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  };

  let response = await fetch(sourceUrl, requestOptions);

  if (!response.ok) {
    throw new Error(`Unable to load video (${response.status}).`);
  }

  // A normal fetch should return the complete file. If an intermediary still
  // answers with 206, request the entire byte span explicitly so this player
  // receives one complete Blob instead of relying on browser range streaming.
  if (response.status === 206) {
    const totalBytes = parseContentRangeTotal(response.headers.get("content-range"));

    if (totalBytes > 0) {
      response = await fetch(sourceUrl, {
        ...requestOptions,
        headers: {
          ...requestOptions.headers,
          Range: `bytes=0-${totalBytes - 1}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Unable to load the complete video (${response.status}).`);
      }
    }
  }

  const blob = await response.blob();
  if (!blob.size) {
    throw new Error("The video file is empty.");
  }

  return blob;
}

export default function ChatVideoPlayer({ attachment }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const objectUrlRef = useRef("");

  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sourceUrl = useMemo(() => {
    const url = getChatAttachmentUrl(attachment?.url);
    if (!url) return "";
    return `${url}${url.includes("?") ? "&" : "?"}full=1`;
  }, [attachment?.url]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === playerRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    setVideoUrl("");
    setLoading(true);
    setError("");
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    if (!sourceUrl) {
      setLoading(false);
      setError("Video source is unavailable.");
      return () => controller.abort();
    }

    void (async () => {
      try {
        const blob = await fetchCompleteVideo(sourceUrl, controller.signal);
        if (!active) return;

        const expectedMime = cleanText(attachment?.mimeType).toLowerCase();
        const actualMime = cleanText(blob.type).toLowerCase();
        if (
          actualMime &&
          !actualMime.startsWith("video/") &&
          !expectedMime.startsWith("video/")
        ) {
          throw new Error("The selected attachment is not a supported video.");
        }

        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setVideoUrl(objectUrl);
      } catch (requestError) {
        if (!active || requestError?.name === "AbortError") return;
        setError(requestError?.message || "Unable to load the complete video.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = "";
      }
    };
  }, [attachment?.id, attachment?.mimeType, reloadKey, sourceUrl]);

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (video.ended) {
      video.currentTime = 0;
    }

    if (video.paused) {
      try {
        await video.play();
      } catch {
        // Browser playback errors are reflected by the unchanged paused state.
      }
      return;
    }

    video.pause();
  }

  function seekVideo(event) {
    const video = videoRef.current;
    const nextTime = Number(event.target.value || 0);
    if (!video || !Number.isFinite(nextTime)) return;

    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setMuted(video.muted);
  }

  async function enterFullscreen() {
    const target = playerRef.current;
    if (!target) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
      } else {
        await target.requestFullscreen?.();
      }
    } catch {
      // Ignore browsers that block programmatic fullscreen.
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[210px] w-full items-center justify-center rounded-xl bg-black px-6 text-center text-white">
        <div>
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          <p className="mt-2 text-[10px] font-bold text-white/75">
            Loading complete video...
          </p>
        </div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className="flex min-h-[180px] w-full items-center justify-center rounded-xl bg-black px-6 text-center text-white">
        <div>
          <p className="text-[10px] font-bold leading-4 text-white/80">
            {error || "Unable to load this video."}
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-[10px] font-extrabold text-white transition hover:bg-white/20"
          >
            <RotateCcw size={13} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const safeCurrentTime = Math.min(Math.max(0, currentTime), safeDuration || currentTime);

  return (
    <div
      ref={playerRef}
      className={`group/video-player relative overflow-hidden bg-black shadow-sm ${
        isFullscreen
          ? "flex h-screen w-screen items-center justify-center rounded-none"
          : "rounded-xl"
      }`}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        playsInline
        preload="auto"
        className={
          isFullscreen
            ? "h-screen w-screen max-h-none max-w-none bg-black object-contain"
            : "max-h-72 w-full bg-black object-contain"
        }
        onClick={() => void togglePlayback()}
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
        onEnded={() => setPlaying(false)}
        onVolumeChange={(event) => setMuted(Boolean(event.currentTarget.muted))}
      />

      {!playing ? (
        <button
          type="button"
          onClick={() => void togglePlayback()}
          aria-label={currentTime > 0 ? "Resume video" : "Play video"}
          className="absolute left-1/2 top-1/2 inline-flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-white shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-black/75"
        >
          <Play size={22} className="ml-0.5" fill="currentColor" />
        </button>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-2 pt-8 text-white">
        <input
          type="range"
          min="0"
          max={safeDuration || 0}
          step="0.05"
          value={safeDuration ? safeCurrentTime : 0}
          onChange={seekVideo}
          disabled={!safeDuration}
          aria-label="Video progress"
          className="h-1.5 w-full cursor-pointer accent-sibs-orange disabled:cursor-default"
        />

        <div className="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void togglePlayback()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white transition hover:bg-white/15"
            aria-label={playing ? "Pause video" : "Play video"}
          >
            {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>

          <span className="text-[10px] font-bold tabular-nums text-white/90">
            {formatMediaTime(safeCurrentTime)} / {formatMediaTime(safeDuration)}
          </span>

          <div className="flex-1" />

          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white transition hover:bg-white/15"
            aria-label={muted ? "Unmute video" : "Mute video"}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            type="button"
            onClick={() => void enterFullscreen()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white transition hover:bg-white/15"
            aria-label="Fullscreen video"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
