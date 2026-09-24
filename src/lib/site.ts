import navData from "@/data/nav.json";
import content from "@/data/site-content.json";

export type NavItem = { label: string; href: string; children?: NavItem[] };

export type PageRec = {
  title: string;
  description: string;
  hero: string;
  html: string;
  source: string;
  missing?: boolean;
};

type Bundle = {
  heroImage: string;
  logo: string;
  crystal: string;
  pages: Record<string, PageRec>;
};

export const nav = navData as NavItem[];
export const site = content as Bundle;

export const PHONE = "(856) 504-6811";
export const PHONE_TEL = "tel:(856) 504-6811";
export const EMAIL = "advisor@yourfreshstartsolutions.com";
export const ADDRESS = ["Your Fresh Start Solutions LLC", "602 Benson Street", "Camden, NJ 08109"];
export const PORTAL_LOGIN = "https://www.securefirmportal.com/Account/Login/69667";
export const PORTAL_REGISTER = "https://www.securefirmportal.com/Account/Register/69667";
export const PORTAL_PAY = "https://www.securefirmportal.com/Account/Login/69667/?returnURL=/Launch/Payment";
export const PAYCONEX =
  "https://secure.payconex.net/paymentpage/enhanced/index.php?action=view&aid=120615818311&id=204271";
export const SECURE_SEND = "https://www.securefirmportal.com/SecureSend/Send/69667";
export const NEWSLETTER_ACTION = "https://www.cpaemailmarketing.com/client/campsub.php";

export function pageKey(pathname: string, search: string) {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const sp = new URLSearchParams(raw);
  const keys = [...new Set([...sp.keys()])].sort();
  const out = new URLSearchParams();
  for (const k of keys) {
    const v = sp.get(k);
    if (v) out.append(k, v);
  }
  const q = out.toString();
  let path = pathname || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (path === "/index.php") path = "/";
  return path + (q ? `?${q}` : "");
}

export function getPage(pathname: string, search: string): PageRec | undefined {
  const key = pageKey(pathname, search);
  return site.pages[key] ?? site.pages[pathname];
}

function pathOf(href: string) {
  return href.split("?")[0];
}

function findNode(
  items: NavItem[],
  pathname: string,
  parent: NavItem | null,
): { node: NavItem; parent: NavItem | null } | null {
  for (const item of items) {
    if (item.children?.length) {
      const deeper = findNode(item.children, pathname, item);
      if (deeper) return deeper;
    }
    if (pathOf(item.href) === pathname) return { node: item, parent };
  }
  return null;
}

export function sectionFor(pathname: string): { title: string; links: NavItem[] } | null {
  const found = findNode(nav, pathname, null);
  if (!found) return null;
  if (found.node.children?.length) {
    return { title: found.node.label, links: found.node.children };
  }
  if (found.parent?.children?.length) {
    return { title: found.parent.label, links: found.parent.children };
  }
  return null;
}
