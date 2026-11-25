import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2, LogOut } from 'lucide-react';
import portalApi from '../../lib/assessment-admin/portalApi';
import { readPortalPhoto, writePortalPhoto, clearPortalPhoto } from '../../lib/assessment-admin/portalHeaderCache';
import { readPortalSession } from '../../lib/assessment-admin/portalSession';

// Resize the authenticated response for the header and its 152px hover preview.
async function createPortalPhotoThumbnail(blob) {
  if (!blob?.size || !/^image\/(jpeg|png|webp|gif)$/i.test(blob.type)) return '';
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
    const scale = Math.min(1, 320 / Math.max(image.naturalWidth, image.naturalHeight));
    if (!Number.isFinite(scale) || scale <= 0) return '';
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) return '';
    context.fillStyle = '#042C51';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally { URL.revokeObjectURL(url); }
}
import { getActiveCollectibleProfile } from '../../config/developerBorders';
import CollectibleAvatarFrame from '../../components/layout/dropdown/CollectibleAvatarFrame';
import { sanitizeMiddleName } from '../../lib/utils/employees/employeeNameDisplay.js';

/** Portal-specific counterpart of the HRIS header profile.
 * It deliberately does not depend on the main HRIS UserContext or sign-out API.
 */
export default function AssessmentAdminUserProfile({ user, logout, displayOnly = false }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutInFlight = useRef(false);
  const triggerRef = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const sibsId = String(user?.sibsId || '');
  const sessionId = readPortalSession()?.sessionId || '';
  const [photoUrl, setPhotoUrl] = useState(() => readPortalPhoto(sibsId, sessionId));
  const wrapperRef = useRef(null);
  const avatarRef = useRef(null);
  const menuRef = useRef(null);
  // Match SiBS HRIS: LAST NAME, FIRST NAME MIDDLE NAME.
  // HRIS omits unavailable middle names such as N/A or Not Applicable.
  const familyName = String(user?.lastName ?? '').trim();
  const firstName = String(user?.firstName ?? '').trim();
  const middleName = sanitizeMiddleName(user?.middleName);
  const givenNames = [firstName, middleName].filter(Boolean).join(' ');
  const name = `${familyName}${familyName && givenNames ? ', ' : ''}${givenNames}`
    .replace(/\s+/g, ' ').trim() || String(user?.sibsId || 'USER');
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'S';
  const email = user?.email || user?.role || '';
  const collectible = getActiveCollectibleProfile(user);
  const showPhoto = Boolean(photoUrl);
  const onPhotoError = () => {
    clearPortalPhoto();
    setPhotoUrl('');
  };

  // Keep the last authenticated thumbnail during session verification and
  // refresh it only after authentication. No extra <img> network request.
  useEffect(() => {
    if (displayOnly || !sibsId || !sessionId) return;
    let alive = true;
    const controller = new AbortController();
    const isCurrent = () => alive && readPortalSession()?.sessionId === sessionId &&
      readPortalSession()?.expiresAt > Date.now();
    portalApi.get('/api/assessment-portal/profile-photo', { responseType: 'blob', signal: controller.signal })
      .then(async response => {
        if (!isCurrent()) return;
        const src = await createPortalPhotoThumbnail(response.data);
        if (!isCurrent() || !src) return;
        writePortalPhoto(sibsId, sessionId, src);
        setPhotoUrl(src);
      })
      .catch(error => {
        // Keep an existing portrait through transient network failures.
        if (isCurrent() && Number(error?.response?.status) === 404) {
          clearPortalPhoto();
          setPhotoUrl('');
        }
      });
    return () => { alive = false; controller.abort(); };
  }, [sibsId, sessionId, displayOnly]);

  const placePreview = useCallback(() => {
    const anchor = avatarRef.current;
    if (!anchor || typeof window === 'undefined') return null;
    const rect = anchor.getBoundingClientRect();
    const size = 152, gap = 10, padding = 12;
    const left = Math.min(Math.max(rect.left + rect.width / 2 - size / 2, padding), Math.max(padding, window.innerWidth - size - padding));
    const below = rect.bottom + gap;
    const top = below + size <= window.innerHeight - padding ? below : Math.max(padding, rect.top - size - gap);
    return { left, top };
  }, []);

  const placeMenu = useCallback(() => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect || typeof window === 'undefined') return null;
    const padding = 12;
    const width = Math.min(window.innerWidth >= 1536 ? 286 : 260, Math.max(0, window.innerWidth - padding * 2));
    const menuHeight = menuRef.current?.offsetHeight || 66;
    const left = Math.max(padding, Math.min(rect.right - width, window.innerWidth - width - padding));
    const below = rect.bottom + 8;
    const top = below + menuHeight <= window.innerHeight - padding ? below : Math.max(padding, rect.top - menuHeight - 8);
    return { top, left, width };
  }, []);

  const onEnter = () => {
    if (displayOnly || open) return;
    const next = placePreview();
    if (next) { setPreviewPosition(next); setPreviewOpen(true); }
  };
  const toggle = () => {
    if (displayOnly) return;
    setPreviewOpen(false);
    if (!open) setMenuPosition(placeMenu());
    setOpen(current => !current);
  };

  useEffect(() => {
    const close = event => {
      if (!wrapperRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setOpen(false);
        setPreviewOpen(false);
      }
    };
    const escape = event => { if (event.key === 'Escape' && (wrapperRef.current?.contains(document.activeElement) || menuRef.current?.contains(document.activeElement))) { setOpen(false); setPreviewOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, []);

  useLayoutEffect(() => {
    if (!previewOpen && !open) return undefined;
    const reposition = () => {
      if (previewOpen) setPreviewPosition(placePreview());
      if (open) setMenuPosition(placeMenu());
    };
    const frame = window.requestAnimationFrame(reposition);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener('scroll', reposition, true); window.removeEventListener('resize', reposition); };
  }, [previewOpen, open, placePreview, placeMenu]);

  const onLogout = async () => {
    if (displayOnly || logoutInFlight.current) return;
    logoutInFlight.current = true;
    setLoggingOut(true);
    try { await logout(); setOpen(false); }
    finally { logoutInFlight.current = false; setLoggingOut(false); }
  };

  const avatar = variant => collectible ? (
    <CollectibleAvatarFrame collectible={collectible} photoUrl={showPhoto ? photoUrl : ''} fallback={initials}
      variant={variant} onPhotoError={onPhotoError}/>
  ) : variant === 'preview' ? (
    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-sibs-primary-1 text-4xl font-extrabold text-white">
      {showPhoto ? <img src={photoUrl} alt="" className="h-full w-full object-cover" onError={onPhotoError}/> : initials}
    </div>
  ) : (
    <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-sibs-primary-1 text-[11px] font-extrabold text-white shadow-[0_6px_16px_rgba(0,48,142,0.24)] 2xl:h-9 2xl:w-9 2xl:text-xs">
      {showPhoto ? <img src={photoUrl} alt="" className="h-full w-full object-cover" onError={onPhotoError}/> : initials}
    </span>
  );

  return <div ref={wrapperRef} className="relative z-[90] min-w-0 font-jakarta">
    <button ref={triggerRef} type="button" aria-label={`User menu: ${name}`} aria-haspopup="menu" aria-expanded={open}
      disabled={displayOnly} onClick={toggle}
      className="group flex min-w-0 max-w-[290px] cursor-pointer items-center gap-2 rounded-xl border border-transparent bg-transparent px-2 py-1 text-left transition-colors duration-150 hover:bg-sibs-tertiary-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sibs-primary-1/30 xl:max-w-[320px] 2xl:max-w-[360px] 2xl:gap-2.5 2xl:py-1.5">
      <span ref={avatarRef} onMouseEnter={onEnter} onMouseLeave={() => setPreviewOpen(false)}
        className="relative flex shrink-0 items-center justify-center">{avatar('header')}</span>
      <span className="hidden min-w-0 flex-1 flex-col overflow-hidden text-left leading-tight sm:flex">
        <span className="block w-full min-w-0 truncate text-[11px] font-extrabold text-sibs-primary-1 2xl:text-xs" title={name}>{name.toUpperCase()}</span>
        <span className="mt-0.5 block w-full min-w-0 truncate text-[9px] font-semibold text-sibs-primary-2 2xl:text-[10px]" title={email}>{email}</span>
      </span>
      <ChevronDown size={14} strokeWidth={2} className={`hidden shrink-0 text-sibs-tertiary-6 transition-transform duration-200 group-hover:text-sibs-primary-1 sm:block ${open ? 'rotate-180 text-sibs-primary-1' : ''}`}/>
    </button>
    {!displayOnly && !open && previewOpen && previewPosition && createPortal(
      <div aria-hidden="true" className="pointer-events-none fixed z-[2147483631] h-[152px] w-[152px] rounded-2xl border border-sibs-border-subtle bg-white p-1.5 shadow-[0_18px_50px_rgba(4,44,81,0.28)]"
        style={previewPosition}>{avatar('preview')}</div>, document.body)}
    {!displayOnly && open && menuPosition && createPortal(
      <div ref={menuRef} role="menu" aria-label="User actions" className="sibs-animated-dropdown open fixed z-[2147483630] font-jakarta" style={menuPosition}>
        <div className="sibs-animated-dropdown-inner">
          <div className="sibs-animated-dropdown-box overflow-hidden rounded-xl border border-sibs-border-subtle bg-white shadow-[0_18px_50px_rgba(4,44,81,0.20)]">
            <div className="p-1.5 2xl:p-2">
              <button type="button" role="menuitem" onClick={onLogout} disabled={loggingOut}
                className="mt-0.5 flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 2xl:gap-3 2xl:min-h-[50px] 2xl:px-3 2xl:py-2.5">
                {loggingOut ? <Loader2 size={16} className="shrink-0 animate-spin"/> : <LogOut size={16} className="shrink-0"/>}<span className="text-[11px] font-extrabold 2xl:text-xs">{loggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>, document.body)}
  </div>;
}
