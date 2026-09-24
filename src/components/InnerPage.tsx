import { useEffect, useRef } from "react";
import { HelpBand } from "@/components/HomePage";
import { SearchResults } from "@/components/SearchResults";
import { TextLink } from "@/components/SiteShell";
import { EMAIL, PAYCONEX, PORTAL_REGISTER, getPage, sectionFor, site } from "@/lib/site";
import { localizeHtml } from "@/lib/tools/localize";
import { taxWidgetHtml, taxWidgetSelector } from "@/lib/tools/tax-center";

export function InnerPage({ pathname, search }: { pathname: string; search: string }) {
  const page = getPage(pathname, search);
  const section = sectionFor(pathname);
  const copyRef = useRef<HTMLDivElement>(null);
  const title = page?.title || "Your Fresh Start Solutions LLC";
  const hero = page?.hero || title.replace(/^Your Fresh Start Solutions LLC \| /, "").replace(/ Page$/, "");
  const html = page?.html ? localizeHtml(page.html) : "";
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("q") || "";

  useEffect(() => {
    document.title = title;
    const desc = page?.description;
    if (!desc) return;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "description");
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", desc);
  }, [title, page?.description]);

  useEffect(() => {
    const root = copyRef.current;
    if (!root) return;
    const scripts = [...root.querySelectorAll("script")];
    for (const old of scripts) {
      if (old.src && /^https?:/i.test(old.src)) {
        old.remove();
        continue;
      }
      const s = document.createElement("script");
      s.text = old.text;
      s.async = false;
      old.replaceWith(s);
    }
    const selector = taxWidgetSelector(pathname);
    const widget = taxWidgetHtml(pathname);
    if (selector && widget) {
      const slot = root.querySelector(selector);
      if (slot) slot.innerHTML = widget;
    }
  }, [html, pathname, search]);

  return (
    <>
      <section className="hero inner-hero" style={{ backgroundImage: `url(${site.heroImage})` }}>
        <div className="hero-card">
          <h1>{hero}</h1>
          <div className="hero-actions">
            {pathname !== "/clientportal.php" ? (
              <a className="btn btn-green btn-lg" href="#modalConsult">
                Schedule a Consultation
              </a>
            ) : null}
            <a className="btn btn-green btn-lg" href={PORTAL_REGISTER} target="_blank" rel="noopener noreferrer">
              Register Here
            </a>
            <a className="btn btn-green btn-lg" href={PAYCONEX} target="_blank" rel="noopener noreferrer">
              Pay My Fee
            </a>
          </div>
        </div>
      </section>
      <div className="crumb">
        <TextLink href="/">
          <i className="fa fa-home" aria-hidden="true" /> Home
        </TextLink>
      </div>
      <div className="wrap page-layout">
        <article className="page-copy" ref={copyRef}>
          {page && !page.missing && html ? (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <h1>Page not found</h1>
          )}
          {pathname === "/search.php" ? <SearchResults query={query} /> : null}
        </article>
        <aside className="page-side">
          {section ? (
            <div className="side-block">
              <p className="side-h">In This Section:</p>
              <ul>
                {section.links.map((link) => (
                  <li key={link.href + link.label}>
                    <TextLink href={link.href}>{link.label}</TextLink>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="side-block side-form">
            <p className="side-h">Contact Us</p>
            <form data-unwired="feedbackmail" action="#" method="post">
              <input name="recipient" value={EMAIL} type="hidden" />
              <input className="hp" name="company_website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <label>
                Name
                <input name="Name" autoComplete="name" />
              </label>
              <label>
                Email
                <input name="Email" type="email" autoComplete="email" />
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
            <img className="side-crystal" src={site.crystal} alt="" />
            <p className="side-rank">
              <strong>
                Your Fresh Start Solutions LLC Ranked #1 in Camden Accountant Rankings for 2026
                <br />
                <TextLink href="/award-recognition.php" className="btn btn-navy">
                  {"Learn More >>"}
                </TextLink>
              </strong>
            </p>
          </div>
        </aside>
      </div>
      <HelpBand />
    </>
  );
}
