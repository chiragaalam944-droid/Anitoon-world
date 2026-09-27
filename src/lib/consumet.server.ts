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

const BASE_URL = "https://consumet-api-clone.vercel.app/anime/gogoanime";

export async function loadCatalog(page: number = 1) {
  try {
    const res = await fetch(`${BASE_URL}/top-airing?page=${page}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { results: [] };
    const data = await res.json();
    
    // Frontend structure sync
    const results = (data.results || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      image: item.image,
      url: item.url,
      genres: item.genres || [],
      episodeNumber: item.episodeNumber || 1,
    }));

    return { results };
  } catch (err) {
    console.error("loadCatalog error:", err);
    return { results: [] };
  }
}

export async function loadInfo(id: string) {
  try {
    const res = await fetch(`${BASE_URL}/info/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("loadInfo error:", err);
    return null;
  }
}

export async function loadSearch(query: string) {
  try {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(query)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { results: [] };
    const data = await res.json();
    return { results: data.results || [] };
  } catch (err) {
    console.error("loadSearch error:", err);
    return { results: [] };
  }
}

export async function loadStream(opts: {
  aniListId?: string;
  malId?: number;
  episode?: number;
  title?: string;
  id?: string;
}) {
  try {
    let episodeId = opts.id || "";

    if (!episodeId && opts.title) {
      const searchRes = await fetch(`${BASE_URL}/${encodeURIComponent(opts.title)}`);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results[0]) {
          const animeId = searchData.results[0].id;
          const infoRes = await fetch(`${BASE_URL}/info/${animeId}`);
          if (infoRes.ok) {
            const infoData = await infoRes.json();
            const epNum = opts.episode || 1;
            const targetEp = (infoData.episodes || []).find((e: any) => e.number === epNum);
            if (targetEp) episodeId = targetEp.id;
          }
        }
      }
    }

    if (!episodeId) {
      return {
        servers: ANIME_SERVERS.map((s, idx) => ({
          id: `fallback-${idx}`,
          name: s.name,
          url: s.url,
        })),
      };
    }

    const watchRes = await fetch(`${BASE_URL}/watch/${episodeId}`);
    if (!watchRes.ok) throw new Error("Failed to fetch watch sources");
    const watchData = await watchRes.json();

    const rawServers = watchData.sources || watchData.servers || [];
    const servers = rawServers.map((srv: any, idx: number) => {
      const originalName = srv.name || srv.quality || `Server ${idx + 1}`;
      return {
        id: srv.id || `srv-${idx}`,
        name: SERVER_NAME_MAP[originalName] || originalName,
        url: srv.url || srv.file || "",
      };
    });

    return {
      servers: servers.length > 0 ? servers : ANIME_SERVERS,
    };
  } catch (err) {
    console.error("loadStream error:", err);
    return {
      servers: ANIME_SERVERS.map((s, idx) => ({
        id: `fallback-${idx}`,
        name: s.name,
        url: s.url,
      })),
    };
  }
}
