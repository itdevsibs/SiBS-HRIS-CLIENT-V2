import { useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import api from "../../../lib/axios/api-template";
import ModalShell from "../../ui/ModalShell";

function cleanText(value) {
  return String(value ?? "").trim();
}

function resolveFilename(contentDisposition = "", fallback = "") {
  const encodedMatch = String(contentDisposition).match(
    /filename\*=UTF-8''([^;]+)/i,
  );

  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      return encodedMatch[1];
    }
  }

  const regularMatch = String(contentDisposition).match(
    /filename="?([^";]+)"?/i,
  );

  return (
    cleanText(regularMatch?.[1]) ||
    cleanText(fallback) ||
    "Employment Offer.pdf"
  );
}

export default function EmploymentOfferPdfPreviewModal({
  open = false,
  filename = "",
  requestUrl = "",
  onClose,
}) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [resolvedFilename, setResolvedFilename] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const previewUrlRef = useRef("");

  function clearPreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }

    setPreviewUrl("");
  }

  useEffect(() => {
    if (!open || !requestUrl) {
      clearPreviewUrl();
      setLoading(false);
      setErrorMessage("");
      return undefined;
    }

    let active = true;
    const abortController = new AbortController();

    async function loadPdf() {
      clearPreviewUrl();
      setLoading(true);
      setErrorMessage("");
      setResolvedFilename(cleanText(filename));

      try {
        const response = await api.get(requestUrl, {
          responseType: "blob",
          withCredentials: true,
          signal: abortController.signal,
          skipAuthRedirect: true,
          headers: {
            Accept: "application/pdf",
          },
        });

        if (!active || abortController.signal.aborted) return;

        const contentType = cleanText(
          response?.headers?.["content-type"],
        ).toLowerCase();

        const responseBlob = response?.data;

        if (
          !(responseBlob instanceof Blob) ||
          (
            contentType &&
            !contentType.includes("application/pdf") &&
            contentType !== "application/octet-stream"
          )
        ) {
          throw new Error(
            "The server did not return a valid Employment Offer PDF.",
          );
        }

        const pdfBlob =
          responseBlob.type === "application/pdf"
            ? responseBlob
            : new Blob([responseBlob], {
                type: "application/pdf",
              });

        const nextPreviewUrl = URL.createObjectURL(pdfBlob);
        previewUrlRef.current = nextPreviewUrl;
        setPreviewUrl(nextPreviewUrl);

        setResolvedFilename(
          resolveFilename(
            response?.headers?.["content-disposition"],
            filename,
          ),
        );
      } catch (error) {
        if (
          !active ||
          abortController.signal.aborted ||
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }

        const status = error?.response?.status;

        setErrorMessage(
          status === 404
            ? "The Employment Offer PDF could not be found on the file server."
            : status === 401
              ? "The PDF endpoint rejected the request. Confirm that the Employment Offer route is publicly accessible."
              : error?.message ||
                "Unable to load the Employment Offer PDF.",
        );
      } finally {
        if (active && !abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      active = false;
      abortController.abort();
      clearPreviewUrl();
    };
  }, [open, requestUrl, filename]);

  useEffect(() => {
    if (!open) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const displayFilename =
    resolvedFilename ||
    cleanText(filename) ||
    "Employment Offer.pdf";

  function handleDownload() {
    if (!previewUrl) return;

    const anchor = document.createElement("a");
    anchor.href = previewUrl;
    anchor.download = displayFilename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="navy"
      title={displayFilename}
      icon={FileText}
      maxWidth="max-w-5xl"
      className="rounded-[14px]"
      bodyClassName="min-h-0 flex-1 overflow-auto p-5 font-jakarta"
      footer={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p
              title={displayFilename}
              className="truncate text-xs font-extrabold text-slate-700"
            >
              {displayFilename}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-sibs-muted">
              Employment Offer · Candidate Pipeline
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!previewUrl || loading}
              onClick={handleDownload}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-[10px] bg-sibs-navy px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={14} className="text-sibs-orange" />
              Download
            </button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[10px] bg-slate-50 text-center">
          <Loader2 size={30} className="animate-spin text-sibs-navy" />
          <p className="mt-4 text-sm font-extrabold text-sibs-navy">
            Loading Employment Offer PDF...
          </p>
        </div>
      ) : errorMessage ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[10px] border border-red-100 bg-red-50 p-8 text-center">
          <FileText size={36} className="text-red-600" />
          <p className="mt-4 text-sm font-extrabold text-red-700">
            Employment Offer preview unavailable
          </p>
          <p className="mt-2 max-w-xl text-xs font-semibold leading-5 text-red-600">
            {errorMessage}
          </p>
        </div>
      ) : previewUrl ? (
        <iframe
          src={previewUrl}
          title={displayFilename}
          className="h-[68dvh] min-h-[520px] w-full rounded-[10px] border border-sibs-border"
        />
      ) : (
        <div className="flex min-h-[420px] items-center justify-center rounded-[10px] bg-slate-50 text-sm font-bold text-sibs-muted">
          No PDF preview is available.
        </div>
      )}
    </ModalShell>
  );
}
