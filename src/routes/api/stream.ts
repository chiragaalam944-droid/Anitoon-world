import { createFileRoute } from "@tanstack/react-router";
import { loadStream } from "@/lib/consumet.server";

export const Route = createFileRoute("/api/stream")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const anilistId = url.searchParams.get("anilistId") || "";
        const episode = Number(url.searchParams.get("episode") || "1") || 1;
        const malRaw = url.searchParams.get("malId");
        const malId = malRaw ? Number(malRaw) : undefined;
        const episodeId = url.searchParams.get("episodeId") || undefined;
        const title = url.searchParams.get("title") || undefined;
        if (!anilistId) {
          return Response.json({ error: "Missing anilistId" }, { status: 400 });
        }
        try {
          const payload = await loadStream({
            anilistId,
            episode,
            malId: Number.isFinite(malId) ? malId : undefined,
            episodeId,
            title,
          });
          return Response.json(payload);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Stream failed";
          return Response.json({ servers: [], trailer: null, error: message }, { status: 502 });
        }
      },
    },
  },
});
