export type AnimeTitle = {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
  userPreferred?: string | null;
};

export type LangBadge =
  | "Hindi"
  | "English"
  | "Hinglish"
  | "Tamil"
  | "Telugu"
  | "Japanese"
  | "SUB"
  | "DUB";

export type AnimeCard = {
  id: string;
  malId?: number;
  gogoId?: string;
  title: string;
  image: string;
  cover?: string;
  rating?: number;
  status?: string;
  type?: string;
  releaseDate?: string;
  genres?: string[];
  description?: string;
  totalEpisodes?: number;
  color?: string;
  languages?: LangBadge[];
  ageRating?: string;
};

export type AnimeEpisode = {
  id: string;
  number: number;
  title?: string;
};

export type AnimeInfo = AnimeCard & {
  episodes: AnimeEpisode[];
  trailer?: { id: string; site?: string } | null;
};

export type StreamServer = {
  id: string;
  name: string;
  url: string;
  download?: string;
};

export type StreamPayload = {
  servers: StreamServer[];
  trailer: string | null;
};

export type CatalogKind =
  | "trending"
  | "popular"
  | "hindi"
  | "genre"
  | "movies"
  | "cartoons"
  | "topic"
  | "family";

export type CatalogResponse = {
  results: AnimeCard[];
  hasNextPage: boolean;
};

export const CATEGORIES: {
  id: string;
  label: string;
  kind: CatalogKind;
  genre?: string;
}[] = [
  { id: "trending", label: "Trending", kind: "trending" },
  { id: "hindi", label: "Hindi Dubbed", kind: "hindi" },
  { id: "popular", label: "Popular", kind: "popular" },
  { id: "action", label: "Action", kind: "genre", genre: "Action" },
  { id: "adventure", label: "Adventure", kind: "genre", genre: "Adventure" },
  { id: "fantasy", label: "Fantasy", kind: "genre", genre: "Fantasy" },
  { id: "comedy", label: "Comedy", kind: "genre", genre: "Comedy" },
  { id: "movies", label: "Movies", kind: "movies" },
  { id: "cartoons", label: "Kids / Cartoons", kind: "cartoons" },
];

export const POSTER_FALLBACK = "/poster-fallback.svg";

const MATURE_GENRE = /^(hentai|ecchi|erotica|erotic|adult)$/i;
const MATURE_TITLE =
  /\b(hentai|ecchi|erotica|erotic|uncensored|r-?18|rx\b|adult video|yuri hentai|yaoi hentai|tentacle)\b/i;
const MATURE_AGE = /^(R18|R\+|RX|18\+|NC-17)$/i;

const INDIAN_KIDS =
  /doraemon|shin-?chan|crayon shin|ninja hattori|perman|kiteretsu|pok[eé]mon|beyblade|digimon|chibi maruko|anpanman|oggy|tom and jerry|scooby|spongebob|ben 10|chhota bheem|motu patlu/;
const FAMILY_SHONEN =
  /naruto|one piece|dragon ball|bleach|detective conan|sailor moon|yu-?gi-?oh|cardcaptor|inazuma|precure|pre-cure|digimon|beyblade/;
const GHIBLI =
  /totoro|spirited away|ponyo|kiki|howl|ghibli|arrietty|mononoke|castle in the sky|whisper of the heart/;
const KIDS_CARTOON =
  /doraemon|shin-?chan|crayon shin|ninja hattori|perman|kiteretsu|anpanman|chibi maruko|oggy|chhota bheem|motu patlu/;
const HINDI_DUB =
  /demon slayer|kimetsu|jujutsu kaisen|solo leveling|naruto|boruto|one piece|dragon ball|bleach|black clover|my hero academia|boku no hero|attack on titan|shingeki|death note|tokyo revengers|chainsaw man|spy x family|kaiju no.?8|dandadan|sakamoto days|wind breaker|hunter x hunter|fairy tail|one punch|pok[eé]mon|doraemon|shin-?chan|crayon shin|ninja hattori|perman/;

export function pickTitle(title: unknown, fallback = "Untitled"): string {
  if (!title) return fallback;
  if (typeof title === "string" && title.trim()) return title.trim();
  if (typeof title === "object") {
    const t = title as AnimeTitle;
    return (
      t.english?.trim() ||
      t.userPreferred?.trim() ||
      t.romaji?.trim() ||
      t.native?.trim() ||
      fallback
    );
  }
  return fallback;
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/&/g, "&")
    .replace(/"/g, '"')
    .replace(/&#039;|'/g, "'")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function languageBadges(title: string, type?: string): LangBadge[] {
  const t = title.toLowerCase();
  const hindi = HINDI_DUB.test(t) || INDIAN_KIDS.test(t);
  if (INDIAN_KIDS.test(t)) {
    return ["Hindi", "English", "Japanese", "DUB"];
  }
  if (hindi) {
    return ["Hindi", "English", "Japanese", "DUB", "SUB"];
  }
  if (FAMILY_SHONEN.test(t) || GHIBLI.test(t)) {
    return ["Japanese", "English", "Hindi", "SUB", "DUB"];
  }
  if (type && /movie|special/i.test(type)) {
    return ["Japanese", "English", "SUB"];
  }
  return ["Japanese", "English", "SUB"];
}

export function hasHindiDub(title: string): boolean {
  return HINDI_DUB.test(title.toLowerCase()) || INDIAN_KIDS.test(title.toLowerCase());
}

export function isMatureTitle(card: {
  title: string;
  genres?: string[];
  ageRating?: string;
  description?: string;
}): boolean {
  if (card.ageRating && MATURE_AGE.test(card.ageRating)) return true;
  if (card.genres?.some((g) => MATURE_GENRE.test(g))) return true;
  if (MATURE_TITLE.test(card.title)) return true;
  if (card.description && MATURE_TITLE.test(card.description)) return true;
  return false;
}

export function isKidsCartoon(card: { title: string; genres?: string[] }): boolean {
  return KIDS_CARTOON.test(card.title);
}

export function isFamilyTitle(card: { title: string; genres?: string[] }): boolean {
  const t = card.title.toLowerCase();
  if (INDIAN_KIDS.test(t) || FAMILY_SHONEN.test(t) || GHIBLI.test(t)) return true;
  const genres = (card.genres ?? []).map((g) => g.toLowerCase());
  return genres.some((g) => g === "kids" || g === "childcare" || g === "family");
}

export function buildEmbedServers(
  anilistId: string,
  malId: number | undefined,
  episode: number,
  title = "",
): StreamServer[] {
  const servers: StreamServer[] = [];
  const id = String(anilistId).replace(/^(mal|kitsu|gogo)-/, "");
  const ep = Math.max(1, episode);
  const hindi = hasHindiDub(title);
  if (hindi && /^\d+$/.test(id)) {
    servers.push({
      id: "videasy-hindi",
      name: "Hindi Dub",
      url: `https://embed.su/embed/anime/${id}/${ep}?dub=hindi&color=e50914`,
    });
  }
  if (/^\d+$/.test(id)) {
    servers.push({
      id: "videasy-sub",
      name: "Japanese SUB",
      url: `https://embed.su/embed/anime/${id}/${ep}?color=e50914`,
    });
    servers.push({
      id: "videasy-dub",
      name: "English Dub",
      url: `https://embed.su/embed/anime/${id}/${ep}?dub=true&color=e50914`,
    });
  }
  if (malId) {
    if (hindi) {
      servers.push({
        id: "vidstream-hindi",
        name: "Vidstream · Hindi",
        url: `https://embed.su/embed/anime/${malId}/${ep}/hindi`,
      });
    }
    servers.push({
      id: "vidstream",
      name: "Vidstream",
      url: `https://embed.su/embed/anime/${malId}/${ep}`,
    });
    servers.push({
      id: "vidstream-dub",
      name: "Vidstream · DUB",
      url: `https://embed.su/embed/anime/${malId}/${ep}/dub`,
    });
    servers.push({
      id: "streamwish",
      name: "StreamWish",
      url: `https://vidsrc.vip/embed/anime?mal=${malId}&ep=${ep}`,
    });
    servers.push({
      id: "vidsrc-tw",
      name: "Server 4",
      url: `https://embed.su/embed/anime/${malId}/${ep}`,
    });
    servers.push({
      id: "2embed",
      name: "2Embed",
      url: `https://www.2embed.cc/embed/anime/${malId}/${ep}`,
    });
  }
  return servers;
}

export const CONTINUE_KEY = "anitoon:continue";
export const LIST_KEY = "anitoon:watchlist";
export const HISTORY_KEY = "anitoon:history";

export type WatchEntry = {
  id: string;
  malId?: number;
  title: string;
  image: string;
  episode: number;
  updatedAt: number;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function migrateKeys() {
  if (typeof window === "undefined") return;
  const pairs: Array<[string, string]> = [
    ["kage:continue", CONTINUE_KEY],
    ["kage:mylist", LIST_KEY],
  ];
  for (const [from, to] of pairs) {
    if (!localStorage.getItem(to) && localStorage.getItem(from)) {
      localStorage.setItem(to, localStorage.getItem(from) as string);
    }
  }
}

export function getContinueWatching(): WatchEntry[] {
  migrateKeys();
  return readJson<WatchEntry[]>(CONTINUE_KEY, []).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveContinueWatching(entry: WatchEntry) {
  const next = getContinueWatching().filter((item) => item.id !== entry.id);
  next.unshift(entry);
  localStorage.setItem(CONTINUE_KEY, JSON.stringify(next.slice(0, 18)));
}

export function getMyList(): WatchEntry[] {
  migrateKeys();
  return readJson<WatchEntry[]>(LIST_KEY, []);
}

export function toggleMyList(entry: Omit<WatchEntry, "episode" | "updatedAt">): WatchEntry[] {
  const list = getMyList();
  const exists = list.some((item) => item.id === entry.id);
  const next = exists
    ? list.filter((item) => item.id !== entry.id)
    : [{ ...entry, episode: 1, updatedAt: Date.now() }, ...list].slice(0, 60);
  localStorage.setItem(LIST_KEY, JSON.stringify(next));
  return next;
}

export function isInMyList(id: string): boolean {
  return getMyList().some((item) => item.id === id);
}

export function getWatchHistory(): WatchEntry[] {
  return readJson<WatchEntry[]>(HISTORY_KEY, []).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function pushWatchHistory(entry: WatchEntry) {
  const current = getWatchHistory();
  const next = current.filter(
    (item) => !(item.id === entry.id && item.episode === entry.episode),
  );
  next.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next.slice(0, 40)));
  saveContinueWatching(entry);
}

export function clearWatchHistory() {
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(CONTINUE_KEY);
}

async function api<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function fetchCatalog(kind: CatalogKind, genre?: string, page = 1) {
  const params = new URLSearchParams({ kind, page: String(page) });
  if (genre) params.set("genre", genre);
  return api<CatalogResponse>(`/api/catalog?${params}`);
}

export function fetchSearch(query: string, page = 1) {
  const params = new URLSearchParams({ q: query, page: String(page) });
  return api<CatalogResponse>(`/api/search?${params}`);
}

export function fetchInfo(id: string, title?: string) {
  const params = new URLSearchParams({ id });
  if (title) params.set("title", title);
  return api<AnimeInfo>(`/api/info?${params}`);
}

export function fetchStream(opts: {
  malId?: number;
  anilistId: string;
  episode: number;
  episodeId?: string;
  title?: string;
}) {
  const params = new URLSearchParams({
    anilistId: opts.anilistId,
    episode: String(opts.episode),
  });
  if (opts.malId) params.set("malId", String(opts.malId));
  if (opts.episodeId) params.set("episodeId", opts.episodeId);
  if (opts.title) params.set("title", opts.title);
  return api<StreamPayload>(`/api/stream?${params}`);
}
