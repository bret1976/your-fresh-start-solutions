import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { ADDRESS, EMAIL, PHONE, PHONE_TEL, PORTAL_LOGIN, SECURE_SEND, nav, site, type NavItem } from "@/lib/site";
import { draftFromForm } from "@/lib/tools/mail";
import { rememberSubscriber } from "@/lib/tools/subscribers";
import { recordHit } from "@/lib/tools/traffic";

export function TextLink({
  href,
  className,
  children,
  target,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  target?: string;
}) {
  const router = useRouter();
  const external = /^(https?:|mailto:|tel:)/.test(href) || target === "_blank";
  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      onClick={(e) => {
        if (external || href.startsWith("#") || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
        e.preventDefault();
        void router.navigate({ href });
      }}
    >
      {children}
    </a>
  );
}

function MenuList({
  items,
  depth,
  close,
}: {
  items: NavItem[];
  depth: number;
  close: () => void;
}) {
  return (
    <ul className={depth === 0 ? "menu-tree" : "menu-sub"}>
      {items.map((item) => (
        <MenuNode key={item.label + item.href} item={item} depth={depth} close={close} />
      ))}
    </ul>
  );
}

function MenuNode({ item, depth, close }: { item: NavItem; depth: number; close: () => void }) {
  const [open, setOpen] = useState(false);
  const has = !!item.children?.length;
  return (
    <li>
      <div className="menu-row">
        <TextLink href={item.href}>
          <span onClick={close}>{item.label}</span>
        </TextLink>
        {has ? (
          <button
            type="button"
            className="menu-expand"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <i className={`fa fa-angle-${open ? "up" : "down"}`} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {has && open ? <MenuList items={item.children!} depth={depth + 1} close={close} /> : null}
    </li>
  );
}

function DesktopNav() {
  return (
    <nav className="desk-nav" aria-label="Primary">
      <ul>
        {nav.map((item) => (
          <li key={item.label}>
            <TextLink href={item.href}>{item.label}</TextLink>
            {item.children?.length ? (
              <div className="desk-drop">
                {item.children.map((child) => (
                  <div key={child.label} className="desk-group">
                    <TextLink href={child.href}>{child.label}</TextLink>
                    {child.children?.length ? (
                      <ul>
                        {child.children.map((g) => (
                          <li key={g.label}>
                            <TextLink href={g.href}>{g.label}</TextLink>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteShell({ children, variant }: { children: ReactNode; variant: "home" | "internal" }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState<null | "consult" | "login" | "news">(null);
  const [notice, setNotice] = useState<null | { title: string; body: string; mailto?: string; gmail?: string; text?: string }>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const key = `yfss-hit:${path}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      return;
    }
    void recordHit({ data: { path } }).catch(() => undefined);
  }, [path]);

  useEffect(() => {
    function onSubmit(e: Event) {
      const form = e.target as HTMLFormElement;
      if (!(form instanceof HTMLFormElement)) return;
      const action = form.getAttribute("action") || "";
      if (form.dataset.siteSearch === "1" || action.includes("google.com/search")) {
        e.preventDefault();
        const input = form.querySelector('input[name="q"]') as HTMLInputElement | null;
        const raw = (input?.value || "").replace(/^site:yourfreshstartsolutions\.com\s*/i, "").trim();
        void router.navigate({ href: `/search.php?q=${encodeURIComponent(raw)}` });
        return;
      }
      const newsletter =
        form.dataset.localNewsletter === "1" || action.includes("cpaemailmarketing.com") || !!form.querySelector('input[name="un"]');
      const inquiry = form.dataset.unwired === "feedbackmail" || action.includes("feedbackmail");
      if (!newsletter && !inquiry) return;
      e.preventDefault();
      const draft = draftFromForm(form, newsletter ? "newsletter" : "inquiry");
      if (!draft.ok) {
        setNotice({ title: "Check the form", body: draft.error });
        return;
      }
      if (draft.silent) return;
      if (newsletter && draft.email) rememberSubscriber(draft.email);
      setNotice({
        title: newsletter ? "Newsletter signup is ready to send" : "Your message is ready to send",
        body: `It is not sent until you press send. Nothing is stored in a public database. Open your email app, or Gmail, and the message to ${EMAIL} will be filled in.`,
        mailto: draft.mailto,
        gmail: draft.gmail,
        text: draft.text,
      });
    }
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const control = target?.closest("input, button, a");
      const onclick = control?.getAttribute("onclick") || "";
      const label = control instanceof HTMLInputElement ? control.value : control?.textContent || "";
      if (onclick.includes("openSecureSend") || label.trim() === "Launch" || label.trim() === "Send Us a File") {
        const opener = (window as Window & { openSecureSend?: () => void }).openSecureSend;
        if (typeof opener === "function") return;
        e.preventDefault();
        window.open(SECURE_SEND, "securesend", "width=560,height=680,scrollbars=1,resizable=1");
        return;
      }
      const el = target?.closest("a");
      if (!el) return;
      const href = el.getAttribute("href") || "";
      if (el.dataset.localPrint === "1" || href.includes("cpasitesolutions.com/content/newsletter")) {
        e.preventDefault();
        window.print();
        return;
      }
      if (href === "#modalConsult" || href === "#modalLogin" || href === "#modalSubscribe") {
        e.preventDefault();
        setModal(href === "#modalLogin" ? "login" : href === "#modalSubscribe" ? "news" : "consult");
      }
    }
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("click", onClick);
    };
  }, [router]);

  useEffect(() => {
    document.body.style.overflow = menu || modal || notice ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu, modal, notice]);

  return (
    <div id="yfss" className={variant}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-bar">
          <TextLink href="/" className="logo-link">
            <img src={site.logo} alt="Your Fresh Start Solutions LLC" />
          </TextLink>
          <div className="header-actions">
            <a className="phone-link" href={PHONE_TEL}>
              <i className="fa fa-phone" aria-hidden="true" />
              <span>{PHONE}</span>
            </a>
            <button type="button" className="btn btn-navy" onClick={() => setModal("login")}>
              <i className="fa fa-lock" aria-hidden="true" /> Login
            </button>
            <button type="button" className="menu-toggle" aria-expanded={menu} onClick={() => setMenu(true)}>
              <i className="fa fa-navicon" aria-hidden="true" />
              <span>Menu</span>
            </button>
          </div>
        </div>
        <DesktopNav />
      </header>

      {menu ? (
        <div className="menu-layer">
          <button type="button" className="menu-backdrop" aria-label="Close menu" onClick={() => setMenu(false)} />
          <div className="menu-panel" role="dialog" aria-label="Menu">
            <button type="button" className="menu-close" onClick={() => setMenu(false)}>
              Close <i className="fa fa-close" />
            </button>
            <MenuList items={nav} depth={0} close={() => setMenu(false)} />
          </div>
        </div>
      ) : null}

      <main id="main">{children}</main>

      <footer className="site-footer">
        <div className="wrap footer-grid">
          <div>
            <p className="foot-h">Resources</p>
            <p>
              <TextLink href="/calc-section.php">Calculators</TextLink>
              <br />
              <TextLink href="/clientportal.php">Client Portal</TextLink>
              <br />
              <TextLink href="/quick-send.php">SecureSend</TextLink>
              <br />
              <TextLink href="/links.php">Internet Links</TextLink>
              <br />
              <TextLink href="/newsletter.php">Newsletter</TextLink>
            </p>
          </div>
          <div>
            <p className="foot-h">Tax Center</p>
            <p>
              <TextLink href="/taxrefunds.php">Track Your Refund</TextLink>
              <br />
              <TextLink href="/taxduedates.php">Tax Due Dates</TextLink>
              <br />
              <TextLink href="/taxrates2.php">Tax Rates</TextLink>
              <br />
              <TextLink href="/taxretention.php">Record Retention Guide</TextLink>
              <br />
              <TextLink href="/statetaxforms.php">State Tax Forms</TextLink>
            </p>
          </div>
          <div>
            <p className="foot-h">Contact</p>
            <p>
              {ADDRESS[0]}
              <br />
              {ADDRESS[1]}
              <br />
              {ADDRESS[2]}
              <br />
              <a href={PHONE_TEL}>{PHONE}</a>
              <br />
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </p>
          </div>
          <div className="crystal">
            <TextLink href="/award-recognition.php">
              <img src={site.crystal} alt="Your Fresh Start Solutions LLC Ranked #1 in Camden Accountant Rankings for 2026" />
            </TextLink>
          </div>
        </div>
        <div className="legal">
          <p>
            © Your Fresh Start Solutions LLC 2026
            <span className="dot"> · </span>
            <TextLink href="/sitemap.php">Site Map</TextLink>
            <span className="dot"> · </span>
            <TextLink href="/activity.php">Activity</TextLink>
            <span className="dot"> · </span>
            <TextLink href="/newsletter-list.php">Newsletter list</TextLink>
            <span className="dot"> · </span>
            <TextLink href="/privacy.php">Privacy Policy</TextLink>
            <span className="dot"> · </span>
            <TextLink href="/disclaimer.php">Disclaimer</TextLink>
            <span className="dot"> · </span>
            <a className="fa fa-facebook social" target="_blank" rel="noopener noreferrer" title="Facebook" href="https://www.facebook.com/yourfreshstartsolutions" />
            <a
              className="fa fa-linkedin social"
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn"
              href="https://www.linkedin.com/company/your-fresh-start-solutions-llc/"
            />
          </p>
        </div>
      </footer>

      {modal ? (
        <div className="modal-layer" role="presentation" onClick={() => setModal(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-x" onClick={() => setModal(null)} aria-label="Close">
              ×
            </button>
            {modal === "consult" ? <ConsultForm /> : null}
            {modal === "login" ? <LoginForm /> : null}
            {modal === "news" ? <NewsForm /> : null}
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className="modal-layer" role="presentation" onClick={() => setNotice(null)}>
          <div className="modal-card" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-x" onClick={() => setNotice(null)} aria-label="Close">
              ×
            </button>
            <h2>{notice.title}</h2>
            <p>{notice.body}</p>
            {notice.gmail ? (
              <p className="notice-actions">
                <a className="btn btn-green" href={notice.gmail} target="_blank" rel="noopener noreferrer">
                  Open Gmail
                </a>
                <a className="btn btn-navy" href={notice.mailto}>
                  Open email app
                </a>
                <button
                  type="button"
                  className="btn btn-navy"
                  onClick={() => {
                    void navigator.clipboard?.writeText(notice.text || "");
                  }}
                >
                  Copy message
                </button>
              </p>
            ) : null}
            <button type="button" className="btn btn-navy" onClick={() => setNotice(null)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ConsultForm() {
  return (
    <>
      <h2>Contact Us</h2>
      <form data-unwired="feedbackmail" action="#" method="post">
        <input name="recipient" value={EMAIL} type="hidden" />
        <input className="hp" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <label>
          Name
          <input name="Name" required autoComplete="name" />
        </label>
        <label>
          Email
          <input name="Email" type="email" required autoComplete="email" />
        </label>
        <label>
          Phone
          <input name="Phone" autoComplete="tel" />
        </label>
        <label>
          Comments
          <textarea name="Comments" rows={4} />
        </label>
        <button type="submit" className="btn btn-green">
          Send
        </button>
      </form>
    </>
  );
}

function LoginForm() {
  return (
    <>
      <h2>Portal Login</h2>
      <form action={PORTAL_LOGIN} method="post">
        <label>
          Email
          <input name="Username" autoComplete="username" required />
        </label>
        <label>
          Password
          <input name="Password" type="password" autoComplete="current-password" required />
        </label>
        <input name="Submit" value="clicked" type="hidden" />
        <button type="submit" className="btn btn-green">
          Login
        </button>
      </form>
    </>
  );
}

function NewsForm() {
  return (
    <>
      <h2>Newsletter</h2>
      <form method="post" action="#" data-local-newsletter="1">
        <input className="hp" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <label>
          Email
          <input name="Email" type="email" required placeholder="Enter your email address" />
        </label>
        <button className="btn btn-green" type="submit">
          Subscribe
        </button>
      </form>
      <p>
        This prepares an email to the firm. It is not sent until you press send. Addresses added on this computer are also kept in the{" "}
        <TextLink href="/newsletter-list.php">newsletter list</TextLink> on this computer, not in a public database.
      </p>
    </>
  );
}
