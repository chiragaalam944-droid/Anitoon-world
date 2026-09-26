import { createFileRoute } from "@tanstack/react-router";
import { loadCatalog } from "@/lib/consumet.server";

export const Route = createFileRoute("/api/catalog")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const kind = url.searchParams.get("kind") || "trending";
        const genre = url.searchParams.get("genre") || undefined;
        const page = Number(url.searchParams.get("page") || "1") || 1;
        try {
          const payload = await loadCatalog({ kind, genre, page });
          return Response.json(payload);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Catalog failed";
          return Response.json({ results: [], hasNextPage: false, error: message }, { status: 502 });
        }
      },
    },
  },
});
