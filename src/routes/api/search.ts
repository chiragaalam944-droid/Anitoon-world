import { createFileRoute } from "@tanstack/react-router";
import { loadSearch } from "@/lib/consumet.server";

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get("q") || url.searchParams.get("query") || "";
        const page = Number(url.searchParams.get("page") || "1") || 1;
        try {
          const payload = await loadSearch(q, page, false);
          return Response.json(payload);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Search failed";
          return Response.json({ results: [], hasNextPage: false, error: message }, { status: 502 });
        }
      },
    },
  },
});
