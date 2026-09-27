export const ANIME_SERVERS = [
  { name: "HydraX", url: "https://player.smashy.stream/anime/" },
  { name: "MyCloud", url: "https://vidlink.pro/anime/" },
  { name: "VidCloud", url: "https://vidsrc.cc/v2/embed/anime/" },
  { name: "Vidmoly", url: "https://player.smashy.stream/anime/" },
  { name: "SRuby", url: "https://vidlink.pro/anime/" },
  { name: "NeoCDN", url: "https://vidsrc.cc/v2/embed/anime/" },
];

export async function loadCatalog(page: number = 1) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/top/anime?page=${page}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { results: [] };
    const data = await res.json();

    const items = (data.data || []).map((anime: any) => ({
      id: String(anime.mal_id),
      title: anime.title_english || anime.title,
      image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
      coverImage: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
      episodeNumber: anime.episodes || 1,
      type: anime.type || "TV",
    }));

    return { results: items, data: items, animeList: items };
  } catch (err) {
    return { results: [], data: [], animeList: [] };
  }
}

export async function loadInfo(id: string) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    const anime = json.data;

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
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}`);
    if (!res.ok) return { results: [] };
    const data = await res.json();

    const items = (data.data || []).map((anime: any) => ({
      id: String(anime.mal_id),
      title: anime.title_english || anime.title,
      image: anime.images?.jpg?.image_url,
    }));

    return { results: items, data: items };
  } catch (err) {
    return { results: [], data: [] };
  }
}

export async function loadStream(opts: any) {
  return {
    servers: [
      { id: "hydrax", name: "HydraX", url: "https://player.smashy.stream/anime/" },
      { id: "vidcloud", name: "VidCloud", url: "https://vidsrc.cc/v2/embed/anime/" },
      { id: "vidmoly", name: "Vidmoly", url: "https://player.smashy.stream/anime/" },
      { id: "mycloud", name: "MyCloud", url: "https://vidlink.pro/anime/" },
    ],
  };
}
