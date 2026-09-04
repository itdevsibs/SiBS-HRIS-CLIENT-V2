import assert from "node:assert/strict";
import test from "node:test";

import {
  buildConversationPayload,
  getAiErrorMessage,
  normalizeAiAnswerPayload,
} from "./aiAssistantHelpers.js";

test("buildConversationPayload keeps only user and assistant text and caps history", () => {
  const messages = Array.from({ length: 14 }, (_, index) => ({
    role: index % 2 === 0 ? "user" : "assistant",
    content: ` message ${index + 1} `,
  }));

  messages.push({ role: "system", content: "should be ignored" });
  messages.push({ role: "assistant", content: "   " });

  const result = buildConversationPayload(messages);

  assert.equal(result.length, 10);
  assert.deepEqual(result[0], { role: "user", content: "message 5" });
  assert.deepEqual(result.at(-1), {
    role: "assistant",
    content: "message 14",
  });
});

test("normalizeAiAnswerPayload produces safe display defaults", () => {
  const result = normalizeAiAnswerPayload({
    success: true,
    answer: "  Attendance is complete.  ",
    highlights: [" On time ", "", null],
    risks: "No material risk",
    recommendations: [" Review weekly "],
    toolsUsed: ["getMyAttendanceSummary"],
    conversationId: "conversation-123",
  });

  assert.equal(result.answer, "Attendance is complete.");
  assert.deepEqual(result.highlights, ["On time"]);
  assert.deepEqual(result.risks, ["No material risk"]);
  assert.deepEqual(result.recommendations, ["Review weekly"]);
  assert.deepEqual(result.toolsUsed, ["getMyAttendanceSummary"]);
  assert.equal(result.conversationId, "conversation-123");
});

test("getAiErrorMessage prefers the backend public message", () => {
  const message = getAiErrorMessage({
    response: {
      data: {
        message: "SiBS AI is temporarily unavailable.",
      },
    },
  });

  assert.equal(message, "SiBS AI is temporarily unavailable.");
});
