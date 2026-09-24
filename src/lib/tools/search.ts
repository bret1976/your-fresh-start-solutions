import { site, type PageRec } from "@/lib/site";

export type Hit = { href: string; title: string; snippet: string };

function plain(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&/gi, "&")
    .replace(/</gi, "<")
    .replace(/&#39;|'/gi, "'")
    .replace(/"/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function searchSite(query: string): Hit[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1 && term !== "site:yourfreshstartsolutions.com");
  if (!terms.length) return [];
  const hits: (Hit & { score: number })[] = [];
  for (const [href, page] of Object.entries(site.pages) as [string, PageRec][]) {
    if (page.missing || href === "/search.php") continue;
    const title = (page.hero || page.title || href).replace(/^Your Fresh Start Solutions LLC \| /, "");
    const body = plain(page.html || "");
    const titleHay = title.toLowerCase();
    const descHay = (page.description || "").toLowerCase();
    const bodyHay = body.toLowerCase();
    let score = 0;
    let at = -1;
    let matched = 0;
    for (const term of terms) {
      let hit = false;
      if (titleHay.includes(term)) {
        score += 8;
        hit = true;
      }
      if (descHay.includes(term)) {
        score += 3;
        hit = true;
      }
      const index = bodyHay.indexOf(term);
      if (index >= 0) {
        score += 1;
        hit = true;
        if (at < 0) at = index;
      }
      if (hit) matched += 1;
    }
    if (!matched) continue;
    const start = Math.max(0, at - 70);
    const snippet = (start > 0 ? "…" : "") + body.slice(start, start + 180) + (body.length > start + 180 ? "…" : "");
    hits.push({ href, title, snippet: snippet || page.description, score: score + matched * 2 });
  }
  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return hits.slice(0, 25).map(({ href, title, snippet }) => ({ href, title, snippet }));
}
