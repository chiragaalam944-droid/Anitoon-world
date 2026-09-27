export const ANIME_SERVERS = [
  { name: "HydraX", url: "https://player.smashy.stream/anime/" },
  { name: "MyCloud", url: "https://vidlink.pro/anime/" },
  { name: "VidCloud", url: "https://vidsrc.cc/v2/embed/anime/" },
  { name: "Vidmoly", url: "https://player.smashy.stream/anime/" },
  { name: "SRuby", url: "https://vidlink.pro/anime/" },
  { name: "NeoCDN", url: "https://vidsrc.cc/v2/embed/anime/" },
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

export async function loadCatalog(page: number = 1) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/top/anime?page=${page}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Catalog fetch failed");
    const data = await res.json();

    const results = (data.data || []).map((anime: any) => ({
      id: String(anime.mal_id),
      malId: anime.mal_id,
      title: anime.title_english || anime.title,
      name: anime.title_english || anime.title,
      image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
      poster: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
      cover: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
      episodeNumber: anime.episodes || 1,
      episodes: anime.episodes || 1,
      type: anime.type || "TV",
      url: anime.url || "",
    }));

    return { results, data: results };
  } catch (err) {
    console.error("loadCatalog error:", err);
    return { results: [], data: [] };
  }
}

export async function loadInfo(id: string) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
    if (!res.ok) throw new Error("Info fetch failed");
    const json = await res.json();
    const anime = json.data;

    const totalEps = anime.episodes || 12;
    const episodesList = Array.from({ length: totalEps }, (_, i) => ({
      id: `${anime.mal_id}-${i + 1}`,
      number: i + 1,
      title: `Episode ${i + 1}`,
    }));

    return {
      id: String(anime.mal_id),
      malId: anime.mal_id,
      title: anime.title_english || anime.title,
      image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
      description: anime.synopsis || "",
      episodes: episodesList,
    };
  } catch (err) {
    console.error("loadInfo error:", err);
    return null;
  }
}

export async function loadSearch(query: string) {
  try {
    const res = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) throw new Error("Search fetch failed");
    const data = await res.json();

    const results = (data.data || []).map((anime: any) => ({
      id: String(anime.mal_id),
      malId: anime.mal_id,
      title: anime.title_english || anime.title,
      image: anime.images?.jpg?.image_url,
      poster: anime.images?.jpg?.image_url,
    }));

    return { results, data: results };
  } catch (err) {
    console.error("loadSearch error:", err);
    return { results: [], data: [] };
  }
}

export async function loadStream(opts: {
  aniListId?: string;
  malId?: number;
  episode?: number;
  title?: string;
  id?: string;
}) {
  const mappedServers = ANIME_SERVERS.map((s, idx) => ({
    id: `srv-${idx}`,
    name: SERVER_NAME_MAP[s.name] || s.name,
    url: s.url,
  }));

  return {
    servers: mappedServers,
    sources: mappedServers,
  };
}
