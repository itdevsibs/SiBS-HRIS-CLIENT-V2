import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Ticket SIBS-UIUX-PATTERN-B-01: Core Tables Pattern B Filter Decoupling", () => {
  const employeeTablePath = path.resolve(__dirname, "./employees/EmployeeTable.jsx");
  const attendanceTablePath = path.resolve(__dirname, "./AttendanceTable.jsx");
  const leavesTablePath = path.resolve(__dirname, "./Leaves/LeavesTable.jsx");

  it("TC-01: EmployeeTable.jsx decouples from PaginationTable and composes canonical Pattern B controls", () => {
    const content = fs.readFileSync(employeeTablePath, "utf-8");
    // Should not import PaginationTable
    expect(content).not.toContain("import PaginationTable");
    expect(content).not.toContain("<PaginationTable");
    // Should compose SearchInput and SelectDropdown
    expect(content).toMatch(/import\s*\{[^}]*SearchInput[^}]*\}\s*from\s*["']@\/components\/ui["']|import\s+SearchInput\s+from\s+["']@\/components\/ui\/SearchInput["']/);
    expect(content).toMatch(/import\s*\{[^}]*SelectDropdown[^}]*\}\s*from\s*["']@\/components\/ui["']|import\s+SelectDropdown\s+from\s+["']@\/components\/ui\/SelectDropdown["']/);
    expect(content).toContain("<SearchInput");
    expect(content).toContain("<SelectDropdown");
  });

  it("TC-02: AttendanceTable.jsx decouples from PaginationTable and composes canonical Pattern B controls", () => {
    const content = fs.readFileSync(attendanceTablePath, "utf-8");
    // Should not import PaginationTable
    expect(content).not.toContain("import PaginationTable");
    expect(content).not.toContain("<PaginationTable");
    // Should compose SearchInput and SelectDropdown
    expect(content).toContain("<SearchInput");
    expect(content).toContain("<SelectDropdown");
  });

  it("TC-03: LeavesTable.jsx decouples from PaginationTable and composes canonical Pattern B controls", () => {
    const content = fs.readFileSync(leavesTablePath, "utf-8");
    // Should not import PaginationTable
    expect(content).not.toContain("import PaginationTable");
    expect(content).not.toContain("<PaginationTable");
    // Should compose SearchInput and SelectDropdown
    expect(content).toContain("<SearchInput");
    expect(content).toContain("<SelectDropdown");
  });

  it("TC-04: Eradicates showPagination={false} misuse across all three core operational tables", () => {
    const empContent = fs.readFileSync(employeeTablePath, "utf-8");
    const attContent = fs.readFileSync(attendanceTablePath, "utf-8");
    const leaContent = fs.readFileSync(leavesTablePath, "utf-8");

    expect(empContent).not.toContain("showPagination={false}");
    expect(attContent).not.toContain("showPagination={false}");
    expect(leaContent).not.toContain("showPagination={false}");
  });
});

describe("Ticket SIBS-UIUX-PATTERN-B-02: Resignation Table Pattern B Filter Decoupling", () => {
  const resignationTablePath = path.resolve(__dirname, "./ResignationTable.jsx");
  const employeeResignationTablePath = path.resolve(
    __dirname,
    "./employees/EmployeeResignationTable.jsx",
  );

  it("TC-05: ResignationTable.jsx decouples from PaginationTable and composes canonical Pattern B controls", () => {
    const content = fs.readFileSync(resignationTablePath, "utf-8");
    expect(content).not.toContain("import PaginationTable");
    expect(content).not.toContain("<PaginationTable");
    expect(content).toMatch(
      /import\s*\{[^}]*SearchInput[^}]*\}\s*from\s*["']@\/components\/ui["']|import\s+SearchInput\s+from\s+["']@\/components\/ui\/SearchInput["']/,
    );
    expect(content).toMatch(
      /import\s*\{[^}]*SelectDropdown[^}]*\}\s*from\s*["']@\/components\/ui["']|import\s+SelectDropdown\s+from\s+["']@\/components\/ui\/SelectDropdown["']/,
    );
    expect(content).toMatch(
      /import\s*\{[^}]*TablePagination[^}]*\}\s*from\s*["']@\/components\/ui["']|import\s+TablePagination\s+from\s+["']@\/components\/ui\/TablePagination["']/,
    );
    expect(content).toContain("<SearchInput");
    expect(content).toContain("<SelectDropdown");
    expect(content).toContain("<TablePagination");
  });

  it("TC-06: ResignationTable.jsx replaces legacy StatusModal with canonical ConfirmModal", () => {
    const content = fs.readFileSync(resignationTablePath, "utf-8");
    expect(content).not.toContain("import StatusModal");
    expect(content).not.toContain("<StatusModal");
    expect(content).toMatch(
      /import\s*\{[^}]*ConfirmModal[^}]*\}\s*from\s*["']@\/components\/ui["']|import\s+ConfirmModal\s+from\s+["']@\/components\/ui\/ConfirmModal["']/,
    );
    expect(content).toContain("<ConfirmModal");
  });

  it("TC-07: EmployeeResignationTable.jsx decouples from PaginationTable and composes canonical Pattern B controls", () => {
    const content = fs.readFileSync(employeeResignationTablePath, "utf-8");
    expect(content).not.toContain("import PaginationTable");
    expect(content).not.toContain("<PaginationTable");
    expect(content).not.toContain("import StatusModal");
    expect(content).not.toContain("<StatusModal");
    expect(content).toContain("<SearchInput");
    expect(content).toContain("<SelectDropdown");
    expect(content).toContain("<TablePagination");
    expect(content).toContain("<ConfirmModal");
  });

  it("TC-08: Eradicates showPagination={false} misuse across Resignation tables", () => {
    const resContent = fs.readFileSync(resignationTablePath, "utf-8");
    const empResContent = fs.readFileSync(employeeResignationTablePath, "utf-8");
    expect(resContent).not.toContain("showPagination={false}");
    expect(empResContent).not.toContain("showPagination={false}");
  });
});

describe("Ticket SIBS-UIUX-PATTERN-B-03: AttritionTable & JobDescriptionTable Pattern B Decoupling", () => {
  const attritionTablePath = path.resolve(__dirname, "./AttritionTable.jsx");
  const jobDescriptionTablePath = path.resolve(
    __dirname,
    "./jobDescription/JobDescriptionTable.jsx",
  );

  it("TC-09: AttritionTable.jsx decouples from PaginationTable and composes canonical Pattern B controls", () => {
    const content = fs.readFileSync(attritionTablePath, "utf-8");
    expect(content).not.toContain("import PaginationTable");
    expect(content).not.toContain("<PaginationTable");
    expect(content).toMatch(
      /import\s*\{[^}]*SearchInput[^}]*\}\s*from\s*["']@\/components\/ui["']|import\s+SearchInput\s+from\s+["']@\/components\/ui\/SearchInput["']/,
    );
    expect(content).toMatch(
      /import\s*\{[^}]*SelectDropdown[^}]*\}\s*from\s*["']@\/components\/ui["']|import\s+SelectDropdown\s+from\s+["']@\/components\/ui\/SelectDropdown["']/,
    );
    expect(content).toMatch(
      /import\s*\{[^}]*TablePagination[^}]*\}\s*from\s*["']@\/components\/ui["']|import\s+TablePagination\s+from\s+["']@\/components\/ui\/TablePagination["']/,
    );
    expect(content).toContain("<SearchInput");
    expect(content).toContain("<SelectDropdown");
    expect(content).toContain("<TablePagination");
  });

  it("TC-10: JobDescriptionTable.jsx decouples from PaginationTable and composes canonical Pattern B controls", () => {
    const content = fs.readFileSync(jobDescriptionTablePath, "utf-8");
    expect(content).not.toContain("import PaginationTable");
    expect(content).not.toContain("<PaginationTable");
    expect(content).toContain("<SearchInput");
    expect(content).toContain("<SelectDropdown");
    expect(content).toContain("<TablePagination");
  });

  it("TC-11: Eradicates showPagination={false} misuse across AttritionTable and JobDescriptionTable", () => {
    const attContent = fs.readFileSync(attritionTablePath, "utf-8");
    const jdContent = fs.readFileSync(jobDescriptionTablePath, "utf-8");
    expect(attContent).not.toContain("showPagination={false}");
    expect(jdContent).not.toContain("showPagination={false}");
  });
});


