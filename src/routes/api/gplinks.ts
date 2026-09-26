import { createFileRoute } from "@tanstack/react-router";
import { GPLINKS_API_KEY, GPLINKS_SHORTEN } from "@/lib/ad";

function normalizeDest(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const u = new URL(value);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (u.hostname === "localhost" || u.hostname === "[::1]") u.hostname = "127.0.0.1";
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/gplinks")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const incoming = new URL(request.url);
        const dest = normalizeDest(incoming.searchParams.get("url") || "");
        if (!dest) {
          return Response.json({ shortenedUrl: "", error: "Destination URL is missing" }, { status: 400 });
        }
        const api = `${GPLINKS_SHORTEN}${GPLINKS_API_KEY}&url=${encodeURIComponent(dest)}`;
        try {
          const res = await fetch(api, {
            headers: { accept: "application/json" },
            signal: AbortSignal.timeout(12000),
          });
          const data = (await res.json()) as { status?: string; shortenedUrl?: string; message?: unknown };
          const shortenedUrl = typeof data.shortenedUrl === "string" ? data.shortenedUrl : "";
          if (!shortenedUrl) {
            return Response.json({
              shortenedUrl: "",
              error: typeof data.message === "string" ? data.message : "URL is invalid",
            });
          }
          return Response.json({ shortenedUrl, destinationUrl: dest });
        } catch (err) {
          const message = err instanceof Error ? err.message : "GPLinks request failed";
          return Response.json({ shortenedUrl: "", error: message }, { status: 502 });
        }
      },
    },
  },
});
