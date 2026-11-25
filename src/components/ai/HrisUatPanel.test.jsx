import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import SiBSAIAssistant from "./SiBSAIAssistant";
import { sendHermesAgentChat } from "@/lib/axios/hermes-agent-chat";
import * as uat from "@/lib/axios/hris-uat";

vi.mock("@/services/context/UserContext", () => ({
  useUser: () => ({ user: { sibsId: "participant", firstName: "Sam", role: "super_admin" }, loading: false }),
}));
vi.mock("@/lib/axios/hermes-agent-chat", () => ({ sendHermesAgentChat: vi.fn() }));
vi.mock("@/lib/axios/hris-uat", () => ({
  getUatStatus: vi.fn(), getUatCatalog: vi.fn(), getUatMonitoring: vi.fn(),
  getOwnUatFeedback: vi.fn(),
  submitUatFeedback: vi.fn(), reviewUatFeedback: vi.fn(), runUatBenchmark: vi.fn(),
}));

const scenarios = [
  { id: "TEST-1", question: "What is my profile?", role: "employee", domain: "operational_data" },
  { id: "TEST-2", question: "What is my leave balance?", role: "employee", domain: "operational_data" },
];
const monitoring = {
  summary: { scenarioCount: scenarios.length, executedScenarioCount: 1, pendingReviewCount: 1, passedCount: 0, failedCount: 0, blockedCount: 1, notTestedCount: 0 },
  records: [{ recordId: "record-1", scenarioId: "TEST-1", role: "employee", executionStatus: "BLOCKED", reviewerStatus: "PENDING", sanitizedComment: "Source unavailable" }],
};
const mount = () => render(<SiBSAIAssistant variant="hermes" isOpen hideTrigger />);
async function selectScenario(id = "TEST-1") {
  await screen.findByRole("combobox", { name: "UAT scenario" });
  await waitFor(() => expect(screen.getByRole("option", { name: /TEST-1:/ })).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText("UAT scenario"), { target: { value: id } });
}

beforeEach(() => {
  uat.getUatStatus.mockResolvedValue({ success: true, participant: true, reviewer: false, benchmarkEnabled: false });
  uat.getUatCatalog.mockResolvedValue({ success: true, scenarios });
  sendHermesAgentChat.mockResolvedValue({ reply: "Verified profile", requestId: "request-123", actualCapability: "get_my_profile", status: "completed", uatExecution: { recordId: "execution-123", correlationId: "request-123" } });
  uat.submitUatFeedback.mockResolvedValue({ success: true, record: { scenarioId: "TEST-1" } });
  uat.getUatMonitoring.mockResolvedValue(monitoring);
  uat.reviewUatFeedback.mockResolvedValue({ success: true });
  uat.getOwnUatFeedback.mockResolvedValue({ success: true, records: [] });
});

it("reopens personal progress and submits a human-authored open defect without asserting a pass", async () => {
  uat.getOwnUatFeedback.mockResolvedValue({ success: true, records: [{ recordId: "own", scenarioId: "TEST-1", executionStatus: "IN_PROGRESS", reviewerStatus: "PENDING", evidenceReference: "DEV-01" }] });
  mount();
  fireEvent.click(await screen.findByRole("button", { name: "View my UAT records" }));
  await screen.findByText(/TEST-1: IN_PROGRESS; review PENDING/);
  await selectScenario();
  fireEvent.change(screen.getByLabelText("Execution outcome"), { target: { value: "IN_PROGRESS" } });
  fireEvent.change(screen.getByLabelText("Defect reference"), { target: { value: "8C-01" } });
  fireEvent.change(screen.getByLabelText("Defect severity"), { target: { value: "High" } });
  fireEvent.change(screen.getByLabelText("Expected behavior"), { target: { value: "Do not infer attendance" } });
  fireEvent.change(screen.getByLabelText("Evidence reference (no confidential data)"), { target: { value: "DEV-01" } });
  fireEvent.click(screen.getByRole("button", { name: "Save UAT feedback" }));
  await screen.findByText(/Feedback saved/);
  expect(uat.submitUatFeedback).toHaveBeenCalledWith(expect.objectContaining({ executionStatus: "IN_PROGRESS", evidenceReference: "DEV-01", defect: expect.objectContaining({ severity: "High", expectedBehavior: "Do not infer attendance" }) }), expect.any(AbortSignal));
});
afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs(); });

it("keeps an actual failed backend receipt linkable without marking an automatic outcome", async () => {
  sendHermesAgentChat.mockRejectedValue({ response: { status: 502, data: { message: "Hermes unavailable", uatExecution: { recordId: "failed-execution", correlationId: "failed-request" } } } });
  mount(); await selectScenario();
  fireEvent.click(screen.getByRole("button", { name: "Run UAT scenario" }));
  await screen.findByText(/Backend execution recorded with an error/);
  expect(screen.getByLabelText("Execution outcome")).toHaveValue("NOT_TESTED");
  fireEvent.change(screen.getByLabelText("Execution outcome"), { target: { value: "BLOCKED" } });
  fireEvent.click(screen.getByRole("button", { name: "Save UAT feedback" }));
  await screen.findByText(/Feedback saved/);
  expect(uat.submitUatFeedback).toHaveBeenCalledWith(expect.objectContaining({ executionStatus: "BLOCKED", executionRecordId: "failed-execution", correlationId: "failed-request" }), expect.any(AbortSignal));
});

it("runs an isolated assigned scenario and sends measured correlation metadata with a human-selected outcome", async () => {
  mount();
  // Ordinary chat history must not influence a UAT scenario.
  fireEvent.change(screen.getByPlaceholderText(/authorized HRIS data/i), { target: { value: "Prior unrelated chat" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await screen.findByText("Verified profile");
  await selectScenario();
  expect(screen.getByLabelText("Execution outcome")).toHaveValue("NOT_TESTED");
  expect(within(screen.getByLabelText("Execution outcome")).getByRole("option", { name: "Pass" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Run UAT scenario" }));
  await screen.findByText(/Request: request-123/);
  expect(sendHermesAgentChat).toHaveBeenLastCalledWith(expect.objectContaining({ message: scenarios[0].question, conversation: [], includeReport: true, uatScenarioId: "TEST-1" }));
  expect(screen.getByLabelText("Execution outcome")).toHaveValue("NOT_TESTED");
  expect(uat.submitUatFeedback).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Execution outcome"), { target: { value: "PASS" } });
  fireEvent.change(screen.getByLabelText("UAT comment"), { target: { value: "Compared to official HRIS" } });
  fireEvent.click(screen.getByRole("button", { name: "Save UAT feedback" }));
  await screen.findByText(/Feedback saved for TEST-1/);
  expect(uat.submitUatFeedback).toHaveBeenCalledWith(expect.objectContaining({ scenarioId: "TEST-1", executionRecordId: "execution-123", correlationId: "request-123", actualCapability: "get_my_profile", latencyMs: expect.any(Number), executionStatus: "PASS", dataComparison: "NOT_TESTED", citationVerification: "NOT_TESTED" }), expect.any(AbortSignal));
  expect(screen.queryByText("UAT reviewer monitoring")).not.toBeInTheDocument();
  expect(uat.getUatMonitoring).not.toHaveBeenCalled();
  expect(screen.queryByText(/Run live benchmark/)).not.toBeInTheDocument();
  await selectScenario("TEST-2");
  expect(screen.queryByText(/Request: request-123/)).not.toBeInTheDocument();
  expect(screen.getByLabelText("Execution outcome")).toHaveValue("NOT_TESTED");
});

it("does not expose participant or administrative controls based on the client super_admin role", async () => {
  uat.getUatStatus.mockResolvedValue({ success: true, participant: false, reviewer: false, benchmarkEnabled: true });
  mount();
  await waitFor(() => expect(uat.getUatStatus).toHaveBeenCalled());
  expect(screen.queryByRole("region", { name: "Development UAT" })).not.toBeInTheDocument();
  expect(uat.getUatCatalog).not.toHaveBeenCalled();
  expect(uat.getUatMonitoring).not.toHaveBeenCalled();
  expect(uat.runUatBenchmark).not.toHaveBeenCalled();
});

it("keeps UAT controls hidden when configuration or authentication fails", async () => {
  uat.getUatStatus.mockRejectedValue({ response: { status: 503, data: { message: "Development UAT is not fully configured." } } });
  mount();
  await screen.findByText(/Development UAT is not fully configured/);
  expect(screen.queryByText("Refresh UAT monitoring")).not.toBeInTheDocument();
  expect(uat.getUatCatalog).not.toHaveBeenCalled();
});

it("keeps deliberately disabled UAT silent while ordinary Hermes chat remains usable", async () => {
  uat.getUatStatus.mockResolvedValue({ success: true, status: "DISABLED", participant: false, reviewer: false, benchmarkEnabled: false });
  mount();
  await waitFor(() => expect(uat.getUatStatus).toHaveBeenCalled());
  expect(screen.queryByText(/Development UAT unavailable/)).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Development UAT" })).not.toBeInTheDocument();
  expect(uat.getUatCatalog).not.toHaveBeenCalled();
  expect(uat.getUatMonitoring).not.toHaveBeenCalled();
  fireEvent.change(screen.getByPlaceholderText(/authorized HRIS data/i), { target: { value: "My profile" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await screen.findByText("Verified profile");
  expect(sendHermesAgentChat).toHaveBeenCalledWith(expect.objectContaining({ message: "My profile" }));
});

it("lets a server-authorized reviewer load evidence and save an independent decision without participant controls", async () => {
  uat.getUatStatus.mockResolvedValue({ success: true, participant: false, reviewer: true });
  uat.getUatMonitoring.mockResolvedValue({ ...monitoring,
    membership: { configuredParticipantCount: 2 },
    summary: { ...monitoring.summary, observedParticipantCount: 1, countsByRole: { employee: { catalogued: 2, executed: 0, passed: 0, failed: 0, blocked: 1, pending: 2 } } },
  });
  mount();
  fireEvent.click(await screen.findByRole("button", { name: "Refresh UAT monitoring" }));
  await screen.findByText("Source unavailable");
  expect(screen.getByText(/2 configured participants; 1 observed/)).toBeInTheDocument();
  expect(screen.getByRole("table", { name: "Coverage by authenticated role" })).toBeInTheDocument();
  expect(screen.getByText(/Formal business acceptance remains pending/)).toBeInTheDocument();
  expect(uat.getUatCatalog).not.toHaveBeenCalled();
  expect(screen.queryByLabelText("UAT scenario")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Review decision"), { target: { value: "REJECTED" } });
  fireEvent.change(screen.getByLabelText("Reviewer comment"), { target: { value: "Needs corrected data" } });
  fireEvent.click(screen.getByRole("button", { name: "Save review" }));
  await screen.findByText("Review saved.");
  expect(uat.reviewUatFeedback).toHaveBeenCalledWith("record-1", { decision: "REJECTED", comment: "Needs corrected data", defectReference: "" }, expect.any(AbortSignal));
});

it("removes reviewer evidence and controls when the backend revokes authorization", async () => {
  uat.getUatStatus.mockResolvedValue({ success: true, participant: false, reviewer: true });
  uat.reviewUatFeedback.mockRejectedValue({ response: { status: 403, data: { message: "Reviewer access revoked" } } });
  mount();
  fireEvent.click(await screen.findByRole("button", { name: "Refresh UAT monitoring" }));
  await screen.findByText("Source unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Save review" }));
  await screen.findByText(/Reviewer access revoked/);
  expect(screen.queryByText("Source unavailable")).not.toBeInTheDocument();
  expect(screen.queryByText("Save review")).not.toBeInTheDocument();
});

it("surfaces failed scenario and storage requests without recording an automatic pass", async () => {
  sendHermesAgentChat.mockRejectedValue(new Error("Hermes unavailable"));
  uat.submitUatFeedback.mockRejectedValue({ response: { status: 503, data: { message: "Evidence storage unavailable" } } });
  mount();
  await selectScenario();
  fireEvent.click(screen.getByRole("button", { name: "Run UAT scenario" }));
  await screen.findByText(/The scenario did not complete/);
  expect(uat.submitUatFeedback).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Execution outcome"), { target: { value: "BLOCKED" } });
  fireEvent.click(screen.getByRole("button", { name: "Save UAT feedback" }));
  await screen.findByText("Evidence storage unavailable");
  expect(screen.queryByText(/Feedback saved/)).not.toBeInTheDocument();
});

it("runs live benchmarks only after server opt-in and an explicit click, displaying completion errors", async () => {
  uat.getUatStatus.mockResolvedValue({ success: true, participant: true, reviewer: false, benchmarkEnabled: true });
  uat.runUatBenchmark.mockResolvedValue({ sampleSize: 1, p50Ms: 20, p95Ms: 20, sampleWarning: "Small sample", results: [{ scenarioId: "TEST-1", completionStatus: "error", errorCategory: "timeout" }] });
  mount();
  await selectScenario();
  expect(uat.runUatBenchmark).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /Run live benchmark/ }));
  await screen.findByText("Small sample");
  expect(screen.getByText("TEST-1: error (timeout)")).toBeInTheDocument();
  expect(uat.runUatBenchmark).toHaveBeenCalledWith(["TEST-1"], expect.any(AbortSignal));
  expect(uat.submitUatFeedback).not.toHaveBeenCalled();
});

it("aborts UAT requests on close and does not mount UAT in a production build", async () => {
  const view = mount();
  await waitFor(() => expect(uat.getUatStatus).toHaveBeenCalled());
  const signal = uat.getUatStatus.mock.calls[0][0];
  view.rerender(<SiBSAIAssistant variant="hermes" isOpen={false} hideTrigger />);
  expect(signal.aborted).toBe(true);
  view.unmount();
  vi.clearAllMocks();
  vi.stubEnv("DEV", false);
  mount();
  expect(screen.queryByRole("region", { name: "Development UAT" })).not.toBeInTheDocument();
  expect(uat.getUatStatus).not.toHaveBeenCalled();
});

it("toggles the UAT panel collapse state and persists preference in storage", async () => {
  mount();
  const toggle = await screen.findByRole("button", { name: "Hide UAT" });
  expect(screen.getByRole("combobox", { name: "UAT scenario" })).toBeInTheDocument();
  fireEvent.click(toggle);
  expect(screen.getByRole("button", { name: "Show UAT" })).toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: "UAT scenario" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show UAT" }));
  expect(screen.getByRole("button", { name: "Hide UAT" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "UAT scenario" })).toBeInTheDocument();
});
