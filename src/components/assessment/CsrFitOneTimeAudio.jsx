import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Headphones, Loader2, LockKeyhole, Play, Volume2 } from 'lucide-react';
import api from '../../lib/axios/api-template';

/** Single-use voicemail. No native media controls or seek bar.
 * The API atomically records first access. Reloading never grants a second copy.
 */
export default function CsrFitOneTimeAudio({ token, startedAtMs, disabled = false, onClaim, onError }) {
  const element = useRef(null);
  const objectUrl = useRef(null);
  const lastTime = useRef(0);
  const requestPending = useRef(false);
  const [status, setStatus] = useState(startedAtMs ? 'used' : 'ready');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (startedAtMs && status === 'ready') setStatus('used');
  }, [startedAtMs, status]);

  useEffect(() => () => {
    element.current?.pause();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  const playOneTime = useCallback(async () => {
    if (disabled || startedAtMs || requestPending.current || status !== 'ready') return;
    requestPending.current = true;
    setStatus('loading');
    try {
      // A POST, not the obsolete publicly served audio file. The Server
      // consumes the playback token within a transaction before delivering bytes.
      const response = await api.post(`/api/assessment/public/${token}/audio-once`, {}, {
        responseType: 'blob', withCredentials: false,
        headers: { 'Cache-Control': 'no-store' },
      });
      onClaim?.(Date.now());
      const blob = response.data instanceof Blob
        ? response.data : new Blob([response.data], { type: 'audio/mpeg' });
      if (blob.size === 0) throw new Error('The voicemail recording is empty.');
      const url = URL.createObjectURL(blob);
      objectUrl.current = url;
      const player = element.current;
      if (!player) throw new Error('The voicemail player is not available.');
      player.src = url;
      player.currentTime = 0;
      lastTime.current = 0;
      // Browsers sometimes block playback after an asynchronous download.
      // The claimed audio remains in memory so the next user click can start
      // its *first* playback, without making a second API request.
      try {
        await player.play();
        setStatus('playing');
      } catch (playError) {
        if (playError?.name === 'NotAllowedError') setStatus('awaiting-click');
        else throw playError;
      }
    } catch (error) {
      setStatus('used');
      let message = error?.response?.data?.message;
      if (!message && error?.response?.data instanceof Blob) {
        try { message = JSON.parse(await error.response.data.text()).message; } catch { /* non-JSON error */ }
      }
      onError?.(message || error?.message ||
        'The single playback attempt could not be completed. Contact the SiBS Career Team.');
    } finally {
      requestPending.current = false;
    }
  }, [disabled, startedAtMs, status, token, onClaim, onError]);

  async function startClaimedAudio() {
    if (status !== 'awaiting-click' || !element.current) return;
    try {
      await element.current.play();
      setStatus('playing');
    } catch (error) {
      onError?.(error.message || 'Unable to begin the audio recording.');
    }
  }

  function finish() {
    setProgress(duration || 1);
    setStatus('finished');
    if (element.current) {
      element.current.pause();
      element.current.removeAttribute('src');
      element.current.load();
    }
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
  }

  const consumed = Boolean(startedAtMs) || ['playing', 'finished', 'used'].includes(status);
  return <div className="rounded-xl border border-sibs-border bg-sibs-surface p-4" role="group" aria-label="Single-play customer voicemail">
    <audio ref={element} preload="none" className="hidden" aria-hidden="true"
      onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)}
      onTimeUpdate={event => {
        const current = event.currentTarget.currentTime;
        lastTime.current = Math.max(lastTime.current, current);
        setProgress(current);
      }}
      onSeeking={event => {
        const player = event.currentTarget;
        if (player.currentTime > lastTime.current + 0.3 || player.currentTime < lastTime.current - 0.3)
          player.currentTime = lastTime.current;
      }}
      onRateChange={event => { if (event.currentTarget.playbackRate !== 1) event.currentTarget.playbackRate = 1; }}
      onEnded={finish}/>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-[#e9f2fa] p-3 text-sibs-navy"><Headphones size={20} /></span>
        <div><p className="text-sm font-extrabold text-sibs-navy">Customer voicemail</p>
          <p className="mt-0.5 text-[11px] text-sibs-muted">Listen carefully and record the customer's information.</p></div>
      </div>
      <button type="button" disabled={disabled || (consumed && status !== 'awaiting-click') || status === 'loading'} onClick={() => void (status === 'awaiting-click' ? startClaimedAudio() : playOneTime())}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sibs-navy px-4 text-xs font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
        {status === 'loading' ? <Loader2 size={15} className="animate-spin"/> :
          status === 'playing' ? <Volume2 size={15}/> : status === 'finished' ? <CheckCircle2 size={15}/> :
          status === 'awaiting-click' ? <Play size={15}/> :
          consumed ? <LockKeyhole size={15}/> : <Play size={15}/>}
        {status === 'loading' ? 'Loading audio…' : status === 'playing' ? 'Playing once…' :
          status === 'finished' ? 'Listening complete' : status === 'awaiting-click' ? 'Start listening' : consumed ? 'Already played' : 'Play voicemail once'}
      </button>
    </div>
    {(status === 'playing' || status === 'finished') && <div className="mt-4" aria-label="Audio progress">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-sibs-navy transition-[width]" style={{width:`${Math.min(100,Math.max(0,duration ? progress/duration*100 : 0))}%`}}/>
      </div>
    </div>}
    <div className={`mt-3 flex items-start gap-2 text-[11px] leading-5 ${consumed ? 'text-sibs-secondary' : 'text-amber-800'}`}>
      {consumed ? <LockKeyhole className="mt-0.5 shrink-0" size={14}/> : <AlertCircle className="mt-0.5 shrink-0" size={14}/>}
      <span>{status === 'playing' ? 'Playback is in progress. Rewind, seek, pause, and replay controls are unavailable.' :
        status === 'finished' ? 'The voicemail has finished. Replay is permanently disabled for this attempt.' :
        status === 'awaiting-click' ? 'The recording is ready. Start listening once; replay remains disabled.' :
        consumed ? 'This attempt has already used its one audio playback. Continue completing the response form.' :
        'Only one playback is permitted. Once you press Play, refreshing or leaving this page will not restart the recording.'}</span>
    </div>
  </div>;
}
