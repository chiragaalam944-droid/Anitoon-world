const AD_KEY = "ad_verified";
const AD_NONCE_KEY = "ad_nonce";
const AD_RESUME_KEY = "ad_resume";
export const AD_TTL_MS = 48 * 60 * 60 * 1000;
export const GPLINKS_API_KEY = "c73a19b90f7153ce05f2c8c2b24fe4b8c51e819f";
export const GPLINKS_ST = "https://api.gplinks.com/st?api=";
export const GPLINKS_SHORTEN = "https://api.gplinks.com/api?api=";

export type AdResume = {
  id: string;
  malId?: number;
  title: string;
  image: string;
  episode: number;
  action: "play" | "download";
};

export function isAdVerified(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const ts = Number(localStorage.getItem(AD_KEY) || 0);
    return Number.isFinite(ts) && ts > 0 && Date.now() - ts < AD_TTL_MS;
  } catch {
    return false;
  }
}

export function markAdVerified() {
  localStorage.setItem(AD_KEY, String(Date.now()));
}

export function saveAdResume(resume: AdResume) {
  sessionStorage.setItem(AD_RESUME_KEY, JSON.stringify(resume));
}

export function takeAdResume(): AdResume | null {
  try {
    const raw = sessionStorage.getItem(AD_RESUME_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(AD_RESUME_KEY);
    return JSON.parse(raw) as AdResume;
  } catch {
    sessionStorage.removeItem(AD_RESUME_KEY);
    return null;
  }
}

function createNonce(): string {
  const nonce = crypto.randomUUID();
  sessionStorage.setItem(AD_NONCE_KEY, nonce);
  return nonce;
}

export function consumeAdReturn(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  const token = url.searchParams.get("ad_token");
  if (token) {
    const nonce = sessionStorage.getItem(AD_NONCE_KEY);
    url.searchParams.delete("ad_token");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    if (nonce && token === nonce) {
      sessionStorage.removeItem(AD_NONCE_KEY);
      markAdVerified();
      return true;
    }
    return isAdVerified();
  }
  return isAdVerified();
}

function currentPageUrl(): string {
  if (typeof window === "undefined") return "https://example.com/";
  const href = String(window.location.href || "").trim();
  const origin = String(window.location.origin || "").trim();
  const protocol = String(window.location.protocol || "");
  const host = String(window.location.host || "");
  if (/^https?:\/\/\S+/i.test(href)) return href;
  if (/^https?:$/i.test(protocol) && host) return `${protocol}//${host}/`;
  if (/^https?:\/\/\S+/i.test(origin)) return origin.endsWith("/") ? origin : `${origin}/`;
  return "https://example.com/";
}

export function getDestinationUrl(): string {
  const nonce = createNonce();
  let dest = currentPageUrl();
  try {
    const u = new URL(dest);
    if (u.hostname === "localhost" || u.hostname === "[::1]") {
      u.hostname = "127.0.0.1";
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
    u.hash = "";
    u.searchParams.delete("ad_token");
    u.searchParams.set("ad_token", nonce);
    dest = u.toString();
  } catch {
    dest = `http://127.0.0.1/?ad_token=${encodeURIComponent(nonce)}`;
  }
  if (!dest) dest = currentPageUrl();
  return dest;
}

export function gplinksUrl(destinationUrl?: string | null): string {
  let dest = typeof destinationUrl === "string" ? destinationUrl.trim() : "";
  if (!dest) dest = getDestinationUrl();
  if (!dest) dest = currentPageUrl();
  return `${GPLINKS_ST}${GPLINKS_API_KEY}&url=${encodeURIComponent(dest)}`;
}

export function gplinksShortenUrl(destinationUrl: string): string {
  const dest = destinationUrl.trim() || currentPageUrl();
  return `${GPLINKS_SHORTEN}${GPLINKS_API_KEY}&url=${encodeURIComponent(dest)}`;
}

export async function startAdSkip(): Promise<string> {
  const destinationUrl = getDestinationUrl();
  if (!destinationUrl) throw new Error("Destination URL is missing");
  const res = await fetch(`/api/gplinks?url=${encodeURIComponent(destinationUrl)}`, {
    headers: { accept: "application/json" },
  });
  const data = (await res.json()) as { shortenedUrl?: string; error?: string };
  if (data.shortenedUrl && /^https?:\/\//i.test(data.shortenedUrl)) {
    return data.shortenedUrl;
  }
  return gplinksUrl(destinationUrl);
}
