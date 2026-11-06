import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("NHO Page Harmonization & Full-Width Layout", () => {
  const pagePath = path.resolve(__dirname, "../../../pages/recruitment/NewHireOrientationPage.jsx");
  const mainModulePath = path.resolve(__dirname, "./NHOMainModule.jsx");
  const roleHeaderPath = path.resolve(__dirname, "./NHORoleHeader.jsx");
  const taDashboardPath = path.resolve(__dirname, "./ta/NHOTADashboard.jsx");
  const attendanceViewPath = path.resolve(__dirname, "./ta/NHOAttendanceView.jsx");
  const handoffsViewPath = path.resolve(__dirname, "./ta/NHOHandoffsView.jsx");

  const pageContent = fs.readFileSync(pagePath, "utf-8");
  const mainModuleContent = fs.readFileSync(mainModulePath, "utf-8");
  const roleHeaderContent = fs.readFileSync(roleHeaderPath, "utf-8");
  const taDashboardContent = fs.readFileSync(taDashboardPath, "utf-8");
  const attendanceViewContent = fs.readFileSync(attendanceViewPath, "utf-8");
  const handoffsViewContent = fs.readFileSync(handoffsViewPath, "utf-8");

  it("NewHireOrientationPage aligns with standard full-width layout without inner padding traps", () => {
    assert.ok(pageContent.includes('className="sibs-dashboard-shell"'));
    assert.ok(pageContent.includes('className="sibs-dashboard-main-wide"'));
    assert.ok(pageContent.includes("max-w-[1700px]"));
    assert.ok(!pageContent.includes("overflow-hidden"));
    assert.ok(!pageContent.includes("h-dvh"));
  });

  it("NHOMainModule eliminates nested main tags and canvas wrapper", () => {
    assert.ok(!mainModuleContent.includes("nho-workspace"));
    assert.ok(!mainModuleContent.includes("bg-sibs-canvas"));
    assert.ok(!mainModuleContent.includes("<main"));
    assert.ok(mainModuleContent.includes("onSwitchModule={onSwitchModule}"));
  });

  it("NHORoleHeader uses PageHeaderHero and integrates action buttons", () => {
    assert.ok(roleHeaderContent.includes("<PageHeaderHero"));
    assert.ok(roleHeaderContent.includes("kicker={sectionHeader.badge"));
    assert.ok(roleHeaderContent.includes("title={sectionHeader.title"));
    assert.ok(roleHeaderContent.includes("onSwitchModule"));
    assert.ok(roleHeaderContent.includes("Standalone Employee View"));
  });

  it("NHOTADashboard uses standard MetricGrid and MetricCard with QDS filters", () => {
    assert.ok(taDashboardContent.includes("<MetricGrid columns={7}>"));
    assert.ok(taDashboardContent.includes("<MetricCard"));
    assert.ok(taDashboardContent.includes('clearFilterLabel="Clear"'));
    assert.ok(taDashboardContent.includes("hasActiveFilters"));
    assert.ok(taDashboardContent.includes("onClearFilters"));
  });

  it("NHOAttendanceView and NHOHandoffsView use MetricGrid and MetricCard", () => {
    assert.ok(attendanceViewContent.includes("<MetricGrid columns={4}>"));
    assert.ok(attendanceViewContent.includes("<MetricCard"));
    assert.ok(handoffsViewContent.includes("<MetricGrid columns={4}>"));
    assert.ok(handoffsViewContent.includes("<MetricCard"));
  });
});
