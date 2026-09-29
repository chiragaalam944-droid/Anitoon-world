import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id, episode } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing anime ID" });
  }

  try {
    const response = await fetch(
      `https://consumet-api-production-e651.up.railway.app/anime/gogoanime/watch/${id}-episode-${episode || 1}`
    );
    const data = await response.json();

    if (!data || !data.sources) {
      return res.status(404).json({ error: "Stream sources not found" });
    }

    return res.status(200).json({
      sources: data.sources,
      subtitles: data.subtitles || [],
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch stream source" });
  }
}
