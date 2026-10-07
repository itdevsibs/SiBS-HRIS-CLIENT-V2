import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSignature,
  Loader2,
  Pencil,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import { useParams } from "react-router-dom";

function getPublicApiBaseUrl() {
  const rawBaseUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://sibs-hris-server.getleadsource.com";

  return String(rawBaseUrl)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
}

const PUBLIC_API_BASE_URL = getPublicApiBaseUrl();

function getPublicOfferResponseUrl(token = "") {
  return `${PUBLIC_API_BASE_URL}/api/candidate-pipeline/public/offer-response/${encodeURIComponent(
    token,
  )}`;
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n)
    ? new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(n)
    : "—";
}

function validateSignatureLikeImage(image) {
  const sourceWidth = Math.max(
    Number(
      image?.naturalWidth ||
        image?.width ||
        0,
    ),
    0,
  );
  const sourceHeight = Math.max(
    Number(
      image?.naturalHeight ||
        image?.height ||
        0,
    ),
    0,
  );

  if (
    sourceWidth < 120 ||
    sourceHeight < 35
  ) {
    throw new Error(
      "The image is too small to be accepted as a signature. Please upload a clear, cropped signature image.",
    );
  }

  const sourceAspect =
    sourceWidth / Math.max(sourceHeight, 1);

  if (
    sourceAspect < 1.35 ||
    sourceAspect > 12
  ) {
    throw new Error(
      "Only a cropped handwritten signature image is allowed. Photos, profile pictures, screenshots, logos, and documents are not accepted.",
    );
  }

  const maxAnalysisWidth = 360;
  const maxAnalysisHeight = 160;
  const ratio = Math.min(
    maxAnalysisWidth / sourceWidth,
    maxAnalysisHeight / sourceHeight,
    1,
  );

  const canvas =
    document.createElement("canvas");

  canvas.width = Math.max(
    Math.round(sourceWidth * ratio),
    1,
  );
  canvas.height = Math.max(
    Math.round(sourceHeight * ratio),
    1,
  );

  const context = canvas.getContext(
    "2d",
    {
      willReadFrequently: true,
    },
  );

  if (!context) {
    throw new Error(
      "Unable to validate the signature image.",
    );
  }

  context.clearRect(
    0,
    0,
    canvas.width,
    canvas.height,
  );
  context.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const imageData = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const pixels = imageData.data;
  const pixelCount =
    canvas.width * canvas.height;

  let backgroundPixels = 0;
  let foregroundPixels = 0;
  let saturatedPixels = 0;

  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = -1;
  let maxY = -1;

  const foregroundMask =
    new Uint8Array(pixelCount);

  for (
    let index = 0;
    index < pixelCount;
    index += 1
  ) {
    const offset = index * 4;

    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    const alpha =
      pixels[offset + 3] / 255;

    const maxChannel = Math.max(
      red,
      green,
      blue,
    );
    const minChannel = Math.min(
      red,
      green,
      blue,
    );

    const saturation =
      maxChannel <= 0
        ? 0
        : (maxChannel - minChannel) /
          maxChannel;

    const luminance =
      0.2126 * red +
      0.7152 * green +
      0.0722 * blue;

    const isTransparent =
      alpha < 0.08;

    const isPlainLightBackground =
      alpha >= 0.08 &&
      luminance >= 238 &&
      saturation <= 0.18;

    if (
      isTransparent ||
      isPlainLightBackground
    ) {
      backgroundPixels += 1;
    }

    const isForeground =
      alpha >= 0.1 &&
      (
        luminance < 215 ||
        (
          saturation >= 0.28 &&
          luminance < 235
        )
      );

    if (!isForeground) {
      continue;
    }

    foregroundPixels += 1;
    foregroundMask[index] = 1;

    if (
      saturation >= 0.42 &&
      luminance < 230
    ) {
      saturatedPixels += 1;
    }

    const x =
      index % canvas.width;
    const y = Math.floor(
      index / canvas.width,
    );

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  const backgroundRatio =
    backgroundPixels /
    Math.max(pixelCount, 1);

  const foregroundRatio =
    foregroundPixels /
    Math.max(pixelCount, 1);

  const saturatedRatio =
    saturatedPixels /
    Math.max(pixelCount, 1);

  if (backgroundRatio < 0.7) {
    throw new Error(
      "Only signature images on a plain white or transparent background are accepted. Photos, screenshots, and other non-signature images are not allowed.",
    );
  }

  if (
    foregroundRatio < 0.002 ||
    foregroundRatio > 0.22
  ) {
    throw new Error(
      "The uploaded image does not look like a handwritten signature. Please upload a cropped image containing only your signature.",
    );
  }

  if (saturatedRatio > 0.08) {
    throw new Error(
      "The uploaded image contains too much color to be accepted as a signature. Please upload only your handwritten signature on a white or transparent background.",
    );
  }

  if (
    maxX < minX ||
    maxY < minY
  ) {
    throw new Error(
      "No visible signature strokes were detected.",
    );
  }

  const boundsWidth =
    maxX - minX + 1;
  const boundsHeight =
    maxY - minY + 1;

  const boundsAspect =
    boundsWidth /
    Math.max(boundsHeight, 1);

  const boundsCoverage =
    foregroundPixels /
    Math.max(
      boundsWidth * boundsHeight,
      1,
    );

  if (
    boundsWidth <
      canvas.width * 0.22 ||
    boundsHeight <
      canvas.height * 0.08 ||
    boundsAspect < 1.25
  ) {
    throw new Error(
      "The uploaded image does not have enough signature-like strokes. Please upload a cropped handwritten signature only.",
    );
  }

  if (boundsCoverage > 0.5) {
    throw new Error(
      "The uploaded image is too dense to be accepted as a signature. Photos, logos, filled graphics, screenshots, and documents are not allowed.",
    );
  }

  // Count meaningful connected foreground groups.
  // Text-heavy screenshots and documents normally create many
  // disconnected components, while a handwritten signature tends
  // to contain a much smaller number of connected stroke groups.
  const visited =
    new Uint8Array(pixelCount);
  const stack = [];
  let significantComponents = 0;

  for (
    let index = 0;
    index < pixelCount;
    index += 1
  ) {
    if (
      !foregroundMask[index] ||
      visited[index]
    ) {
      continue;
    }

    visited[index] = 1;
    stack.length = 0;
    stack.push(index);

    let componentSize = 0;

    while (stack.length > 0) {
      const current =
        stack.pop();

      componentSize += 1;

      const x =
        current % canvas.width;
      const y = Math.floor(
        current / canvas.width,
      );

      const neighbors = [
        current - 1,
        current + 1,
        current - canvas.width,
        current + canvas.width,
      ];

      neighbors.forEach(
        (neighbor, neighborIndex) => {
          if (
            neighbor < 0 ||
            neighbor >= pixelCount
          ) {
            return;
          }

          if (
            neighborIndex === 0 &&
            x === 0
          ) {
            return;
          }

          if (
            neighborIndex === 1 &&
            x === canvas.width - 1
          ) {
            return;
          }

          if (
            (
              neighborIndex === 2 &&
              y === 0
            ) ||
            (
              neighborIndex === 3 &&
              y ===
                canvas.height - 1
            )
          ) {
            return;
          }

          if (
            !foregroundMask[neighbor] ||
            visited[neighbor]
          ) {
            return;
          }

          visited[neighbor] = 1;
          stack.push(neighbor);
        },
      );
    }

    if (componentSize >= 3) {
      significantComponents += 1;
    }
  }

  if (significantComponents > 24) {
    throw new Error(
      "The uploaded image contains too many separate elements to be accepted as a signature. Please upload only a cropped handwritten signature.",
    );
  }
}

async function signatureFileToPngDataUrl(file) {
  const allowedTypes = new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ]);

  if (
    !file ||
    !allowedTypes.has(
      String(file.type || "")
        .toLowerCase(),
    )
  ) {
    throw new Error(
      "Only PNG, JPG, JPEG, or WEBP signature images are allowed.",
    );
  }

  if (
    Number(file.size || 0) >
    5 * 1024 * 1024
  ) {
    throw new Error(
      "Signature image must not exceed 5 MB.",
    );
  }

  const objectUrl =
    URL.createObjectURL(file);

  try {
    const image =
      await new Promise(
        (resolve, reject) => {
          const preview =
            new Image();

          preview.onload = () =>
            resolve(preview);

          preview.onerror = () =>
            reject(
              new Error(
                "Unable to read the signature image.",
              ),
            );

          preview.src =
            objectUrl;
        },
      );

    // Reject non-signature images before converting/saving.
    validateSignatureLikeImage(
      image,
    );

    const render = (
      maxWidth,
      maxHeight,
    ) => {
      const width = Math.max(
        Number(
          image.naturalWidth ||
            image.width ||
            1,
        ),
        1,
      );

      const height = Math.max(
        Number(
          image.naturalHeight ||
            image.height ||
            1,
        ),
        1,
      );

      const ratio = Math.min(
        maxWidth / width,
        maxHeight / height,
        1,
      );

      const canvas =
        document.createElement(
          "canvas",
        );

      canvas.width = Math.max(
        Math.round(
          width * ratio,
        ),
        1,
      );

      canvas.height = Math.max(
        Math.round(
          height * ratio,
        ),
        1,
      );

      const context =
        canvas.getContext("2d");

      if (!context) {
        throw new Error(
          "Unable to prepare the signature image.",
        );
      }

      context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height,
      );

      context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      return canvas.toDataURL(
        "image/png",
      );
    };

    let dataUrl = render(
      600,
      200,
    );

    if (
      dataUrl.length > 180000
    ) {
      dataUrl = render(
        450,
        150,
      );
    }

    if (
      dataUrl.length > 180000
    ) {
      dataUrl = render(
        320,
        110,
      );
    }

    if (
      dataUrl.length > 220000
    ) {
      throw new Error(
        "The signature image is still too large. Please use a simpler cropped signature image.",
      );
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(
      objectUrl,
    );
  }
}

export default function PublicOfferResponsePage() {
  const { token = "" } = useParams();
  const [state, setState] = useState({
    loading: true,
    error: "",
    data: null,
    action: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [signatureFilename, setSignatureFilename] = useState("");
  const [signatureErrorModal, setSignatureErrorModal] = useState("");
  const [drawSignatureOpen, setDrawSignatureOpen] = useState(false);
  const [drawSignatureHasStroke, setDrawSignatureHasStroke] = useState(false);
  const drawSignatureCanvasRef = useRef(null);
  const drawSignatureDrawingRef = useRef(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    let active = true;

    fetch(getPublicOfferResponseUrl(token))
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.message || "Unable to load offer.");
        }

        if (active) {
          setState({
            loading: false,
            error: "",
            data: payload.data,
            action: payload.action,
          });
        }
      })
      .catch((error) => {
        if (active) {
          setState({
            loading: false,
            error: error.message,
            data: null,
            action: "",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!drawSignatureOpen) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const canvas = drawSignatureCanvasRef.current;

      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(
        Math.max(window.devicePixelRatio || 1, 1),
        2,
      );

      canvas.width = Math.max(
        Math.round(rect.width * ratio),
        1,
      );
      canvas.height = Math.max(
        Math.round(rect.height * ratio),
        1,
      );

      const context = canvas.getContext("2d");

      if (!context) return;

      context.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0,
      );
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2.4;
      context.strokeStyle = "rgb(17, 24, 39)";
      context.clearRect(
        0,
        0,
        rect.width,
        rect.height,
      );

      drawSignatureDrawingRef.current = false;
      setDrawSignatureHasStroke(false);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      drawSignatureDrawingRef.current = false;
    };
  }, [drawSignatureOpen]);

  const actionLabel =
    state.action === "accept" ? "Accept Offer" : "Negotiate Offer";

  const total = useMemo(
    () =>
      Number(state.data?.basicPay || 0) +
      Number(state.data?.deminimisDailyRate || 0),
    [state.data],
  );

  async function handleSignatureChange(event) {
    const file = event.target.files?.[0] || null;
    event.target.value = "";

    if (!file) return;

    setSignatureLoading(true);
    setSignatureErrorModal("");
    setState((current) => ({ ...current, error: "" }));

    try {
      const dataUrl = await signatureFileToPngDataUrl(file);
      setSignatureDataUrl(dataUrl);
      setSignatureFilename(file.name || "signature.png");
    } catch (error) {
      setSignatureDataUrl("");
      setSignatureFilename("");
      setSignatureErrorModal(
        error?.message ||
          "Unable to prepare the signature image.",
      );
    } finally {
      setSignatureLoading(false);
    }
  }

  function removeSignature() {
    if (submitting) return;
    setSignatureDataUrl("");
    setSignatureFilename("");
  }

  function getDrawSignaturePoint(event) {
    const canvas = drawSignatureCanvasRef.current;

    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function handleDrawSignaturePointerDown(event) {
    if (submitting || signatureLoading) return;

    const canvas = drawSignatureCanvasRef.current;
    const point = getDrawSignaturePoint(event);

    if (!canvas || !point) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    event.preventDefault();

    if (typeof canvas.setPointerCapture === "function") {
      canvas.setPointerCapture(event.pointerId);
    }

    drawSignatureDrawingRef.current = true;

    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(
      point.x + 0.01,
      point.y + 0.01,
    );
    context.stroke();

    setDrawSignatureHasStroke(true);
  }

  function handleDrawSignaturePointerMove(event) {
    if (
      !drawSignatureDrawingRef.current ||
      submitting ||
      signatureLoading
    ) {
      return;
    }

    const canvas = drawSignatureCanvasRef.current;
    const point = getDrawSignaturePoint(event);

    if (!canvas || !point) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    event.preventDefault();

    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stopDrawSignature(event) {
    drawSignatureDrawingRef.current = false;

    const canvas = drawSignatureCanvasRef.current;

    if (
      canvas &&
      event?.pointerId !== undefined &&
      typeof canvas.hasPointerCapture === "function" &&
      canvas.hasPointerCapture(event.pointerId) &&
      typeof canvas.releasePointerCapture === "function"
    ) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  function clearDrawSignature() {
    const canvas = drawSignatureCanvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );
    context.restore();

    drawSignatureDrawingRef.current = false;
    setDrawSignatureHasStroke(false);
  }

  function closeDrawSignature() {
    if (submitting || signatureLoading) return;

    setDrawSignatureOpen(false);
    drawSignatureDrawingRef.current = false;
    setDrawSignatureHasStroke(false);
  }

  function useDrawnSignature() {
    if (
      submitting ||
      signatureLoading ||
      !drawSignatureHasStroke
    ) {
      return;
    }

    const canvas = drawSignatureCanvasRef.current;

    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");

    setSignatureDataUrl(dataUrl);
    setSignatureFilename("Drawn signature");
    setDrawSignatureOpen(false);
    drawSignatureDrawingRef.current = false;
    setDrawSignatureHasStroke(false);
    setState((current) => ({
      ...current,
      error: "",
    }));
  }

  async function submit() {
    if (state.action === "negotiate" && !message.trim()) return;
    if (state.action === "accept" && !signatureDataUrl) return;

    setSubmitting(true);
    setState((current) => ({ ...current, error: "" }));

    try {
      const response = await fetch(getPublicOfferResponseUrl(token), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: state.action,
          message: message.trim(),
          signatureDataUrl:
            state.action === "accept" ? signatureDataUrl : "",
        }),
      });
      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to submit response.");
      }

      setResult(payload.message || "Your response was submitted.");
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 font-jakarta">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-[14px] border border-sibs-border bg-white shadow-xl">
        <header className="bg-sibs-navy px-6 py-5 text-white">
          <img
            src="/SiBSLogoWhite.png"
            alt="SiBS"
            className="mx-auto h-24 w-auto max-w-[360px] sm:h-28"
          />
          <h1 className="mt-4 text-center text-2xl font-extrabold">
            Employment Offer Response
          </h1>
        </header>

        <div className="p-6 sm:p-8">
          {state.loading ? (
            <p className="text-center font-bold text-sibs-muted">
              Loading your offer...
            </p>
          ) : null}

          {state.error ? (
            <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
              {state.error}
            </div>
          ) : null}

          {result ? (
            <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 p-5 text-center font-bold text-emerald-800">
              {result}
            </div>
          ) : null}

          {!state.loading && !result && state.data ? (
            <div className="space-y-5">
              <p className="text-lg font-bold text-sibs-navy">
                Hi {state.data.candidateName},
              </p>
              <p className="text-sm leading-6 text-slate-600">
                Review the approved Employment Offer PDF sent to your email and
                the offer details below before confirming your response.
              </p>

              <div className="grid gap-3 rounded-[10px] border border-sibs-border bg-slate-50 p-5 sm:grid-cols-2">
                <p>
                  <b>Final Role:</b>
                  <br />
                  {state.data.finalRole}
                </p>
                <p>
                  <b>Final Account:</b>
                  <br />
                  {state.data.finalAccount}
                </p>
                <p>
                  <b>Basic Daily Rate:</b>
                  <br />
                  {money(state.data.basicPay)}
                </p>
                <p>
                  <b>Daily De Minimis:</b>
                  <br />
                  {money(state.data.deminimisDailyRate)}
                </p>
                <p>
                  <b>Total Daily Rate:</b>
                  <br />
                  {money(total)}
                </p>
                <p>
                  <b>Offer Version:</b>
                  <br />
                  {state.data.offerVersion}
                </p>
              </div>

              {state.action === "negotiate" ? (
                <label className="block">
                  <span className="text-sm font-extrabold text-sibs-navy">
                    Negotiation message
                  </span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={5}
                    className="mt-2 w-full rounded-[10px] border border-sibs-border p-3 outline-none focus:border-sibs-orange"
                    placeholder="Explain the changes you would like HR to review."
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                    By accepting, you confirm that you have reviewed and
                    accepted this Employment Offer. Upload or draw your signature
                    first to enable the Accept Offer button.
                  </div>

                  <div className="rounded-[10px] border border-sibs-border bg-white p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-orange-50 text-sibs-orange">
                        <FileSignature size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-sibs-navy">
                          Candidate Signature
                        </p>
                        <p className="mt-0.5 text-xs font-medium leading-5 text-sibs-muted">
                          Upload a cropped handwritten signature image only (PNG, JPG, or WEBP), or draw
                          your signature if you do not have a signature file.
                          The signature will be added to the accepted Employment
                          Offer document.
                        </p>
                      </div>
                    </div>

                    {signatureDataUrl ? (
                      <div className="mt-4 rounded-[10px] border border-emerald-200 bg-emerald-50/60 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-emerald-800">
                            <CheckCircle2 size={17} className="shrink-0" />
                            <span className="truncate">
                              {signatureFilename || "Signature uploaded"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={removeSignature}
                            disabled={submitting}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            aria-label="Remove signature"
                            title="Remove signature"
                          >
                            <X size={15} />
                          </button>
                        </div>
                        <div className="mt-3 flex min-h-24 items-center justify-center rounded-[10px] border border-sibs-border bg-white p-3">
                          <img
                            src={signatureDataUrl}
                            alt="Candidate signature preview"
                            className="max-h-24 max-w-full object-contain"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="h-px flex-1 bg-sibs-border" />
                          <span className="shrink-0 rounded-full border border-sibs-border bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-sibs-muted">
                            Choose one signature method
                          </span>
                          <div className="h-px flex-1 bg-sibs-border" />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className={`group relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-sibs-border bg-slate-50 px-4 py-5 text-center transition ${
                            signatureLoading || submitting
                              ? "cursor-not-allowed opacity-50"
                              : "hover:border-sibs-orange hover:bg-orange-50/50"
                          }`}>
                            <span className="absolute left-3 top-3 rounded-full bg-white px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted shadow-sm">
                              Option 1
                            </span>

                            {signatureLoading ? (
                              <Loader2
                                size={18}
                                className="animate-spin text-sibs-navy"
                              />
                            ) : (
                              <Upload
                                size={18}
                                className="text-sibs-orange"
                              />
                            )}

                            <span className="text-sm font-extrabold text-sibs-navy">
                              {signatureLoading
                                ? "Preparing Signature..."
                                : "Upload Signature"}
                            </span>

                            <span className="text-[10px] font-semibold text-sibs-muted">
                              Signature image only
                            </span>

                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={handleSignatureChange}
                              disabled={
                                signatureLoading ||
                                submitting
                              }
                              className="sr-only"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() =>
                              setDrawSignatureOpen(true)
                            }
                            disabled={
                              signatureLoading ||
                              submitting
                            }
                            className="relative flex flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-sibs-border bg-slate-50 px-4 py-5 text-center transition hover:border-sibs-orange hover:bg-orange-50/50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <span className="absolute left-3 top-3 rounded-full bg-white px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted shadow-sm">
                              Option 2
                            </span>

                            <Pencil
                              size={18}
                              className="text-sibs-orange"
                            />

                            <span className="text-sm font-extrabold text-sibs-navy">
                              Draw Signature
                            </span>

                            <span className="text-[10px] font-semibold text-sibs-muted">
                              Draw using mouse, touch, or stylus
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {state.action === "negotiate" || signatureDataUrl ? (
                <button
                  type="button"
                  disabled={
                    submitting ||
                    signatureLoading ||
                    (state.action === "negotiate" && !message.trim())
                  }
                  onClick={submit}
                  className="w-full rounded-[10px] bg-sibs-orange px-5 py-3 font-extrabold text-white transition hover:opacity-95 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : actionLabel}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {drawSignatureOpen ? (
        <div
          className="fixed inset-0 z-[12000] flex items-center justify-center bg-sibs-navy/65 p-4 backdrop-blur-[2px]"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeDrawSignature();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="candidate-draw-signature-title"
            className="w-full max-w-xl overflow-hidden rounded-[14px] border border-white/60 bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <header className="flex items-start justify-between gap-3 bg-sibs-navy px-5 py-4 text-white">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-sibs-orange">
                  <Pencil size={17} />
                </span>

                <div className="min-w-0">
                  <h2
                    id="candidate-draw-signature-title"
                    className="text-base font-extrabold"
                  >
                    Draw Your Signature
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold leading-5 text-white/75">
                    Sign inside the box using your mouse,
                    touchscreen, or stylus.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDrawSignature}
                disabled={
                  submitting ||
                  signatureLoading
                }
                className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-white/75 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                aria-label="Close draw signature"
              >
                <X size={18} />
              </button>
            </header>

            <div className="p-5">
              <div className="rounded-[10px] border border-sibs-border bg-slate-50 p-3">
                <canvas
                  ref={drawSignatureCanvasRef}
                  className="block h-[220px] w-full cursor-crosshair touch-none rounded-[10px] border border-dashed border-sibs-border bg-white"
                  onPointerDown={
                    handleDrawSignaturePointerDown
                  }
                  onPointerMove={
                    handleDrawSignaturePointerMove
                  }
                  onPointerUp={stopDrawSignature}
                  onPointerCancel={
                    stopDrawSignature
                  }
                  onPointerLeave={(event) => {
                    if (event.buttons === 0) {
                      stopDrawSignature(event);
                    }
                  }}
                />

                <p className="mt-2 text-xs font-medium leading-5 text-sibs-muted">
                  Draw only your signature. It will be
                  attached to the Employment Offer exactly
                  like an uploaded signature image.
                </p>
              </div>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-sibs-border bg-slate-50 px-5 py-3.5">
              <button
                type="button"
                onClick={clearDrawSignature}
                disabled={
                  submitting ||
                  signatureLoading ||
                  !drawSignatureHasStroke
                }
                className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-sibs-border bg-white px-4 text-sm font-extrabold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Clear
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeDrawSignature}
                  disabled={
                    submitting ||
                    signatureLoading
                  }
                  className="inline-flex h-10 items-center justify-center rounded-[10px] border border-sibs-border bg-white px-4 text-sm font-extrabold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={useDrawnSignature}
                  disabled={
                    submitting ||
                    signatureLoading ||
                    !drawSignatureHasStroke
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-sibs-orange px-4 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  Use Signature
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}

      {signatureErrorModal ? (
        <div
          className="fixed inset-0 z-[13000] flex items-center justify-center bg-sibs-navy/65 p-4 backdrop-blur-[2px]"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSignatureErrorModal("");
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="signature-upload-error-title"
            aria-describedby="signature-upload-error-message"
            className="w-full max-w-md overflow-hidden rounded-[14px] border border-white/60 bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <header className="flex items-start justify-between gap-3 bg-sibs-navy px-5 py-4 text-white">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-sibs-orange text-white">
                  <AlertTriangle size={17} />
                </span>

                <div className="min-w-0">
                  <h2
                    id="signature-upload-error-title"
                    className="text-base font-extrabold"
                  >
                    Invalid Signature Image
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSignatureErrorModal("")
                }
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-white/75 transition hover:bg-white/10 hover:text-white"
                aria-label="Close signature error"
              >
                <X size={18} />
              </button>
            </header>

            <div className="p-5">
              <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
                <p
                  id="signature-upload-error-message"
                  className="text-sm font-semibold leading-6 text-red-700"
                >
                  {signatureErrorModal}
                </p>
              </div>

            </div>

            <footer className="flex justify-end border-t border-sibs-border bg-slate-50 px-5 py-3.5">
              <button
                type="button"
                onClick={() =>
                  setSignatureErrorModal("")
                }
                className="inline-flex h-10 items-center justify-center rounded-[10px] bg-sibs-navy px-5 text-sm font-extrabold text-white transition hover:opacity-90"
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}
