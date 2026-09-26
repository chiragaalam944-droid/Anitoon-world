import { createFileRoute } from "@tanstack/react-router";
import { loadInfo } from "@/lib/consumet.server";

export const Route = createFileRoute("/api/info")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id") || "";
        const title = url.searchParams.get("title") || undefined;
        if (!id) {
          return Response.json({ error: "Missing id" }, { status: 400 });
        }
        try {
          const info = await loadInfo(id, title);
          if (!info) {
            return Response.json({ error: "Not found" }, { status: 404 });
          }
          return Response.json(info);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Info failed";
          return Response.json({ error: message }, { status: 502 });
        }
      },
    },
  },
});
