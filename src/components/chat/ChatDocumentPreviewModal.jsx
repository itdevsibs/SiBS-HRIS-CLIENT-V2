import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileSpreadsheet, FileText, Image as ImageIcon, Loader2, X } from "lucide-react";
import { chatCsvColumnLabel, parseChatCsvBytes } from "@/lib/utils/chat/chatCsvPreview";

function getFileType(name, mimeType = "") {
  const extension = String(name || "").trim().toLowerCase().split(".").pop();
  const mime = String(mimeType || "").trim().toLowerCase();
  if (mime.startsWith("image/")) return "Image";
  return extension === "pdf" ? "PDF" : extension === "csv" ? "CSV" : ["xls", "xlsx"].includes(extension) ? "Excel" : "Word";
}

/**
 * Preview stays inside the SiBS Chat modal system, not in another browser tab.
 * PDFs use the browser's PDF viewer. Office content is converted server-side to
 * read-only, escaped HTML and displayed in a sandboxed iframe (no scripts).
 */
export default function ChatDocumentPreviewModal({ attachment, getPreview, onClose }) {
  const [source, setSource] = useState("");
  const [csvData, setCsvData] = useState(null);
  const [mobileOfficeHeight, setMobileOfficeHeight] = useState(0);
  const documentFrameRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const originalFocusRef = useRef(null);
  const name = String(attachment?.originalName || "Document");
  const mimeType = String(attachment?.mimeType || "");
  const type = getFileType(name, mimeType);
  const isPdf = type === "PDF";
  const isImage = type === "Image";
  const isCsv = type === "CSV";
  const DocumentIcon = isImage ? ImageIcon : (type === "Excel" || type === "CSV" ? FileSpreadsheet : FileText);
  const fileSize = Number(attachment?.fileSize || 0);
  const displayFileSize = fileSize < 1024
    ? `${fileSize} B`
    : fileSize < 1024 * 1024
      ? `${(fileSize / 1024).toFixed(1)} KB`
      : `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";
    let alive = true;
    setLoading(true);
    setError("");
    setSource("");
    setCsvData(null);
    setMobileOfficeHeight(0);

    if (isImage) {
      const imageUrl = String(attachment?.downloadUrl || attachment?.url || "").trim();
      if (!imageUrl) {
        setError("This image is no longer available.");
        setLoading(false);
        return () => {
          alive = false;
          controller.abort();
        };
      }
      setSource(imageUrl);
      setLoading(false);
      return () => {
        alive = false;
        controller.abort();
      };
    }

    // CSV is rendered from original attachment bytes directly in React.
    // This avoids the blank server-generated HTML grid while preserving exact
    // original string cell values, including leading zeroes and bad dates.
    Promise.resolve(getPreview(attachment?.id, controller.signal, { original: isCsv })).then(async (blob) => {
      if (!alive) return;
      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error("This file has no preview available.");
      }
      if (isCsv) {
        const bytes = await blob.arrayBuffer();
        if (alive) setCsvData(parseChatCsvBytes(bytes));
        return;
      }
      const expectedType = isPdf ? "application/pdf" : "text/html;charset=utf-8";
      objectUrl = URL.createObjectURL(new Blob([blob], { type: expectedType }));
      setSource(objectUrl);
    }).catch((requestError) => {
      if (!alive || controller.signal.aborted) return;
      setError(requestError?.response?.status === 404
        ? "This attachment is no longer available."
        : requestError?.response?.status === 409 && isCsv
          ? "The stored copy of this CSV is damaged. Re-upload the original CSV file to restore its preview."
          : requestError?.message?.includes("CSV") || requestError?.message?.includes("UTF-8")
            ? requestError.message
            : "Unable to load a preview. You can still download the original file.");
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment?.downloadUrl, attachment?.id, attachment?.url, getPreview, isCsv, isImage, isPdf]);

  // iOS browsers can refuse to swipe-scroll a small sandboxed iframe.
  // Office HTML is rendered with scripts disabled and its content already
  // escaped by the server. Measuring it permits scrolling the outer modal
  // instead of depending entirely on nested iframe scrolling.
  const measureOfficeDocument = () => {
    if (isPdf || isCsv || isImage || !window.matchMedia?.("(max-width: 639px)")?.matches) return;
    const frame = documentFrameRef.current;
    try {
      const body = frame?.contentDocument?.body;
      const doc = frame?.contentDocument?.documentElement;
      const actualHeight = Math.max(body?.scrollHeight || 0, doc?.scrollHeight || 0);
      if (actualHeight > 0) setMobileOfficeHeight(Math.min(100_000, Math.max(1000, actualHeight + 32)));
    } catch {
      // The preview can still be scrolled inside the frame if inaccessible.
    }
  };

  useEffect(() => {
    if (!source || isPdf || isCsv || isImage) return undefined;
    const update = () => measureOfficeDocument();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [source, isPdf, isCsv, isImage]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    originalFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus({ preventScroll: true });
    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation?.();
        onClose();
      } else if (event.key === "Tab") {
        const elements = [...(dialogRef.current?.querySelectorAll('button:not(:disabled), a[href], iframe') || [])];
        if (!elements.length) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      const previous = originalFocusRef.current;
      if (previous?.isConnected) requestAnimationFrame(() => previous.focus({ preventScroll: true }));
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[2147483635] flex items-center justify-center overflow-hidden bg-black/60 p-0 backdrop-blur-[3px] font-jakarta sm:px-5 sm:py-6">
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Preview ${name}`}
        className={`sibs-modal-pop-in flex h-[100dvh] w-screen min-w-0 min-h-0 flex-col overflow-hidden rounded-none bg-white shadow-[0_24px_80px_rgba(2,30,56,0.38)] sm:w-full sm:rounded-[18px] ${(type === "Excel" || type === "CSV") ? "sm:h-[min(900px,calc(100dvh-3rem))] sm:max-w-[1480px]" : "sm:h-[min(780px,calc(100dvh-3rem))] sm:max-w-[980px]"}`}>
        <header className="flex shrink-0 items-center justify-between gap-3 bg-sibs-navy px-3 py-3 text-white sm:px-6 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-sibs-orange text-white"><DocumentIcon size={19} /></span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wide text-white/75">SiBS HRIS · SiBS Chat</div>
              <h2 className="truncate text-[16px] font-black leading-snug text-white" title={name}>{name}</h2>
              <p className="text-[10px] font-medium text-white/75">{isImage ? "Image" : `${type} document`} · Read-only preview</p>
            </div>
          </div>
          <button ref={closeButtonRef} type="button" aria-label="Close attachment preview" onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-white transition hover:bg-white/20"><X size={18} /></button>
        </header>
        <div className="relative min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain bg-sibs-canvas" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}>
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm font-semibold text-sibs-navy" role="status"><Loader2 className="animate-spin" size={21} /> Loading document preview…</div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <DocumentIcon size={36} className="text-sibs-orange" />
              <p role="alert" className="text-sm font-semibold text-sibs-navy">{error}</p>
            </div>
          ) : isCsv && csvData ? (
            <div className="flex h-full min-h-0 w-full flex-col p-2 sm:p-4">
              <div className="mb-2 shrink-0 rounded-lg border border-sibs-border bg-white px-3 py-2">
                <h3 className="text-sm font-extrabold text-sibs-navy">CSV spreadsheet preview</h3>
                <p className="mt-0.5 text-[11px] font-medium text-sibs-text-secondary">
                  {csvData.rows.length} source rows · {csvData.columnCount} columns · Read-only
                </p>
                {csvData.truncated ? <p className="text-[11px] font-semibold text-amber-700">Preview limited to 200 rows, 25 columns and 1 MB of text. Download for all data.</p> : null}
                {csvData.malformed ? <p className="text-[11px] font-semibold text-amber-700">An unmatched quote was detected in the CSV.</p> : null}
              </div>
              <div className="sibs-scrollbar min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain rounded-lg border border-sibs-border bg-white"
                role="region" aria-label="Scroll CSV rows and columns" tabIndex={0} style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}>
                <table className="w-max min-w-full table-fixed border-separate border-spacing-0 text-left text-xs text-sibs-navy">
                  <colgroup>
                    <col style={{ width: 46 }} />
                    {Array.from({ length: csvData.columnCount }, (_, column) => {
                      const maxChars = Math.max(8, ...csvData.rows.slice(0, 60).map((row) => String(row[column] ?? "").length));
                      return <col key={column} style={{ width: Math.min(275, Math.max(110, 18 + maxChars * 7.5)) }} />;
                    })}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="sticky left-0 top-0 z-30 border-b border-r border-slate-300 bg-slate-100 px-2 py-2" aria-label="Row numbers" />
                      {Array.from({ length: csvData.columnCount }, (_, column) => (
                        <th key={column} scope="col" className="sticky top-0 z-20 border-b border-r border-slate-300 bg-slate-100 px-2 py-2 text-center text-[11px] font-bold text-slate-600">{chatCsvColumnLabel(column)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <th scope="row" className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-100 px-2 py-2 text-center text-[11px] font-medium text-slate-600">{rowIndex + 1}</th>
                        {Array.from({ length: csvData.columnCount }, (_, column) => {
                          const value = row[column] ?? "";
                          return <td key={column} title={value} className={`overflow-hidden text-ellipsis whitespace-nowrap border-b border-r border-slate-200 px-2 py-2 align-top ${rowIndex === 0 ? "font-bold" : "font-normal"} text-[#112a42]`}>{value}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : source ? (
            isImage ? (
              <div className="flex h-full items-center justify-center overflow-auto bg-slate-950/5 p-3 sm:p-5">
                <img
                  src={source}
                  alt={name}
                  className="max-h-full w-auto max-w-full rounded-xl border border-sibs-border bg-white object-contain shadow-sm"
                />
              </div>
            ) : (
              <iframe key={source} ref={documentFrameRef} src={source} title={`Read-only preview: ${name}`}
                sandbox={isPdf ? undefined : "allow-same-origin"}
                scrolling="yes"
                onLoad={measureOfficeDocument}
                referrerPolicy="no-referrer"
                style={mobileOfficeHeight ? { height: `${mobileOfficeHeight}px` } : undefined}
                className="block h-full min-h-full w-full border-0 bg-white" />
            )
          ) : null}
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-sibs-border bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-sibs-text-secondary">{Number.isFinite(fileSize) && fileSize > 0 ? displayFileSize : type} · Original file is unchanged</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="inline-flex h-9 items-center justify-center rounded-[9px] border border-sibs-border px-4 text-xs font-extrabold text-sibs-navy hover:bg-sibs-canvas">Close</button>
            <a href={attachment?.downloadUrl} target="_blank" rel="noopener noreferrer" download={name}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[9px] bg-sibs-orange px-4 text-xs font-extrabold text-white hover:bg-sibs-button-hover"><Download size={15} /> Download</a>
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
