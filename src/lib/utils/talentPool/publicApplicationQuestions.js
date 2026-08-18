function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeBoolean(value, fallback = false) {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;

  const normalized = cleanText(value).toLowerCase();
  if (["true", "yes"].includes(normalized)) return true;
  if (["false", "no"].includes(normalized)) return false;

  return fallback;
}

function parseOptions(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "object") return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) || (parsed && typeof parsed === "object")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

export function normalizeApplicationFormQuestion(question = {}) {
  return {
    id: Number(question.id || question.questionId || question.question_id || 0),
    formId: cleanText(question.formId || question.form_id),
    sectionId: cleanText(question.sectionId || question.section_id),
    questionKey: cleanText(
      question.questionKey ||
        question.question_key ||
        question.clientQuestionId ||
        question.client_question_id,
    ),
    questionText: cleanText(
      question.questionText || question.question_text || question.question_label,
    ),
    helperText: cleanText(question.helperText || question.helper_text),
    placeholderText: cleanText(
      question.placeholderText || question.placeholder_text,
    ),
    questionType:
      cleanText(question.questionType || question.question_type) || "Text",
    isRequired: normalizeBoolean(
      question.isRequired ?? question.is_required,
      false,
    ),
    isEnabled: normalizeBoolean(
      question.isEnabled ?? question.is_enabled,
      true,
    ),
    sortOrder:
      Number(question.sortOrder ?? question.sort_order ?? 0) || 0,
    options: parseOptions(question.options ?? question.options_json),
  };
}

export function normalizeApplicationFormQuestions(payload = {}) {
  const questions = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.questions)
      ? payload.questions
      : [];

  return questions
    .map(normalizeApplicationFormQuestion)
    .filter((question) => question.id > 0 && question.questionText && question.isEnabled)
    .sort((first, second) => {
      const sectionCompare = first.sectionId.localeCompare(second.sectionId);
      if (sectionCompare !== 0) return sectionCompare;
      if (first.sortOrder !== second.sortOrder) {
        return first.sortOrder - second.sortOrder;
      }
      return first.id - second.id;
    });
}

export function createQuestionAnswerState(questions = [], previousState = {}) {
  return normalizeApplicationFormQuestions(questions).reduce((acc, question) => {
    const key = String(question.id);
    const previous = previousState?.[key] || {};

    acc[key] = {
      questionId: question.id,
      questionKey: question.questionKey,
      answerType: "Text",
      textAnswer: String(previous.textAnswer ?? ""),
    };

    return acc;
  }, {});
}

export function buildApplicationFormAnswersPayload(
  questions = [],
  answerState = {},
) {
  return normalizeApplicationFormQuestions(questions).map((question) => {
    const state = answerState?.[String(question.id)] || {};

    return {
      questionId: question.id,
      questionKey: question.questionKey,
      answerType: "Text",
      textAnswer: cleanText(state.textAnswer),
    };
  });
}

export function validateApplicationQuestionAnswers(
  questions = [],
  answerState = {},
) {
  for (const question of normalizeApplicationFormQuestions(questions)) {
    if (!question.isRequired) continue;

    const state = answerState?.[String(question.id)] || {};

    if (!cleanText(state.textAnswer)) {
      return `Please provide a text answer for the required question: ${question.questionText}`;
    }
  }

  return "";
}
