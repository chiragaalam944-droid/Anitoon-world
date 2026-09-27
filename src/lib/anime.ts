export interface AnimeCard {
  id: string;
  malId?: number;
  title: string;
  image: string;
  episode?: number;
}

export interface WatchEntry {
  id: string;
  malId?: number;
  title: string;
  image: string;
  episode?: number;
  updatedAt?: number;
}

export interface CatalogKind {
  kind: string;
  genre?: string;
}

export const CATEGORIES = [
  { id: "trending", label: "Trending", kind: "trending" },
  { id: "hindi-dubbed", label: "Hindi Dubbed", kind: "hindi-dubbed" },
  { id: "popular", label: "Popular", kind: "popular" },
  { id: "action", label: "Action", kind: "action" },
] as const;

export const POSTER_FALLBACK =
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&q=80";

const DEFAULT_ANIME_LIST: AnimeCard[] = [
  {
    id: "21",
    malId: 21,
    title: "One Piece",
    image: "https://cdn.myanimelist.net/images/anime/6/73245.jpg",
  },
  {
    id: "52034",
    malId: 52034,
    title: "Solo Leveling",
    image: "https://cdn.myanimelist.net/images/anime/1825/140733.jpg",
  },
  {
    id: "5114",
    malId: 5114,
    title: "Fullmetal Alchemist: Brotherhood",
    image: "https://cdn.myanimelist.net/images/anime/1208/94745.jpg",
  },
  {
    id: "38000",
    malId: 38000,
    title: "Demon Slayer: Kimetsu no Yaiba",
    image: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
  },
  {
    id: "40748",
    malId: 40748,
    title: "Jujutsu Kaisen",
    image: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
  },
  {
    id: "16498",
    malId: 16498,
    title: "Attack on Titan",
    image: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
  },
  {
    id: "20",
    malId: 20,
    title: "Naruto",
    image: "https://cdn.myanimelist.net/images/anime/13/17405.jpg",
  },
];

const SERVER_NAME_MAP: Record<string, string> = {
  "Hindi Dub": "HydraX (Hindi)",
  "Japanese SUB": "HydraX (SUB)",
  "English Dub": "HydraX (DUB)",
  Vidstream: "HydraX",
  "Vidstream Hindi": "VidCloud (Hindi)",
  "Vidstream DUB": "VidCloud (DUB)",
  StreamWish: "VidCloud",
  "Server 4": "Vidmoly",
  "2Embed": "MyCloud",
};

export async function fetchCatalog(kind?: string, genre?: string, page: number = 1) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/top/anime?page=${page}`);
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const results: AnimeCard[] = data.data.map((anime: any) => ({
          id: String(anime.mal_id),
          malId: anime.mal_id,
          title: anime.title_english || anime.title,
          image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || POSTER_FALLBACK,
        }));
        return {
          results,
          hasNextPage: Boolean(data.pagination?.has_next_page),
        };
      }
    }
  } catch (err) {
    console.error("Fetch catalog fallback activated:", err);
  }

  return {
    results: DEFAULT_ANIME_LIST,
    hasNextPage: false,
  };
}

export async function fetchSearch(query: string, page: number = 1) {
  try {
    const res = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&page=${page}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const results: AnimeCard[] = data.data.map((anime: any) => ({
          id: String(anime.mal_id),
          malId: anime.mal_id,
          title: anime.title_english || anime.title,
          image: anime.images?.jpg?.image_url || POSTER_FALLBACK,
        }));
        return {
          results,
          hasNextPage: Boolean(data.pagination?.has_next_page),
        };
      }
    }
  } catch (err) {
    console.error("Fetch search fallback activated:", err);
  }

  const filtered = DEFAULT_ANIME_LIST.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  return {
    results: filtered.length > 0 ? filtered : DEFAULT_ANIME_LIST,
    hasNextPage: false,
  };
}

export function getWatchHistory(): WatchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("anitoon_history");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getMyList(): WatchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("anitoon_mylist");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getContinueWatching(): WatchEntry[] {
  return getWatchHistory();
}

export function clearWatchHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("anitoon_history");
}

export async function fetchStream(opts: any) {
  const defaultServers = [
    { id: "hydrax", name: "HydraX", url: "https://player.smashy.stream/anime/" },
    { id: "vidcloud", name: "VidCloud", url: "https://vidsrc.cc/v2/embed/anime/" },
    { id: "vidmoly", name: "Vidmoly", url: "https://player.smashy.stream/anime/" },
    { id: "mycloud", name: "MyCloud", url: "https://vidlink.pro/anime/" },
  ];

  return {
    servers: defaultServers.map((srv) => ({
      ...srv,
      name: SERVER_NAME_MAP[srv.name] || srv.name,
    })),
  };
}
