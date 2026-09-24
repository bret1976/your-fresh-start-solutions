import { site } from "@/lib/site";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

function headlines(html: string): string[] {
  const titles: string[] = [];
  for (const block of html.matchAll(/<ul class="headline">([\s\S]*?)<\/ul>/gi)) {
    for (const match of block[1].matchAll(/<a\b[^>]*>(.*?)<\/a>/gi)) {
      const title = match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (title.length > 8) titles.push(title);
    }
  }
  return titles;
}

function archiveDate(key: string): Date | null {
  const match = key.match(/archive=(\d{2})(\d{4})/);
  if (!match) return null;
  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 1));
}

export function buildRss(origin: string): string {
  const items: { title: string; link: string; date: Date; description: string }[] = [];
  for (const [key, page] of Object.entries(site.pages)) {
    const date = archiveDate(key);
    if (!date) continue;
    const heads = headlines(page.html || "");
    const month = MONTHS[date.getUTCMonth()];
    const title = heads[0] ? `${month} ${date.getUTCFullYear()}: ${heads[0]}` : `${month} ${date.getUTCFullYear()} newsletter`;
    const description = heads.length ? heads.join(" · ") : "Monthly newsletter from Your Fresh Start Solutions LLC.";
    items.push({
      title,
      link: `${origin}${key}`,
      date,
      description,
    });
  }
  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  const xmlItems = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid>${escapeXml(item.link)}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Your Fresh Start Solutions LLC Newsletter</title>
    <link>${escapeXml(origin)}/newsletter.php</link>
    <description>Monthly newsletter from Your Fresh Start Solutions LLC in Camden, New Jersey.</description>
${xmlItems}
  </channel>
</rss>
`;
}
