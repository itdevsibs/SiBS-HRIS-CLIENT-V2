import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api-template";
import {
  normalizeApplicantLead,
  normalizeApplicantLeads,
  buildApplicantLeadPayload,
  getApplicantLeads,
  getApplicantLeadOptions,
  createApplicantLead,
  updateApplicantLead,
  updateApplicantLeadStatus,
  sendApplicantLeadApplicationLink,
} from "./getApplicantLeads";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Applicant Leads Client API & Normalizers", () => {
  it("normalizes applicant lead record with full name, dates, and contact fields", () => {
    const raw = {
      id: 101,
      lead_id: "LEAD-101",
      first_name: "JUAN",
      middle_name: "PROTASIO",
      last_name: "DELA CRUZ",
      suffix: "JR",
      cp_number: "09171234567",
      email_address: "juan@example.com",
      status: "New Lead",
      date_logged: "2026-10-26T10:00:00.000Z",
    };

    const lead = normalizeApplicantLead(raw);
    expect(lead.id).toBe(101);
    expect(lead.leadId).toBe("LEAD-101");
    expect(lead.firstName).toBe("JUAN");
    expect(lead.lastName).toBe("DELA CRUZ");
    expect(lead.fullName).toBe("JUAN PROTASIO DELA CRUZ JR");
    expect(lead.cpNum).toBe("09171234567");
    expect(lead.email).toBe("juan@example.com");
    expect(lead.status).toBe("New Lead");
  });

  it("converts status to 'Converted to Applicant' when linked to talent pool", () => {
    const raw = {
      id: 102,
      first_name: "MARIA",
      last_name: "SANTOS",
      status: "Moved to Talent Pool Archive",
      talent_pool_application_id: "TP-2026-001",
    };

    const lead = normalizeApplicantLead(raw);
    expect(lead.status).toBe("Converted to Applicant");
  });

  it("builds applicant lead payload with trimmed text and valid defaults", () => {
    const formData = {
      firstName: "  Ana  ",
      lastName: "  Reyes  ",
      cpNum: "  09181234567  ",
      email: "  ana@example.com  ",
      notes: "  Initial phone screen passed.  ",
    };

    const payload = buildApplicantLeadPayload(formData, { id: 1, name: "Recruiter 1" });
    expect(payload.first_name).toBe("ANA");
    expect(payload.last_name).toBe("REYES");
    expect(payload.cp_number).toBe("09181234567");
    expect(payload.email_address).toBe("ana@example.com");
    expect(payload.remarks).toBe("INITIAL PHONE SCREEN PASSED.");
  });

  it("getApplicantLeads calls GET /api/applicant-leads and normalizes response", async () => {
    const mockData = [
      { id: 1, first_name: "Candidate", last_name: "One", cp_number: "09170000001", status: "New Lead" },
    ];
    vi.spyOn(api, "get").mockResolvedValueOnce({
      status: 200,
      data: { success: true, data: mockData },
    });

    const res = await getApplicantLeads({ page: 1, limit: 10 });
    expect(api.get).toHaveBeenCalledWith(
      "/api/applicant-leads",
      expect.objectContaining({ params: { page: 1, limit: 10 } }),
    );
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data[0].fullName).toBe("Candidate One");
  });

  it("createApplicantLead calls POST /api/applicant-leads with payload", async () => {
    const payload = { first_name: "Test", last_name: "User", cp_number: "09171234567", remarks: "Notes" };
    vi.spyOn(api, "post").mockResolvedValueOnce({
      status: 201,
      data: { success: true, message: "Lead saved successfully." },
    });

    const res = await createApplicantLead(payload);
    expect(api.post).toHaveBeenCalledWith(
      "/api/applicant-leads",
      payload,
      expect.any(Object),
    );
    expect(res.success).toBe(true);
  });

  it("updateApplicantLead calls PUT /api/applicant-leads/:id", async () => {
    const payload = { first_name: "Updated", last_name: "User", cp_number: "09171234567", remarks: "Notes" };
    vi.spyOn(api, "put").mockResolvedValueOnce({
      status: 200,
      data: { success: true, message: "Applicant lead updated." },
    });

    const res = await updateApplicantLead(42, payload);
    expect(api.put).toHaveBeenCalledWith(
      "/api/applicant-leads/42",
      payload,
      expect.any(Object),
    );
    expect(res.success).toBe(true);
  });

  it("updateApplicantLeadStatus calls PATCH /api/applicant-leads/:id/status", async () => {
    vi.spyOn(api, "patch").mockResolvedValueOnce({
      status: 200,
      data: { success: true, message: "Applicant lead status updated." },
    });

    const res = await updateApplicantLeadStatus(42, { status: "Contacted" });
    expect(api.patch).toHaveBeenCalledWith(
      "/api/applicant-leads/42/status",
      { status: "Contacted" },
      expect.any(Object),
    );
    expect(res.success).toBe(true);
  });

  it("sendApplicantLeadApplicationLink calls POST /api/applicant-leads/:id/send-application-link", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      status: 200,
      data: { success: true, message: "Application link sent." },
    });

    const res = await sendApplicantLeadApplicationLink(42);
    expect(api.post).toHaveBeenCalledWith(
      "/api/applicant-leads/42/send-application-link",
      {},
      expect.any(Object),
    );
    expect(res.success).toBe(true);
  });
});
