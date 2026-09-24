export type SubscriberStatus = "subscribed" | "unsubscribed" | "suppressed";

export type Subscriber = {
  email: string;
  name: string;
  status: SubscriberStatus;
  source: string;
};

const KEY = "yfss-newsletter-list-v1";

export function loadSubscribers(): Subscriber[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as Subscriber[];
    if (!Array.isArray(raw)) return [];
    return raw.filter((row) => row && typeof row.email === "string");
  } catch {
    return [];
  }
}

export function saveSubscribers(rows: Subscriber[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export function rememberSubscriber(email: string, name = "", source = "website") {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return;
  const rows = loadSubscribers();
  const found = rows.find((row) => row.email === clean);
  if (found) {
    if (found.status === "subscribed" && name && !found.name) found.name = name;
  } else {
    rows.push({ email: clean, name, status: "subscribed", source });
  }
  saveSubscribers(rows);
}

function statusOf(value: string): SubscriberStatus {
  const text = value.trim().toLowerCase();
  if (text.startsWith("unsub") || text === "opt-out" || text === "opt out") return "unsubscribed";
  if (text.startsWith("suppress") || text === "bounce" || text === "complained") return "suppressed";
  return "subscribed";
}

export function parseSubscriberCsv(text: string): Subscriber[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const split = (line: string) => {
    const cells: string[] = [];
    let cur = "";
    let quoted = false;
    for (const ch of line) {
      if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) {
        cells.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  };
  const head = split(lines[0]).map((cell) => cell.toLowerCase());
  const emailAt = head.findIndex((cell) => cell.includes("mail"));
  const hasHeader = emailAt >= 0;
  const start = hasHeader ? 1 : 0;
  const nameAt = hasHeader ? head.findIndex((cell) => cell === "name" || cell.includes("first")) : 1;
  const statusAt = hasHeader ? head.findIndex((cell) => /status|subscr|suppress/.test(cell)) : -1;
  const rows: Subscriber[] = [];
  for (const line of lines.slice(start)) {
    const cells = split(line);
    const email = (hasHeader ? cells[emailAt] : cells[0] || "").replace(/^mailto:/i, "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    rows.push({
      email,
      name: nameAt >= 0 ? cells[nameAt] || "" : "",
      status: statusAt >= 0 ? statusOf(cells[statusAt] || "") : "subscribed",
      source: "import",
    });
  }
  return rows;
}

export function mergeSubscribers(current: Subscriber[], incoming: Subscriber[]) {
  const map = new Map(current.map((row) => [row.email, row]));
  for (const row of incoming) {
    const prev = map.get(row.email);
    if (!prev) map.set(row.email, row);
    else {
      map.set(row.email, {
        ...prev,
        name: row.name || prev.name,
        status: row.status === "subscribed" ? prev.status : row.status,
        source: prev.source === "import" ? prev.source : row.source,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.email.localeCompare(b.email));
}

export function subscribersToCsv(rows: Subscriber[]) {
  const esc = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return ["email,name,status,source", ...rows.map((row) => [row.email, row.name, row.status, row.source].map(esc).join(","))].join(
    "\n",
  );
}
