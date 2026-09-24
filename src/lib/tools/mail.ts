import { EMAIL } from "@/lib/site";

export type MailDraft = { ok: true; mailto: string; text: string; silent?: boolean } | { ok: false; error: string };

const SKIP = new Set(["recipient", "function", "un", "custom5", "submit", "captcha_code", "company_website"]);

export function draftFromForm(form: HTMLFormElement, kind: "inquiry" | "newsletter"): MailDraft {
  const data = new FormData(form);
  const trap = String(data.get("company_website") || "").trim();
  if (trap) return { ok: true, mailto: "", text: "", silent: true };
  const lines: string[] = [];
  let email = "";
  for (const [key, value] of data.entries()) {
    if (typeof value !== "string" || SKIP.has(key)) continue;
    const text = value.trim();
    if (!text || text === "E-Mail") continue;
    const label = key.replace(/_/g, " ");
    if (/mail/i.test(label)) email = text;
    lines.push(`${label}: ${text}`);
  }
  if (kind === "newsletter") {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: "Enter the email address that should receive the newsletter." };
    }
  } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address so the firm can reply." };
  } else if (!lines.length) {
    return { ok: false, error: "Add your name, email, or a short note before sending." };
  }
  const subject = kind === "newsletter" ? "Newsletter signup" : "Website inquiry";
  const body = `${lines.join("\n")}\n\nSent from the Your Fresh Start Solutions website.`;
  const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { ok: true, mailto, text: body };
}
