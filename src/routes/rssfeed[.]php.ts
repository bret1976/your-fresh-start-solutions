import { createFileRoute } from "@tanstack/react-router";
import { buildRss } from "@/lib/tools/rss";

export const Route = createFileRoute("/rssfeed.php")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        return new Response(buildRss(origin), {
          headers: {
            "content-type": "application/rss+xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
