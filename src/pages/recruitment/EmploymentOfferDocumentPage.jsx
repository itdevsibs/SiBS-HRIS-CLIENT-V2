import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Download,
  FileText,
  History,
  Loader2,
  Pencil,
  Printer,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";

import DOMPurify from "dompurify";
import Header from "../../components/layout/Header";
import StatusModal from "../../components/modals/StatusModal";
import { useUser } from "../../services/context/UserContext";
import { useOffers } from "../../services/context/OffersContext";
import {
  getEmploymentOfferDocument,
  getEmploymentOfferPdfUrl,
  saveEmploymentOfferDocument,
} from "../../lib/axios/employmentOfferDocument";

function cleanText(value) {
  return String(value ?? "").trim();
}

function getCurrentUserSibsId(user = {}) {
  const currentUser =
    Array.isArray(user)
      ? user[0] || {}
      : user || {};

  const candidates = [
    currentUser.sibsId,
    currentUser.sibs_id,
    currentUser.gy_emp_id,
    currentUser.employeeId,
    currentUser.employee_id,
    currentUser.employeeNumber,
    currentUser.employee_number,
  ];

  for (const candidate of candidates) {
    const value = cleanText(candidate);

    if (/^\d+$/.test(value)) {
      return value;
    }
  }

  return "";
}

function getAdminAccess(user = {}) {
  const currentUser = Array.isArray(user) ? user[0] || {} : user || {};
  const direct = Number(
    currentUser.adminAccess ??
      currentUser.admin_access ??
      currentUser.gy_user_access ??
      currentUser.access ??
      0,
  );

  if (Number.isFinite(direct) && direct > 0) return direct;

  const assigned = Array.isArray(currentUser.assignedAccounts)
    ? currentUser.assignedAccounts
        .flatMap((item) => [item?.adminAccess, item?.admin_access, item?.access])
        .map(Number)
        .filter(Number.isFinite)
    : [];

  return assigned.length ? Math.max(...assigned) : 0;
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function normalizeEmploymentOfferCompensationHtml(value = "") {
  const source = String(value || "").trim();

  if (
    !source ||
    typeof DOMParser === "undefined" ||
    !/Basic Daily Rate/i.test(source) ||
    !/Daily De Minimis/i.test(source) ||
    !/Total:/i.test(source)
  ) {
    return source;
  }

  const parsed = new DOMParser().parseFromString(source, "text/html");
  const paragraphs = Array.from(parsed.body.querySelectorAll("p"));

  const compensationParagraph = paragraphs.find((paragraph) => {
    const text = String(paragraph.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return (
      /Basic Daily Rate/i.test(text) &&
      /Daily De Minimis/i.test(text) &&
      /Total:/i.test(text)
    );
  });

  if (!compensationParagraph) return source;

  const lineHtml = compensationParagraph.innerHTML
    .split(/<br\s*\/?\s*>/i)
    .map((line) => line.trim())
    .filter(Boolean);

  const lineText = lineHtml.map((line) => {
    const wrapper = parsed.createElement("div");
    wrapper.innerHTML = line;
    return String(wrapper.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  });

  const definitions = [
    ["Basic Daily Rate", lineText.find((line) => /^Basic Daily Rate/i.test(line))],
    ["Daily De Minimis", lineText.find((line) => /^Daily De Minimis/i.test(line))],
    ["Total:", lineText.find((line) => /^Total:/i.test(line))],
  ];

  if (definitions.some(([, line]) => !line)) return source;

  const fragment = parsed.createDocumentFragment();

  definitions.forEach(([label, line]) => {
    const amountMatch = String(line).match(/(?:₱|PHP|P)?\s*([0-9][0-9,.]*)\s*$/i);
    const amount = amountMatch?.[1] || "0.00";
    const paragraph = parsed.createElement("p");
    paragraph.append(document.createTextNode(`${label} `));
    const currency = parsed.createElement("strong");
    currency.textContent = "₱";
    paragraph.append(currency);
    paragraph.append(document.createTextNode(` ${amount}`));
    fragment.append(paragraph);
  });

  compensationParagraph.replaceWith(fragment);

  return parsed.body.innerHTML.trim();
}


function normalizeEmploymentOfferLayoutText(value = "") {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatEmploymentOfferSignedDate(value) {
  const source = cleanText(value);

  if (!source) return "";

  const parsed = new Date(source);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(parsed);
}


function getEmploymentOfferManagerSignatureDetails(
  value = "",
) {
  const source = String(value || "").trim();

  if (
    !source ||
    typeof DOMParser === "undefined"
  ) {
    return {
      signatureDataUrl: "",
      signatureSibsId: "",
      approverSibsId: "",
    };
  }

  const parsed = new DOMParser().parseFromString(
    source,
    "text/html",
  );
  const body = parsed.body;

  const approverBlock =
    body.querySelector(
      '[data-employment-offer-approver-block="true"]',
    );

  const signatureImage =
    body.querySelector(
      'img[data-employment-offer-manager-signature="true"]',
    );

  const approverSibsId = cleanText(
    approverBlock?.getAttribute(
      "data-employment-offer-approver-sibs-id",
    ),
  );

  const signatureSibsId =
    cleanText(
      signatureImage?.getAttribute(
        "data-employment-offer-manager-signature-sibs-id",
      ),
    ) || approverSibsId;

  const signatureDataUrl = cleanText(
    signatureImage?.getAttribute("src"),
  );

  return {
    signatureDataUrl:
      /^data:image\/(?:png|jpeg|jpg|webp);base64,/i.test(
        signatureDataUrl,
      )
        ? signatureDataUrl
        : "",
    signatureSibsId,
    approverSibsId,
  };
}

function hasEmploymentOfferManagerSignature(value = "") {
  return Boolean(
    getEmploymentOfferManagerSignatureDetails(
      value,
    ).signatureDataUrl,
  );
}

function removeEmploymentOfferManagerSignatureHtml(
  value = "",
) {
  const source = String(value || "").trim();

  if (!source || typeof DOMParser === "undefined") {
    return source;
  }

  const parsed = new DOMParser().parseFromString(
    source,
    "text/html",
  );
  const body = parsed.body;

  const signatureImage = body.querySelector(
    'img[data-employment-offer-manager-signature="true"]',
  );

  if (!signatureImage) {
    return body.innerHTML.trim();
  }

  const signatureContainer =
    signatureImage.closest(
      '[data-employment-offer-manager-signature-container="true"]',
    ) || signatureImage.parentElement;

  if (
    signatureContainer &&
    signatureContainer !== body
  ) {
    signatureContainer.remove();
  } else {
    signatureImage.remove();
  }

  return body.innerHTML.trim();
}

function upsertEmploymentOfferManagerSignatureHtml(
  value = "",
  signatureDataUrl = "",
) {
  const source = String(value || "").trim();

  if (
    !source ||
    !signatureDataUrl ||
    typeof DOMParser === "undefined"
  ) {
    return source;
  }

  const parsed = new DOMParser().parseFromString(source, "text/html");
  const body = parsed.body;

  const paragraphs = Array.from(body.querySelectorAll("p"));
  const managerParagraph =
    body.querySelector(
      '[data-employment-offer-approver-block="true"]',
    ) ||
    paragraphs.find((paragraph) => {
      const textValue = normalizeEmploymentOfferLayoutText(
        paragraph.textContent,
      );

      return (
        /HASSANOR M\. SUMAGUINA/i.test(textValue) ||
        /Senior Corporate Services Manager/i.test(textValue)
      );
    });

  if (!managerParagraph?.parentNode) {
    throw new Error(
      "The Employment Offer approver block was not found.",
    );
  }

  const signerSibsId = cleanText(
    managerParagraph.getAttribute(
      "data-employment-offer-approver-sibs-id",
    ),
  );
  const existingImage = body.querySelector(
    'img[data-employment-offer-manager-signature="true"]',
  );

  if (existingImage) {
    existingImage.setAttribute("src", signatureDataUrl);
    if (signerSibsId) {
      existingImage.setAttribute(
        "data-employment-offer-manager-signature-sibs-id",
        signerSibsId,
      );
    }
    return body.innerHTML.trim();
  }

  const signatureContainer = parsed.createElement("p");
  signatureContainer.setAttribute(
    "data-employment-offer-manager-signature-container",
    "true",
  );

  const signatureImage = parsed.createElement("img");
  signatureImage.setAttribute(
    "data-employment-offer-manager-signature",
    "true",
  );
  signatureImage.setAttribute("src", signatureDataUrl);
  if (signerSibsId) {
    signatureImage.setAttribute(
      "data-employment-offer-manager-signature-sibs-id",
      signerSibsId,
    );
  }
  signatureImage.setAttribute(
    "alt",
    "Employment Offer approver signature",
  );
  signatureImage.setAttribute(
    "style",
    "display:block;width:auto;max-width:42mm;max-height:16mm;object-fit:contain;margin:0;",
  );

  signatureContainer.appendChild(signatureImage);
  managerParagraph.parentNode.insertBefore(
    signatureContainer,
    managerParagraph,
  );

  return body.innerHTML.trim();
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
      "The image is too small to be accepted as a signature. Upload a clear, cropped signature image.",
    );
  }

  const sourceAspect =
    sourceWidth / Math.max(sourceHeight, 1);

  if (
    sourceAspect < 1.35 ||
    sourceAspect > 12
  ) {
    throw new Error(
      "Only a cropped signature image is allowed. The uploaded image does not have a signature-like shape.",
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

  const context =
    canvas.getContext("2d", {
      willReadFrequently: true,
    });

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

  const foregroundMask = new Uint8Array(
    pixelCount,
  );

  for (
    let index = 0;
    index < pixelCount;
    index += 1
  ) {
    const offset = index * 4;

    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    const alpha = pixels[offset + 3] / 255;

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

    const x = index % canvas.width;
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
      "Only signature images on a plain white or transparent background are accepted. Photos, screenshots, and other images are not allowed.",
    );
  }

  if (
    foregroundRatio < 0.002 ||
    foregroundRatio > 0.22
  ) {
    throw new Error(
      "The uploaded image does not look like a signature. Use a cropped image containing only the handwritten signature.",
    );
  }

  if (saturatedRatio > 0.08) {
    throw new Error(
      "The uploaded image contains too much color to be accepted as a signature. Upload only the signature on a plain white or transparent background.",
    );
  }

  if (
    maxX < minX ||
    maxY < minY
  ) {
    throw new Error(
      "No visible signature strokes were detected in the uploaded image.",
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
      "The uploaded image does not have enough signature-like strokes. Upload a cropped handwritten signature only.",
    );
  }

  if (boundsCoverage > 0.5) {
    throw new Error(
      "The uploaded image is too dense to be accepted as a signature. Photos, logos, filled shapes, and screenshots are not allowed.",
    );
  }

  // Count connected foreground groups. A real handwritten signature
  // normally has a small number of stroke groups. Screenshots/text-heavy
  // images usually create many separate compact components.
  const visited = new Uint8Array(
    pixelCount,
  );
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
      const current = stack.pop();
      componentSize += 1;

      const x = current % canvas.width;
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
              y === canvas.height - 1
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
      "The uploaded image contains too many separate elements to be accepted as a signature. Upload only a cropped handwritten signature.",
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
      "Only Signature only · PNG, JPG, JPEG, or WEBP signature images are allowed.",
    );
  }

  if (Number(file.size || 0) > 5 * 1024 * 1024) {
    throw new Error(
      "Signature image must not exceed 5 MB.",
    );
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise((resolve, reject) => {
      const preview = new Image();

      preview.onload = () =>
        resolve(preview);
      preview.onerror = () =>
        reject(
          new Error(
            "Unable to read the signature image.",
          ),
        );
      preview.src = objectUrl;
    });

    validateSignatureLikeImage(image);

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
        document.createElement("canvas");
      canvas.width = Math.max(
        Math.round(width * ratio),
        1,
      );
      canvas.height = Math.max(
        Math.round(height * ratio),
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

    if (dataUrl.length > 180000) {
      dataUrl = render(
        450,
        150,
      );
    }

    if (dataUrl.length > 180000) {
      dataUrl = render(
        320,
        110,
      );
    }

    if (dataUrl.length > 220000) {
      throw new Error(
        "The signature image is still too large. Please use a simpler cropped signature image.",
      );
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function EmploymentOfferViewer({
  value = "",
  emptyText = "",
}) {
  const safeHtml = useMemo(() => {
    const source = String(value || "").trim();

    if (!source) return "";

    return DOMPurify.sanitize(source, {
      USE_PROFILES: {
        html: true,
      },
      ADD_ATTR: [
        "style",
        "class",
        "start",
        "value",
        "type",
      ],
    });
  }, [value]);

  if (!safeHtml) {
    return emptyText ? (
      <p className="text-sm text-[#667085]">
        {emptyText}
      </p>
    ) : null;
  }

  return (
    <div
      className="jd-rich-text-viewer employment-offer-viewer"
      dangerouslySetInnerHTML={{
        __html: safeHtml,
      }}
    />
  );
}

function splitEmploymentOfferDocumentPages(value = "") {
  const source = String(value || "").trim();

  if (!source) return [""];

  const explicitPages = source
    .split(/<hr\s*\/?\s*>/i)
    .map((page) => cleanText(page))
    .filter(Boolean);

  if (explicitPages.length > 1) {
    return explicitPages;
  }

  if (typeof DOMParser === "undefined") {
    return [source];
  }

  const parsed = new DOMParser().parseFromString(source, "text/html");
  const children = Array.from(parsed.body.children);
  const pageTwoIndex = children.findIndex((element) =>
    /^3\.\s*Pre-employment Requirements/i.test(
      normalizeEmploymentOfferLayoutText(element.textContent),
    ),
  );

  if (pageTwoIndex <= 0) {
    return [source];
  }

  const firstPage = children
    .slice(0, pageTwoIndex)
    .map((element) => element.outerHTML)
    .join("");
  const secondPage = children
    .slice(pageTwoIndex)
    .map((element) => element.outerHTML)
    .join("");

  return [firstPage, secondPage].filter(Boolean);
}

function decorateEmploymentOfferPageHtml(
  value = "",
  pageIndex = 0,
  candidatePrintedName = "",
  candidateSignatureDataUrl = "",
  candidateSignedAt = "",
) {
  const source = String(value || "").trim();

  if (!source || typeof DOMParser === "undefined") {
    return source;
  }

  const parsed = new DOMParser().parseFromString(source, "text/html");
  const body = parsed.body;
  const rootChildren = Array.from(body.children);

  const addClass = (element, ...classes) => {
    if (!element) return;
    classes.filter(Boolean).forEach((className) => element.classList.add(className));
  };

  const applyImportantStyles = (element, styles = {}) => {
    if (!element) return;

    Object.entries(styles).forEach(([property, value]) => {
      element.style.setProperty(property, value, "important");
    });
  };

  const elementText = (element) =>
    normalizeEmploymentOfferLayoutText(element?.textContent || "");

  const markParagraph = (matcher, ...classes) => {
    const element = rootChildren.find(
      (item) => item.tagName === "P" && matcher(elementText(item), item),
    );
    addClass(element, ...classes);
    return element;
  };

  const findFollowingBlockquote = (element) => {
    if (!element) return null;
    let sibling = element.nextElementSibling;

    while (sibling) {
      if (sibling.tagName === "BLOCKQUOTE") return sibling;
      if (sibling.tagName === "P") break;
      sibling = sibling.nextElementSibling;
    }

    return null;
  };

  const createSectionContentWrapper = (sectionElement, nextSectionElement, className) => {
    if (!sectionElement) return null;

    const wrapper = document.createElement("div");
    wrapper.className = className;

    let sibling = sectionElement.nextElementSibling;
    let hasContent = false;

    while (sibling && sibling !== nextSectionElement) {
      const current = sibling;
      sibling = sibling.nextElementSibling;

      if (current.tagName === "HR") {
        current.remove();
        continue;
      }

      if (current.tagName === "BLOCKQUOTE") {
        while (current.firstElementChild) {
          wrapper.appendChild(current.firstElementChild);
          hasContent = true;
        }
        current.remove();
        continue;
      }

      if (current.tagName === "P") {
        wrapper.appendChild(current);
        hasContent = true;
        continue;
      }

      current.remove();
    }

    if (!hasContent) return null;

    if (nextSectionElement?.parentNode) {
      nextSectionElement.parentNode.insertBefore(wrapper, nextSectionElement);
    } else {
      body.appendChild(wrapper);
    }

    return wrapper;
  };

  if (pageIndex === 0) {
    const title = markParagraph(
      (textValue) => textValue.toUpperCase() === "EMPLOYMENT OFFER",
      "eo-title",
    );

    if (title?.nextElementSibling?.tagName === "P") {
      const dateParagraph = title.nextElementSibling;
      addClass(dateParagraph, "eo-offer-date");

      const candidateParagraph =
        dateParagraph.nextElementSibling?.tagName === "P"
          ? dateParagraph.nextElementSibling
          : null;

      if (candidateParagraph) {
        addClass(candidateParagraph, "eo-candidate");

        const identityBlock = document.createElement("div");
        identityBlock.className = "eo-date-candidate-block";

        dateParagraph.parentNode?.insertBefore(
          identityBlock,
          dateParagraph,
        );

        const dateCandidateSpacer =
          document.createElement("div");
        dateCandidateSpacer.className =
          "eo-date-candidate-spacer";
        dateCandidateSpacer.setAttribute(
          "aria-hidden",
          "true",
        );

        identityBlock.append(
          dateParagraph,
          dateCandidateSpacer,
          candidateParagraph,
        );

        applyImportantStyles(identityBlock, {
          display: "flex",
          "flex-direction": "column",
          gap: "0",
          width: "100%",
        });

        applyImportantStyles(dateCandidateSpacer, {
          display: "block",
          width: "100%",
          height: "4.23mm",
          "min-height": "4.23mm",
          "flex-shrink": "0",
        });

        applyImportantStyles(dateParagraph, {
          margin: "0",
          padding: "0",
          "font-size": "10.5pt",
          "font-weight": "400",
          "line-height": "14pt",
        });

        applyImportantStyles(candidateParagraph, {
          margin: "0",
          padding: "0",
          "font-size": "10.5pt",
          "font-weight": "400",
          "line-height": "18pt",
        });

        const candidateName =
          candidateParagraph.querySelector("strong");

        if (candidateName) {
          applyImportantStyles(candidateName, {
            "font-size": "11pt",
            "font-weight": "700",
            "line-height": "18pt",
          });
        }
      }
    }

    const greetingParagraph = markParagraph(
      (textValue) => /^Dear\s+/i.test(textValue),
      "eo-greeting",
    );

    if (greetingParagraph) {
      const greetingText =
        normalizeEmploymentOfferLayoutText(
          greetingParagraph.textContent,
        );
      const greetingMatch = greetingText.match(
        /^Dear\s+(.+?)(,?)$/,
      );

      if (greetingMatch?.[1]) {
        greetingParagraph.innerHTML = "";
        greetingParagraph.append(
          document.createTextNode("Dear "),
        );

        const greetingName =
          document.createElement("strong");
        greetingName.className =
          "eo-greeting-name";
        greetingName.textContent =
          greetingMatch[1];

        applyImportantStyles(greetingName, {
          "font-weight": "700",
        });

        greetingParagraph.append(
          greetingName,
          document.createTextNode(
            greetingMatch[2] || "",
          ),
        );
      }
    }

    const congratulationsParagraph = markParagraph(
      (textValue) => /^Congratulations!/i.test(textValue),
      "eo-congratulations",
    );

    if (congratulationsParagraph) {
      const congratulationsText =
        normalizeEmploymentOfferLayoutText(
          congratulationsParagraph.textContent,
        );

      const boldRanges = [];

      const roleMatch =
        congratulationsText.match(
          /position of\s+(.+?)\s+here at\s+/i,
        );

      if (roleMatch?.[1]) {
        const roleStart =
          congratulationsText.indexOf(
            roleMatch[1],
          );

        if (roleStart >= 0) {
          boldRanges.push({
            start: roleStart,
            end:
              roleStart +
              roleMatch[1].length,
          });
        }
      }

      const companyMatch =
        congratulationsText.match(
          /\bSiBS\b/,
        );

      if (companyMatch?.[0]) {
        const companyStart =
          congratulationsText.indexOf(
            companyMatch[0],
          );

        if (companyStart >= 0) {
          boldRanges.push({
            start: companyStart,
            end:
              companyStart +
              companyMatch[0].length,
          });
        }
      }

      const addressMatch =
        congratulationsText.match(
          /located at\s+(.+?)(?=\.$|$)/i,
        );

      if (addressMatch?.[1]) {
        const addressStart =
          congratulationsText.indexOf(
            addressMatch[1],
          );

        if (addressStart >= 0) {
          boldRanges.push({
            start: addressStart,
            end:
              addressStart +
              addressMatch[1].length,
          });
        }
      }

      if (boldRanges.length > 0) {
        boldRanges.sort(
          (left, right) =>
            left.start - right.start,
        );

        congratulationsParagraph.innerHTML =
          "";

        let cursor = 0;

        boldRanges.forEach(
          ({ start, end }) => {
            if (start > cursor) {
              congratulationsParagraph.append(
                document.createTextNode(
                  congratulationsText.slice(
                    cursor,
                    start,
                  ),
                ),
              );
            }

            const boldText =
              document.createElement("strong");
            boldText.className =
              "eo-congratulations-bold";
            boldText.textContent =
              congratulationsText.slice(
                start,
                end,
              );

            applyImportantStyles(
              boldText,
              {
                "font-weight": "700",
              },
            );

            congratulationsParagraph.append(
              boldText,
            );
            cursor = end;
          },
        );

        if (
          cursor <
          congratulationsText.length
        ) {
          congratulationsParagraph.append(
            document.createTextNode(
              congratulationsText.slice(
                cursor,
              ),
            ),
          );
        }
      }
    }
    const startDateParagraph = markParagraph(
      (textValue) => /^Your start date is/i.test(textValue),
      "eo-start-date",
    );

    if (startDateParagraph) {
      const startDateText =
        normalizeEmploymentOfferLayoutText(
          startDateParagraph.textContent,
        );
      const dateMatch = startDateText.match(
        /[A-Za-z]+\s+\d{1,2},\s+\d{4}/,
      );

      if (dateMatch?.[0]) {
        const dateText = dateMatch[0];
        const dateIndex =
          startDateText.indexOf(dateText);

        if (dateIndex >= 0) {
          const beforeDate =
            startDateText.slice(0, dateIndex);
          const afterDate =
            startDateText.slice(
              dateIndex + dateText.length,
            );

          startDateParagraph.innerHTML = "";
          startDateParagraph.append(
            document.createTextNode(beforeDate),
          );

          const dateElement =
            document.createElement("strong");
          dateElement.className =
            "eo-start-date-value";
          dateElement.textContent = dateText;

          applyImportantStyles(dateElement, {
            "font-weight": "700",
          });

          startDateParagraph.append(
            dateElement,
            document.createTextNode(afterDate),
          );
        }
      }
    }

    const sectionOne = markParagraph(
      (textValue) => /^1\.\s*Term of Employment Contract/i.test(textValue),
      "eo-section-heading",
      "eo-section-one-heading",
    );
    const formatNumberedSectionHeading = (element) => {
      if (!element) return;

      const textValue = elementText(element);
      const match = textValue.match(/^(\d+)\.\s*(.+)$/);

      if (!match) return;

      element.innerHTML = "";

      const number = document.createElement("span");
      number.className = "eo-section-number";
      number.textContent = `${match[1]}.`;

      const titleText = document.createElement("span");
      titleText.className = "eo-section-title-text";
      titleText.textContent = match[2];

      element.append(number, titleText);

      applyImportantStyles(element, {
        display: "grid",
        "grid-template-columns": "8mm minmax(0, 1fr)",
        width: "161mm",
        "margin-top": "7.05mm",
        "margin-left": "7mm",
        "font-size": "10.5pt",
        "font-weight": "700",
        "line-height": "14pt",
      });

      applyImportantStyles(number, {
        display: "block",
        "text-align": "left",
        "font-weight": "700",
      });

      applyImportantStyles(titleText, {
        display: "block",
        "min-width": "0",
        "font-weight": "700",
      });
    };

    formatNumberedSectionHeading(sectionOne);

    const sectionTwo = markParagraph(
      (textValue) => /^2\.\s*Compensation and Other Benefits/i.test(textValue),
      "eo-section-heading",
      "eo-section-two-heading",
    );

    const sectionOneContent =
      createSectionContentWrapper(
        sectionOne,
        sectionTwo,
        "eo-section-content eo-section-one-content",
      ) || findFollowingBlockquote(sectionOne);
    addClass(sectionOneContent, "eo-section-body", "eo-section-one-body");

    if (sectionOneContent) {
      applyImportantStyles(sectionOneContent, {
        width: "146mm",
        "max-width": "146mm",
        margin: "7.05mm 0 9.17mm 15mm",
        border: "0",
        padding: "0",
      });

      const sectionOneParagraphs = Array.from(sectionOneContent.children).filter(
        (element) => element.tagName === "P",
      );

      sectionOneParagraphs.forEach((element, index) => {
        addClass(element, "eo-section-one-paragraph");
        applyImportantStyles(element, {
          width: "146mm",
          "max-width": "146mm",
          "font-size": "10.2pt",
          "font-weight": "400",
          "line-height": "13.2pt",
          "margin-top": index === 0 ? "0" : "7.05mm",
        });
      });
    }

    formatNumberedSectionHeading(sectionTwo);

    const sectionTwoContent =
      createSectionContentWrapper(
        sectionTwo,
        null,
        "eo-section-content eo-section-two-content",
      ) || findFollowingBlockquote(sectionTwo);
    addClass(sectionTwoContent, "eo-section-body", "eo-section-two-body");

    if (sectionTwoContent) {
      applyImportantStyles(sectionTwoContent, {
        width: "146mm",
        "max-width": "146mm",
        margin: "7.05mm 0 0 15mm",
        border: "0",
        padding: "0",
      });
    }

    const formatCompensationRow = (element, label) => {
      if (!element) return;

      const textValue = elementText(element);
      const amountMatch = textValue.match(/([0-9][0-9,.]*)\s*$/);
      const amount = amountMatch?.[1] || "0.00";

      element.innerHTML = "";

      const labelCell = document.createElement("span");
      labelCell.textContent = label;

      const currencyCell = document.createElement("strong");
      currencyCell.textContent = "₱";

      const amountCell = document.createElement("span");
      amountCell.textContent = amount;

      element.append(labelCell, currencyCell, amountCell);

      applyImportantStyles(element, {
        display: "grid",
        "grid-template-columns": "48.7mm 7.1mm auto",
        "align-items": "baseline",
        width: "76mm",
        "max-width": "76mm",
        margin: "0",
        "font-size": "10.2pt",
        "line-height": "16pt",
        "white-space": "nowrap",
        "font-variant-numeric": "tabular-nums",
      });

      applyImportantStyles(currencyCell, {
        "font-weight": "700",
      });
    };

    const markCompensationParagraph = (element) => {
      if (!element || element.tagName !== "P") return;

      const textValue = elementText(element);

      if (/^For and in consideration/i.test(textValue)) {
        addClass(element, "eo-comp-intro");
        applyImportantStyles(element, {
          width: "146mm",
          "max-width": "146mm",
          "font-size": "10.2pt",
          "line-height": "13.2pt",
          "margin-top": "0",
        });
      } else if (/^Basic Daily Rate/i.test(textValue)) {
        addClass(element, "eo-comp-row", "eo-comp-basic");
        formatCompensationRow(element, "Basic Daily Rate");
        applyImportantStyles(element, {
          "margin-top": "8.47mm",
        });
      } else if (/^Daily De Minimis/i.test(textValue)) {
        addClass(element, "eo-comp-row", "eo-comp-deminimis");
        formatCompensationRow(element, "Daily De Minimis");
        applyImportantStyles(element, {
          "margin-top": "0.7mm",
        });
      } else if (/^Total:/i.test(textValue)) {
        addClass(element, "eo-comp-row", "eo-comp-total");
        formatCompensationRow(element, "Total:");
        applyImportantStyles(element, {
          "margin-top": "0.7mm",
        });
      } else if (/^Upon Regularization/i.test(textValue)) {
        addClass(element, "eo-health-benefit");
        applyImportantStyles(element, {
          width: "146mm",
          "max-width": "146mm",
          "margin-top": "4.25mm",
          "font-size": "10.2pt",
          "font-weight": "700",
          "line-height": "13.2pt",
        });
      }
    };

    if (sectionTwoContent) {
      Array.from(sectionTwoContent.children).forEach(markCompensationParagraph);
    }
  } else {
    const sectionThree = markParagraph(
      (textValue) => /^3\.\s*Pre-employment Requirements/i.test(textValue),
      "eo-section-three-heading",
    );

    const compliance = markParagraph(
      (textValue) =>
        /^The complete submission of all listed pre-employment requirements/i.test(
          textValue,
        ),
      "eo-compliance",
    );

    const acceptanceInvite = markParagraph(
      (textValue) =>
        /^Please signify your acceptance of this Employment Offer/i.test(
          textValue,
        ),
      "eo-acceptance-invite",
    );

    const closing = markParagraph(
      (textValue) => /^Very truly yours/i.test(textValue),
      "eo-closing",
    );

    const companySignoff = markParagraph(
      (textValue) => /^For NADELA BUSINESS CENTER, INC\.?$/i.test(textValue),
      "eo-company-signoff",
    );

    const managerSignoff =
      body.querySelector(
        '[data-employment-offer-approver-block="true"]',
      ) ||
      markParagraph(
        (textValue) =>
          /HASSANOR M\. SUMAGUINA/i.test(textValue) ||
          /Senior Corporate Services Manager/i.test(textValue),
        "eo-manager-signoff",
      );
    addClass(managerSignoff, "eo-manager-signoff");

    const managerSignatureImage = body.querySelector(
      'img[data-employment-offer-manager-signature="true"]',
    );
    const managerSignature =
      managerSignatureImage?.closest(
        '[data-employment-offer-manager-signature-container="true"]',
      ) || managerSignatureImage?.parentElement || null;
    addClass(managerSignature, "eo-manager-signature");

    const managerNameElement =
      managerSignoff?.querySelector("strong") || null;

    let managerNameSignatureAnchor = null;

    if (
      managerSignatureImage &&
      managerSignoff &&
      managerNameElement
    ) {
      managerNameSignatureAnchor =
        parsed.createElement("span");
      managerNameSignatureAnchor.className =
        "eo-manager-name-signature-anchor";

      managerSignoff.insertBefore(
        managerNameSignatureAnchor,
        managerNameElement,
      );

      /*
       * Move only the IMG into the inline name anchor.
       * Do not move its original <p> container inside the <span>;
       * that would be invalid HTML and browsers can re-parent it.
       */
      managerNameSignatureAnchor.appendChild(
        managerSignatureImage,
      );
      managerNameSignatureAnchor.appendChild(
        managerNameElement,
      );

      if (
        managerSignature &&
        managerSignature !== managerSignatureImage &&
        !managerSignature.contains(managerSignatureImage)
      ) {
        managerSignature.remove();
      }
    }

    const acceptanceHeading = markParagraph(
      (textValue) => /^Acceptance:?$/i.test(textValue),
      "eo-acceptance-heading",
    );

    const acceptanceText = markParagraph(
      (textValue) =>
        /^I hereby certify that I have read and understood/i.test(textValue),
      "eo-acceptance-text",
    );

    const signatureLine = markParagraph(
      (textValue) =>
        /Signature over Printed Name/i.test(textValue) ||
        /^_+\s*$/i.test(textValue),
      "eo-signature-line",
    );

    if (signatureLine && cleanText(candidatePrintedName)) {
      signatureLine.innerHTML = "";

      const printedName = parsed.createElement("span");
      printedName.className = "eo-candidate-printed-name";
      printedName.textContent =
        cleanText(candidatePrintedName).toUpperCase();

      if (cleanText(candidateSignatureDataUrl)) {
        const candidateSignature = parsed.createElement("img");
        candidateSignature.className = "eo-candidate-signature";
        candidateSignature.src = candidateSignatureDataUrl;
        candidateSignature.alt = "Candidate signature";
        signatureLine.appendChild(candidateSignature);

        applyImportantStyles(candidateSignature, {
          position: "absolute",
          left: "50%",
          bottom: "calc(100% + 6.35mm)",
          width: "auto",
          "max-width": "42mm",
          height: "auto",
          "max-height": "13mm",
          transform: "translateX(-50%)",
          "object-fit": "contain",
        });
      }

      signatureLine.appendChild(printedName);

      applyImportantStyles(printedName, {
        position: "absolute",
        left: "0",
        bottom: "calc(100% + 1.41mm)",
        width: "100%",
        color: "#111",
        "font-family": "Arial, Helvetica, sans-serif",
        "font-size": "10pt",
        "font-weight": "700",
        "line-height": "12pt",
        "text-align": "center",
        "white-space": "nowrap",
      });
    }

    const dateSigned = markParagraph(
      (textValue) => /^Date signed:/i.test(textValue),
      "eo-date-signed",
    );

    const formattedCandidateSignedDate =
      formatEmploymentOfferSignedDate(
        candidateSignedAt,
      );

    if (
      dateSigned &&
      formattedCandidateSignedDate
    ) {
      addClass(
        dateSigned,
        "eo-date-signed-complete",
      );

      dateSigned.innerHTML = "";

      const signedDateValue =
        document.createElement("span");
      signedDateValue.className =
        "eo-date-signed-value";
      signedDateValue.textContent =
        formattedCandidateSignedDate;

      dateSigned.appendChild(
        signedDateValue,
      );

      applyImportantStyles(
        signedDateValue,
        {
          flex: "1 1 auto",
          "min-width": "42mm",
          height: "12pt",
          color: "#111",
          "font-family":
            "Arial, Helvetica, sans-serif",
          "font-size": "9.4pt",
          "font-weight": "400",
          "line-height": "12pt",
          "padding-left": "2mm",
          "border-bottom":
            "0.7pt solid #111",
        },
      );
    }

    // Match the PDF: number in the first column, heading text in the second.
    if (sectionThree) {
      const headingText = elementText(sectionThree);
      const headingMatch = headingText.match(/^(\d+)\.\s*(.+)$/);

      if (headingMatch) {
        sectionThree.innerHTML = "";

        const number = document.createElement("span");
        number.className = "eo-section-number";
        number.textContent = `${headingMatch[1]}.`;

        const titleText = document.createElement("span");
        titleText.className = "eo-section-title-text";
        titleText.textContent = headingMatch[2];

        sectionThree.append(number, titleText);

        applyImportantStyles(sectionThree, {
          display: "grid",
          "grid-template-columns": "8mm minmax(0, 1fr)",
          width: "161mm",
          margin: "0 0 0 7mm",
          "font-size": "10.5pt",
          "font-weight": "700",
          "line-height": "12.5pt",
        });

        const sectionThreeNumber =
          sectionThree.querySelector(
            ".eo-section-number",
          );
        const sectionThreeTitle =
          sectionThree.querySelector(
            ".eo-section-title-text",
          );

        applyImportantStyles(
          sectionThreeNumber,
          {
            "font-weight": "700",
          },
        );

        applyImportantStyles(
          sectionThreeTitle,
          {
            "font-weight": "700",
          },
        );
      }
    }

    // Tiptap may preserve the original blockquote or flatten it after save.
    // Normalize both structures into the same display-only requirements group.
    const requirementsGroup =
      createSectionContentWrapper(
        sectionThree,
        compliance,
        "eo-requirements-block",
      ) || findFollowingBlockquote(sectionThree);

    addClass(requirementsGroup, "eo-requirements-block");

    if (requirementsGroup) {
      applyImportantStyles(requirementsGroup, {
        width: "146mm",
        "max-width": "146mm",
        margin: "4.76mm 0 3.53mm 15mm",
        border: "0",
        padding: "0",
      });

      const requirementElements = Array.from(
        requirementsGroup.children,
      ).filter((element) => element.tagName === "P");

      let requirementIndex = 0;

      requirementElements.forEach((element) => {
        const textValue = elementText(element);

        if (/^A list of pre-employment requirements/i.test(textValue)) {
          addClass(element, "eo-requirements-intro");

          applyImportantStyles(element, {
            width: "146mm",
            "max-width": "146mm",
            margin: "0",
            "font-size": "9.5pt",
            "font-weight": "400",
            "line-height": "12pt",
          });

          return;
        }

        if (/^[a-m]\.\s*/i.test(textValue)) {
          addClass(element, "eo-requirement-item");

          applyImportantStyles(element, {
            width: "146mm",
            "max-width": "146mm",
            "margin-left": "0",
            "margin-top":
              requirementIndex === 0 ? "4.23mm" : "1.41mm",
            "font-size": "9.6pt",
            "font-weight": "400",
            "line-height": "12.2pt",
          });

          requirementIndex += 1;
        }
      });
    }

    if (compliance) {
      applyImportantStyles(compliance, {
        width: "157mm",
        "max-width": "157mm",
        "margin-top": "6.35mm",
        "font-size": "9.8pt",
        "font-weight": "400",
        "line-height": "12.5pt",
      });
    }

    if (acceptanceInvite) {
      applyImportantStyles(acceptanceInvite, {
        width: "157mm",
        "max-width": "157mm",
        "margin-top": "7.76mm",
        "font-size": "9.8pt",
        "font-weight": "400",
        "line-height": "12.5pt",
      });
    }

    if (closing) {
      applyImportantStyles(closing, {
        "margin-top": "7.76mm",
        "font-size": "10pt",
        "font-weight": "400",
        "line-height": "13pt",
      });
    }

    if (companySignoff) {
      applyImportantStyles(companySignoff, {
        "margin-top": "1.76mm",
        "font-size": "10pt",
        "font-weight": "700",
        "line-height": "13pt",
      });
    }

    if (managerNameSignatureAnchor) {
      applyImportantStyles(
        managerNameSignatureAnchor,
        {
          position: "relative",
          display: "inline-block",
          width: "max-content",
          "max-width": "100%",
          "padding-top": "22.7mm",
          "vertical-align": "top",
        },
      );

      applyImportantStyles(
        managerNameElement,
        {
          display: "block",
          width: "max-content",
          "max-width": "100%",
        },
      );

      applyImportantStyles(
        managerSignatureImage,
        {
          position: "absolute",
          left: "50%",
          top: "5.29mm",
          display: "block",
          width: "auto",
          "max-width": "42mm",
          height: "auto",
          "max-height": "16mm",
          transform: "translateX(-50%)",
          "object-fit": "contain",
          margin: "0",
        },
      );
    }

    if (managerSignoff) {
      applyImportantStyles(managerSignoff, {
        "margin-top": managerSignature ? "0" : "10.58mm",
        "font-size": "10pt",
        "font-weight": "400",
        "line-height": "16pt",
      });
    }

    if (acceptanceHeading) {
      applyImportantStyles(acceptanceHeading, {
        "margin-top": "8.47mm",
        "font-size": "10pt",
        "font-weight": "700",
        "line-height": "13pt",
      });
    }

    if (acceptanceText) {
      applyImportantStyles(acceptanceText, {
        width: "157mm",
        "max-width": "157mm",
        "margin-top": "2.47mm",
        "font-size": "9.8pt",
        "font-weight": "400",
        "line-height": "12.5pt",
      });
    }

    if (signatureLine) {
      applyImportantStyles(signatureLine, {
        position: "relative",
        width: "80.8mm",
        "margin-top": "16.93mm",
        "padding-top": "2.6mm",
        "border-top": "0.7pt solid #111",
        color: "transparent",
        "font-size": "0",
        "line-height": "0",
        "text-align": "center",
      });
    }

    if (dateSigned) {
      applyImportantStyles(dateSigned, {
        display: "flex",
        "align-items": "flex-start",
        width: "80.8mm",
        "margin-top": "7.05mm",
        color: "transparent",
        "font-size": "0",
        "line-height": "0",
        "white-space": "nowrap",
      });
    }

  }

  return body.innerHTML.trim();
}

export default function EmploymentOfferDocumentPage() {
  const { candidatePipelineId, versionNumber } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const {
    offerList,
    handleApproval,
    canCurrentUserApproveOffer,
    getOfferApprovalStatus,
  } = useOffers();

  const [activeTab, setActiveTab] = useState("Details");
  const [documentData, setDocumentData] = useState(null);
  const [documentHtml, setDocumentHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [signatureReuseChecking, setSignatureReuseChecking] =
    useState(false);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [drawSignatureOpen, setDrawSignatureOpen] = useState(false);
  const [drawSignatureHasStroke, setDrawSignatureHasStroke] = useState(false);
  const signatureInputRef = useRef(null);
  const drawSignatureCanvasRef = useRef(null);
  const drawSignatureDrawingRef = useRef(false);
  const signatureReuseAttemptRef = useRef("");
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const adminAccess = getAdminAccess(user);
  const canEdit =
    documentData?.canEdit ?? [1, 2, 3, 7].includes(adminAccess);

  const documentActionBusy =
    signatureUploading ||
    signatureReuseChecking ||
    approvalSubmitting;

  const candidate = documentData?.candidate || {};
  const version = documentData?.version || {};
  const revisions = Array.isArray(documentData?.revisions)
    ? documentData.revisions
    : [];
  const versionMetadata =
    version?.metadata && typeof version.metadata === "object"
      ? version.metadata
      : {};
  const candidateSignatureDataUrl = cleanText(
    versionMetadata.candidateSignatureDataUrl ||
      versionMetadata.candidate_signature_data_url,
  );

  const candidateResponseStatus = cleanText(
    version.candidateResponse ||
      version.candidate_response ||
      candidate.offerResponseStatus ||
      candidate.offer_response_status,
  );

  const candidateSignedAt =
    candidateResponseStatus.toLowerCase() ===
    "accepted"
      ? cleanText(
          versionMetadata.candidateSignatureUploadedAt ||
            versionMetadata.candidate_signature_uploaded_at ||
            versionMetadata.respondedAt ||
            versionMetadata.responded_at ||
            candidate.offerDecisionAt ||
            candidate.offer_decision_at,
        )
      : "";

  const candidatePrintedName = cleanText(
    candidate.name ||
      candidate.candidateName ||
      candidate.fullName ||
      candidate.full_name,
  );

  const candidateName =
    candidatePrintedName || "Employment Offer";

  const offerCode = `EO-${cleanText(candidate.candidateId || candidate.candidate_id || candidatePipelineId)}-V${versionNumber}`;

  const status = cleanText(
    version.approvalStatus ||
      version.approval_status ||
      "For Review",
  );

  const currentUserSibsId =
    getCurrentUserSibsId(user);

  const managerSignatureDetails = useMemo(
    () =>
      getEmploymentOfferManagerSignatureDetails(
        documentHtml,
      ),
    [documentHtml],
  );

  const rawHasManagerSignature = Boolean(
    managerSignatureDetails.signatureDataUrl,
  );

  const managerSignatureBelongsToCurrentUser =
    Boolean(
      rawHasManagerSignature &&
        currentUserSibsId &&
        cleanText(
          managerSignatureDetails.signatureSibsId,
        ) === currentUserSibsId,
    );

  /*
   * While an offer is still For Review, never show another approver's
   * signature to the current approval user. Approved documents keep
   * showing the official approver signature regardless of who views them.
   */
  const displayDocumentHtml = useMemo(() => {
    if (
      status === "For Review" &&
      rawHasManagerSignature &&
      currentUserSibsId &&
      !managerSignatureBelongsToCurrentUser
    ) {
      return removeEmploymentOfferManagerSignatureHtml(
        documentHtml,
      );
    }

    return documentHtml;
  }, [
    currentUserSibsId,
    documentHtml,
    managerSignatureBelongsToCurrentUser,
    rawHasManagerSignature,
    status,
  ]);

  const pdfUrl = useMemo(
    () => getEmploymentOfferPdfUrl(candidatePipelineId, versionNumber),
    [candidatePipelineId, versionNumber],
  );

  const documentPages = useMemo(
    () =>
      splitEmploymentOfferDocumentPages(
        displayDocumentHtml,
      ).map(
        (pageHtml, pageIndex) =>
          decorateEmploymentOfferPageHtml(
            pageHtml,
            pageIndex,
            candidatePrintedName,
            candidateSignatureDataUrl,
            candidateSignedAt,
          ),
      ),
    [
      candidatePrintedName,
      candidateSignatureDataUrl,
      candidateSignedAt,
      displayDocumentHtml,
    ],
  );

  const hasManagerSignature =
    status === "For Review"
      ? managerSignatureBelongsToCurrentUser
      : rawHasManagerSignature;

  const approvalMode = searchParams.get("approval") === "1";

  const approvalOffer = useMemo(() => {
    const targetId = cleanText(candidatePipelineId);

    return (Array.isArray(offerList) ? offerList : []).find((item) => {
      const itemId = cleanText(
        item?.candidatePipelineId ||
          item?.candidate_pipeline_id ||
          item?.dbId ||
          item?.id,
      );

      return Boolean(itemId) && itemId === targetId;
    }) || null;
  }, [candidatePipelineId, offerList]);

  const approvalStatus = approvalOffer
    ? cleanText(
        typeof getOfferApprovalStatus === "function"
          ? getOfferApprovalStatus(approvalOffer)
          : approvalOffer.offerApprovalStatus ||
              approvalOffer.offer_approval_status ||
              approvalOffer.status,
      )
    : status;

  const isAuthorizedApprover = approvalOffer
    ? typeof canCurrentUserApproveOffer === "function"
      ? canCurrentUserApproveOffer(approvalOffer)
      : Boolean(canCurrentUserApproveOffer)
    : false;

  const canApproveFromDocument =
    approvalOffer &&
    approvalStatus === "For Review" &&
    isAuthorizedApprover &&
    hasManagerSignature;

  async function loadDocument() {
    setLoading(true);
    try {
      const response = await getEmploymentOfferDocument(
        candidatePipelineId,
        versionNumber,
      );
      const payload = response?.data || response;
      const html = normalizeEmploymentOfferCompensationHtml(
        cleanText(payload?.documentHtml || payload?.document_html),
      );
      setDocumentData(payload);
      setDocumentHtml(html);
    } catch (error) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Employment Offer Not Loaded",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to load the Employment Offer document.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocument();
  }, [candidatePipelineId, versionNumber]);

  useEffect(() => {
    const currentVersionNumber =
      Number(versionNumber);

    if (
      loading ||
      hasManagerSignature ||
      !documentHtml ||
      !Number.isFinite(currentVersionNumber) ||
      currentVersionNumber <= 1 ||
      approvalStatus !== "For Review" ||
      !isAuthorizedApprover
    ) {
      return undefined;
    }

    const currentSignatureDetails =
      getEmploymentOfferManagerSignatureDetails(
        documentHtml,
      );

    const loggedInSibsId =
      getCurrentUserSibsId(user);

    const currentApproverSibsId =
      loggedInSibsId;

    if (!currentApproverSibsId) {
      return undefined;
    }

    /*
     * The logged-in approval account is authoritative.
     * If this draft explicitly belongs to another approver,
     * do not reuse any previous signature.
     */
    if (
      currentSignatureDetails.approverSibsId &&
      cleanText(
        currentSignatureDetails.approverSibsId,
      ) !== currentApproverSibsId
    ) {
      return undefined;
    }

    const reuseKey = [
      cleanText(candidatePipelineId),
      currentVersionNumber,
      currentApproverSibsId,
    ].join(":");

    if (
      signatureReuseAttemptRef.current ===
      reuseKey
    ) {
      return undefined;
    }

    signatureReuseAttemptRef.current =
      reuseKey;

    let active = true;

    async function reusePreviousSignature() {
      setSignatureReuseChecking(true);

      try {
        const previousVersion =
          currentVersionNumber - 1;

        let previousPayload = null;

        try {
          const response =
            await getEmploymentOfferDocument(
              candidatePipelineId,
              String(previousVersion),
            );

          previousPayload =
            response?.data || response;
        } catch {
          return;
        }

        if (!active) {
          return;
        }

        const previousHtml =
          normalizeEmploymentOfferCompensationHtml(
            cleanText(
              previousPayload?.documentHtml ||
                previousPayload?.document_html,
            ),
          );

        const previousSignature =
          getEmploymentOfferManagerSignatureDetails(
            previousHtml,
          );

        const previousSignerSibsId =
          cleanText(
            previousSignature.signatureSibsId ||
              previousSignature.approverSibsId,
          );

        /*
         * Reuse is allowed ONLY when the immediately previous
         * offer version was signed by the same logged-in approver.
         *
         * Example:
         * - V2 = Roland, V3 = Kristian -> do NOT reuse Roland's signature.
         * - V2 = Kristian, V3 = Kristian -> reuse Kristian's signature.
         *
         * We intentionally do not search V1/V0/etc. after a mismatch.
         */
        if (
          !previousSignature.signatureDataUrl ||
          !previousSignerSibsId ||
          previousSignerSibsId !==
            currentApproverSibsId
        ) {
          return;
        }

        await persistApproverSignature(
          previousSignature.signatureDataUrl,
          `Reused approver signature from Employment Offer Version ${previousVersion}.`,
          "Signature Reused",
          {
            showSuccessModal: false,
            sourceHtml: documentHtml,
          },
        );
      } catch (error) {
        /*
         * Reuse is only a convenience. If it fails or the immediately
         * previous version belongs to another approver, leave Upload /
         * Draw Signature available for the current user.
         */
        console.warn(
          "Unable to reuse previous Employment Offer approver signature:",
          error,
        );
      } finally {
        setSignatureReuseChecking(false);
      }
    }

    void reusePreviousSignature();

    return () => {
      active = false;
    };
  }, [
    approvalStatus,
    candidatePipelineId,
    documentHtml,
    hasManagerSignature,
    isAuthorizedApprover,
    loading,
    user,
    versionNumber,
  ]);

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
      context.strokeStyle = "#111827";
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

  async function persistApproverSignature(
    signatureDataUrl,
    revisionComment,
    successTitle,
    {
      showSuccessModal = true,
      sourceHtml = documentHtml,
    } = {},
  ) {
    const updatedHtml =
      upsertEmploymentOfferManagerSignatureHtml(
        sourceHtml,
        signatureDataUrl,
      );

    const response =
      await saveEmploymentOfferDocument(
        candidatePipelineId,
        versionNumber,
        {
          documentHtml: updatedHtml,
          revisionComment,
        },
      );

    const payload = response?.data || response;
    const html =
      normalizeEmploymentOfferCompensationHtml(
        cleanText(
          payload?.documentHtml || updatedHtml,
        ),
      );

    setDocumentData(payload);
    setDocumentHtml(html);

    if (showSuccessModal) {
      setStatusModal({
        open: true,
        type: "success",
        title: successTitle,
        message:
          "The Employment Offer approver signature was saved above the approver name.",
      });
    }

    return {
      payload,
      html,
    };
  }

  async function handleSignatureUpload(event) {
    const input = event?.target;
    const file = input?.files?.[0];

    if (input) {
      input.value = "";
    }

    if (!file) return;

    setSignatureUploading(true);

    try {
      const signatureDataUrl =
        await signatureFileToPngDataUrl(file);

      await persistApproverSignature(
        signatureDataUrl,
        hasManagerSignature
          ? "Employment Offer approver signature replaced."
          : "Employment Offer approver signature uploaded.",
        hasManagerSignature
          ? "Signature Replaced"
          : "Signature Uploaded",
      );
    } catch (error) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Signature Upload Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to upload the Employment Offer signature.",
      });
    } finally {
      setSignatureUploading(false);
    }
  }

  function getDrawSignaturePoint(event) {
    const canvas =
      drawSignatureCanvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect =
      canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function handleDrawSignaturePointerDown(event) {
    if (signatureUploading) return;

    const canvas =
      drawSignatureCanvasRef.current;
    const point =
      getDrawSignaturePoint(event);

    if (!canvas || !point) return;

    const context =
      canvas.getContext("2d");

    if (!context) return;

    event.preventDefault();

    if (
      typeof canvas.setPointerCapture ===
      "function"
    ) {
      canvas.setPointerCapture(
        event.pointerId,
      );
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
      signatureUploading
    ) {
      return;
    }

    const canvas =
      drawSignatureCanvasRef.current;
    const point =
      getDrawSignaturePoint(event);

    if (!canvas || !point) return;

    const context =
      canvas.getContext("2d");

    if (!context) return;

    event.preventDefault();

    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stopDrawSignature(event) {
    drawSignatureDrawingRef.current = false;

    const canvas =
      drawSignatureCanvasRef.current;

    if (
      canvas &&
      event?.pointerId !== undefined &&
      typeof canvas.hasPointerCapture ===
        "function" &&
      canvas.hasPointerCapture(
        event.pointerId,
      ) &&
      typeof canvas.releasePointerCapture ===
        "function"
    ) {
      canvas.releasePointerCapture(
        event.pointerId,
      );
    }
  }

  function clearDrawSignature() {
    const canvas =
      drawSignatureCanvasRef.current;

    if (!canvas) return;

    const context =
      canvas.getContext("2d");

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
    if (signatureUploading) return;

    setDrawSignatureOpen(false);
    drawSignatureDrawingRef.current = false;
    setDrawSignatureHasStroke(false);
  }

  async function handleUseDrawnSignature() {
    if (
      signatureUploading ||
      !drawSignatureHasStroke
    ) {
      return;
    }

    const canvas =
      drawSignatureCanvasRef.current;

    if (!canvas) return;

    setSignatureUploading(true);

    try {
      const signatureDataUrl =
        canvas.toDataURL("image/png");

      await persistApproverSignature(
        signatureDataUrl,
        hasManagerSignature
          ? "Employment Offer approver signature replaced with a drawn signature."
          : "Employment Offer approver signature drawn and saved.",
        hasManagerSignature
          ? "Signature Replaced"
          : "Signature Saved",
      );

      setDrawSignatureOpen(false);
      drawSignatureDrawingRef.current = false;
      setDrawSignatureHasStroke(false);
    } catch (error) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Signature Save Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to save the drawn Employment Offer signature.",
      });
    } finally {
      setSignatureUploading(false);
    }
  }

  async function handleSignatureRemove() {
    if (!hasManagerSignature || signatureUploading) {
      return;
    }

    setSignatureUploading(true);

    try {
      const updatedHtml =
        removeEmploymentOfferManagerSignatureHtml(
          documentHtml,
        );

      const response = await saveEmploymentOfferDocument(
        candidatePipelineId,
        versionNumber,
        {
          documentHtml: updatedHtml,
          revisionComment:
            "Employment Offer approver signature removed.",
        },
      );

      const payload = response?.data || response;
      const html =
        normalizeEmploymentOfferCompensationHtml(
          cleanText(
            payload?.documentHtml || updatedHtml,
          ),
        );

      setDocumentData(payload);
      setDocumentHtml(html);

      setStatusModal({
        open: true,
        type: "success",
        title: "Signature Removed",
        message:
          "The Employment Offer approver signature was removed.",
      });
    } catch (error) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Remove Signature Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to remove the Employment Offer signature.",
      });
    } finally {
      setSignatureUploading(false);
    }
  }

  async function handleApproveFromDocument() {
    if (
      !canApproveFromDocument ||
      approvalSubmitting ||
      signatureUploading ||
      typeof handleApproval !== "function"
    ) {
      return;
    }

    setApprovalSubmitting(true);

    try {
      /*
       * Reuse the Offers approval flow so this opens the same
       * Approve Offer confirmation modal and Notes field used
       * everywhere else on the Offers page.
       */
      await handleApproval(approvalOffer, "Approved");
    } finally {
      setApprovalSubmitting(false);
    }
  }

  function handlePrint() {
    if (documentActionBusy) return;

    window.print();
  }

  return (
    <div className="employment-offer-document-page flex h-screen max-h-screen min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#EEF3F8] font-jakarta text-[#042C51]">
      <style>{`
        @page { size: A4 portrait; margin: 0; }

        .employment-offer-pages {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8mm;
        }

        .employment-offer-paper {
          box-sizing: border-box;
          width: 210mm;
          min-height: 297mm;
          font-family: Arial, Helvetica, sans-serif;
          color: #111;
        }

        .employment-offer-letterhead {
          display: grid;
          grid-template-columns: 82.9mm minmax(0, 1fr);
          align-items: start;
          column-gap: 7.7mm;
          padding: 9.88mm 9.9mm 0;
          font-family: Arial, Helvetica, sans-serif;
          color: #111;
        }

        .employment-offer-letterhead-logo {
          display: block;
          width: 82.9mm;
          max-width: 100%;
          height: auto;
          margin: 3.2mm 0 0;
        }

        .employment-offer-letterhead-details {
          min-width: 0;
          padding-top: 6.35mm;
          font-family: Arial, Helvetica, sans-serif;
          color: #111;
        }

        .employment-offer-letterhead-company {
          margin: 0;
          font-size: 10pt;
          font-weight: 700;
          line-height: 14pt;
          white-space: nowrap;
        }

        .employment-offer-letterhead-business,
        .employment-offer-letterhead-department {
          margin: 0;
          font-size: 9.5pt;
          font-weight: 700;
          line-height: 14pt;
          white-space: nowrap;
        }

        .employment-offer-letterhead-contact {
          margin: 0;
          font-size: 8.2pt;
          font-weight: 400;
          line-height: 13pt;
          white-space: nowrap;
        }

        .employment-offer-letterhead-contact p {
          margin: 0;
          font-size: inherit;
          line-height: inherit;
        }

        .employment-offer-letterhead-contact a {
          color: #0B5CAD;
          text-decoration: underline;
        }

        .employment-offer-content {
          padding: 9.8mm 12.7mm 14mm;
          font-family: Arial, Helvetica, sans-serif;
          color: #111;
        }

        .employment-offer-page-two .employment-offer-content {
          padding-top: 12.7mm;
        }

        .employment-offer-content .jd-rich-text-viewer {
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10.2pt;
          font-weight: 400;
          line-height: 13.2pt;
          overflow-wrap: normal;
        }

        .employment-offer-viewer {
          width: 100%;
        }

        .employment-offer-page-one .employment-offer-viewer .eo-section-heading {
          display: grid !important;
          grid-template-columns: 8mm minmax(0, 1fr) !important;
          width: 161mm !important;
          margin-left: 7mm !important;
        }

        .employment-offer-page-one .employment-offer-viewer .eo-section-content,
        .employment-offer-page-one .employment-offer-viewer .eo-section-body,
        .employment-offer-page-one .employment-offer-viewer .eo-section-one-content,
        .employment-offer-page-one .employment-offer-viewer .eo-section-two-content {
          box-sizing: border-box !important;
          width: 146mm !important;
          max-width: 146mm !important;
          margin-left: 15mm !important;
        }

        .employment-offer-page-one .employment-offer-viewer .eo-section-one-content > p,
        .employment-offer-page-one .employment-offer-viewer .eo-section-one-body > p {
          line-height: 13.2pt !important;
          width: 146mm !important;
          max-width: 146mm !important;
        }

        .employment-offer-page-one .employment-offer-viewer .eo-section-one-content > p + p,
        .employment-offer-page-one .employment-offer-viewer .eo-section-one-body > p + p {
          margin-top: 7.05mm !important;
        }

        .employment-offer-page-one .employment-offer-viewer .eo-section-two-content,
        .employment-offer-page-one .employment-offer-viewer .eo-section-two-body {
          line-height: 13.2pt !important;
        }

        .employment-offer-page-one .employment-offer-viewer .eo-section-two-content > p,
        .employment-offer-page-one .employment-offer-viewer .eo-section-two-body > p {
          width: 146mm !important;
          max-width: 146mm !important;
        }

        .employment-offer-page-one .employment-offer-viewer .eo-comp-row {
          display: grid !important;
          grid-template-columns: 48.7mm 7.1mm auto !important;
          align-items: baseline !important;
          width: 76mm !important;
          max-width: 76mm !important;
          white-space: nowrap !important;
          font-variant-numeric: tabular-nums;
        }

        /* The reference offer uses normal left-aligned line wrapping, not justified spacing. */
        .employment-offer-content .jd-rich-text-viewer [style*="text-align: justify"] {
          text-align: left !important;
          text-justify: auto !important;
        }

        .employment-offer-content .jd-rich-text-viewer p,
        .employment-offer-content .jd-rich-text-viewer li {
          margin: 0;
          font-size: 10.2pt;
          font-weight: 400;
          line-height: 13.2pt;
        }

        .employment-offer-content .jd-rich-text-viewer blockquote {
          border: 0;
          padding: 0;
          color: #111;
        }

        .employment-offer-content .jd-rich-text-viewer hr {
          display: none;
        }

        /* PAGE 1 — semantic selectors stay aligned after Tiptap edits/saves. */
        .employment-offer-page-one .eo-title {
          margin: 0 0 8.3mm !important;
          text-align: center !important;
          font-size: 13pt !important;
          font-weight: 700 !important;
          line-height: 13pt !important;
        }

        .employment-offer-page-one .eo-date-candidate-block {
          display: flex !important;
          flex-direction: column !important;
          gap: 0 !important;
          width: 100% !important;
        }

        .employment-offer-page-one .eo-date-candidate-spacer {
          display: block !important;
          width: 100% !important;
          height: 4.23mm !important;
          min-height: 4.23mm !important;
          flex-shrink: 0 !important;
        }

        .employment-offer-page-one .eo-offer-date {
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 10.5pt !important;
          line-height: 14pt !important;
        }

        .employment-offer-page-one .eo-candidate {
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
          font-size: 10.5pt !important;
          font-weight: 400 !important;
          line-height: 18pt !important;
        }

        .employment-offer-page-one .eo-candidate strong {
          font-size: 11pt !important;
          font-weight: 700 !important;
        }

        .employment-offer-page-one .eo-greeting {
          margin-top: 7.1mm !important;
          font-size: 10.5pt !important;
          line-height: 14pt !important;
        }

        .employment-offer-page-one .eo-congratulations {
          width: 160mm !important;
          max-width: 160mm !important;
          margin-top: 7.8mm !important;
          font-size: 10.5pt !important;
          line-height: 14pt !important;
        }

        .employment-offer-page-one .eo-greeting-name,
        .employment-offer-page-one .eo-congratulations-bold {
          font-weight: 700 !important;
        }

        .employment-offer-page-one .eo-start-date {
          width: 160mm !important;
          max-width: 160mm !important;
          margin-top: 7.05mm !important;
          font-size: 10.5pt !important;
          line-height: 14pt !important;
        }

        .employment-offer-page-one .eo-start-date-value {
          font-weight: 700 !important;
        }

        .employment-offer-page-one .eo-section-heading {
          display: grid !important;
          grid-template-columns: 8mm minmax(0, 1fr);
          width: 161mm !important;
          margin-top: 7.05mm !important;
          margin-left: 7mm !important;
          font-size: 10.5pt !important;
          font-weight: 400 !important;
          line-height: 1.15 !important;
        }

        .employment-offer-page-one .eo-section-one-heading,
        .employment-offer-page-one .eo-section-two-heading,
        .employment-offer-page-two .eo-section-three-heading,
        .employment-offer-page-one .eo-section-heading .eo-section-number,
        .employment-offer-page-one .eo-section-heading .eo-section-title-text,
        .employment-offer-page-two .eo-section-three-heading .eo-section-number,
        .employment-offer-page-two .eo-section-three-heading .eo-section-title-text {
          font-weight: 700 !important;
        }

        .employment-offer-page-one .eo-section-number {
          display: block;
          text-align: left;
        }

        .employment-offer-page-one .eo-section-title-text {
          display: block;
          min-width: 0;
        }

        .employment-offer-page-one .eo-section-body {
          width: 146mm !important;
          max-width: 146mm !important;
          margin: 7.05mm 0 0 15mm !important;
          border: 0 !important;
          padding: 0 !important;
        }

        .employment-offer-page-one .eo-section-body > p {
          width: 146mm !important;
          max-width: 146mm !important;
          font-size: 10.2pt !important;
          font-weight: 400 !important;
          line-height: 1.15 !important;
        }

        .employment-offer-page-one .eo-section-body > p + p {
          margin-top: 7.05mm !important;
        }

        .employment-offer-page-one .eo-section-one-body {
          margin-bottom: 9.17mm !important;
        }

        .employment-offer-page-one .eo-section-one-flat,
        .employment-offer-page-one .eo-section-two-flat {
          width: 146mm !important;
          max-width: 146mm !important;
          margin-left: 15mm !important;
          font-size: 10.2pt !important;
          font-weight: 400 !important;
          line-height: 1.15 !important;
        }

        .employment-offer-page-one .eo-section-one-flat-first {
          margin-top: 7.05mm !important;
        }

        .employment-offer-page-one .eo-section-one-flat + .eo-section-one-flat {
          margin-top: 7.05mm !important;
        }

        .employment-offer-page-one .eo-section-one-flat-last {
          margin-bottom: 2.12mm !important;
        }

        .employment-offer-page-one .eo-section-two-flat.eo-comp-intro {
          margin-top: 7.05mm !important;
        }

        .employment-offer-page-one .eo-section-two-flat.eo-comp-intro + .eo-comp-row {
          margin-top: 8.47mm !important;
        }

        .employment-offer-page-one .eo-section-two-flat.eo-comp-row {
          display: grid !important;
          grid-template-columns: 48.7mm 7.1mm auto !important;
          align-items: baseline !important;
          width: 76mm !important;
          max-width: 76mm !important;
          margin-left: 14.8mm !important;
          font-variant-numeric: tabular-nums;
          line-height: 16pt !important;
          white-space: nowrap;
        }

        .employment-offer-page-one .eo-section-two-flat.eo-comp-row + .eo-comp-row {
          margin-top: 0.7mm !important;
        }

        .employment-offer-page-one .eo-section-two-flat.eo-health-benefit {
          width: 146mm !important;
          max-width: 146mm !important;
          margin-top: 4.25mm !important;
          margin-left: 15mm !important;
          font-weight: 700 !important;
          line-height: 1.15 !important;
        }

        .employment-offer-page-one .eo-section-two-body .eo-comp-row {
          display: grid !important;
          grid-template-columns: 48.7mm 7.1mm auto !important;
          align-items: baseline !important;
          width: 76mm !important;
          max-width: 76mm !important;
          margin: 0 !important;
          font-variant-numeric: tabular-nums;
          line-height: 16pt !important;
          white-space: nowrap;
        }

        .employment-offer-page-one .eo-section-two-body .eo-comp-intro {
          width: 146mm !important;
          max-width: 146mm !important;
        }

        .employment-offer-page-one .eo-section-two-body .eo-comp-intro + .eo-comp-row {
          margin-top: 8.47mm !important;
        }

        .employment-offer-page-one .eo-section-two-body .eo-comp-row + .eo-comp-row {
          margin-top: 0.7mm !important;
        }

        .employment-offer-page-one .eo-section-two-body .eo-comp-row strong {
          font-weight: 700 !important;
        }

        .employment-offer-page-one .eo-section-two-body .eo-health-benefit {
          margin-top: 4.25mm !important;
          font-weight: 700 !important;
          line-height: 13.2pt !important;
        }

        /* PAGE 2 — display geometry follows the generated Employment Offer PDF. */
        .employment-offer-page-two .eo-section-three-heading {
          display: grid !important;
          grid-template-columns: 8mm minmax(0, 1fr) !important;
          width: 161mm !important;
          margin: 0 0 0 7mm !important;
          text-align: left !important;
          font-size: 10.5pt !important;
          font-weight: 400 !important;
          line-height: 12.5pt !important;
        }

        .employment-offer-page-two .eo-section-number,
        .employment-offer-page-two .eo-section-title-text {
          display: block;
          min-width: 0;
        }

        .employment-offer-page-two .eo-requirements-block {
          box-sizing: border-box !important;
          width: 146mm !important;
          max-width: 146mm !important;
          margin-left: 15mm !important;
        }

        .employment-offer-page-two .eo-requirements-intro,
        .employment-offer-page-two .eo-requirement-item {
          width: 146mm !important;
          max-width: 146mm !important;
          margin-left: 0 !important;
        }

        .employment-offer-page-two .eo-requirements-block {
          margin: 4.76mm 0 3.53mm 7.76mm !important;
          border: 0 !important;
          padding: 0 !important;
        }

        .employment-offer-page-two .eo-requirements-intro {
          margin: 0 !important;
          font-size: 9.5pt !important;
          line-height: 12pt !important;
        }

        .employment-offer-page-two .eo-requirements-block .eo-requirements-intro + .eo-requirement-item {
          margin-top: 4.23mm !important;
        }

        .employment-offer-page-two .eo-requirement-item {
          margin-left: -3.53mm !important;
          font-size: 9.6pt !important;
          font-weight: 400 !important;
          line-height: 12.2pt !important;
        }

        .employment-offer-page-two .eo-requirement-item + .eo-requirement-item {
          margin-top: 1.41mm !important;
        }

        /* Flattened Tiptap output still receives the same reference indentation. */
        .employment-offer-page-two .jd-rich-text-viewer > .eo-requirements-intro {
          margin: 4.76mm 0 0 7.76mm !important;
        }

        .employment-offer-page-two .jd-rich-text-viewer > .eo-requirement-item {
          margin-left: 4.23mm !important;
        }

        .employment-offer-page-two .eo-compliance,
        .employment-offer-page-two .eo-acceptance-invite {
          width: 157mm !important;
          max-width: 157mm !important;
          font-size: 9.8pt !important;
          font-weight: 400 !important;
          line-height: 12.5pt !important;
        }

        .employment-offer-page-two .eo-compliance {
          margin-top: 6.35mm !important;
        }

        .employment-offer-page-two .eo-acceptance-invite {
          margin-top: 7.76mm !important;
        }

        .employment-offer-page-two .eo-closing {
          margin-top: 7.76mm !important;
          font-size: 10pt !important;
          line-height: 13pt !important;
        }

        .employment-offer-page-two .eo-company-signoff {
          margin-top: 1.76mm !important;
          font-size: 10pt !important;
          font-weight: 700 !important;
          line-height: 13pt !important;
        }

        .employment-offer-page-two .eo-manager-name-signature-anchor {
          position: relative !important;
          display: inline-block !important;
          width: max-content !important;
          max-width: 100% !important;
          padding-top: 22.7mm !important;
          vertical-align: top !important;
        }

        .employment-offer-page-two .eo-manager-name-signature-anchor > strong {
          display: block !important;
          width: max-content !important;
          max-width: 100% !important;
        }

        .employment-offer-page-two .eo-manager-name-signature-anchor > img[data-employment-offer-manager-signature="true"] {
          position: absolute !important;
          left: 50% !important;
          top: 5.29mm !important;
          display: block !important;
          width: auto !important;
          max-width: 42mm !important;
          height: auto !important;
          max-height: 16mm !important;
          transform: translateX(-50%) !important;
          object-fit: contain !important;
          margin: 0 !important;
        }

        .employment-offer-page-two .eo-manager-signoff {
          margin-top: 10.58mm !important;
          font-size: 10pt !important;
          font-weight: 400 !important;
          line-height: 16pt !important;
        }

        .employment-offer-page-two .eo-manager-signoff strong {
          font-weight: 700 !important;
        }

        .employment-offer-page-two .eo-acceptance-heading {
          margin-top: 8.47mm !important;
          font-size: 10pt !important;
          font-weight: 700 !important;
          line-height: 13pt !important;
        }

        .employment-offer-page-two .eo-acceptance-text {
          margin-top: 2.47mm !important;
          font-size: 9.8pt !important;
          font-weight: 400 !important;
          line-height: 12.5pt !important;
        }

        .employment-offer-page-two .eo-signature-line {
          position: relative;
          width: 80.8mm !important;
          margin-top: 16.93mm !important;
          padding-top: 2.6mm !important;
          border-top: 0.7pt solid #111 !important;
          color: transparent !important;
          font-size: 0 !important;
          line-height: 0 !important;
          text-align: center !important;
        }

        .employment-offer-page-two .eo-signature-line::after {
          content: "Signature over Printed Name";
          display: block;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9.4pt;
          font-weight: 400;
          line-height: 12pt;
        }

        .employment-offer-page-two .eo-candidate-signature {
          position: absolute !important;
          left: 50% !important;
          bottom: calc(100% + 6.35mm) !important;
          width: auto !important;
          max-width: 42mm !important;
          height: auto !important;
          max-height: 13mm !important;
          transform: translateX(-50%) !important;
          object-fit: contain !important;
        }

        .employment-offer-page-two .eo-candidate-printed-name {
          position: absolute !important;
          left: 0 !important;
          bottom: calc(100% + 1.41mm) !important;
          width: 100% !important;
          color: #111 !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 10pt !important;
          font-weight: 700 !important;
          line-height: 12pt !important;
          text-align: center !important;
          white-space: nowrap !important;
        }

        .employment-offer-page-two .eo-date-signed {
          display: flex !important;
          align-items: flex-start !important;
          width: 80.8mm !important;
          margin-top: 7.05mm !important;
          color: transparent !important;
          font-size: 0 !important;
          line-height: 0 !important;
          white-space: nowrap;
        }

        .employment-offer-page-two .eo-date-signed::before {
          content: "Date signed:";
          flex: 0 0 auto;
          margin-right: 1.76mm;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9.4pt;
          font-weight: 400;
          line-height: 12pt;
        }

        .employment-offer-page-two .eo-date-signed::after {
          content: "";
          flex: 1 1 auto;
          min-width: 42mm;
          height: 12pt;
          border-bottom: 0.7pt solid #111;
          margin-top: 0;
        }

        .employment-offer-page-two .eo-date-signed-complete::after {
          display: none !important;
        }

        .employment-offer-page-two .eo-date-signed-value {
          flex: 1 1 auto !important;
          min-width: 42mm !important;
          height: 12pt !important;
          color: #111 !important;
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 9.4pt !important;
          font-weight: 400 !important;
          line-height: 12pt !important;
          padding-left: 2mm !important;
          border-bottom: 0.7pt solid #111 !important;
        }

        .employment-offer-editor .jd-rich-text-editor .ProseMirror {
          min-height: 235mm;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10.2pt;
          font-weight: 400;
          line-height: 13.2pt;
        }

        .employment-offer-editor .jd-rich-text-editor .ProseMirror > * + * {
          margin-top: 4.2mm;
        }

        .employment-offer-editor .jd-rich-text-editor .ProseMirror [style*="text-align: justify"] {
          text-align: left !important;
          text-justify: auto !important;
        }

        .employment-offer-editor .jd-rich-text-editor .ProseMirror > p:first-child {
          margin: 0 0 8mm;
          text-align: center;
          font-size: 13pt;
          font-weight: 700;
        }

        .employment-offer-editor .jd-rich-text-editor .ProseMirror blockquote {
          margin: 5mm 0 7mm 7.5mm;
          border-left: 0 !important;
          padding-left: 0 !important;
          color: #111;
        }

        .employment-offer-editor .jd-rich-text-editor .ProseMirror hr {
          margin: 12mm 0 8mm;
          border: 0;
          border-top: 1px dashed #D6DEE8;
        }

        .employment-offer-editor .jd-rich-text-editor .ProseMirror blockquote > p:nth-child(2):has(strong),
        .employment-offer-editor .jd-rich-text-editor .ProseMirror blockquote > p:nth-child(3):has(strong),
        .employment-offer-editor .jd-rich-text-editor .ProseMirror blockquote > p:nth-child(4):has(strong) {
          display: grid;
          grid-template-columns: 48.7mm 7.1mm auto;
          align-items: baseline;
          width: 76mm;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .employment-offer-no-print {
            display: none !important;
          }

          .employment-offer-document-page,
          .employment-offer-screen-shell {
            display: block !important;
            width: auto !important;
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: #fff !important;
          }

          .employment-offer-print-area {
            padding: 0 !important;
            overflow: visible !important;
          }

          .employment-offer-pages {
            display: block !important;
          }

          .employment-offer-paper {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            border: 0 !important;
            box-shadow: none !important;
            break-after: page;
            page-break-after: always;
          }

          .employment-offer-paper:last-child {
            break-after: auto;
            page-break-after: auto;
          }

          .employment-offer-content .jd-rich-text-viewer hr {
            display: none !important;
          }
        }
      `}</style>

      <div className="employment-offer-no-print relative z-40 shrink-0 overflow-visible bg-white">
        <Header />
      </div>

      <div className="employment-offer-screen-shell flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden overscroll-none">
        <header className="employment-offer-no-print shrink-0 border-b border-[#DCE4EC] bg-white">
        <div className="mx-auto max-w-[1500px] px-5 py-4 2xl:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                Employment Offer Document
              </p>
              <h1 className="mt-1 font-heading text-xl font-extrabold tracking-tight text-[#042C51]">
                {candidateName.toUpperCase()}
              </h1>
              <p className="mt-1 text-xs font-semibold text-[#667085]">
                {cleanText(
                  version.roleTitle ||
                    version.role_title ||
                    candidate.roleTitle ||
                    candidate.role_title,
                ).toUpperCase() || "EMPLOYMENT OFFER"}
              </p>
            </div>

            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
              {status}
            </span>
          </div>

          <div className="mt-3 flex gap-7">
            {["Details", "Revision History"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-1 pb-2 text-sm font-extrabold transition ${
                  activeTab === tab
                    ? "border-[#1677FF] text-[#1677FF]"
                    : "border-transparent text-[#475467]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {approvalMode && status === "For Review" ? (
        <div className="employment-offer-no-print shrink-0 border-b border-[#DCE4EC] bg-[#FFF8F5] px-5 py-3">
          <div className="mx-auto flex max-w-[1500px] items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-white text-[#FF5C28]">
              <AlertTriangle size={17} />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#042C51]">
                {hasManagerSignature
                  ? "Signature ready for approval"
                  : "Approver signature required"}
              </p>

              <p className="mt-0.5 text-[10px] font-semibold leading-relaxed text-[#667085]">
                {hasManagerSignature
                  ? "Review the signed Employment Offer, then click Approve Offer below. The standard approval Notes modal will open before final approval."
                  : "Upload a signature image or draw your signature below before approving this Employment Offer."}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          <div className="text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#FF5C28]" />
            <p className="mt-3 text-sm font-bold text-[#667085]">Loading Employment Offer...</p>
          </div>
        </div>
      ) : activeTab === "Revision History" ? (
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-8 2xl:px-8">
          <div className="mx-auto w-full max-w-5xl">
          <section className="rounded-2xl border border-[#DCE4EC] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#E6ECF2] pb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF5FF] text-[#042C51]">
                <History size={17} />
              </span>
              <div>
                <h2 className="font-heading text-base font-extrabold">Revision History</h2>
                <p className="text-xs font-semibold text-[#667085]">Saved Employment Offer document updates.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {revisions.length ? (
                [...revisions].reverse().map((revision, index) => (
                  <article key={`${revision.revision || index}-${revision.updatedAt || index}`} className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold text-[#042C51]">Revision {revision.revision ?? revisions.length - index}</p>
                        <p className="mt-1 text-[11px] font-semibold text-[#667085]">{revision.updatedBy || "System"} • {formatDateTime(revision.updatedAt)}</p>
                      </div>
                      <span className="rounded-full border border-[#D6DEE8] bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#475467]">
                        Version {versionNumber}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-semibold leading-5 text-[#475467]">{revision.comment || "Employment Offer signature updated."}</p>
                  </article>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[#CDD7E1] p-8 text-center text-sm font-semibold text-[#667085]">
                  No document revisions have been saved yet.
                </div>
              )}
            </div>
          </section>
          </div>
        </main>
      ) : (
        <main className="employment-offer-print-area min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-6 sm:px-6 2xl:py-8">
          <div className="employment-offer-pages">
            {documentPages.map((pageHtml, pageIndex) => (
              <article
                key={`employment-offer-page-${pageIndex + 1}`}
                className={`employment-offer-paper overflow-hidden border border-[#DCE4EC] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)] ${
                  pageIndex === 0
                    ? "employment-offer-page-one"
                    : "employment-offer-page-two"
                }`}
              >
                {pageIndex === 0 ? (
                  <div className="employment-offer-letterhead">
                    <img
                      src="/SiBSLogoNavy.png"
                      alt="SiBS Human Expertise. Technology Forward."
                      className="employment-offer-letterhead-logo"
                    />

                    <div className="employment-offer-letterhead-details">
                      <p className="employment-offer-letterhead-company">NADELA BUSINESS CENTER, INC</p>
                      <p className="employment-offer-letterhead-business">Siblings International Business Solutions</p>
                      <p className="employment-offer-letterhead-department">HUMAN RESOURCE DEPARTMENT</p>
                      <div className="employment-offer-letterhead-contact">
                        <p>Davao: 5F, Robinsons Cybergate Delta, Tower 2, Bajada, Davao City</p>
                        <p>Tagum: Ramos Bldg., Arellano St., Tagum City</p>
                        <p>Phone: +639178308169</p>
                        <p>Email: <a href="mailto:hr@thesiblingssolutions.com">hr@thesiblingssolutions.com</a></p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="employment-offer-content">
                  <EmploymentOfferViewer
                    value={pageHtml}
                    emptyText="Employment Offer content is empty."
                  />
                </div>
              </article>
            ))}
          </div>
        </main>
      )}

      <footer className="employment-offer-no-print shrink-0 border-t border-[#DCE4EC] bg-white px-5 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.06)]">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#667085]">
            <FileText size={15} className="text-[#042C51]" />
            <span>Document: <strong className="text-[#042C51]">{offerCode}</strong></span>
            <span>• Revision: <strong className="text-[#042C51]">{documentData?.documentRevision ?? 0}</strong></span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={() => navigate(-1)} disabled={documentActionBusy} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-[#042C51] hover:bg-[#F8FAFC] disabled:opacity-50">
              <ArrowLeft size={15} /> Back to Offers
            </button>

            <>
              <a
                href={documentActionBusy ? undefined : pdfUrl}
                target="_blank"
                rel="noreferrer"
                aria-disabled={documentActionBusy}
                tabIndex={documentActionBusy ? -1 : 0}
                onClick={(event) => {
                  if (documentActionBusy) {
                    event.preventDefault();
                  }
                }}
                className={`inline-flex h-10 items-center gap-2 rounded-lg border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-[#042C51] ${
                  documentActionBusy
                    ? "pointer-events-none cursor-not-allowed opacity-50"
                    : "hover:bg-[#F8FAFC]"
                }`}
              >
                <Download size={15} /> PDF
              </a>
              <button
                type="button"
                onClick={handlePrint}
                disabled={documentActionBusy}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-[#042C51] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Printer size={15} /> Print
              </button>
              {canEdit ? (
                <>
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={documentActionBusy}
                    onChange={handleSignatureUpload}
                  />
                  <button
                    type="button"
                    onClick={() => signatureInputRef.current?.click()}
                    disabled={documentActionBusy}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#042C51] px-4 text-xs font-extrabold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {signatureUploading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Upload size={15} className="text-[#FF5C28]" />
                    )}
                    {signatureUploading
                      ? "Uploading Signature..."
                      : hasManagerSignature
                        ? "Replace Signature"
                        : "Upload Signature"}
                  </button>

                  {!hasManagerSignature ? (
                    <button
                      type="button"
                      onClick={() =>
                        setDrawSignatureOpen(true)
                      }
                      disabled={documentActionBusy}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28] hover:bg-[#FFF8F5] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Pencil
                        size={15}
                        className="text-[#FF5C28]"
                      />
                      Draw Signature
                    </button>
                  ) : null}

                  {hasManagerSignature ? (
                    <button
                      type="button"
                      onClick={handleSignatureRemove}
                      disabled={documentActionBusy}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-xs font-extrabold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {signatureUploading ? (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={15} />
                      )}
                      Remove Signature
                    </button>
                  ) : null}
                </>
              ) : null}
            </>

            {approvalStatus === "For Review" &&
            isAuthorizedApprover ? (
              hasManagerSignature ? (
                <button
                  type="button"
                  onClick={handleApproveFromDocument}
                  disabled={
                    !canApproveFromDocument ||
                    documentActionBusy
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#042C51] px-4 text-xs font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {approvalSubmitting ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Check size={15} className="text-[#FF5C28]" />
                  )}
                  {approvalSubmitting ? "Approving..." : "Approve Offer"}
                </button>
              ) : (
                <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 text-[10px] font-extrabold text-amber-700">
                  <AlertTriangle size={14} />
                  Upload or draw signature to enable approval
                </span>
              )
            ) : null}
          </div>
        </div>
      </footer>
      </div>

      {drawSignatureOpen ? (
        <div
          className="employment-offer-no-print fixed inset-0 z-[13000] flex items-center justify-center bg-[#042C51]/60 p-4 backdrop-blur-[2px]"
          onClick={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeDrawSignature();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="draw-signature-title"
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <header className="flex items-start justify-between gap-4 bg-[#042C51] px-5 py-4 text-white">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white">
                  <Pencil size={17} />
                </span>

                <div className="min-w-0">
                  <h2
                    id="draw-signature-title"
                    className="font-heading text-base font-extrabold"
                  >
                    Draw Signature
                  </h2>
                  <p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-white/75">
                    Sign inside the box using your mouse,
                    touch screen, or stylus.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDrawSignature}
                disabled={signatureUploading}
                className="rounded-lg px-3 py-2 text-xs font-extrabold text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
            </header>

            <div className="p-5">
              <div className="rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] p-3">
                <canvas
                  ref={drawSignatureCanvasRef}
                  className="block h-[220px] w-full cursor-crosshair touch-none rounded-lg border border-dashed border-[#B8C6D6] bg-white"
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
                    if (
                      event.buttons === 0
                    ) {
                      stopDrawSignature(event);
                    }
                  }}
                />

                <p className="mt-2 text-[10px] font-semibold text-[#667085]">
                  Draw only your signature. It will be
                  saved as a transparent PNG and placed
                  above your approver name.
                </p>
              </div>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E6ECF2] bg-[#F8FAFC] px-5 py-3.5">
              <button
                type="button"
                onClick={clearDrawSignature}
                disabled={
                  signatureUploading ||
                  !drawSignatureHasStroke
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-[#475467] transition hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={15} />
                Clear
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeDrawSignature}
                  disabled={signatureUploading}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-[#475467] transition hover:bg-[#F1F5F9] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUseDrawnSignature}
                  disabled={
                    signatureUploading ||
                    !drawSignatureHasStroke
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#042C51] px-4 text-xs font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {signatureUploading ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Check
                      size={15}
                      className="text-[#FF5C28]"
                    />
                  )}

                  {signatureUploading
                    ? "Saving..."
                    : "Use Signature"}
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal((previous) => ({ ...previous, open: false }))}
        variant="center"
        lockScroll
      />
    </div>
  );
}
