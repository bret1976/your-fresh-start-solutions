import { createServerFn } from "@tanstack/react-start";

export type TrafficRow = { day: string; path: string; hits: number };

function cleanPath(value: unknown): string | null {
  const path = String(value || "");
  if (!path.startsWith("/") || path.length > 160) return null;
  if (path.includes("@") || path.includes("..") || path.includes("\\") || path.includes("?")) return null;
  if (!/^\/[a-zA-Z0-9._/%&=+-]*$/.test(path)) return null;
  return path;
}

export const recordHit = createServerFn({ method: "POST" })
  .validator((input: { path: string }) => ({ path: cleanPath(input?.path) || "" }))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (!data.path) return { ok: false };
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into page_counts (day, path, hits)
      values (current_date, ${data.path}, 1)
      on conflict (day, path) do update set hits = page_counts.hits + 1
    `;
    return { ok: true };
  });

export const listTraffic = createServerFn({ method: "POST" }).handler(async (): Promise<TrafficRow[]> => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ day: string; path: string; hits: number }>`
    select day::text as day, path, hits
    from page_counts
    where day >= current_date - interval '30 days'
    order by day desc, hits desc
    limit 200
  `;
  return rows.map((row) => ({ day: String(row.day), path: row.path, hits: Number(row.hits) }));
});
