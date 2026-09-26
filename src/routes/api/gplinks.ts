import { createFileRoute } from "@tanstack/react-router";

function normalizeDest(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const u = new URL(value);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (u.hostname === "localhost" || u.hostname === ":::1") u.hostname = "127.0.0.1";
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
        // Direct bypass: Return destination URL directly as shortenedUrl
        return Response.json({ shortenedUrl: dest, destinationUrl: dest });
      },
    },
  },
});
