const PHONE_NUMBER_LIMIT = 11;

export function normalizePhoneNumberInput(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, PHONE_NUMBER_LIMIT);
}

export function normalizePhoneNumberForSubmit(value) {
  return normalizePhoneNumberInput(value);
}

export { PHONE_NUMBER_LIMIT };
