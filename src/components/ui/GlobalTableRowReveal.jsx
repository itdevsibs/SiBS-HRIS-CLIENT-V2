import { useEffect } from "react";

// The Attendance Records table has its own approved CSS animation. Other HRIS
// tables use the same 320 ms / 30 ms stagger without editing their renderers.
const ROW_DURATION_MS = 320;
const ROW_STAGGER_MS = 30;
const MAX_STAGGER_INDEX = 12;
// Large unpaginated reports must not launch hundreds of concurrent animations.
// Their first visible rows get the reveal; later rows remain immediately usable.
const MAX_ANIMATED_ROWS_PER_TABLE = 40;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const SKIP_ROW_CONTENT =
  '[data-testid*="skeleton"], [class*="skeleton"], [class*="Skeleton"], .animate-pulse';

function isDataRow(row) {
  if (row?.tagName !== "TR" || row.parentElement?.tagName !== "TBODY") return false;
  if (!row.cells.length || row.hasAttribute("data-sibs-no-row-animation")) return false;
  if (row.className && /(?:^|\s)[^\s]*(?:row-reveal|sibs-page-card-in)(?:\s|$)/i.test(String(row.className))) return false;
  if (row.getAttribute("data-testid")?.toLowerCase().includes("skeleton")) return false;
  if (row.querySelector(SKIP_ROW_CONTENT)) return false;
  // An empty-state or a spinner spanning the table is not a data record.
  if (row.cells.length === 1 && row.cells[0].colSpan > 1) return false;
  if (row.parentElement.getAttribute("aria-busy") === "true") return false;
  if (row.closest('table[aria-busy="true"]')) return false;
  return true;
}

function getRecordSignature(row) {
  // React can reuse a <tr> across pagination. Key changes in the identifying
  // columns warrant a new reveal; live status/time changes in later columns do not.
  return Array.from(row.cells)
    .slice(0, 2)
    .map((cell) => (cell.textContent || "").replace(/\s+/g, " ").trim().slice(0, 160))
    .join("\u001f");
}

/**
 * Single DOM observer for authenticated SiBS HRIS tables.
 *
 * - Animates *data* rows after async/skeleton loading completes.
 * - Covers native tables on pages, dashboard views and modal overlays.
 * - Replays for new records/pagination, but not unchanged live-refresh rows.
 * - Does not delay data loading, alter table DOM, touch SQL, or add dependencies.
 * - Existing row-specific animations (Attendance, Employees, Schedule) win.
 * - Mobile tables represented by DataCard retain their existing card animation.
 */
export default function GlobalTableRowReveal() {
  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return undefined;
    // ModalShell portals to <body>, outside #root. Observe both route tables
    // and portal-mounted modal tables without touching each individual page.
    const root = document.body;
    if (!root) return undefined;

    const seenSignatures = new WeakMap();
    const pendingTables = new Set();
    const runningAnimations = new WeakMap();
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let frame = null;
    let disposed = false;

    function animateTable(table) {
      if (!table.isConnected || reducedMotion?.matches) return;
      // Hidden responsive desktop tables should animate when actually visible.
      if (!table.getClientRects().length) return;
      const bodies = table.tBodies;
      for (const body of bodies) {
        const rows = Array.from(body.children).filter((node) => node.tagName === "TR");
        for (const [index, row] of rows.entries()) {
          if (!isDataRow(row)) continue;
          const signature = getRecordSignature(row);
          if (seenSignatures.get(row) === signature) continue;
          seenSignatures.set(row, signature);
          if (index >= MAX_ANIMATED_ROWS_PER_TABLE) continue;
          if (typeof row.animate !== "function") continue;
          // Cancel a superseded transition when React reuses a row for a new page.
          runningAnimations.get(row)?.cancel();
          const animation = row.animate(
            [
              { opacity: 0, transform: "translateY(8px)" },
              { opacity: 1, transform: "translateY(0px)" },
            ],
            {
              duration: ROW_DURATION_MS,
              delay: Math.min(index, MAX_STAGGER_INDEX) * ROW_STAGGER_MS,
              easing: EASING,
              fill: "backwards",
            },
          );
          runningAnimations.set(row, animation);
          animation.onfinish = () => {
            // Leave the row's original CSS (including hover styles) in control.
            if (runningAnimations.get(row) === animation) {
              runningAnimations.delete(row);
              animation.cancel();
            }
          };
        }
      }
    }

    function flush() {
      frame = null;
      if (disposed) return;
      const tables = Array.from(pendingTables);
      pendingTables.clear();
      tables.forEach(animateTable);
    }

    function schedule() {
      if (frame === null) frame = window.requestAnimationFrame(flush);
    }

    function addTable(table) {
      if (table?.tagName !== "TABLE") return;
      pendingTables.add(table);
      schedule();
    }

    function addTablesIn(node) {
      if (node?.nodeType !== 1) return;
      if (node.matches?.("table")) addTable(node);
      node.querySelectorAll?.("table").forEach(addTable);
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const target = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
        if (mutation.type === "characterData") {
          // Only the identifying columns count as pagination/filter replacement.
          const cell = target?.closest?.("td, th");
          if (cell && cell.cellIndex <= 1) addTable(cell.closest("table"));
          continue;
        }
        if (mutation.type === "attributes") {
          addTable(target?.closest?.("table"));
          continue;
        }
        addTable(target?.closest?.("table"));
        mutation.addedNodes.forEach(addTablesIn);
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-busy"],
    });
    root.querySelectorAll("table").forEach(addTable);

    const checkResponsiveTables = () => root.querySelectorAll("table").forEach(addTable);
    window.addEventListener("resize", checkResponsiveTables, { passive: true });

    return () => {
      disposed = true;
      observer.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", checkResponsiveTables);
      pendingTables.clear();
    };
  }, []);

  return null;
}
