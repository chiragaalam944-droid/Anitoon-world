import {
  hasHindiDub,
  isKidsCartoon,
  isMatureTitle,
  languageBadges,
  pickTitle,
  stripHtml,
  type AnimeCard,
  type AnimeEpisode,
  type AnimeInfo,
  type StreamServer,
} from "./anime";

const CONSUMET_BASES = [
  "https://consumet-ten.vercel.app",
  "https://consumet-api-clone.vercel.app",
  "https://api.consumet.org",
];

const ANILIST = "https://graphql.anilist.co";
const KITSU = "https://kitsu.io/api/edge/anime";
const JIKAN = "https://api.jikan.moe/v4/anime";

const cache = new Map<string, { at: number; data: unknown }>();
const TTL_MS = 8 * 60 * 1000;

const FEATURED_QUERIES = [
  { key: "doraemon", q: "Doraemon" },
  { key: "pokemon", q: "Pokemon" },
  { key: "shinchan", q: "Crayon Shin-chan" },
  { key: "naruto", q: "Naruto" },
  { key: "hattori", q: "Ninja Hattori" },
  { key: "onepiece", q: "One Piece" },
  { key: "dragonball", q: "Dragon Ball" },
  { key: "totoro", q: "My Neighbor Totoro" },
] as const;

const CARTOON_QUERIES = [
  "Doraemon",
  "Crayon Shin-chan",
  "Ninja Hattori",
  "Perman",
  "Pokémon",
  "Tom and Jerry",
  "Oggy",
];

const HINDI_QUERIES = [
  "Demon Slayer",
  "Jujutsu Kaisen",
  "Solo Leveling",
  "Naruto",
  "One Piece",
  "Dragon Ball Super",
  "Black Clover",
  "My Hero Academia",
  "Attack on Titan",
  "Death Note",
];

const FAMILY_FALLBACK: AnimeCard[] = [
  { id: "2471", malId: 2471, title: "Doraemon (1979)", image: "", type: "TV" },
  { id: "527", malId: 527, title: "Pokémon", image: "", type: "TV" },
  { id: "966", malId: 966, title: "Crayon Shin-chan", image: "", type: "TV" },
  { id: "20", malId: 20, title: "Naruto", image: "", type: "TV" },
  { id: "21", malId: 21, title: "One Piece", image: "", type: "TV" },
  { id: "223", malId: 223, title: "Dragon Ball", image: "", type: "TV" },
  { id: "523", malId: 523, title: "My Neighbor Totoro", image: "", type: "MOVIE" },
  { id: "164", malId: 164, title: "Spirited Away", image: "", type: "MOVIE" },
  { id: "235", malId: 235, title: "Detective Conan", image: "", type: "TV" },
].map((c) => ({ ...c, languages: languageBadges(c.title, c.type) }));

function fromCache<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data as T;
}

function toCache<T>(key: string, data: T): T {
  cache.set(key, { at: Date.now(), data });
  return data;
}

async function fetchJson(url: string, ms = 9000): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(ms),
    });
    const ct = res.headers.get("content-type") ?? "";
    if (!res.ok || !ct.includes("json")) return null;
    const data: unknown = await res.json();
    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      !("results" in data) &&
      !("episodes" in data) &&
      !("data" in data) &&
      !("id" in data && "title" in data)
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

async function consumetGet(path: string, ms = 7000): Promise<unknown | null> {
  for (const base of CONSUMET_BASES) {
    const data = await fetchJson(`${base}${path}`, ms);
    if (data) return data;
  }
  return null;
}

const MEDIA_FIELDS = `
  id
  idMal
  title { romaji english native userPreferred }
  description(asHtml: false)
  coverImage { extraLarge large color }
  bannerImage
  averageScore
  status
  format
  seasonYear
  episodes
  genres
  isAdult
  trailer { id site }
`;

type AnilistMedia = {
  id: number;
  idMal?: number | null;
  title?: {
    romaji?: string | null;
    english?: string | null;
    native?: string | null;
    userPreferred?: string | null;
  };
  description?: string | null;
  coverImage?: { extraLarge?: string; large?: string; color?: string | null };
  bannerImage?: string | null;
  averageScore?: number | null;
  status?: string | null;
  format?: string | null;
  seasonYear?: number | null;
  episodes?: number | null;
  genres?: string[] | null;
  isAdult?: boolean | null;
  trailer?: { id?: string; site?: string } | null;
};

async function anilistQuery<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T | null> {
  try {
    const res = await fetch(ANILIST, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T };
    return json.data ?? null;
  } catch {
    return null;
  }
}

function decorate(card: AnimeCard): AnimeCard {
  return {
    ...card,
    languages: card.languages?.length ? card.languages : languageBadges(card.title, card.type),
  };
}

function fromAnilist(m: AnilistMedia): AnimeCard | null {
  if (m.isAdult) return null;
  const card: AnimeCard = {
    id: String(m.id),
    malId: m.idMal ?? undefined,
    title: pickTitle(m.title),
    image: m.coverImage?.extraLarge || m.coverImage?.large || "",
    cover: m.bannerImage || undefined,
    rating: m.averageScore ?? undefined,
    status: m.status ?? undefined,
    type: m.format ?? undefined,
    releaseDate: m.seasonYear ? String(m.seasonYear) : undefined,
    genres: m.genres ?? undefined,
    description: stripHtml(m.description),
    totalEpisodes: m.episodes ?? undefined,
    color: m.coverImage?.color ?? undefined,
  };
  if (isMatureTitle(card)) return null;
  return decorate(card);
}

type ConsumetItem = {
  id?: string | number;
  malId?: number;
  title?: string | {
    romaji?: string;
    english?: string;
    native?: string;
    userPreferred?: string;
  };
  image?: string;
  cover?: string;
  rating?: number;
  status?: string;
  type?: string;
  releaseDate?: string | number;
  genres?: string[];
  description?: string;
  totalEpisodes?: number;
  color?: string;
  episodes?: Array<{ id?: string; number?: number; title?: string }>;
  trailer?: { id?: string; site?: string };
};

function fromConsumet(item: ConsumetItem): AnimeCard | null {
  if (item.id == null) return null;
  const card: AnimeCard = {
    id: String(item.id),
    malId: item.malId,
    gogoId: typeof item.id === "string" && /[a-z]/i.test(item.id) ? String(item.id) : undefined,
    title: pickTitle(item.title),
    image: item.image || "",
    cover: item.cover,
    rating: item.rating,
    status: item.status,
    type: item.type,
    releaseDate: item.releaseDate != null ? String(item.releaseDate) : undefined,
    genres: item.genres,
    description: stripHtml(item.description),
    totalEpisodes: item.totalEpisodes,
    color: item.color,
  };
  if (isMatureTitle(card)) return null;
  return decorate(card);
}

function resultsFromConsumet(data: unknown): AnimeCard[] {
  if (!data || typeof data !== "object") return [];
  const results = (data as { results?: ConsumetItem[] }).results;
  if (!Array.isArray(results)) return [];
  return results.map(fromConsumet).filter((x): x is AnimeCard => Boolean(x));
}

type KitsuAnime = {
  id: string;
  attributes?: {
    canonicalTitle?: string;
    titles?: { en?: string; en_jp?: string; ja_jp?: string };
    posterImage?: { large?: string; original?: string };
    coverImage?: { original?: string; large?: string };
    synopsis?: string;
    startDate?: string;
    subtype?: string;
    status?: string;
    ageRating?: string;
    averageRating?: string;
    episodeCount?: number;
  };
};

function fromKitsu(item: KitsuAnime): AnimeCard | null {
  const a = item.attributes;
  if (!a) return null;
  const title = a.titles?.en || a.canonicalTitle || a.titles?.en_jp || "Untitled";
  const card: AnimeCard = {
    id: `kitsu-${item.id}`,
    title,
    image: a.posterImage?.large || a.posterImage?.original || "",
    cover: a.coverImage?.original || a.coverImage?.large,
    rating: a.averageRating ? Math.round(Number(a.averageRating)) : undefined,
    status: a.status,
    type: a.subtype?.toUpperCase(),
    releaseDate: a.startDate ? a.startDate.slice(0, 4) : undefined,
    description: stripHtml(a.synopsis),
    totalEpisodes: a.episodeCount,
    ageRating: a.ageRating,
  };
  if (isMatureTitle(card)) return null;
  return decorate(card);
}

type JikanAnime = {
  mal_id?: number;
  title?: string;
  title_english?: string;
  images?: { jpg?: { large_image_url?: string; image_url?: string } };
  year?: number;
  type?: string;
  status?: string;
  synopsis?: string;
  score?: number;
  episodes?: number;
  genres?: Array<{ name?: string }>;
  rating?: string;
};

function fromJikan(item: JikanAnime): AnimeCard | null {
  if (!item.mal_id) return null;
  const card: AnimeCard = {
    id: `mal-${item.mal_id}`,
    malId: item.mal_id,
    title: item.title_english || item.title || "Untitled",
    image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || "",
    rating: item.score ? Math.round(item.score * 10) : undefined,
    status: item.status,
    type: item.type,
    releaseDate: item.year ? String(item.year) : undefined,
    genres: item.genres?.map((g) => g.name || "").filter(Boolean),
    description: stripHtml(item.synopsis),
    totalEpisodes: item.episodes,
    ageRating: item.rating,
  };
  if (isMatureTitle(card)) return null;
  return decorate(card);
}

function mergeCards(lists: AnimeCard[][]): AnimeCard[] {
  const seen = new Set<string>();
  const out: AnimeCard[] = [];
  const remember = (card: AnimeCard) => {
    const keys = [
      card.id,
      card.malId ? `mal-${card.malId}` : "",
      card.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(),
    ].filter(Boolean);
    if (keys.some((k) => seen.has(k))) return;
    for (const k of keys) seen.add(k);
    out.push(card);
  };
  for (const list of lists) {
    for (const card of list) remember(card);
  }
  return out;
}

function bestMatch(group: AnimeCard[], query: string): AnimeCard | undefined {
  if (!group.length) return undefined;
  const n = query.toLowerCase().replace(/-/g, " ");
  const scored = group.map((c) => {
    const t = c.title.toLowerCase().replace(/-/g, " ");
    let s = 0;
    if (t === n) s += 12;
    if (t.startsWith(n)) s += 8;
    if (t.includes(n)) s += 6;
    for (const part of n.split(/\s+/).filter((p) => p.length > 3)) {
      if (t.includes(part)) s += 2;
    }
    return { c, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored[0]?.c ?? group[0];
}

async function anilistPage(opts: {
  sort?: string;
  genre?: string;
  format?: string;
  search?: string;
  tag?: string;
  page?: number;
  perPage?: number;
}): Promise<{ results: AnimeCard[]; hasNextPage: boolean }> {
  const variables: Record<string, unknown> = {
    page: opts.page ?? 1,
    perPage: opts.perPage ?? 24,
    sort: [opts.sort ?? "TRENDING_DESC"],
  };
  const defs = ["$page: Int", "$perPage: Int", "$sort: [MediaSort]"];
  const args = ["type: ANIME", "sort: $sort", "isAdult: false"];
  if (opts.genre) {
    defs.push("$genre: String");
    args.push("genre: $genre");
    variables.genre = opts.genre;
  }
  if (opts.format) {
    defs.push("$format: MediaFormat");
    args.push("format: $format");
    variables.format = opts.format;
  }
  if (opts.search) {
    defs.push("$search: String");
    args.push("search: $search");
    variables.search = opts.search;
  }
  if (opts.tag) {
    defs.push("$tag: String");
    args.push("tag: $tag");
    variables.tag = opts.tag;
  }

  const data = await anilistQuery<{
    Page: { pageInfo?: { hasNextPage?: boolean }; media: AnilistMedia[] };
  }>(
    `query (${defs.join(", ")}) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { hasNextPage }
        media(${args.join(", ")}) { ${MEDIA_FIELDS} }
      }
    }`,
    variables,
  );
  const results = (data?.Page?.media ?? [])
    .map(fromAnilist)
    .filter((x): x is AnimeCard => Boolean(x));
  return { results, hasNextPage: Boolean(data?.Page?.pageInfo?.hasNextPage) };
}

async function kitsuSearch(query: string, page = 1): Promise<AnimeCard[]> {
  const offset = (page - 1) * 20;
  const url = `${KITSU}?filter%5Btext%5D=${encodeURIComponent(query)}&page%5Blimit%5D=20&page%5Boffset%5D=${offset}`;
  const data = (await fetchJson(url, 8000)) as { data?: KitsuAnime[] } | null;
  return (data?.data ?? []).map(fromKitsu).filter((x): x is AnimeCard => Boolean(x));
}

async function jikanSearch(query: string, page = 1): Promise<AnimeCard[]> {
  const url = `${JIKAN}?q=${encodeURIComponent(query)}&sfw=true&page=${page}&limit=25`;
  const data = (await fetchJson(url, 8000)) as { data?: JikanAnime[] } | null;
  return (data?.data ?? []).map(fromJikan).filter((x): x is AnimeCard => Boolean(x));
}

async function resolveAnilistId(card: AnimeCard): Promise<AnimeCard> {
  if (/^\d+$/.test(card.id)) return card;
  if (card.malId) {
    const data = await anilistQuery<{ Media: AnilistMedia | null }>(
      `query ($id: Int) { Media(idMal: $id, type: ANIME) { ${MEDIA_FIELDS} } }`,
      { id: card.malId },
    );
    const mapped = data?.Media ? fromAnilist(data.Media) : null;
    if (mapped) return { ...card, ...mapped, languages: card.languages };
  }
  const found = await anilistPage({ search: card.title, sort: "SEARCH_MATCH", perPage: 5 });
  const mapped = found.results[0];
  if (mapped) {
    return {
      ...card,
      id: mapped.id,
      malId: mapped.malId ?? card.malId,
      image: card.image || mapped.image,
    };
  }
  return card;
}

async function loadFeaturedFamily(): Promise<AnimeCard[]> {
  const aliasQueries = FEATURED_QUERIES.map(
    ({ key, q }) => `
      ${key}: Page(page: 1, perPage: 8) {
        media(search: "${q.replace(/"/g, "")}", type: ANIME, isAdult: false, sort: SEARCH_MATCH) {
          ${MEDIA_FIELDS}
        }
      }
    `,
  ).join("\n");

  const data = await anilistQuery<Record<string, { media: AnilistMedia[] }>>(
    `query { ${aliasQueries} }`,
  );

  const groups: AnimeCard[][] = FEATURED_QUERIES.map(({ key }) =>
    (data?.[key]?.media ?? [])
      .map(fromAnilist)
      .filter((x): x is AnimeCard => Boolean(x)),
  );

  const kids = await anilistPage({
    genre: "Kids",
    sort: "POPULARITY_DESC",
    perPage: 24,
  });

  const lead: AnimeCard[] = [];
  const rest: AnimeCard[] = [];
  const seen = new Set<string>();
  FEATURED_QUERIES.forEach(({ q }, i) => {
    const group = groups[i] ?? [];
    const first = bestMatch(group, q);
    if (first && !seen.has(first.id)) {
      seen.add(first.id);
      lead.push(first);
    }
    for (const item of group) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      rest.push(item);
    }
  });
  for (const item of kids.results) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    rest.push(item);
  }

  const merged = [...lead, ...rest];
  return merged.length ? merged : FAMILY_FALLBACK;
}

function withoutKidsCartoons(cards: AnimeCard[]): AnimeCard[] {
  return cards.filter((c) => !isKidsCartoon(c));
}

export async function loadCatalog(opts: {
  kind: string;
  genre?: string;
  page?: number;
}): Promise<{ results: AnimeCard[]; hasNextPage: boolean }> {
  const page = opts.page ?? 1;
  const key = `cat:${opts.kind}:${opts.genre ?? ""}:${page}`;
  const cached = fromCache<{ results: AnimeCard[]; hasNextPage: boolean }>(key);
  if (cached) return cached;

  if (opts.kind === "cartoons" || opts.kind === "family") {
    if (page === 1) {
      const packs = await Promise.all(
        CARTOON_QUERIES.map((q) => anilistPage({ search: q, sort: "SEARCH_MATCH", perPage: 8 })),
      );
      const results = mergeCards(packs.map((p) => p.results));
      return toCache(key, { results, hasNextPage: true });
    }
    const more = await anilistPage({
      tag: "Kids",
      sort: "POPULARITY_DESC",
      page,
      perPage: 24,
    });
    return toCache(key, more);
  }

  if (opts.kind === "hindi") {
    if (page === 1) {
      const packs = await Promise.all(
        HINDI_QUERIES.map((q) => anilistPage({ search: q, sort: "SEARCH_MATCH", perPage: 6 })),
      );
      const merged = mergeCards(packs.map((p) => p.results));
      const results = merged.filter((c) => hasHindiDub(c.title));
      return toCache(key, { results: results.length ? results : merged, hasNextPage: true });
    }
    const more = await anilistPage({ sort: "POPULARITY_DESC", page, perPage: 24 });
    return toCache(key, {
      results: more.results.filter((c) => hasHindiDub(c.title)),
      hasNextPage: more.hasNextPage,
    });
  }

  if (opts.kind === "topic" && opts.genre) {
    return toCache(key, await loadSearch(opts.genre, page, false));
  }

  if (opts.kind === "movies") {
    const movies = await anilistPage({
      sort: "POPULARITY_DESC",
      format: "MOVIE",
      page,
      perPage: 24,
    });
    return toCache(key, {
      results: withoutKidsCartoons(movies.results),
      hasNextPage: movies.hasNextPage,
    });
  }

  if (opts.kind === "genre" && opts.genre && opts.genre !== "Kids") {
    const payload = await anilistPage({
      sort: "POPULARITY_DESC",
      genre: opts.genre,
      page,
      perPage: 24,
    });
    return toCache(key, {
      results: withoutKidsCartoons(payload.results),
      hasNextPage: payload.hasNextPage,
    });
  }

  if (opts.kind === "popular") {
    const payload = await anilistPage({ sort: "POPULARITY_DESC", page, perPage: 24 });
    return toCache(key, {
      results: withoutKidsCartoons(payload.results),
      hasNextPage: payload.hasNextPage,
    });
  }

  const payload = await anilistPage({ sort: "TRENDING_DESC", page, perPage: 24 });
  return toCache(key, {
    results: withoutKidsCartoons(payload.results),
    hasNextPage: payload.hasNextPage,
  });
}

export async function loadSearch(
  query: string,
  page = 1,
  familyBias = false,
): Promise<{ results: AnimeCard[]; hasNextPage: boolean }> {
  const q = query.trim();
  if (q.length < 2) return { results: [], hasNextPage: false };
  const key = `search-v2:${q}:${page}:${familyBias ? "f" : "a"}`;
  const cached = fromCache<{ results: AnimeCard[]; hasNextPage: boolean }>(key);
  if (cached?.results.length) return cached;

  const popularCartoon = /doraemon|pok[eé]mon|shin-?chan|hattori|naruto/i.test(q);

  const anilistMain = await anilistPage({
    search: q,
    sort: "SEARCH_MATCH",
    page,
    perPage: 25,
  });

  const extras: AnimeCard[][] =
    page === 1
      ? await Promise.all([
          kitsuSearch(q, 1),
          jikanSearch(q, 1),
          consumetGet(`/anime/gogoanime/${encodeURIComponent(q)}?page=1`, 4000).then(resultsFromConsumet),
          popularCartoon
            ? anilistPage({ search: `${q} movie`, sort: "SEARCH_MATCH", perPage: 25 }).then((r) => r.results)
            : Promise.resolve([] as AnimeCard[]),
          popularCartoon
            ? anilistPage({ search: `${q} special`, sort: "SEARCH_MATCH", perPage: 20 }).then((r) => r.results)
            : Promise.resolve([] as AnimeCard[]),
        ])
      : [[], [], [], [], []];

  const merged = mergeCards([
    anilistMain.results,
    extras[3] ?? [],
    extras[4] ?? [],
    extras[0] ?? [],
    extras[1] ?? [],
    extras[2] ?? [],
  ]);

  const resolvedExtras = await Promise.all(
    merged
      .filter((card) => !/^\d+$/.test(card.id))
      .slice(0, 8)
      .map(async (card) => {
        try {
          return await resolveAnilistId(card);
        } catch {
          return card;
        }
      }),
  );
  const already = merged.filter((card) => /^\d+$/.test(card.id));

  let results = mergeCards([already, resolvedExtras]);
  if (familyBias) {
    results = results.filter((c) => !isMatureTitle(c));
  }

  const payload = {
    results,
    hasNextPage: anilistMain.hasNextPage || results.length >= 20,
  };
  if (results.length) toCache(key, payload);
  return payload;
}

function toEpisode(ep: { id?: string; number?: number; title?: string } | null | undefined): AnimeEpisode | null {
  if (!ep?.id || typeof ep.number !== "number") return null;
  return { id: ep.id, number: ep.number, title: ep.title || `Episode ${ep.number}` };
}

function buildEpisodes(count: number, animeId: string): AnimeEpisode[] {
  const n = Math.min(Math.max(count || 12, 1), 2500);
  return Array.from({ length: n }, (_, i) => ({
    id: `${animeId}-episode-${i + 1}`,
    number: i + 1,
    title: `Episode ${i + 1}`,
  }));
}

async function gogoEpisodes(title: string): Promise<{ gogoId?: string; episodes: AnimeEpisode[] }> {
  const search = await consumetGet(`/anime/gogoanime/${encodeURIComponent(title)}`, 4000);
  const first = resultsFromConsumet(search)[0];
  const gogoId = first?.gogoId || first?.id;
  if (!gogoId || /^\d+$/.test(gogoId)) return { episodes: [] };
  const info = (await consumetGet(`/anime/gogoanime/info/${encodeURIComponent(gogoId)}`, 5000)) as
    | ConsumetItem
    | null;
  const episodes = (info?.episodes ?? []).map(toEpisode).filter((x): x is AnimeEpisode => x !== null);
  return { gogoId, episodes };
}

export async function loadInfo(id: string, titleHint?: string): Promise<AnimeInfo | null> {
  const key = `info:${id}:${titleHint ?? ""}`;
  const cached = fromCache<AnimeInfo>(key);
  if (cached) return cached;

  let media: AnilistMedia | null = null;
  const numericId = Number(id);
  const malMatch = /^mal-(\d+)$/.exec(id);

  if (Number.isFinite(numericId) && /^\d+$/.test(id)) {
    const data = await anilistQuery<{ Media: AnilistMedia | null }>(
      `query ($id: Int) { Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} } }`,
      { id: numericId },
    );
    media = data?.Media ?? null;
  } else if (malMatch) {
    const data = await anilistQuery<{ Media: AnilistMedia | null }>(
      `query ($id: Int) { Media(idMal: $id, type: ANIME) { ${MEDIA_FIELDS} } }`,
      { id: Number(malMatch[1]) },
    );
    media = data?.Media ?? null;
  } else if (titleHint) {
    const found = await anilistPage({ search: titleHint, sort: "SEARCH_MATCH", perPage: 1 });
    if (found.results[0]) {
      const data = await anilistQuery<{ Media: AnilistMedia | null }>(
        `query ($id: Int) { Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} } }`,
        { id: Number(found.results[0].id) },
      );
      media = data?.Media ?? null;
    }
  }

  if (!media) return null;
  const card = fromAnilist(media);
  if (!card) return null;

  const episodes = buildEpisodes(card.totalEpisodes ?? 12, card.id);

  return toCache(key, {
    ...card,
    episodes,
    trailer: media.trailer?.id
      ? { id: media.trailer.id, site: media.trailer.site ?? "youtube" }
      : null,
  });
}

export async function loadStream(opts: {
  malId?: number;
  anilistId: string;
  episode: number;
  episodeId?: string;
  title?: string;
}): Promise<{ servers: StreamServer[]; trailer: string | null }> {
  const servers: StreamServer[] = [];
  const ep = opts.episode;
  const anilistId = opts.anilistId.replace(/^(mal|kitsu|gogo)-/, "");
  const mal = opts.malId;

  if (opts.episodeId && /[a-z]/i.test(opts.episodeId) && !/^\d+-episode-\d+$/.test(opts.episodeId)) {
    const watch = (await consumetGet(
      `/anime/gogoanime/watch/${encodeURIComponent(opts.episodeId)}`,
      4000,
    )) as {
      sources?: Array<{ url?: string; quality?: string }>;
      download?: string;
    } | null;
    if (watch?.sources?.length) {
      for (const src of watch.sources) {
        if (!src.url) continue;
        servers.push({
          id: `gogo-${src.quality ?? servers.length}`,
          name: `Gogo ${src.quality ?? "Auto"}`,
          url: src.url,
          download: watch.download,
        });
      }
    }
    const list = (await consumetGet(
      `/anime/gogoanime/servers/${encodeURIComponent(opts.episodeId)}`,
      4000,
    )) as Array<{ name?: string; url?: string }> | null;
    if (Array.isArray(list)) {
      for (const s of list) {
        if (!s.url) continue;
        servers.push({
          id: `gogo-iframe-${s.name ?? servers.length}`,
          name: s.name || "Gogo embed",
          url: s.url,
        });
      }
    }
  }

  if (/^\d+$/.test(anilistId)) {
    if (opts.title && hasHindiDub(opts.title)) {
      servers.push({
        id: "videasy-hindi",
        name: "Hindi Dub",
        url: `https://www.2embed.cc/embedanime/${anilistId}/${ep}?dub=hindi&color=e50914`,
      });
    }
    servers.push({
      id: "videasy-sub",
      name: "Japanese SUB",
      url: `https://www.2embed.cc/embedanime/${anilistId}/${ep}?color=e50914`,
    });
    servers.push({
      id: "videasy-dub",
      name: "English Dub",
      url: `https://www.2embed.cc/embedanime/${anilistId}/${ep}?dub=true&color=e50914`,
    });
  }

  if (mal) {
    servers.push({
      id: "vidstream",
      name: "Vidstream",
      url: `https://vidsrc.pm/embed/anime/${mal}/${ep}`,
    });
    if (opts.title && hasHindiDub(opts.title)) {
      servers.push({
        id: "vidstream-hindi",
        name: "Vidstream · Hindi",
        url: `https://vidsrc.pm/embed/anime/${mal}/${ep}/hindi`,
      });
    }
    servers.push({
      id: "vidstream-dub",
      name: "Vidstream · DUB",
      url: `https://vidsrc.pm/embed/anime/${mal}/${ep}/dub`,
    });
    servers.push({
      id: "streamwish",
      name: "StreamWish",
      url: `https://vidsrc.sh/embed/anime?mal=${mal}&ep=${ep}`,
    });
    servers.push({
      id: "vidsrc-tw",
      name: "Server 4",
      url: `https://vidsrc.tw/embed/anime/${mal}/${ep}`,
    });
    servers.push({
      id: "2embed",
      name: "2Embed",
      url: `https://www.2embed.cc/embed/anime/${mal}/${ep}`,
    });
  }

  const seen = new Set<string>();
  const unique = servers.filter((s) => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });

  return { servers: unique, trailer: null };
}
