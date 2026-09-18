const GIFSNAP_API_BASE_URL = "https://gifsnap.com/api/v1";
const GIF_DEFAULT_LIMIT = 24;

function cleanText(value) {
  return String(value ?? "").trim();
}

function buildGifSnapUrl(path, params = {}) {
  const url = new URL(`${GIFSNAP_API_BASE_URL}/${path}`);
  url.searchParams.set("page", "1");
  url.searchParams.set("limit", String(GIF_DEFAULT_LIMIT));

  Object.entries(params).forEach(([key, value]) => {
    const text = cleanText(value);
    if (text) url.searchParams.set(key, text);
  });

  return url.toString();
}

function normalizeOnlineGifUrl(value) {
  const text = cleanText(value);
  if (!text) return "";

  try {
    const url = new URL(text, "https://gifsnap.com");
    if (url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function normalizeGifSnapItem(item = {}) {
  const previewUrl = normalizeOnlineGifUrl(item?.preview_url || item?.url);
  const gifUrl = normalizeOnlineGifUrl(item?.url || item?.preview_url);
  const id = cleanText(item?.id || gifUrl);

  if (!id || !previewUrl || !gifUrl) return null;

  return {
    id,
    title: cleanText(item?.title) || "GIF",
    previewUrl,
    gifUrl,
    width: Number(item?.width || 0),
    height: Number(item?.height || 0),
    source: cleanText(item?.source),
  };
}

async function requestGifSnap(path, params = {}, signal) {
  const response = await fetch(buildGifSnapUrl(path, params), {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Online GIF search failed (${response.status}).`);
  }

  const result = await response.json();

  return (Array.isArray(result?.data) ? result.data : [])
    .map(normalizeGifSnapItem)
    .filter(Boolean);
}

export async function getTrendingChatGifs({ signal } = {}) {
  return requestGifSnap("gifs/trending", {}, signal);
}

export async function searchChatGifs(query, { signal } = {}) {
  const q = cleanText(query).slice(0, 50);
  if (!q) return getTrendingChatGifs({ signal });

  return requestGifSnap("gifs/search", { q }, signal);
}
