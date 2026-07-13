import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Previewer } from "pagedjs";

import {
  calculateJdPreviewScale,
  JD_COMPACT_VIEW_BREAKPOINT,
  JD_PREVIEW_MIN_SCALE,
} from "../../lib/utils/jobDescription/detailsConstants";
import {
  createMobilePagedJobDescriptionStyles,
  pagedJobDescriptionStyles,
} from "../../components/layout/tabs/JobDescriptionView/details/detailsStyles";

const DESKTOP_PAGE_WIDTH = 1100;

const MOBILE_PAGE_PRESETS = [
  {
    key: "small-phone",
    maxContainerWidth: 360,
    pageWidth: 390,
    headerHeight: 650,
  },
  {
    key: "phone",
    maxContainerWidth: 430,
    pageWidth: 440,
    headerHeight: 650,
  },
  {
    key: "large-phone",
    maxContainerWidth: 520,
    pageWidth: 520,
    headerHeight: 630,
  },
  {
    key: "small-tablet",
    maxContainerWidth: 640,
    pageWidth: 640,
    headerHeight: 610,
  },
  {
    key: "tablet",
    maxContainerWidth: JD_COMPACT_VIEW_BREAKPOINT,
    pageWidth: 800,
    headerHeight: 600,
  },
];

function waitForAnimationFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function getMobilePagePreset(
  containerWidth = 390,
) {
  const safeContainerWidth = Math.max(
    280,
    Number(containerWidth || 390),
  );

  const preset =
    MOBILE_PAGE_PRESETS.find(
      (item) =>
        safeContainerWidth <=
        item.maxContainerWidth,
    ) ||
    MOBILE_PAGE_PRESETS[
      MOBILE_PAGE_PRESETS.length - 1
    ];

  const bodyHeight = Math.max(
    720,
    Math.round(preset.pageWidth * 1.05),
  );

  return {
    ...preset,
    pageHeight:
      preset.headerHeight + bodyHeight,
  };
}

function createPagedStagingContainer(
  width = DESKTOP_PAGE_WIDTH,
) {
  const safeWidth = Math.max(
    280,
    Math.round(
      Number(width || DESKTOP_PAGE_WIDTH),
    ),
  );

  const stagingElement =
    document.createElement("div");

  stagingElement.setAttribute(
    "data-jd-paged-staging",
    "true",
  );

  Object.assign(stagingElement.style, {
    position: "fixed",
    top: "0",
    left: "-20000px",
    zIndex: "-2147483647",
    display: "block",
    width: `${safeWidth}px`,
    minWidth: `${safeWidth}px`,
    maxWidth: `${safeWidth}px`,
    minHeight: "1px",
    overflow: "visible",
    opacity: "0",
    visibility: "hidden",
    pointerEvents: "none",
  });

  document.body.appendChild(stagingElement);

  return stagingElement;
}

function replaceElementChildren(
  targetElement,
  sourceElement,
) {
  if (!targetElement || !sourceElement) return;

  const fragment =
    document.createDocumentFragment();

  while (sourceElement.firstChild) {
    fragment.appendChild(
      sourceElement.firstChild,
    );
  }

  targetElement.replaceChildren(fragment);
}

function renderFallbackContent(
  outputElement,
  sourceHtml,
) {
  if (!outputElement?.isConnected) return;

  const fallbackContainer =
    document.createElement("div");

  fallbackContainer.innerHTML = sourceHtml;

  replaceElementChildren(
    outputElement,
    fallbackContainer,
  );
}

async function waitForSourceAssets(
  sourceElement,
  isCancelled,
) {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue with currently available fonts.
    }
  }

  if (
    isCancelled() ||
    !sourceElement?.isConnected
  ) {
    return;
  }

  const images = Array.from(
    sourceElement.querySelectorAll("img"),
  );

  await Promise.all(
    images.map((image) => {
      if (image.complete) {
        return (
          image.decode?.().catch(
            () => undefined,
          ) ?? Promise.resolve()
        );
      }

      return new Promise((resolve) => {
        const finish = () => resolve();

        image.addEventListener(
          "load",
          finish,
          { once: true },
        );

        image.addEventListener(
          "error",
          finish,
          { once: true },
        );
      });
    }),
  );
}

function setImportantStyle(
  element,
  property,
  value,
) {
  element?.style?.setProperty(
    property,
    value,
    "important",
  );
}

function preserveTableLayout(
  rootElement,
) {
  if (!rootElement) return;

  const tables = Array.from(
    rootElement.querySelectorAll("table"),
  );

  tables.forEach((table) => {
    /*
     * Keep every table inside the printable/page content width without
     * changing its row/column structure.
     */
    setImportantStyle(table, "width", "100%");
    setImportantStyle(
      table,
      "max-width",
      "100%",
    );
    setImportantStyle(
      table,
      "min-width",
      "0",
    );
    setImportantStyle(
      table,
      "table-layout",
      "fixed",
    );
    setImportantStyle(
      table,
      "border-collapse",
      "collapse",
    );

    const cells = Array.from(
      table.querySelectorAll("th, td"),
    );

    cells.forEach((cell) => {
      setImportantStyle(
        cell,
        "min-width",
        "0",
      );
      setImportantStyle(
        cell,
        "max-width",
        "100%",
      );
      setImportantStyle(
        cell,
        "white-space",
        "normal",
      );
      setImportantStyle(
        cell,
        "overflow-wrap",
        "anywhere",
      );
      setImportantStyle(
        cell,
        "word-break",
        "break-word",
      );
      setImportantStyle(
        cell,
        "vertical-align",
        "top",
      );
    });
  });

  /*
   * Some project tables use div-based CSS grids rather than a real <table>.
   * Prevent those grids from keeping an old fixed minimum width.
   */
  const responsiveTableContainers =
    Array.from(
      rootElement.querySelectorAll(
        [
          ".jd-competencies-mobile-fix",
          '[class*="overflow-x-auto"]',
          '[role="table"]',
        ].join(","),
      ),
    );

  responsiveTableContainers.forEach(
    (container) => {
      setImportantStyle(
        container,
        "width",
        "100%",
      );
      setImportantStyle(
        container,
        "max-width",
        "100%",
      );
      setImportantStyle(
        container,
        "min-width",
        "0",
      );
      setImportantStyle(
        container,
        "overflow-x",
        "hidden",
      );
    },
  );
}

function applyPagedGeometry({
  outputElement,
  pageWidth,
  pageHeight,
}) {
  if (!outputElement?.isConnected) {
    return null;
  }

  const pagesElement =
    outputElement.querySelector(
      ".pagedjs_pages",
    );

  if (!pagesElement?.isConnected) {
    return null;
  }

  const safePageWidth = Math.max(
    280,
    Math.round(Number(pageWidth || 390)),
  );

  const safePageHeight = Math.max(
    800,
    Math.round(Number(pageHeight || 1200)),
  );

  setImportantStyle(
    pagesElement,
    "width",
    `${safePageWidth}px`,
  );
  setImportantStyle(
    pagesElement,
    "min-width",
    `${safePageWidth}px`,
  );
  setImportantStyle(
    pagesElement,
    "max-width",
    `${safePageWidth}px`,
  );
  setImportantStyle(
    pagesElement,
    "flex-basis",
    `${safePageWidth}px`,
  );
  setImportantStyle(
    pagesElement,
    "margin-left",
    "auto",
  );
  setImportantStyle(
    pagesElement,
    "margin-right",
    "auto",
  );
  setImportantStyle(
    pagesElement,
    "transform-origin",
    "top center",
  );

  const pages = Array.from(
    pagesElement.querySelectorAll(
      ".pagedjs_page",
    ),
  );

  pages.forEach((page) => {
    setImportantStyle(
      page,
      "width",
      `${safePageWidth}px`,
    );
    setImportantStyle(
      page,
      "min-width",
      `${safePageWidth}px`,
    );
    setImportantStyle(
      page,
      "max-width",
      `${safePageWidth}px`,
    );
    setImportantStyle(
      page,
      "height",
      `${safePageHeight}px`,
    );
    setImportantStyle(
      page,
      "min-height",
      `${safePageHeight}px`,
    );
    setImportantStyle(
      page,
      "max-height",
      `${safePageHeight}px`,
    );
    setImportantStyle(
      page,
      "flex-basis",
      `${safePageWidth}px`,
    );
    setImportantStyle(
      page,
      "overflow",
      "hidden",
    );
  });

  const sheets = Array.from(
    pagesElement.querySelectorAll(
      ".pagedjs_sheet, .pagedjs_pagebox",
    ),
  );

  sheets.forEach((sheet) => {
    setImportantStyle(
      sheet,
      "width",
      `${safePageWidth}px`,
    );
    setImportantStyle(
      sheet,
      "min-width",
      `${safePageWidth}px`,
    );
    setImportantStyle(
      sheet,
      "max-width",
      `${safePageWidth}px`,
    );
    setImportantStyle(
      sheet,
      "height",
      `${safePageHeight}px`,
    );
    setImportantStyle(
      sheet,
      "min-height",
      `${safePageHeight}px`,
    );
    setImportantStyle(
      sheet,
      "max-height",
      `${safePageHeight}px`,
    );
  });

  preserveTableLayout(pagesElement);

  return pagesElement;
}

function applyResponsivePageScale({
  outputElement,
  pageWidth,
  pageHeight,
  availableWidth,
  minScale = 0.2,
}) {
  const pagesElement = applyPagedGeometry({
    outputElement,
    pageWidth,
    pageHeight,
  });

  if (!pagesElement) return null;

  const safeAvailableWidth = Math.max(
    1,
    Number(availableWidth || 1),
  );

  const safePageWidth = Math.max(
    1,
    Number(pageWidth || 1),
  );

  const scale = Math.min(
    1,
    Math.max(
      minScale,
      safeAvailableWidth / safePageWidth,
    ),
  );

  const supportsZoom =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("zoom", "1");

  setImportantStyle(
    outputElement,
    "width",
    "100%",
  );
  setImportantStyle(
    outputElement,
    "max-width",
    "100%",
  );
  setImportantStyle(
    outputElement,
    "min-width",
    "0",
  );
  setImportantStyle(
    outputElement,
    "overflow",
    "hidden",
  );

  if (supportsZoom) {
    setImportantStyle(
      pagesElement,
      "zoom",
      String(scale),
    );
    setImportantStyle(
      pagesElement,
      "transform",
      "none",
    );

    outputElement.style.height = "auto";
  } else {
    pagesElement.style.removeProperty("zoom");

    setImportantStyle(
      pagesElement,
      "transform-origin",
      "top center",
    );
    setImportantStyle(
      pagesElement,
      "transform",
      `scale(${scale})`,
    );

    const scaledHeight = Math.ceil(
      pagesElement.scrollHeight * scale,
    );

    outputElement.style.height =
      `${scaledHeight}px`;
  }

  return {
    pagesElement,
    scale,
  };
}

async function paginateIntoOutput({
  outputElement,
  sourceHtml,
  stylesheetText,
  stagingWidth,
  isCurrentRender,
}) {
  let stylesheetUrl = "";
  let stagingElement = null;

  try {
    await waitForAnimationFrame();
    await waitForAnimationFrame();

    if (!isCurrentRender()) return false;

    const stylesheetBlob = new Blob(
      [stylesheetText],
      {
        type: "text/css",
      },
    );

    stylesheetUrl =
      URL.createObjectURL(stylesheetBlob);

    stagingElement =
      createPagedStagingContainer(
        stagingWidth,
      );

    await waitForAnimationFrame();

    if (
      !stagingElement.isConnected ||
      !isCurrentRender()
    ) {
      return false;
    }

    const previewer = new Previewer();

    await previewer.preview(
      sourceHtml,
      [stylesheetUrl],
      stagingElement,
    );

    if (!isCurrentRender()) return false;

    replaceElementChildren(
      outputElement,
      stagingElement,
    );

    return true;
  } finally {
    stagingElement?.remove();

    if (stylesheetUrl) {
      URL.revokeObjectURL(stylesheetUrl);
    }
  }
}

export default function usePagedJobDescriptionPreview({
  approvalPage = false,
  item,
  editableContent,
  recordInfoDraft,
  competencyDrafts,
}) {
  const pagedSourceRef = useRef(null);
  const pagedOutputRef = useRef(null);
  const mobilePagedOutputRef = useRef(null);
  const pagedPreviewViewportRef = useRef(null);

  const desktopRenderTokenRef = useRef(0);
  const mobileRenderTokenRef = useRef(0);

  const [
    isDesktopPreviewLoading,
    setIsDesktopPreviewLoading,
  ] = useState(!approvalPage);

  const [
    isMobilePreviewLoading,
    setIsMobilePreviewLoading,
  ] = useState(false);

  const [pagedPreviewScale, setPagedPreviewScale] =
    useState(1);

  const [
    availablePreviewWidth,
    setAvailablePreviewWidth,
  ] = useState(() => {
    if (typeof window === "undefined") {
      return DESKTOP_PAGE_WIDTH;
    }

    return Math.max(
      280,
      window.innerWidth,
    );
  });

  const [
    isCompactDocumentView,
    setIsCompactDocumentView,
  ] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return (
      window.innerWidth <=
      JD_COMPACT_VIEW_BREAKPOINT
    );
  });

  const mobilePagePreset = useMemo(
    () =>
      getMobilePagePreset(
        availablePreviewWidth,
      ),
    [availablePreviewWidth],
  );

  const isPagedPreviewLoading = useMemo(
    () =>
      isCompactDocumentView
        ? isMobilePreviewLoading
        : isDesktopPreviewLoading,
    [
      isCompactDocumentView,
      isDesktopPreviewLoading,
      isMobilePreviewLoading,
    ],
  );

  /*
   * Observe the actual Details container, not only window.innerWidth.
   * This responds correctly to:
   * - browser resizing
   * - sidebars opening/closing
   * - split-screen layouts
   * - phone/tablet orientation changes
   * - DevTools responsive resizing
   */
  useEffect(() => {
    if (approvalPage) {
      setPagedPreviewScale(1);
      return undefined;
    }

    const viewportElement =
      pagedPreviewViewportRef.current;

    if (!viewportElement) return undefined;

    let animationFrame = 0;

    function updateResponsiveMode() {
      const currentViewport =
        pagedPreviewViewportRef.current;

      if (!currentViewport?.isConnected) return;

      /*
       * Do not measure only the article itself. Its current mobile Paged.js
       * child can temporarily influence its size and create a feedback loop
       * where the page stays in mobile mode after DevTools closes.
       */
      const stableHost =
        currentViewport.parentElement ||
        currentViewport;

      const hostWidth =
        stableHost
          .getBoundingClientRect()
          .width;

      const browserViewportWidth =
        window.visualViewport?.width ||
        window.innerWidth ||
        hostWidth;

      const measuredWidth = Math.min(
        Number.isFinite(hostWidth) &&
          hostWidth > 0
          ? hostWidth
          : browserViewportWidth,
        Number.isFinite(browserViewportWidth) &&
          browserViewportWidth > 0
          ? browserViewportWidth
          : hostWidth,
      );

      if (
        !Number.isFinite(measuredWidth) ||
        measuredWidth <= 0
      ) {
        return;
      }

      const safeWidth = Math.max(
        280,
        Math.floor(measuredWidth),
      );

      setAvailablePreviewWidth(
        (currentWidth) =>
          Math.abs(
            currentWidth - safeWidth,
          ) < 1
            ? currentWidth
            : safeWidth,
      );

      const compactMediaQuery =
        window.matchMedia?.(
          `(max-width: ${JD_COMPACT_VIEW_BREAKPOINT}px)`,
        )?.matches ?? false;

      const compact =
        compactMediaQuery ||
        safeWidth <=
          JD_COMPACT_VIEW_BREAKPOINT;

      setIsCompactDocumentView(
        (currentValue) =>
          currentValue === compact
            ? currentValue
            : compact,
      );

      const nextDesktopScale = compact
        ? 1
        : calculateJdPreviewScale(
            safeWidth,
          );

      setPagedPreviewScale(
        (currentScale) => {
          const roundedCurrent =
            Number(
              currentScale.toFixed(4),
            );

          const roundedNext =
            Number(
              nextDesktopScale.toFixed(4),
            );

          return roundedCurrent ===
            roundedNext
            ? currentScale
            : roundedNext;
        },
      );
    }

    function scheduleUpdate() {
      window.cancelAnimationFrame(
        animationFrame,
      );

      animationFrame =
        window.requestAnimationFrame(
          updateResponsiveMode,
        );
    }

    scheduleUpdate();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(
            scheduleUpdate,
          )
        : null;

    const stableHost =
      viewportElement.parentElement ||
      viewportElement;

    resizeObserver?.observe(stableHost);

    if (stableHost !== viewportElement) {
      resizeObserver?.observe(
        viewportElement,
      );
    }

    window.addEventListener(
      "resize",
      scheduleUpdate,
    );

    window.addEventListener(
      "orientationchange",
      scheduleUpdate,
    );

    window.visualViewport?.addEventListener(
      "resize",
      scheduleUpdate,
    );

    return () => {
      window.cancelAnimationFrame(
        animationFrame,
      );

      resizeObserver?.disconnect();

      window.removeEventListener(
        "resize",
        scheduleUpdate,
      );

      window.removeEventListener(
        "orientationchange",
        scheduleUpdate,
      );

      window.visualViewport?.removeEventListener(
        "resize",
        scheduleUpdate,
      );
    };
  }, [approvalPage]);

  /*
   * Cancel and clear obsolete mobile pages after returning to desktop.
   * The desktop output is preserved because it is also used for printing.
   */
  useEffect(() => {
    if (
      approvalPage ||
      isCompactDocumentView
    ) {
      return;
    }

    mobileRenderTokenRef.current += 1;
    setIsMobilePreviewLoading(false);

    const mobileOutput =
      mobilePagedOutputRef.current;

    if (mobileOutput?.isConnected) {
      mobileOutput.replaceChildren();
      mobileOutput.style.height = "";
    }
  }, [
    approvalPage,
    isCompactDocumentView,
  ]);

  /*
   * Desktop/PDF output remains at one stable logical size.
   * Resizing changes only its display scale, so tables never reflow or break.
   */
  useEffect(() => {
    if (approvalPage) {
      setIsDesktopPreviewLoading(false);
      return undefined;
    }

    const sourceElement =
      pagedSourceRef.current;

    const outputElement =
      pagedOutputRef.current;

    if (
      !sourceElement?.isConnected ||
      !outputElement?.isConnected
    ) {
      return undefined;
    }

    const renderToken =
      desktopRenderTokenRef.current + 1;

    desktopRenderTokenRef.current =
      renderToken;

    const sourceHtml =
      sourceElement.innerHTML;

    let cancelled = false;
    let renderTimer = null;

    function isCurrentRender() {
      return (
        !cancelled &&
        desktopRenderTokenRef.current ===
          renderToken &&
        pagedOutputRef.current ===
          outputElement &&
        outputElement.isConnected
      );
    }

    async function renderDesktopPages() {
      if (!isCurrentRender()) return;

      const alreadyRendered =
        Boolean(
          outputElement.querySelector(
            ".pagedjs_page",
          ),
        );

      if (!alreadyRendered) {
        setIsDesktopPreviewLoading(true);
      }

      try {
        await waitForSourceAssets(
          sourceElement,
          () => cancelled,
        );

        if (!isCurrentRender()) return;

        await paginateIntoOutput({
          outputElement,
          sourceHtml,
          stylesheetText:
            pagedJobDescriptionStyles,
          stagingWidth:
            DESKTOP_PAGE_WIDTH,
          isCurrentRender,
        });
      } catch (error) {
        if (!isCurrentRender()) return;

        console.error(
          "Unable to render desktop JD pages:",
          error,
        );

        renderFallbackContent(
          outputElement,
          sourceHtml,
        );
      } finally {
        if (isCurrentRender()) {
          setIsDesktopPreviewLoading(
            false,
          );
        }
      }
    }

    renderTimer = window.setTimeout(
      renderDesktopPages,
      120,
    );

    return () => {
      cancelled = true;

      if (renderTimer) {
        window.clearTimeout(renderTimer);
      }

      if (
        desktopRenderTokenRef.current ===
        renderToken
      ) {
        desktopRenderTokenRef.current += 1;
      }
    };
  }, [
    approvalPage,
    item?.id,
    item?.jdStatus,
    editableContent,
    recordInfoDraft,
    competencyDrafts,
  ]);

  /*
   * Mobile/tablet output uses a stable logical page width selected by a
   * responsive preset. Small width changes only scale the completed pages;
   * Paged.js reruns only when the preset changes or JD data changes.
   */
  useEffect(() => {
    if (
      approvalPage ||
      !isCompactDocumentView
    ) {
      setIsMobilePreviewLoading(false);
      return undefined;
    }

    const sourceElement =
      pagedSourceRef.current;

    const outputElement =
      mobilePagedOutputRef.current;

    if (
      !sourceElement?.isConnected ||
      !outputElement?.isConnected
    ) {
      return undefined;
    }

    const renderToken =
      mobileRenderTokenRef.current + 1;

    mobileRenderTokenRef.current =
      renderToken;

    const sourceHtml =
      sourceElement.innerHTML;

    const mobileStyles =
      createMobilePagedJobDescriptionStyles({
        pageWidth:
          mobilePagePreset.pageWidth,
        pageHeight:
          mobilePagePreset.pageHeight,
        headerHeight:
          mobilePagePreset.headerHeight,
      });

    let cancelled = false;
    let renderTimer = null;

    function isCurrentRender() {
      return (
        !cancelled &&
        mobileRenderTokenRef.current ===
          renderToken &&
        mobilePagedOutputRef.current ===
          outputElement &&
        outputElement.isConnected
      );
    }

    async function renderMobilePages() {
      if (!isCurrentRender()) return;

      const alreadyRendered =
        Boolean(
          outputElement.querySelector(
            ".pagedjs_page",
          ),
        );

      if (!alreadyRendered) {
        setIsMobilePreviewLoading(true);
      }

      try {
        await waitForSourceAssets(
          sourceElement,
          () => cancelled,
        );

        if (!isCurrentRender()) return;

        await paginateIntoOutput({
          outputElement,
          sourceHtml,
          stylesheetText:
            mobileStyles,
          stagingWidth:
            mobilePagePreset.pageWidth,
          isCurrentRender,
        });
      } catch (error) {
        if (!isCurrentRender()) return;

        console.error(
          "Unable to render mobile JD pages:",
          error,
        );

        renderFallbackContent(
          outputElement,
          sourceHtml,
        );
      } finally {
        if (isCurrentRender()) {
          setIsMobilePreviewLoading(
            false,
          );
        }
      }
    }

    renderTimer = window.setTimeout(
      renderMobilePages,
      140,
    );

    return () => {
      cancelled = true;

      if (renderTimer) {
        window.clearTimeout(renderTimer);
      }

      if (
        mobileRenderTokenRef.current ===
        renderToken
      ) {
        mobileRenderTokenRef.current += 1;
      }
    };
  }, [
    approvalPage,
    isCompactDocumentView,
    mobilePagePreset.key,
    mobilePagePreset.pageWidth,
    mobilePagePreset.pageHeight,
    mobilePagePreset.headerHeight,
    item?.id,
    item?.jdStatus,
    editableContent,
    recordInfoDraft,
    competencyDrafts,
  ]);

  /*
   * Dynamically fit the desktop pages to the current container.
   * Internal page/table dimensions remain unchanged.
   */
  useEffect(() => {
    if (
      approvalPage ||
      isCompactDocumentView ||
      isDesktopPreviewLoading
    ) {
      return undefined;
    }

    const outputElement =
      pagedOutputRef.current;

    if (!outputElement?.isConnected) {
      return undefined;
    }

    const result =
      applyResponsivePageScale({
        outputElement,
        pageWidth:
          DESKTOP_PAGE_WIDTH,
        pageHeight: 1556,
        availableWidth:
          Math.max(
            280,
            availablePreviewWidth - 24,
          ),
        minScale:
          JD_PREVIEW_MIN_SCALE,
      });

    return () => {
      if (
        result?.pagesElement?.isConnected
      ) {
        result.pagesElement.style
          .removeProperty("zoom");

        result.pagesElement.style
          .removeProperty("transform");
      }

      if (outputElement.isConnected) {
        outputElement.style.height = "";
      }
    };
  }, [
    approvalPage,
    availablePreviewWidth,
    isCompactDocumentView,
    isDesktopPreviewLoading,
    pagedPreviewScale,
  ]);

  /*
   * Dynamically fit mobile/tablet sheets without changing their table layout.
   * This runs on every container resize and does not repaginate unless the
   * logical preset changes.
   */
  useEffect(() => {
    if (
      approvalPage ||
      !isCompactDocumentView ||
      isMobilePreviewLoading
    ) {
      return undefined;
    }

    const outputElement =
      mobilePagedOutputRef.current;

    if (!outputElement?.isConnected) {
      return undefined;
    }

    const horizontalAllowance =
      availablePreviewWidth <= 390
        ? 8
        : 16;

    const result =
      applyResponsivePageScale({
        outputElement,
        pageWidth:
          mobilePagePreset.pageWidth,
        pageHeight:
          mobilePagePreset.pageHeight,
        availableWidth: Math.max(
          280,
          availablePreviewWidth -
            horizontalAllowance,
        ),
        minScale: 0.65,
      });

    return () => {
      if (
        result?.pagesElement?.isConnected
      ) {
        result.pagesElement.style
          .removeProperty("zoom");

        result.pagesElement.style
          .removeProperty("transform");
      }

      if (outputElement.isConnected) {
        outputElement.style.height = "";
      }
    };
  }, [
    approvalPage,
    availablePreviewWidth,
    isCompactDocumentView,
    isMobilePreviewLoading,
    mobilePagePreset.pageWidth,
    mobilePagePreset.pageHeight,
  ]);

  return {
    isCompactDocumentView,
    isPagedPreviewLoading,
    mobilePagedOutputRef,
    pagedOutputRef,
    pagedPreviewScale,
    pagedPreviewViewportRef,
    pagedSourceRef,
  };
}
