export const EDITABLE_PROFILE_FIELDS = Object.freeze([
  "nameExtension",
  "preferredName",
  "birthdate",
  "placeOfBirth",
  "gender",
  "civilStatus",
  "citizenship",
  "bloodType",
  "height",
  "weight",
  "email",
  "contact",
  "telephone",
  "residentialAddress",
  "permanentAddress",
  "workSetup",
  "gsis",
  "sss",
  "phic",
  "hdmf",
  "tin",
]);

export function toProfileDate(value) {
  if (!value) return "";

  const rawValue = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) return rawValue;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return rawValue.slice(0, 10);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function normalizeComparableProfileValue(field, value) {
  if (field === "birthdate") return toProfileDate(value);
  return String(value ?? "").trim();
}

export function buildChangedProfilePayload(draft, current) {
  return EDITABLE_PROFILE_FIELDS.reduce((payload, field) => {
    const draftValue = normalizeComparableProfileValue(field, draft?.[field]);
    const currentValue = normalizeComparableProfileValue(field, current?.[field]);

    if (draftValue !== currentValue) {
      payload[field] = draftValue;
    }

    return payload;
  }, {});
}
