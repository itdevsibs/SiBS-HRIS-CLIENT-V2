import { after, before, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire, Module } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../../../../", import.meta.url));
let dom;
let React;
let createRoot;
let app;
let container;
let Harness;
let IntegratedHarness;
let EsepHarness;
let PortalHarness;

before(async () => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
  for (const key of ["window", "document", "HTMLElement", "Element", "Node", "MutationObserver", "localStorage", "sessionStorage"])
    globalThis[key] = dom.window[key];
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  React = require("react");
  ({ createRoot } = require("react-dom/client"));
  const result = await build({
    stdin: {
      contents: `
        import React, { useState } from 'react';
        import Roster from './src/components/recruitment/onboarding/OnboardingJourneyRoster.jsx';
        import { JourneyProvider, useJourney } from './src/components/recruitment/journey/JourneyContext.jsx';
        import EmployeeJourneyModule from './src/components/recruitment/journey/EmployeeJourneyModule.jsx';
        import ESEPCoachingTabView from './src/components/recruitment/journey/views/ESEPCoachingTabView.jsx';
        import PublicApplicantPortalPage from './src/pages/public/PublicApplicantPortalPage.jsx';
        import { MemoryRouter } from 'react-router-dom';
        export function PortalHarness() { return <MemoryRouter><PublicApplicantPortalPage /></MemoryRouter>; }
        export function EsepHarness() { return <JourneyProvider><ESEPCoachingTabView /></JourneyProvider>; }
        function IntegratedContent() {
          const { journeys, setSelectedJourney } = useJourney();
          return <><EmployeeJourneyModule summaryOnly /><Roster records={[]} journeys={journeys} loading={false} onViewJourney={setSelectedJourney} /></>;
        }
        export function IntegratedHarness() { return <JourneyProvider><IntegratedContent /></JourneyProvider>; }
        export function Harness({ records = [], journeys = [], onViewRecord, onViewJourney }) {
          const [selected, setSelected] = useState(null);
          return <><Roster records={records} journeys={journeys} loading={false}
            onViewRecord={(record) => { onViewRecord?.(record); setSelected(record.candidateName); }}
            onViewJourney={(journey) => { onViewJourney?.(journey); setSelected(journey.fullName); }} />
            {selected && <div role="dialog">{selected}</div>}</>;
        }
      `,
      resolveDir: root,
      loader: "jsx",
    },
    alias: { "@": `${root}/src` },
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    packages: "external",
    jsx: "automatic",
    define: { "import.meta.env": "{}" },
    logLevel: "silent",
  });
  const compiled = new Module(`${root}/roster-interaction-check.cjs`);
  compiled.paths = require.resolve.paths("react");
  compiled._compile(result.outputFiles[0].text, compiled.id);
  ({ Harness, IntegratedHarness, EsepHarness, PortalHarness } = compiled.exports);
});

after(async () => {
  if (app) await React.act(async () => app.unmount());
  dom?.window.close();
});

const journey = { id: "J-TEST", fullName: "Test Trainee", account: "Support", trainerName: "Test Trainer", daysElapsed: 27, overallProgressPct: 30, stage: "Day 1–30", day30: {}, day60: {}, day90: {} };
it("renders the applicant portal checklist without preview tools", async () => {
  document.body.innerHTML = '<div id="test-root"></div>';
  container = document.getElementById("test-root");
  app = createRoot(container);
  await React.act(async () => app.render(React.createElement(PortalHarness)));
  assert.ok(container.textContent.includes("Orientation"));
  assert.equal(container.textContent.includes("Preview tools"), false);
  await React.act(async () => app.unmount());
  app = null;
});
it("renders ESEP outcomes and opens the Assign Action Item modal", async () => {
  document.body.innerHTML = '<div id="test-root"></div>';
  container = document.getElementById("test-root");
  app = createRoot(container);
  await React.act(async () => app.render(React.createElement(EsepHarness)));
  const assign = [...container.querySelectorAll("button")].find((button) => button.textContent.includes("Assign Action Item"));
  assert.ok(assign, "the ESEP page must render without undefined component references");
  await React.act(async () => assign.click());
  const dialog = document.querySelector('[role="dialog"]');
  assert.ok(dialog?.textContent.includes("Assign Coaching Action Item"));
  assert.ok(dialog.textContent.includes("Coachee"));
  const close = [...dialog.querySelectorAll("button")].find((button) => button.textContent === "Close");
  await React.act(async () => close.click());
  assert.equal(document.querySelector('[role="dialog"]'), null);
});
async function render(props) {
  if (app) await React.act(async () => app.unmount());
  document.body.innerHTML = '<div id="test-root"></div>';
  container = document.getElementById("test-root");
  app = createRoot(container);
  await React.act(async () => app.render(React.createElement(Harness, props)));
}

it("opens the journey dialog when a non-button table cell is clicked", async () => {
  await render({ journeys: [journey] });
  const cell = container.querySelector("tbody tr td:nth-child(3)");
  await React.act(async () => cell.dispatchEvent(new window.MouseEvent("click", { bubbles: true })));
  assert.equal(document.querySelector('[role="dialog"]')?.textContent, "Test Trainee");
});

it("opens onboarding rows with Enter and Space", async () => {
  for (const key of ["Enter", " "]) {
    await render({ records: [{ id: 1, candidateName: "Test Candidate" }] });
    const row = container.querySelector("tbody tr");
    assert.equal(row.tabIndex, 0);
    await React.act(async () => row.dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })));
    assert.equal(document.querySelector('[role="dialog"]')?.textContent, "Test Candidate");
  }
});

it("does not also trigger the row action when Review journey is clicked", async () => {
  let onboardingCalls = 0;
  let journeyCalls = 0;
  await render({ records: [{ id: 1, candidateName: journey.fullName, candidateEmail: "test@example.test" }], journeys: [{ ...journey, email: "test@example.test" }], onViewRecord: () => onboardingCalls++, onViewJourney: () => journeyCalls++ });
  const button = [...container.querySelectorAll("tbody button")].find((item) => item.textContent.startsWith("Review journey"));
  await React.act(async () => button.click());
  assert.equal(journeyCalls, 1);
  assert.equal(onboardingCalls, 0);
});

it("opens the mobile profile card when its background is clicked", async () => {
  await render({ journeys: [journey] });
  const card = container.querySelector("article");
  await React.act(async () => card.dispatchEvent(new window.MouseEvent("click", { bubbles: true })));
  assert.equal(document.querySelector('[role="dialog"]')?.textContent, "Test Trainee");
});

it("opens the real journey profile with timeline, coaching, handoffs, and milestone content", async () => {
  if (app) await React.act(async () => app.unmount());
  localStorage.clear();
  document.body.innerHTML = '<div id="test-root"></div>';
  container = document.getElementById("test-root");
  app = createRoot(container);
  await React.act(async () => app.render(React.createElement(IntegratedHarness)));
  const cell = container.querySelector("tbody tr td:nth-child(3)");
  await React.act(async () => cell.dispatchEvent(new window.MouseEvent("click", { bubbles: true })));
  const dialog = document.querySelector('[role="dialog"]');
  assert.ok(dialog, "the real profile modal should mount in the document body");
  for (const label of ["Journey Timeline", "Coaching & Support", "Handoffs", "Milestone Evaluations", "All 30 / 60 / 90"])
    assert.ok(dialog.textContent.includes(label), `profile should contain ${label}`);
  const brokenColorClasses = [...dialog.querySelectorAll("[class]")].flatMap((element) => [...element.classList]).filter((token) => token.includes("[var(") && !token.includes(")]"));
  assert.deepEqual(brokenColorClasses, [], "modal colors must use valid theme utilities, not whitespace-split Tailwind expressions");
  const handoffAction = [...dialog.querySelectorAll("button")].find((button) => button.textContent.includes("Perform Handoff"));
  assert.ok(handoffAction.classList.contains("sibs-modal-btn-primary"), "the handoff CTA must use the shared orange modal button");
  assert.equal(document.querySelectorAll('[role="dialog"]').length, 1, "embedded reviews must not create a second modal");
  const fullView = dialog.querySelector('button[title="Open Full View of FST Process"]');
  await React.act(async () => fullView.click());
  const dialogs = [...document.querySelectorAll('[role="dialog"]')];
  assert.equal(dialogs.length, 2, "training details must use the shared modal shell");
  const training = dialogs.find((element) => element.classList.contains("z-[10020]"));
  assert.ok(training, "nested training details must appear above the profile modal");
  assert.ok(training.textContent.includes("Full Process View"));
  const closeTraining = [...training.querySelectorAll("button")].find((button) => button.textContent === "Close Full View");
  assert.ok(closeTraining.classList.contains("sibs-modal-btn-secondary"));
  await React.act(async () => closeTraining.click());
  assert.equal(document.querySelectorAll('[role="dialog"]').length, 1);
  const calendarButton = [...dialog.querySelectorAll("button")].find((button) => button.textContent.includes("Daily Performance Calendar"));
  await React.act(async () => calendarButton.click());
  const dayCard = [...dialog.querySelectorAll("div.cursor-pointer.group")].find((element) => element.textContent.includes("Day 1"));
  assert.ok(dayCard, "the calendar should show a selectable day");
  await React.act(async () => dayCard.click());
  const dayDialog = [...document.querySelectorAll('[role="dialog"]')].find((element) => element.classList.contains("z-[10020]"));
  assert.ok(dayDialog, "daily details must render as a separate modal above the profile");
  assert.equal(dayDialog.parentElement, document.body, "daily details must escape the profile's scrolling and transformed container");
  const previousDay = dayDialog.querySelector('button[aria-label="Previous day"]');
  assert.equal(previousDay.disabled, true);
  const nextDay = dayDialog.querySelector('button[aria-label="Next day"]');
  await React.act(async () => nextDay.click());
  assert.ok(dayDialog.textContent.includes("Day 2 of 90"));
  const closeDay = [...dayDialog.querySelectorAll("button")].find((button) => button.textContent === "Close Day View");
  await React.act(async () => closeDay.click());
  assert.equal(document.querySelectorAll('[role="dialog"]').length, 1);
  const handoffs = [...dialog.querySelectorAll("button")].find((button) => button.textContent.startsWith("Handoffs"));
  await React.act(async () => handoffs.click());
  assert.ok(dialog.textContent.includes("Handoff"));
  const close = [...dialog.querySelectorAll("button")].find((button) => button.textContent === "Close Journey");
  await React.act(async () => close.click());
  assert.equal(document.querySelector('[role="dialog"]'), null);
});
