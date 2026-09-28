// Fallback missing exports for build validation
export async function loadCatalog(query?: string) {
  return [];
}

export async function loadInfo(id: string) {
  return null;
}

export async function loadSearch(query: string) {
  return [];
}

export async function loadStream(id: string, ep: number = 1) {
  return null;
}

export async function getAnimeStreamUrl(title: string, episode: number = 1) {
  try {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    return `https://vidsrc.cc/v2/embed/anime/${slug}/${episode}`;
  } catch (err) {
    console.error("Stream Fetch Error:", err);
  }
  return null;
}
