import { describe, expect, it } from "vitest";
import {
  DEVELOPER_BORDERS,
  MR_SIBS_BORDER,
  extractUserAccountIdentifiers,
  getActiveCollectibleProfile,
  getDeveloperBorder,
} from "./developerBorders";

describe("developerBorders registry", () => {
  it("contains exactly the 6 canonical developer entries", () => {
    const keys = Object.keys(DEVELOPER_BORDERS);
    expect(keys.sort()).toEqual(["6099", "6495", "6496", "6890", "6891", "6892"]);
  });

  it("resolves Crister by sibs_id, sibsId, or gy_emp_code", () => {
    expect(getDeveloperBorder({ sibs_id: "6496" })?.title).toBe("THE ENGINEER");
    expect(getDeveloperBorder({ sibsId: "6496" })?.title).toBe("THE ENGINEER");
    expect(getDeveloperBorder({ gy_emp_code: "6496" })?.title).toBe("THE ENGINEER");
  });

  it("resolves Allen by gy_user_code or username", () => {
    expect(getDeveloperBorder({ gy_user_code: "6495" })?.title).toBe("BACKEND GOD");
    expect(getDeveloperBorder({ username: "6495" })?.title).toBe("BACKEND GOD");
  });

  it("resolves Miss by sibs_id 6099", () => {
    expect(getDeveloperBorder({ sibs_id: "6099" })?.title).toBe("THE QUEEN MANAGER");
  });

  it("resolves Dwight by sibs_id 6892", () => {
    expect(getDeveloperBorder({ sibs_id: "6892" })?.title).toBe("THE GAMBLER");
  });

  it("resolves Paul by sibs_id 6890", () => {
    expect(getDeveloperBorder({ sibs_id: "6890" })?.title).toBe("THE SLEEPER");
  });

  it("resolves Mars by sibs_id 6891", () => {
    expect(getDeveloperBorder({ sibs_id: "6891" })?.title).toBe("CARZIQO DONATER");
  });

  it("does not infer titles by name alone", () => {
    expect(getDeveloperBorder({ firstName: "Crister", lastName: "Dulla" })).toBeNull();
    expect(getDeveloperBorder({ firstName: "Allen" })).toBeNull();
    expect(getDeveloperBorder({ firstName: "Miss" })).toBeNull();
  });

  it("returns null for non-matching IDs like 6784 (Ralph Dulla) to allow MR. SIBS behavior", () => {
    expect(getDeveloperBorder({ sibs_id: "6784" })).toBeNull();
    expect(getDeveloperBorder({ sibs_id: "9999" })).toBeNull();
  });

  it("handles null, undefined, and non-object gracefully", () => {
    expect(getDeveloperBorder(null)).toBeNull();
    expect(getDeveloperBorder(undefined)).toBeNull();
    expect(getDeveloperBorder({})).toBeNull();
    expect(extractUserAccountIdentifiers(null)).toEqual([]);
  });

  it("resolves active collectible profile for developers and Ralph Dulla", () => {
    expect(getActiveCollectibleProfile({ sibs_id: "6496" })?.title).toBe("THE ENGINEER");
    expect(getActiveCollectibleProfile({ sibs_id: "6784", firstName: "Ralph", lastName: "Dulla" })?.title).toBe("MR. SIBS");
    expect(getActiveCollectibleProfile({ firstName: "Ralph", lastName: "Dulla" })).toBeNull();
    expect(getActiveCollectibleProfile({ sibs_id: "1234", firstName: "Normal", lastName: "User" })).toBeNull();
  });

  it("never assigns frames from database IDs, account IDs, or names", () => {
    for (const field of ["id", "accountId", "account", "gy_emp_id"]) {
      expect(getActiveCollectibleProfile({ [field]: "6496" })).toBeNull();
      expect(getActiveCollectibleProfile({ sibs_id: "9999", [field]: "6496" })).toBeNull();
    }
    expect(getActiveCollectibleProfile({ email: "ralph.dulla@example.com" }, "Ralph Dulla")).toBeNull();
  });

  it("keeps a canonical employee ID ahead of login aliases", () => {
    expect(getActiveCollectibleProfile({ sibs_id: "9999", username: "6496" })).toBeNull();
    expect(getActiveCollectibleProfile({ sibsId: "6784", gy_user_code: "6495" })?.id).toBe("6784");
    expect(getActiveCollectibleProfile({ employeeSibsId: 6496 })?.id).toBe("6496");
    expect(getActiveCollectibleProfile({ employee_sibs_id: " 6495 " })?.id).toBe("6495");
  });

  it("resolves MR. SIBS by employee ID regardless of display name", () => {
    expect(getActiveCollectibleProfile({ sibs_id: "6784" }, "Dulla, R.")).toBe(MR_SIBS_BORDER);
    expect(getActiveCollectibleProfile({ sibs_id: "9999", firstName: "Ralph", lastName: "Dulla" })).toBeNull();
  });

  it("rejects object prototype keys as employee IDs", () => {
    expect(getActiveCollectibleProfile({ sibs_id: "constructor" })).toBeNull();
    expect(getActiveCollectibleProfile({ sibs_id: "toString" })).toBeNull();
  });
});
