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

export async function loadCatalog(category: string = "trending") {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/top/anime`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { results: [] };
    const data = await res.json();
    const results = (data.data || []).map((anime: any) => ({
      id: String(anime.mal_id),
      title: anime.title_english || anime.title,
      image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
      episodeNumber: anime.episodes || 1,
    }));
    return { results };
  } catch (err) {
    return { results: [] };
  }
}

export async function loadInfo(id: string) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    const anime = data.data;
    return {
      id: String(anime.mal_id),
      title: anime.title_english || anime.title,
      image: anime.images?.jpg?.large_image_url,
      description: anime.synopsis,
      episodes: Array.from({ length: anime.episodes || 12 }, (_, i) => ({
        id: `${anime.mal_id}-${i + 1}`,
        number: i + 1,
        title: `Episode ${i + 1}`,
      })),
    };
  } catch (err) {
    return null;
  }
}

export async function loadSearch(query: string) {
  try {
    const res = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) return { results: [] };
    const data = await res.json();
    const results = (data.data || []).map((anime: any) => ({
      id: String(anime.mal_id),
      title: anime.title_english || anime.title,
      image: anime.images?.jpg?.image_url,
    }));
    return { results };
  } catch (err) {
    return { results: [] };
  }
}

export async function loadStream(opts: any) {
  return {
    servers: ANIME_SERVERS.map((s, idx) => ({
      id: `server-${idx}`,
      name: SERVER_NAME_MAP[s.name] || s.name,
      url: s.url,
    })),
  };
                     }
