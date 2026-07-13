export const detailsResponsiveAuditStyles = `
  .jd-details-document,
  .jd-details-document * {
    box-sizing: border-box;
  }

  .jd-details-document {
    overflow-wrap: anywhere;

    /*
     * Document page margins:
     * Left:  1 inch
     * Right: 0.5 inch
     *
     * Padding is used so the white document page remains centered while
     * its content follows the requested page margins.
     */
    padding-left: 1in !important;
    padding-right: 0.5in !important;
  }

  /*
   * JD body typography:
   * - 1.5 line spacing
   * - justified text
   * - compact spacing between copied document lines/list entries
   */
  .jd-single-spaced-justified,
  .jd-single-spaced-justified p,
  .jd-single-spaced-justified li,
  .jd-single-spaced-justified span {
    line-height: 1.5 !important;
    text-align: justify;
    text-justify: inter-word;
  }

  .jd-single-spaced-justified p {
    margin-top: 0;
    margin-bottom: 0;
  }

  .jd-single-spaced-justified li + li {
    margin-top: 0.25rem;
  }

  .jd-single-spaced-justified textarea {
    line-height: 1.5 !important;
    text-align: justify;
    text-justify: inter-word;
  }

  .jd-details-document .jd-rich-text-viewer {
    color: #344054;
    font-size: 0.9375rem;
    line-height: 1.5;
    text-align: justify;
    text-justify: inter-word;
  }

  .jd-details-document .jd-rich-text-viewer p,
  .jd-details-document .jd-rich-text-viewer li,
  .jd-details-document .jd-rich-text-viewer span {
    line-height: 1.5 !important;
  }

  .jd-details-document .jd-rich-text-viewer ol,
  .jd-details-document .jd-rich-text-viewer ul {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    padding-left: 2.25rem;
  }

  .jd-details-document .jd-rich-text-viewer ol ol {
    list-style-type: lower-alpha;
    padding-left: 2.5rem;
  }

  .jd-details-document .jd-rich-text-viewer ol ol ol {
    list-style-type: lower-roman;
  }

  .jd-details-document .jd-rich-text-viewer li + li {
    margin-top: 0.35rem;
  }

  /*
   * Approval/revision mode uses normal responsive padding.
   * The Paged.js preview overrides this padding to zero and keeps its exact
   * print dimensions internally.
   */
  @media screen and (max-width: 1199px) {
    .jd-details-document:not(.jd-details-paged-preview) {
      padding-left: clamp(1.5rem, 5vw, 3rem) !important;
      padding-right: clamp(1.25rem, 4vw, 2.5rem) !important;
    }
  }

  @media screen and (max-width: 820px) {
    .jd-details-document:not(.jd-details-paged-preview) {
      max-width: calc(100vw - 1rem) !important;
      padding-left: 1.25rem !important;
      padding-right: 1.25rem !important;
      border-radius: 0.875rem;
    }
  }

  @media screen and (max-width: 480px) {
    .jd-details-document:not(.jd-details-paged-preview) {
      max-width: calc(100vw - 0.5rem) !important;
      padding-left: 0.75rem !important;
      padding-right: 0.75rem !important;
      border-radius: 0.625rem;
    }

    .jd-details-document:not(.jd-details-paged-preview)
      .jd-rich-text-viewer {
      font-size: 0.875rem;
    }
  }

  /*
   * The off-screen source stays rendered so Paged.js can measure the exact
   * React output. Only the generated A4 sheets are visible in normal view.
   */
  .jd-details-paged-preview {
    width: 100% !important;
    max-width: none !important;
    min-width: 0 !important;
    min-height: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  .jd-paged-source {
    position: fixed !important;
    top: 0;
    left: -200vw;
    z-index: -1;
    width: 1100px;
    max-width: 1100px;
    padding: 0 !important;
    opacity: 0;
    pointer-events: none;
  }

  /*
   * The Paged.js document keeps its exact 1100px print geometry internally.
   * JavaScript applies a responsive zoom/scale so the complete sheet fits:
   * small phones, tablets, iPads, laptops, and large desktop screens.
   */
  .jd-paged-output {
    display: flex;
    width: 100%;
    min-width: 0;
    justify-content: center;
    overflow: hidden;
    padding-inline: clamp(0px, 1vw, 16px);
  }

  .jd-paged-output .pagedjs_pages {
    display: flex !important;
    flex: 0 0 1100px;
    flex-direction: column !important;
    align-items: center !important;
    gap: 28px !important;
    width: 1100px !important;
    min-width: 1100px !important;
    max-width: 1100px !important;
    margin: 0 auto !important;
    padding: 0 0 28px !important;
    background: transparent !important;
    transform-origin: top center;
  }

  .jd-paged-output .pagedjs_page {
    flex: 0 0 1100px;
    width: 1100px !important;
    min-width: 1100px !important;
    max-width: 1100px !important;
    margin: 0 !important;
    background: white !important;
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.18);
  }

  .jd-paged-output .pagedjs_sheet,
  .jd-paged-output .pagedjs_pagebox {
    width: 1100px !important;
    min-width: 1100px !important;
    max-width: 1100px !important;
    background: white !important;
  }

  .jd-paged-output .pagedjs_page_content {
    overflow: visible !important;
  }

  .jd-paged-loading {
    display: flex;
    min-height: 220px;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    color: #315f8c;
    font-size: 0.875rem;
    font-weight: 700;
    text-align: center;
  }

  /*
   * Phones and narrow tablets use a readable continuous document instead of
   * shrinking the complete 1100px page until the text becomes too small.
   * The paginated version is still generated in the background for printing.
   */
  .jd-compact-document-view {
    position: static !important;
    z-index: auto !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 0 auto !important;
    padding:
      clamp(0.75rem, 3vw, 1.5rem)
      clamp(0.75rem, 3.5vw, 1.75rem)
      clamp(1.25rem, 5vw, 2rem) !important;
    overflow: visible !important;
    border-radius: 0.875rem;
    background: white !important;
    box-shadow: 0 16px 45px rgba(15, 23, 42, 0.12);
    opacity: 1 !important;
    pointer-events: auto !important;
  }

  .jd-compact-document-view .jd-paged-running-header {
    position: static !important;
    display: block !important;
    width: 100% !important;
    margin: 0 !important;
  }

  .jd-compact-document-view
    .jd-paged-document-body {
    width: 100%;
    min-width: 0;
    padding-top: clamp(1.25rem, 4vw, 2rem);
    color: #1d2939;
    font-size: 0.9375rem;
    line-height: 1.55;
  }

  .jd-compact-document-view
    .jd-paged-document-body
    > section
    + section {
    margin-top: clamp(1.5rem, 5vw, 2.25rem) !important;
  }

  .jd-compact-document-view
    .jd-paged-document-body
    h4 {
    line-height: 1.4 !important;
  }

  .jd-compact-document-view
    .jd-single-spaced-justified,
  .jd-compact-document-view
    .jd-single-spaced-justified p,
  .jd-compact-document-view
    .jd-single-spaced-justified li,
  .jd-compact-document-view
    .jd-single-spaced-justified span,
  .jd-compact-document-view
    .jd-rich-text-viewer,
  .jd-compact-document-view
    .jd-rich-text-viewer p,
  .jd-compact-document-view
    .jd-rich-text-viewer li,
  .jd-compact-document-view
    .jd-rich-text-viewer span {
    text-align: left !important;
    text-justify: auto !important;
    word-spacing: normal !important;
    letter-spacing: normal !important;
    line-height: 1.55 !important;
  }

  .jd-compact-document-view
    .jd-rich-text-viewer ol,
  .jd-compact-document-view
    .jd-rich-text-viewer ul {
    padding-left: clamp(1.4rem, 6vw, 2.25rem) !important;
  }

  .jd-compact-document-view
    .jd-rich-text-viewer ol ol,
  .jd-compact-document-view
    .jd-rich-text-viewer ul ul {
    padding-left: clamp(1.25rem, 5vw, 2rem) !important;
  }

  .jd-paged-output-compact-hidden {
    display: none !important;
  }

  .jd-manual-header-grid,
  .jd-manual-header-grid * {
    box-sizing: border-box;
  }

  /*
   * Browser print paper. The visible Paged.js sheets are generated internally
   * at 1100px × 1556px, then scaled onto physical A4 paper below.
   */
  @page {
    size: A4 portrait;
    margin: 0;
  }

  @media print {
    html,
    body {
      width: 210mm !important;
      min-width: 210mm !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      background: white !important;
    }

    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /*
     * Print only the completed Paged.js output. Keeping the surrounding
     * application hidden prevents sidebars, sticky footers, modal containers,
     * transforms, and overflow rules from shifting or clipping the document.
     */
    body * {
      visibility: hidden !important;
    }

    .jd-paged-output,
    .jd-paged-output * {
      visibility: visible !important;
    }

    .jd-paged-source,
    .jd-compact-document-view,
    .jd-mobile-paged-output,
    .jd-paged-loading,
    [data-print-hide] {
      display: none !important;
    }

    .jd-details-paged-preview {
      position: static !important;
      inset: auto !important;
      width: 210mm !important;
      min-width: 210mm !important;
      max-width: 210mm !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      background: white !important;
      box-shadow: none !important;
      transform: none !important;
    }

    .jd-paged-output,
    .jd-paged-output-compact-hidden {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      display: block !important;
      width: 210mm !important;
      min-width: 210mm !important;
      max-width: 210mm !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      background: white !important;
      opacity: 1 !important;
      transform: none !important;
    }

    .jd-paged-output .pagedjs_pages {
      display: block !important;
      width: 210mm !important;
      min-width: 210mm !important;
      max-width: 210mm !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      gap: 0 !important;
      background: white !important;
      opacity: 1 !important;
      zoom: 1 !important;
      transform: none !important;
    }

    /*
     * Each generated page is 1100px × 1556px. Scale the inner sheet by
     * 0.7214 so it fits exactly inside 210mm × 297mm A4 paper without
     * clipping either the left logo column or the right metadata column.
     */
    .jd-paged-output .pagedjs_page {
      position: relative !important;
      display: block !important;
      width: 210mm !important;
      min-width: 210mm !important;
      max-width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      max-height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      background: white !important;
      box-shadow: none !important;
      break-before: auto !important;
      break-after: page !important;
      page-break-after: always !important;
    }

    .jd-paged-output .pagedjs_sheet {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 1100px !important;
      min-width: 1100px !important;
      max-width: 1100px !important;
      height: 1556px !important;
      min-height: 1556px !important;
      max-height: 1556px !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      background: white !important;
      box-shadow: none !important;
      transform: scale(0.7214) !important;
      transform-origin: top left !important;
    }

    .jd-paged-output .pagedjs_pagebox {
      width: 1100px !important;
      min-width: 1100px !important;
      max-width: 1100px !important;
      height: 1556px !important;
      min-height: 1556px !important;
      max-height: 1556px !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      background: white !important;
      transform: none !important;
    }

    .jd-paged-output .pagedjs_page_content {
      overflow: hidden !important;
    }

    .jd-paged-output .pagedjs_page:last-child {
      break-after: auto !important;
      page-break-after: auto !important;
    }
  }

  .jd-mobile-actions-row {
    min-width: 0;
  }

  .jd-competencies-mobile-fix {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    overflow-y: visible;
    overscroll-behavior-inline: contain;
    -webkit-overflow-scrolling: touch;
  }

  .jd-competencies-mobile-fix,
  .jd-competencies-mobile-fix * {
    box-sizing: border-box;
  }

  .jd-competencies-mobile-fix > * {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .jd-competencies-mobile-fix h1,
  .jd-competencies-mobile-fix h2,
  .jd-competencies-mobile-fix h3,
  .jd-competencies-mobile-fix h4,
  .jd-competencies-mobile-fix p,
  .jd-competencies-mobile-fix span,
  .jd-competencies-mobile-fix div {
    min-width: 0;
  }

  .jd-competencies-mobile-fix table {
    width: 100%;
    max-width: 100%;
  }

  @media (max-width: 640px) {
    .jd-details-document {
      max-width: calc(100vw - 1.25rem) !important;
      border-radius: 0.875rem;
    }

    .jd-details-section-header {
      align-items: stretch !important;
    }

    .jd-mobile-actions-row {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      width: 100% !important;
      gap: 0.5rem !important;
    }

    .jd-mobile-actions-row > button {
      width: 100% !important;
      min-width: 0 !important;
      justify-content: center !important;
      white-space: nowrap !important;
    }

    .jd-competencies-mobile-fix {
      margin-left: 0 !important;
      margin-right: 0 !important;
      overflow-x: auto !important;
      overflow-y: visible !important;
      overscroll-behavior-inline: contain;
      -webkit-overflow-scrolling: touch;
    }

    .jd-competencies-mobile-fix > * > :first-child {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 0.75rem !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
    }

    .jd-competencies-mobile-fix > * > :first-child > * {
      max-width: 100% !important;
      min-width: 0 !important;
    }

    .jd-competencies-mobile-fix > * > :first-child > :last-child {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 0.5rem !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
    }

    .jd-competencies-mobile-fix > * > :first-child > :last-child button {
      width: 100% !important;
      min-width: 0 !important;
      justify-content: center !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .jd-competencies-mobile-fix [class*="grid-cols-"] {
      min-width: 0 !important;
    }

    .jd-competencies-mobile-fix [class*="min-w-"] {
      min-width: 0 !important;
    }

    .jd-competencies-mobile-fix [class*="overflow-x-auto"] {
      max-width: 100% !important;
    }
  }

  @media (max-width: 390px) {
    .jd-mobile-actions-row,
    .jd-competencies-mobile-fix > * > :first-child > :last-child {
      grid-template-columns: 1fr !important;
    }
  }

  /*
   * Compact mobile/tablet manual header.
   *
   * Layout:
   * 1. Large SiBS logo and issuance number
   * 2. Manual title, full width
   * 3. Document title, full width
   * 4. Document code + revision number, two columns
   * 5. Effectivity date + last review, two columns
   * 6. Prepared/review/approval fields, two columns
   *
   * Desktop and Paged.js print layouts remain unchanged.
   */
  @media screen and (max-width: 820px) {
    .jd-manual-header-wrapper {
      width: 100% !important;
      max-width: 100% !important;
      overflow: visible !important;
      padding-bottom: 0 !important;
    }

    .jd-manual-header-grid {
      width: 100% !important;
      min-width: 0 !important;
      grid-template-columns: 1fr !important;
      border-width: 2px !important;
    }

    .jd-manual-header-logo-column {
      min-height: 0 !important;
      border-right: 0 !important;
      border-bottom: 2px solid #000 !important;
      padding: clamp(1rem, 5vw, 1.5rem) !important;
    }

    .jd-manual-header-logo {
      width: min(100%, 232px) !important;
      max-width: 232px !important;
      height: auto !important;
      margin-inline: auto !important;
    }

    .jd-manual-issuance {
      margin-top: 0.875rem !important;
      font-size: clamp(0.875rem, 3.8vw, 1rem) !important;
      font-weight: 700 !important;
      line-height: 1.35 !important;
    }

    .jd-manual-header-main-row {
      display: grid !important;
      grid-template-columns: 1fr !important;
    }

    .jd-manual-header-main-row
      > .record-info-manualHero,
    .jd-manual-header-main-row
      > .record-info-manualDocumentTitle {
      min-height: 92px !important;
      border-right: 0 !important;
      border-bottom: 2px solid #000 !important;
      padding: 0.9rem 0.75rem !important;
    }

    /*
     * The desktop metadata block uses two vertical rows. On mobile it becomes
     * a compact two-column row like the reference screenshot.
     */
    .jd-manual-header-meta-pair {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      grid-template-rows: none !important;
      width: 100% !important;
    }

    .jd-manual-header-meta-pair
      > .record-info-manualMeta {
      min-height: 74px !important;
      padding: 0.7rem 0.65rem !important;
    }

    .jd-manual-header-meta-pair
      > .record-info-manualMeta:first-child {
      border-right: 2px solid #000 !important;
      border-bottom: 0 !important;
    }

    .jd-manual-header-footer-row {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      width: 100% !important;
    }

    .jd-manual-header-footer-row
      > .record-info-manualFooter {
      min-height: 82px !important;
      padding: 0.7rem 0.65rem !important;
    }

    .jd-manual-header-footer-row
      > .record-info-manualFooter:nth-child(1),
    .jd-manual-header-footer-row
      > .record-info-manualFooter:nth-child(2) {
      border-bottom: 2px solid #000 !important;
    }

    .jd-manual-header-footer-row
      > .record-info-manualFooter:nth-child(2),
    .jd-manual-header-footer-row
      > .record-info-manualFooter:nth-child(4) {
      border-right: 0 !important;
    }

    .jd-manual-header-grid
      .record-info-manualHero
      > p:last-of-type,
    .jd-manual-header-grid
      .record-info-manualDocumentTitle
      > p:last-of-type {
      margin-top: 0.55rem !important;
      font-size: clamp(1rem, 4.8vw, 1.2rem) !important;
      line-height: 1.35 !important;
    }

    .jd-manual-header-grid
      .record-info-manualMeta
      > p:last-of-type,
    .jd-manual-header-grid
      .record-info-manualFooter
      > p:last-of-type {
      margin-top: 0.4rem !important;
      font-size: clamp(0.72rem, 3.3vw, 0.82rem) !important;
      font-weight: 700 !important;
      line-height: 1.35 !important;
      overflow-wrap: anywhere !important;
    }

    .jd-manual-header-grid
      .record-info-manualHero
      > div:first-child
      > p,
    .jd-manual-header-grid
      .record-info-manualDocumentTitle
      > div:first-child
      > p,
    .jd-manual-header-grid
      .record-info-manualMeta
      > div:first-child
      > p,
    .jd-manual-header-grid
      .record-info-manualFooter
      > div:first-child
      > p {
      font-size: clamp(0.62rem, 2.8vw, 0.7rem) !important;
      line-height: 1.3 !important;
      letter-spacing: 0 !important;
    }
  }

  @media screen and (max-width: 420px) {
    .jd-manual-header-logo-column {
      padding: 1rem !important;
    }

    .jd-manual-header-logo {
      width: min(100%, 220px) !important;
      max-width: 220px !important;
    }

    .jd-manual-header-main-row
      > .record-info-manualHero,
    .jd-manual-header-main-row
      > .record-info-manualDocumentTitle {
      min-height: 84px !important;
      padding: 0.8rem 0.65rem !important;
    }

    .jd-manual-header-meta-pair
      > .record-info-manualMeta,
    .jd-manual-header-footer-row
      > .record-info-manualFooter {
      min-height: 76px !important;
      padding: 0.65rem 0.55rem !important;
    }

    .jd-mobile-actions-row > button {
      min-height: 2.5rem;
    }

    .jd-details-document select,
    .jd-details-document input,
    .jd-details-document textarea {
      font-size: 16px !important;
    }
  }

  /*
   * Very narrow devices still retain the reference two-column information
   * rows, but reduce the cell text and padding rather than stacking everything.
   */
  @media screen and (max-width: 340px) {
    .jd-manual-header-logo {
      width: min(100%, 200px) !important;
      max-width: 200px !important;
    }

    .jd-manual-header-meta-pair
      > .record-info-manualMeta,
    .jd-manual-header-footer-row
      > .record-info-manualFooter {
      min-height: 72px !important;
      padding: 0.55rem 0.45rem !important;
    }

    .jd-manual-header-grid
      .record-info-manualMeta
      > p:last-of-type,
    .jd-manual-header-grid
      .record-info-manualFooter
      > p:last-of-type {
      font-size: 0.68rem !important;
    }

    .jd-manual-header-grid
      .record-info-manualMeta
      > div:first-child
      > p,
    .jd-manual-header-grid
      .record-info-manualFooter
      > div:first-child
      > p {
      font-size: 0.58rem !important;
    }
  }

  /*
   * Fixed-width hover cards must remain inside small phone viewports.
   * Focus-within also makes them accessible after a touch/tap.
   */
  .jd-personality-comment-popover {
    width: min(280px, calc(100vw - 2rem)) !important;
    max-width: calc(100vw - 2rem) !important;
  }

  @media (hover: none), (pointer: coarse) {
    .jd-touch-comment-target:focus-within
      .jd-touch-comment-popover {
      pointer-events: auto !important;
      opacity: 1 !important;
      transform: translateY(0.5rem) !important;
    }
  }


  /* Manual header: keep old font sizes but left-align all header text. */
  .jd-manual-header-grid .record-info-manualHero,
  .jd-manual-header-grid .record-info-manualDocumentTitle,
  .jd-manual-header-grid .record-info-manualMeta,
  .jd-manual-header-grid .record-info-manualFooter {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    text-align: left !important;
  }

  .jd-manual-header-grid .record-info-manualHero,
  .jd-manual-header-grid .record-info-manualDocumentTitle,
  .jd-manual-header-grid .record-info-manualMeta {
    justify-content: center !important;
  }

  .jd-manual-header-grid .record-info-manualFooter {
    justify-content: flex-start !important;
  }

  .jd-manual-header-grid .record-info-manualHero p,
  .jd-manual-header-grid .record-info-manualDocumentTitle p,
  .jd-manual-header-grid .record-info-manualMeta p,
  .jd-manual-header-grid .record-info-manualFooter p {
    width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    text-align: left !important;
  }

  .jd-manual-header-grid .record-info-manualHero > p:last-of-type {
    margin-top: 12px !important;
    font-size: 22px !important;
    font-weight: 800 !important;
    line-height: 28px !important;
    text-align: left !important;
  }

  .jd-manual-header-grid .record-info-manualDocumentTitle > p:last-of-type {
    margin-top: 12px !important;
    font-size: 20px !important;
    font-weight: 800 !important;
    line-height: 32px !important;
    text-align: left !important;
  }

  .jd-manual-header-grid .record-info-manualMeta > p:last-of-type {
    margin-top: 8px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    line-height: 20px !important;
    text-align: left !important;
  }

  .jd-manual-header-grid .record-info-manualFooter > p:last-of-type {
    margin-top: 12px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    line-height: 20px !important;
    text-align: left !important;
  }

  .jd-manual-header-grid .record-info-manualHero > div:first-child > p,
  .jd-manual-header-grid .record-info-manualDocumentTitle > div:first-child > p,
  .jd-manual-header-grid .record-info-manualMeta > div:first-child > p,
  .jd-manual-header-grid .record-info-manualFooter > div:first-child > p {
    font-size: 10px !important;
    font-weight: 800 !important;
    line-height: 16px !important;
    text-align: left !important;
  }
  /*
   * Dedicated mobile header. Do not resize or reflow the fixed desktop grid.
   */
  .jd-manual-header-mobile {
    display: none;
  }

  .jd-manual-header-desktop {
    display: block;
  }

  @media screen and (max-width: 820px) {
    .jd-manual-header-wrapper {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      overflow: visible !important;
      padding-bottom: 0 !important;
    }

    .jd-manual-header-desktop {
      display: none !important;
    }

    .jd-manual-header-mobile {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
    }

    .jd-manual-mobile-logo-section {
      padding: clamp(1rem, 5vw, 1.5rem) !important;
    }

    .jd-manual-mobile-logo {
      width: min(100%, 230px) !important;
      max-width: 230px !important;
      height: auto !important;
      margin-inline: auto !important;
    }

    .jd-manual-header-mobile
      .jd-manual-mobile-full-row {
      min-height: 88px !important;
      padding: 0.85rem 0.75rem !important;
    }

    .jd-manual-mobile-pair,
    .jd-manual-mobile-signatories {
      width: 100% !important;
      min-width: 0 !important;
      grid-template-columns:
        repeat(2, minmax(0, 1fr)) !important;
    }

    .jd-manual-header-mobile
      .record-info-manualMeta,
    .jd-manual-header-mobile
      .record-info-manualFooter {
      min-width: 0 !important;
      min-height: 76px !important;
      padding: 0.65rem 0.6rem !important;
    }

    .jd-manual-header-mobile
      .record-info-manualHero,
    .jd-manual-header-mobile
      .record-info-manualDocumentTitle,
    .jd-manual-header-mobile
      .record-info-manualMeta,
    .jd-manual-header-mobile
      .record-info-manualFooter {
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      justify-content: center !important;
      text-align: left !important;
    }

    .jd-manual-header-mobile
      .record-info-manualHero p,
    .jd-manual-header-mobile
      .record-info-manualDocumentTitle p,
    .jd-manual-header-mobile
      .record-info-manualMeta p,
    .jd-manual-header-mobile
      .record-info-manualFooter p {
      width: 100% !important;
      min-width: 0 !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      text-align: left !important;
    }

    .jd-manual-header-mobile
      .record-info-manualHero
      > p:last-of-type,
    .jd-manual-header-mobile
      .record-info-manualDocumentTitle
      > p:last-of-type {
      margin-top: 0.5rem !important;
      font-size: clamp(1rem, 4.7vw, 1.2rem) !important;
      font-weight: 800 !important;
      line-height: 1.35 !important;
    }

    .jd-manual-header-mobile
      .record-info-manualMeta
      > p:last-of-type,
    .jd-manual-header-mobile
      .record-info-manualFooter
      > p:last-of-type {
      margin-top: 0.35rem !important;
      font-size: clamp(0.7rem, 3.2vw, 0.82rem) !important;
      font-weight: 700 !important;
      line-height: 1.35 !important;
    }

    .jd-manual-header-mobile
      .record-info-manualHero
      > div:first-child
      > p,
    .jd-manual-header-mobile
      .record-info-manualDocumentTitle
      > div:first-child
      > p,
    .jd-manual-header-mobile
      .record-info-manualMeta
      > div:first-child
      > p,
    .jd-manual-header-mobile
      .record-info-manualFooter
      > div:first-child
      > p {
      font-size: clamp(0.58rem, 2.7vw, 0.68rem) !important;
      line-height: 1.25 !important;
      letter-spacing: 0 !important;
    }

    .jd-manual-header-mobile select,
    .jd-manual-header-mobile input {
      width: 100% !important;
      min-width: 0 !important;
      height: 2.5rem !important;
      margin-top: 0.45rem !important;
      font-size: 16px !important;
    }
  }

  @media screen and (max-width: 340px) {
    .jd-manual-mobile-logo {
      max-width: 200px !important;
    }

    .jd-manual-header-mobile
      .record-info-manualMeta,
    .jd-manual-header-mobile
      .record-info-manualFooter {
      min-height: 72px !important;
      padding: 0.55rem 0.45rem !important;
    }
  }

  .jd-screen-hidden {
    display: none !important;
  }

  .jd-mobile-paged-output {
    display: block;
    width: 100%;
    min-width: 0;
    overflow: visible;
    padding:
      0
      clamp(0px, 1.5vw, 0.75rem)
      1.25rem;
  }

  .jd-mobile-paged-output .pagedjs_pages {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 1rem !important;
    width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 0 1rem !important;
    background: transparent !important;
  }

  .jd-mobile-paged-output .pagedjs_page {
    flex: 0 0 auto !important;
    max-width: 100% !important;
    margin: 0 !important;
    overflow: hidden !important;
    background: white !important;
    border-radius: 0.75rem;
    box-shadow:
      0 14px 38px
      rgba(15, 23, 42, 0.16);
  }

  .jd-mobile-paged-output .pagedjs_sheet,
  .jd-mobile-paged-output .pagedjs_pagebox {
    max-width: 100% !important;
    background: white !important;
  }

  @media screen and (max-width: 420px) {
    .jd-mobile-paged-output {
      padding-inline: 0;
    }

    .jd-mobile-paged-output .pagedjs_pages {
      gap: 0.75rem !important;
    }

    .jd-mobile-paged-output .pagedjs_page {
      border-radius: 0.625rem;
      box-shadow:
        0 10px 26px
        rgba(15, 23, 42, 0.14);
    }
  }

  /*
   * Responsive preview mode switch.
   *
   * CSS is the immediate source of truth. This prevents a stale mobile
   * Paged.js output from remaining visible after DevTools closes or after a
   * rapid orientation/window resize.
   */
  .jd-desktop-paged-output {
    display: flex !important;
  }

  .jd-mobile-paged-output {
    display: none !important;
  }

  @media screen and (max-width: 820px) {
    .jd-desktop-paged-output {
      display: none !important;
    }

    .jd-mobile-paged-output {
      display: block !important;
    }
  }

  @media screen and (min-width: 821px) {
    .jd-desktop-paged-output {
      display: flex !important;
    }

    .jd-mobile-paged-output {
      display: none !important;
    }
  }

`;

export const pagedJobDescriptionStyles = String.raw`
  @page {
    /*
     * Match the original Details document dimensions exactly.
     * The repeated header keeps the same width and horizontal position:
     * - page width: 1100px
     * - left: 1 inch / 96px
     * - right: 0.5 inch / 48px
     */
    size: 1100px 1556px;
    margin-top: 390px;
    margin-right: 48px;
    margin-bottom: 56px;
    margin-left: 96px;

    @top-center {
      content: element(jdManualHeader);
      width: 100%;
      vertical-align: top;
    }
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: #edf2f7;
  }

  .jd-manual-header-mobile {
    display: none !important;
  }

  .jd-manual-header-desktop {
    display: block !important;
  }

  .jd-paged-running-header {
    position: running(jdManualHeader);
    display: block;
    width: 100%;
    margin-top: 30px;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /*
   * Paged.js uses the element above as a running margin header. In some
   * responsive rerenders it can also leave the original source instance
   * inside the generated page content. That creates two headers in one sheet:
   * one in the top margin and another at the beginning of the body.
   *
   * Hide only the body/source copy. The margin-box clone is outside
   * .pagedjs_page_content, so it remains visible on every sheet.
   */
  .pagedjs_page_content .jd-paged-running-header {
    display: none !important;
    height: 0 !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  .pagedjs_margin-top-center .jd-paged-running-header,
  .pagedjs_margin-top-center .jd-manual-header-wrapper,
  [class*="pagedjs_margin-top"] .jd-paged-running-header,
  [class*="pagedjs_margin-top"] .jd-manual-header-wrapper {
    display: block !important;
    visibility: visible !important;
    height: auto !important;
    overflow: visible !important;
  }

  .jd-paged-running-header,
  .jd-paged-running-header * {
    box-sizing: border-box;
  }

  .jd-paged-running-header .jd-manual-header-wrapper {
    width: 100% !important;
    overflow: visible !important;
    padding: 0 !important;
  }

  .jd-paged-running-header .jd-manual-header-grid {
    display: grid !important;
    width: 100% !important;
    min-width: 920px !important;
    grid-template-columns: 210px minmax(0, 1fr) !important;
    overflow: hidden !important;
  }

  .jd-paged-running-header .jd-manual-header-main-row {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) 185px !important;
  }

  .jd-paged-running-header .jd-manual-header-logo-column {
    min-height: 344px !important;
    padding: 24px 16px !important;
  }

  .jd-paged-running-header .jd-manual-header-logo {
    display: block;
    width: 100% !important;
    max-width: 180px !important;
    height: auto !important;
    margin: 0 auto;
    object-fit: contain;
  }

  .jd-paged-running-header .jd-manual-issuance {
    margin-top: 48px !important;
    font-size: 16px !important;
    font-weight: 500 !important;
    line-height: 1.5 !important;
  }

    .jd-paged-running-header .record-info-manualHero,
  .jd-paged-running-header .record-info-manualDocumentTitle,
  .jd-paged-running-header .record-info-manualMeta,
  .jd-paged-running-header .record-info-manualFooter {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    text-align: left !important;
  }

  .jd-paged-running-header .record-info-manualHero,
  .jd-paged-running-header .record-info-manualDocumentTitle,
  .jd-paged-running-header .record-info-manualMeta {
    justify-content: center !important;
  }

  .jd-paged-running-header .record-info-manualFooter {
    justify-content: flex-start !important;
  }

  .jd-paged-running-header .record-info-manualHero p,
  .jd-paged-running-header .record-info-manualDocumentTitle p,
  .jd-paged-running-header .record-info-manualMeta p,
  .jd-paged-running-header .record-info-manualFooter p {
    width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    text-align: left !important;
  }

  .jd-paged-running-header .record-info-manualHero > p:last-of-type,
  .jd-paged-running-header .record-info-manualDocumentTitle > p:last-of-type,
  .jd-paged-running-header .record-info-manualMeta > p:last-of-type,
  .jd-paged-running-header .record-info-manualFooter > p:last-of-type {
    text-align: left !important;
    align-self: flex-start !important;
  }

  .jd-paged-running-header .record-info-manualHero {
    min-height: 126px !important;
    padding: 16px !important;
  }

  .jd-paged-running-header .record-info-manualDocumentTitle {
    min-height: 134px !important;
    padding: 16px !important;
  }

  .jd-paged-running-header .record-info-manualMeta {
    min-height: 62px !important;
    padding: 8px 10px !important;
  }

  .jd-paged-running-header .record-info-manualFooter {
    min-height: 82px !important;
    padding: 8px 10px !important;
  }

  .jd-paged-running-header .record-info-manualHero > p:last-of-type {
    margin-top: 12px !important;
    font-size: 22px !important;
    font-weight: 800 !important;
    line-height: 28px !important;
  }

  .jd-paged-running-header
    .record-info-manualDocumentTitle
    > p:last-of-type {
    margin-top: 12px !important;
    font-size: 20px !important;
    font-weight: 800 !important;
    line-height: 32px !important;
  }

  .jd-paged-running-header .record-info-manualMeta > p:last-of-type {
    margin-top: 8px !important;
    font-size: 12px !important;
    line-height: 20px !important;
  }

  .jd-paged-running-header .record-info-manualFooter > p:last-of-type {
    margin-top: 12px !important;
    font-size: 12px !important;
    line-height: 20px !important;
  }

  .jd-paged-running-header
    .record-info-manualHero
    > div:first-child
    > p,
  .jd-paged-running-header
    .record-info-manualDocumentTitle
    > div:first-child
    > p,
  .jd-paged-running-header
    .record-info-manualMeta
    > div:first-child
    > p,
  .jd-paged-running-header
    .record-info-manualFooter
    > div:first-child
    > p {
    font-size: 10px !important;
    line-height: 16px !important;
  }

  .jd-paged-document-body {
    color: #1d2939;
    font-family: inherit;
    font-size: 9.75pt;
    line-height: 1.45;
    text-align: left !important;
    text-justify: auto !important;
    word-spacing: normal !important;
    letter-spacing: normal !important;
  }

  .jd-paged-document-body > section,
  .jd-paged-document-body > div {
    break-inside: auto;
  }

  .jd-paged-document-body > section + section {
    margin-top: 6mm !important;
  }

  .jd-paged-document-body h4 {
    margin-bottom: 2.5mm !important;
    break-after: avoid;
    page-break-after: avoid;
    text-align: left !important;
    line-height: 1.35 !important;
  }

  /*
   * Saved Tiptap content may contain text-align: justify. Override it in the
   * document preview so short lines do not spread words across the page.
   */
  .jd-paged-document-body .jd-single-spaced-justified,
  .jd-paged-document-body .jd-single-spaced-justified p,
  .jd-paged-document-body .jd-single-spaced-justified li,
  .jd-paged-document-body .jd-single-spaced-justified span,
  .jd-paged-document-body .jd-rich-text-viewer,
  .jd-paged-document-body .jd-rich-text-viewer p,
  .jd-paged-document-body .jd-rich-text-viewer li,
  .jd-paged-document-body .jd-rich-text-viewer span,
  .jd-paged-document-body [style*="text-align: justify"] {
    text-align: left !important;
    text-justify: auto !important;
    word-spacing: normal !important;
    letter-spacing: normal !important;
    line-height: 1.45 !important;
  }

  .jd-paged-document-body .jd-rich-text-viewer > * + * {
    margin-top: 2.2mm !important;
  }

  .jd-paged-document-body .jd-rich-text-viewer p {
    margin: 0 !important;
  }

  .jd-paged-document-body .jd-rich-text-viewer p:empty {
    display: none !important;
  }

  .jd-paged-document-body .jd-rich-text-viewer ol,
  .jd-paged-document-body .jd-rich-text-viewer ul,
  .jd-paged-document-body ol,
  .jd-paged-document-body ul {
    margin-top: 2mm !important;
    margin-bottom: 2mm !important;
    padding-left: 8mm !important;
    break-inside: auto;
    list-style-position: outside !important;
  }

  .jd-paged-document-body .jd-rich-text-viewer ol {
    list-style-type: decimal !important;
  }

  .jd-paged-document-body .jd-rich-text-viewer ul {
    list-style-type: disc !important;
  }

  .jd-paged-document-body .jd-rich-text-viewer ol ol {
    padding-left: 8mm !important;
    list-style-type: lower-alpha !important;
  }

  .jd-paged-document-body .jd-rich-text-viewer ol ol ol {
    list-style-type: lower-roman !important;
  }

  .jd-paged-document-body .jd-rich-text-viewer ul ul {
    list-style-type: circle !important;
  }

  .jd-paged-document-body .jd-rich-text-viewer li,
  .jd-paged-document-body li {
    display: list-item !important;
    margin-top: 1.4mm !important;
    padding-left: 1.5mm !important;
    line-height: 1.45 !important;
    orphans: 3;
    widows: 3;
  }

  .jd-paged-document-body .jd-rich-text-viewer li:first-child,
  .jd-paged-document-body li:first-child {
    margin-top: 0 !important;
  }

  .jd-paged-document-body .jd-rich-text-viewer li > p {
    display: inline;
    margin: 0 !important;
  }

  .jd-paged-document-body p {
    orphans: 3;
    widows: 3;
  }

  /*
   * Remove blank list entries produced by older malformed rich-text records.
   */
  .jd-paged-document-body li:has(> p:only-child:empty),
  .jd-paged-document-body li:has(> p:only-child > br:only-child) {
    display: none !important;
  }

  .jd-competencies-mobile-fix {
    break-inside: auto;
  }

  .jd-competencies-mobile-fix tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .pagedjs_page {
    background: white;
  }

  .pagedjs_page .jd-rich-text-viewer {
    max-width: 100%;
    text-align: left !important;
    text-justify: auto !important;
  }


  /* Paged.js manual header: keep old font sizes but left-align all header text. */
  .jd-paged-running-header .record-info-manualHero,
  .jd-paged-running-header .record-info-manualDocumentTitle,
  .jd-paged-running-header .record-info-manualMeta,
  .jd-paged-running-header .record-info-manualFooter {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    text-align: left !important;
  }

  .jd-paged-running-header .record-info-manualHero,
  .jd-paged-running-header .record-info-manualDocumentTitle,
  .jd-paged-running-header .record-info-manualMeta {
    justify-content: center !important;
  }

  .jd-paged-running-header .record-info-manualFooter {
    justify-content: flex-start !important;
  }

  .jd-paged-running-header .record-info-manualHero p,
  .jd-paged-running-header .record-info-manualDocumentTitle p,
  .jd-paged-running-header .record-info-manualMeta p,
  .jd-paged-running-header .record-info-manualFooter p {
    width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    text-align: left !important;
  }

  .jd-paged-running-header .record-info-manualHero {
    min-height: 126px !important;
    padding: 16px !important;
  }

  .jd-paged-running-header .record-info-manualDocumentTitle {
    min-height: 134px !important;
    padding: 16px !important;
  }

  .jd-paged-running-header .record-info-manualMeta {
    min-height: 62px !important;
    padding: 8px 10px !important;
  }

  .jd-paged-running-header .record-info-manualFooter {
    min-height: 82px !important;
    padding: 8px 10px !important;
  }

  .jd-paged-running-header .record-info-manualHero > p:last-of-type {
    margin-top: 12px !important;
    font-size: 22px !important;
    font-weight: 800 !important;
    line-height: 28px !important;
    text-align: left !important;
    align-self: flex-start !important;
  }

  .jd-paged-running-header .record-info-manualDocumentTitle > p:last-of-type {
    margin-top: 12px !important;
    font-size: 20px !important;
    font-weight: 800 !important;
    line-height: 32px !important;
    text-align: left !important;
    align-self: flex-start !important;
  }

  .jd-paged-running-header .record-info-manualMeta > p:last-of-type {
    margin-top: 8px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    line-height: 20px !important;
    text-align: left !important;
    align-self: flex-start !important;
  }

  .jd-paged-running-header .record-info-manualFooter > p:last-of-type {
    margin-top: 12px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    line-height: 20px !important;
    text-align: left !important;
    align-self: flex-start !important;
  }

  .jd-paged-running-header .record-info-manualHero > div:first-child > p,
  .jd-paged-running-header .record-info-manualDocumentTitle > div:first-child > p,
  .jd-paged-running-header .record-info-manualMeta > div:first-child > p,
  .jd-paged-running-header .record-info-manualFooter > div:first-child > p {
    font-size: 10px !important;
    font-weight: 800 !important;
    line-height: 16px !important;
    text-align: left !important;
  }
`;


export function createMobilePagedJobDescriptionStyles({
  pageWidth = 390,
  pageHeight = 1320,
  headerHeight = 680,
} = {}) {
  const safePageWidth = Math.max(
    280,
    Math.round(Number(pageWidth || 390)),
  );

  const safePageHeight = Math.max(
    1000,
    Math.round(Number(pageHeight || 1320)),
  );

  const safeHeaderHeight = Math.max(
    520,
    Math.round(Number(headerHeight || 680)),
  );

  return String.raw`
    @page {
      size:
        ${safePageWidth}px
        ${safePageHeight}px;

      margin-top:
        ${safeHeaderHeight + 18}px;

      margin-right: 10px;
      margin-bottom: 28px;
      margin-left: 10px;

      @top-center {
        content: element(jdManualHeader);
        width: 100%;
        vertical-align: top;
      }
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #edf2f7;
      color: #1d2939;
      font-family: inherit;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    .jd-paged-running-header {
      position: running(jdManualHeader);
      display: block !important;
      width: 100% !important;
      margin: 0 !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    /*
     * Show the header only in the running top margin. Without this rule,
     * Paged.js can keep the original header node in the mobile page body,
     * making it look like the header repeats twice inside one sheet.
     */
    .pagedjs_page_content
      .jd-paged-running-header {
      display: none !important;
      height: 0 !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }

    .pagedjs_margin-top-center
      .jd-paged-running-header,
    .pagedjs_margin-top-center
      .jd-manual-header-wrapper,
    [class*="pagedjs_margin-top"]
      .jd-paged-running-header,
    [class*="pagedjs_margin-top"]
      .jd-manual-header-wrapper {
      display: block !important;
      visibility: visible !important;
      height: auto !important;
      overflow: visible !important;
    }

    .jd-manual-header-wrapper {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
    }

    .jd-manual-header-desktop {
      display: none !important;
    }

    .jd-manual-header-mobile {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      overflow: hidden !important;
      border: 2px solid #000 !important;
      background: white !important;
    }

    .jd-manual-mobile-logo-section {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: 0 !important;
      padding: 18px 14px !important;
      border-bottom: 2px solid #000 !important;
      text-align: center !important;
    }

    .jd-manual-mobile-logo {
      display: block !important;
      width: min(100%, 220px) !important;
      max-width: 220px !important;
      height: auto !important;
      margin: 0 auto !important;
      object-fit: contain !important;
    }

    .jd-manual-mobile-logo-section > p {
      margin: 14px 0 0 !important;
      color: #000 !important;
      font-size: 14px !important;
      font-weight: 700 !important;
      line-height: 1.35 !important;
    }

    .jd-manual-mobile-full-row {
      display: flex !important;
      min-height: 84px !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      justify-content: center !important;
      padding: 12px 10px !important;
      border-bottom: 2px solid #000 !important;
      background: white !important;
      text-align: left !important;
    }

    .jd-manual-mobile-pair,
    .jd-manual-mobile-signatories {
      display: grid !important;
      width: 100% !important;
      min-width: 0 !important;
      grid-template-columns:
        repeat(2, minmax(0, 1fr)) !important;
    }

    .jd-manual-mobile-pair {
      border-bottom: 2px solid #000 !important;
    }

    .jd-manual-header-mobile
      .record-info-manualMeta,
    .jd-manual-header-mobile
      .record-info-manualFooter {
      display: flex !important;
      min-width: 0 !important;
      min-height: 74px !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      justify-content: center !important;
      padding: 10px 8px !important;
      background: white !important;
      text-align: left !important;
    }

    .jd-manual-header-mobile
      .record-info-manualHero,
    .jd-manual-header-mobile
      .record-info-manualDocumentTitle {
      min-height: 84px !important;
      padding: 12px 10px !important;
    }

    .jd-manual-header-mobile p {
      width: 100% !important;
      min-width: 0 !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      color: #000 !important;
      text-align: left !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }

    .jd-manual-header-mobile
      .record-info-manualHero
      > p:last-of-type,
    .jd-manual-header-mobile
      .record-info-manualDocumentTitle
      > p:last-of-type {
      margin-top: 7px !important;
      font-size: 17px !important;
      font-weight: 800 !important;
      line-height: 1.35 !important;
    }

    .jd-manual-header-mobile
      .record-info-manualMeta
      > p:last-of-type,
    .jd-manual-header-mobile
      .record-info-manualFooter
      > p:last-of-type {
      margin-top: 5px !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      line-height: 1.35 !important;
    }

    .jd-manual-header-mobile
      .record-info-manualHero
      > div:first-child
      > p,
    .jd-manual-header-mobile
      .record-info-manualDocumentTitle
      > div:first-child
      > p,
    .jd-manual-header-mobile
      .record-info-manualMeta
      > div:first-child
      > p,
    .jd-manual-header-mobile
      .record-info-manualFooter
      > div:first-child
      > p {
      font-size: 9px !important;
      font-weight: 800 !important;
      line-height: 1.25 !important;
      letter-spacing: 0 !important;
    }

    .jd-paged-document-body {
      width: 100%;
      min-width: 0;
      color: #1d2939;
      font-size: 14px;
      line-height: 1.55;
      text-align: left !important;
      text-justify: auto !important;
      word-spacing: normal !important;
      letter-spacing: normal !important;
    }

    .jd-paged-document-body
      > section
      + section {
      margin-top: 24px !important;
    }

    .jd-paged-document-body h4 {
      margin: 0 0 12px !important;
      color: #101828 !important;
      font-size: 14px !important;
      font-weight: 800 !important;
      line-height: 1.4 !important;
      break-after: avoid;
      page-break-after: avoid;
    }

    .jd-paged-document-body
      .jd-rich-text-viewer,
    .jd-paged-document-body
      .jd-rich-text-viewer p,
    .jd-paged-document-body
      .jd-rich-text-viewer li,
    .jd-paged-document-body
      .jd-rich-text-viewer span,
    .jd-paged-document-body
      [style*="text-align: justify"] {
      color: #344054 !important;
      font-size: 14px !important;
      line-height: 1.55 !important;
      text-align: left !important;
      text-justify: auto !important;
      word-spacing: normal !important;
      letter-spacing: normal !important;
    }

    .jd-paged-document-body
      .jd-rich-text-viewer
      > *
      + * {
      margin-top: 10px !important;
    }

    .jd-paged-document-body
      .jd-rich-text-viewer ol,
    .jd-paged-document-body
      .jd-rich-text-viewer ul {
      margin: 8px 0 !important;
      padding-left: 28px !important;
      list-style-position: outside !important;
    }

    .jd-paged-document-body
      .jd-rich-text-viewer ol {
      list-style-type: decimal !important;
    }

    .jd-paged-document-body
      .jd-rich-text-viewer ul {
      list-style-type: disc !important;
    }

    .jd-paged-document-body
      .jd-rich-text-viewer ol ol {
      padding-left: 24px !important;
      list-style-type: lower-alpha !important;
    }

    .jd-paged-document-body
      .jd-rich-text-viewer li {
      display: list-item !important;
      margin-top: 6px !important;
      padding-left: 4px !important;
      line-height: 1.55 !important;
    }

    .jd-paged-document-body
      .jd-rich-text-viewer li > p {
      display: inline;
      margin: 0 !important;
    }

    .jd-competencies-mobile-fix {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      overflow: hidden !important;
    }

    .jd-competencies-mobile-fix table {
      width: 100% !important;
      max-width: 100% !important;
      table-layout: fixed !important;
    }

    .jd-competencies-mobile-fix th,
    .jd-competencies-mobile-fix td {
      overflow-wrap: anywhere !important;
      white-space: normal !important;
    }

    [data-print-hide] {
      display: none !important;
    }

    .pagedjs_page,
    .pagedjs_sheet,
    .pagedjs_pagebox {
      background: white !important;
    }

    .pagedjs_page {
      overflow: hidden !important;
    }
  `;
}
