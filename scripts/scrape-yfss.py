#!/usr/bin/env python3
"""Crawl public pages of yourfreshstartsolutions.com into JSON + local images."""
import hashlib, json, os, re, time
from html import unescape
from urllib.parse import urljoin, urlparse, parse_qsl, urlencode, unquote
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.request

BASE = "https://www.yourfreshstartsolutions.com/"
ROOT = "/workspace"
MEDIA = os.path.join(ROOT, "public/media")
UA = "Mozilla/5.0 (compatible; YFSS-preview-copy/1.0)"
os.makedirs(MEDIA, exist_ok=True)

SEED = """
index.php about.php firmprofile.php award-recognition.php services.php
indservices.php personalfinplan.php estateplan.php wealth-management.php
taxservices.php taxprep.php taxprep-business.php taxplanning.php
estates-trusts-tax.php cryptocurrency.php bizservices.php smallbiz.php
bookkeeping.php payrollservice.php cfoservices.php auditing.php
forensic_accounting.php bankfinancing.php valuation.php bizplan.php
financial-planning-business.php succession.php formation.php nonprofit.php
internalcontrols.php irs-problemshome.php irs-representation.php
irs-nonfiledreturns.php irs-backtaxes.php irs-payrolltax.php irs-taxliens.php
irs-taxlevies.php irs-paymentplan.php irs-offercompromise.php irs-spouse.php
qbmain.php quickbookssetup.php industries.php construction.php dentists.php
medical-practice.php hospitality.php lawfirms.php manufacturers.php marketing.php
non-profit.php realestate.php retail.php resources.php newsletter.php
archive.php reports.php custom.php life-events.php business-strategies.php
investment-strategies.php taxstrategies-businessowners.php
taxstrategies-individuals.php frequently-asked-questions.php calc-section.php
clientportal.php quick-send.php links.php rrdpolicy.php taxcenter2.php
taxrefunds.php taxduedates.php taxrates2.php taxpublications.php
taxretention.php statetaxforms.php Ebooks.php StrategicScalingE-Book.php
business-survival-playbooks.php updates.php contact.php footerpages.php
search.php sitemap.php privacy.php disclaimer.php securitymeasures.php
reviews.php paymyfee.php taxproblems.php
""".split()

CALC_QS = [
    "id=10&category=Cash+Flow",
    "id=11&category=College",
    "id=12&category=Credit",
    "id=13&category=Home+and+Mortgage",
    "id=14&category=Insurance",
    "id=15&category=Investment",
    "id=16&category=Paycheck+and+Benefits",
    "id=17&category=Qualified+Plans",
    "id=18&category=Retirement",
    "id=19&category=Saving",
    "id=20&category=Taxation",
    "id=21&category=Auto",
    "id=22&category=Business",
]
ARCHIVES = ["082026","072026","062026","052026","042026","032026","022026","012026"]

session_cache = {}

def fetch(url, timeout=30):
    if url in session_cache:
        return session_cache[url]
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = r.read()
            final = r.geturl()
            ctype = r.headers.get("Content-Type", "")
        session_cache[url] = (data, final, ctype, None)
    except Exception as e:
        session_cache[url] = (None, url, "", str(e))
    return session_cache[url]

def page_key(path, query):
    path = path.lstrip("/")
    if path in ("", "index.php"):
        return "/"
    q = ""
    if query:
        pairs = parse_qsl(query, keep_blank_values=True)
        # stable
        pairs = [(k, v) for k, v in pairs if k not in ("PHPSESSID",)]
        if pairs:
            q = "?" + urlencode(pairs, doseq=True)
    return "/" + path + q

ASSET_MAP = {}  # remote path -> local /media/...

def local_for(url_path):
    """Map a same-host image/css/pdf asset to /media/... Ignore HTML pages."""
    if url_path in ASSET_MAP:
        return ASSET_MAP[url_path]
    clean = url_path.split("?")[0].split("#")[0]
    if clean.startswith("http"):
        p = urlparse(clean)
        host = p.netloc
        path = unquote(p.path)
        if "cpasitesolutions.com" in host and "/~yourfres/" in path:
            rel = "cpanel" + path
        elif host.endswith("yourfreshstartsolutions.com"):
            rel = path
        else:
            return None
    else:
        rel = unquote(clean)
        if not rel.startswith("/"):
            rel = "/" + rel
    low = rel.lower()
    if not re.search(r"\.(png|jpe?g|gif|webp|svg|ico|pdf|css)$", low):
        return None
    rel = rel.replace("/~yourfres/", "/yourfres/")
    rel = rel.lstrip("/")
    if ".." in rel or not rel:
        return None
    local_fs = os.path.join(MEDIA, rel)
    web = "/media/" + rel
    ASSET_MAP[url_path] = (web, local_fs, url_path)
    return ASSET_MAP[url_path]

def strip_scripts(html):
    html = re.sub(r"<!--\[if[\s\S]*?<!\[endif\]-->", "", html, flags=re.I)
    html = re.sub(r"<script[\s\S]*?</script>", "", html, flags=re.I)
    html = re.sub(r"\sonclick=\"NewWindow\('editdiv\.php[^\"]*\"", "", html, flags=re.I)
    html = re.sub(r"<link[^>]+>", "", html, flags=re.I)
    return html

def rewrite_assets(html, page_url):
    def repl_src(m):
        attr, quote, val = m.group(1), m.group(2), m.group(3)
        if val.startswith("data:") or val.startswith("mailto:") or val.startswith("tel:") or val.startswith("#") or val.startswith("javascript:"):
            return m.group(0)
        absu = urljoin(page_url, val)
        host = urlparse(absu).netloc
        if host.endswith("yourfreshstartsolutions.com") or ("cpasitesolutions.com" in host and "/~yourfres/" in absu):
            mapped = local_for(absu)
            if mapped:
                return f"{attr}={quote}{mapped[0]}{quote}"
        # securimage captcha stays remote so the image can still load, flagged later
        return m.group(0)
    html = re.sub(r'\b(src|href)=([\'"])([^\'"]+)\2', repl_src, html, flags=re.I)
    # src without being a link to html pages: the regex also rewrites internal page hrefs to media if they look like files.
    return html

def fix_internal_links(html):
    """Undo accidental media rewrites of .php pages and normalize index.php."""
    def repl(m):
        quote, val = m.group(1), m.group(2)
        if val.startswith("/media/") and (".php" in val or val.rstrip("/").endswith("index")):
            # shouldn't happen if we only map image-like, but guard
            pass
        if val in ("index.php", "/index.php"):
            return f"href={quote}/{quote}"
        if val.startswith("index.php?"):
            return f"href={quote}/?{val.split('?',1)[1]}{quote}"
        # keep .php paths root-absolute
        if re.match(r"^[A-Za-z0-9_\-]+\.php", val):
            return f"href={quote}/{val}{quote}"
        if val.startswith("?") :
            return m.group(0)
        return m.group(0)
    html = re.sub(r'href=([\'"])([^\'"]+)\1', repl, html)
    # broken live PHP leak
    html = re.sub(
        r'<a[^>]*href=([\'"])[^\'"]*(?:<)?\?php echo \$config[\s\S]*?</a>',
        lambda m: re.search(r'(<img[\s\S]*?>)', m.group(0)).group(1) if re.search(r'<img', m.group(0)) else '',
        html,
        flags=re.I,
    )
    # mark mail forms
    def form_repl(m):
        tag = m.group(0)
        if re.search(r'feedbackmail\.php', tag, re.I):
            tag = re.sub(r'action=([\'"])[^\'"]*\1', 'action="#" data-unwired="feedbackmail"', tag, count=1)
            if "data-unwired" not in tag:
                tag = tag[:-1] + ' data-unwired="feedbackmail">'
            tag = re.sub(r'\sonsubmit=([\'"])[^\'"]*\1', '', tag, flags=re.I)
        return tag
    html = re.sub(r'<form\b[^>]*>', form_repl, html, flags=re.I)
    return html

def extract_content(html):
    i = html.find('id="content"')
    if i < 0:
        return ""
    # back up to the opening <div
    start = html.rfind("<div", 0, i)
    j = html.find('id="CP_Sidebar"', i)
    if j < 0:
        j = html.find('id="CP_Help"', i)
    if j < 0:
        return ""
    # back up to the div that opens the sidebar
    end = html.rfind("<div", i, j)
    chunk = html[start:end]
    return chunk

def extract_title(html):
    m = re.search(r"<title>([\s\S]*?)</title>", html, re.I)
    if not m:
        return ""
    return re.sub(r"\s+", " ", m.group(1)).strip()

def extract_meta(html, name):
    m = re.search(rf'<meta[^>]+name=["\']{name}["\'][^>]+content=["\']([^"\']*)["\']', html, re.I)
    if not m:
        m = re.search(rf'<meta[^>]+content=["\']([^"\']*)["\'][^>]+name=["\']{name}["\']', html, re.I)
    return unescape(m.group(1)).strip() if m else ""

def extract_hero(html):
    m = re.search(r'id="CP_Tagline"[\s\S]*?<p class="h1">([\s\S]*?)</p>', html)
    if not m:
        return ""
    inner = m.group(1)
    text = re.sub(r"<[^>]+>", " ", inner)
    text = unescape(re.sub(r"\s+", " ", text)).strip()
    return text

def extract_hero_bg(html):
    m = re.search(r'id="CP_Hero"[^>]*style="[^"]*url\(([^)]+)\)', html)
    return m.group(1).strip("'\"") if m else ""

def is_html_page(path):
    base = path.split("?")[0].lower()
    if base.endswith((".jpg",".jpeg",".png",".gif",".webp",".svg",".pdf",".css",".js",".ico",".woff",".zip")):
        return False
    return True

def discover_more(html, page_url):
    found = []
    for href in re.findall(r'href=["\']([^"\']+)["\']', html, re.I):
        if href.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue
        if "amp;" in href or "&amp" in href:
            href = unescape(href)
            href = unescape(href)
        absu = urljoin(page_url, href)
        p = urlparse(absu)
        if not p.netloc.endswith("yourfreshstartsolutions.com"):
            continue
        path = p.path.lstrip("/")
        if not path.endswith(".php"):
            continue
        if not re.match(r"^[A-Za-z0-9_\-]+\.php$", path):
            continue
        q = p.query
        if "amp;" in q or len(q) > 80:
            continue
        pairs = parse_qsl(q, keep_blank_values=False)
        allowed = {"archive", "id", "category", "date", "calc"}
        if pairs and any(k not in allowed for k, _v in pairs):
            # keep the page itself, drop odd queries
            q = ""
        if q and path not in ("archive.php", "calc-section.php", "newsletter.php", "calcloader.php"):
            q = ""
        found.append((path, q))
    return found

# ---- crawl pages ----
queue = []
for s in SEED:
    queue.append((s, ""))
for q in CALC_QS:
    queue.append(("calc-section.php", q.replace("+", " ")))  # urlencode later
for a in ARCHIVES:
    queue.append(("archive.php", f"archive={a}"))

seen = set()
pages = {}
errors = []
external_notes = []
asset_urls = set()

# fix calc query encoding properly
fixed_q = []
for path, query in queue:
    if path == "calc-section.php" and query and "category=" in query and "+" not in query and "%20" not in query:
        # already spaces from replace - reencode via parse
        pairs = []
        # query like id=10&category=Cash Flow
        for part in query.split("&"):
            if "=" in part:
                k,v = part.split("=",1)
                pairs.append((k, v.replace("+"," ")))
        query = urlencode(pairs)
    fixed_q.append((path, query))
queue = fixed_q

while queue:
    path, query = queue.pop(0)
    key = page_key(path, query)
    if key in seen:
        continue
    seen.add(key)
    q = ("?" + query) if query else ""
    url = urljoin(BASE, path + q)
    data, final, ctype, err = fetch(url)
    if err or not data:
        errors.append({"key": key, "url": url, "error": err or "empty"})
        print("ERR", key, err)
        continue
    html = data.decode("utf-8", "replace")
    # follow only if still html
    title = extract_title(html)
    if "404" in title and "404 Page" in title:
        errors.append({"key": key, "url": url, "error": "404 page"})
        print("404", key)
        # still store so we know
        pages[key] = {"title": title, "missing": True, "description": "", "hero": "", "html": "", "source": url}
        continue
    content = extract_content(html) if key != "/" else ""
    content = strip_scripts(content)
    content = fix_internal_links(rewrite_assets(content, url))
    hero = extract_hero(html)
    desc = extract_meta(html, "description")
    pages[key] = {
        "title": title,
        "description": desc,
        "hero": hero,
        "html": content,
        "source": url,
        "missing": False,
    }
    print(f"OK {key} html={len(content)} title={title[:60]}")
    # discover
    for npath, nq in discover_more(html, url):
        nkey = page_key(npath, nq)
        if nkey not in seen and len(seen) < 160:
            queue.append((npath, nq))
    # collect asset urls from original html (images)
    for src in re.findall(r'(?:src|href)=["\']([^"\']+\.(?:png|jpe?g|gif|webp|svg|ico|pdf))["\']', html, re.I):
        absu = urljoin(url, src)
        host = urlparse(absu).netloc
        if host.endswith("yourfreshstartsolutions.com") or ("cpasitesolutions.com" in host and "yourfres" in absu):
            asset_urls.add(absu.split("#")[0])

# known critical assets
for extra in [
    "https://www.yourfreshstartsolutions.com/~yourfres/images/hero.jpg",
    "https://cpanel2.cpasitesolutions.com/~yourfres/images/logo-web.png",
    "https://www.yourfreshstartsolutions.com/images/galleries/style/719/images/thumb-1.jpg",
    "https://www.yourfreshstartsolutions.com/images/galleries/style/719/images/thumb-2.jpg",
    "https://www.yourfreshstartsolutions.com/images/galleries/style/719/images/thumb-3.jpg",
    "https://www.yourfreshstartsolutions.com/~yourfres/images/your-fresh-start-solutions-llc-crystal.png",
    "https://www.yourfreshstartsolutions.com/favicon.ico",
    "https://www.yourfreshstartsolutions.com/~yourfres/favicon-32x32.png",
    "https://www.yourfreshstartsolutions.com/images/galleries/header/css/outline.css",
    "https://www.yourfreshstartsolutions.com/images/galleries/header/css/shadows.png",
    "https://www.yourfreshstartsolutions.com/images/galleries/header/hrshade.png",
]:
    asset_urls.add(extra)

print(f"\nPages: {len(pages)} assets queued: {len(asset_urls)} errors: {len(errors)}")

def download_asset(url):
    mapped = local_for(url)
    if not mapped:
        return url, "skip"
    web, fs, _ = mapped
    if os.path.exists(fs) and os.path.getsize(fs) > 0:
        return web, "cached"
    os.makedirs(os.path.dirname(fs), exist_ok=True)
    data, final, ctype, err = fetch(url)
    if err or not data:
        return url, err or "empty"
    # don't save html error pages as images
    if data[:20].lstrip().lower().startswith(b"<!doctype") or data[:15].lstrip().lower().startswith(b"<html"):
        if not url.endswith(".css"):
            return url, "got-html"
    with open(fs, "wb") as f:
        f.write(data)
    return web, "ok"

ok = fail = 0
fails = []
with ThreadPoolExecutor(max_workers=8) as ex:
    futs = [ex.submit(download_asset, u) for u in sorted(asset_urls)]
    for fu in as_completed(futs):
        web, status = fu.result()
        if status in ("ok", "cached"):
            ok += 1
        else:
            fail += 1
            fails.append({"url": web, "status": status})
            print("ASSET FAIL", status, web[:140])

# rewrite any remaining original host image paths inside saved html using ASSET_MAP
# already rewritten during extract via local_for side effect — but local_for was called
# before downloads, mapping exists. Content html uses /media paths. Good.

# hero image public path
hero_map = local_for("https://www.yourfreshstartsolutions.com/~yourfres/images/hero.jpg")
logo_map = local_for("https://cpanel2.cpasitesolutions.com/~yourfres/images/logo-web.png")
crystal_map = local_for("https://www.yourfreshstartsolutions.com/~yourfres/images/your-fresh-start-solutions-llc-crystal.png")

out = {
    "source": "https://www.yourfreshstartsolutions.com/",
    "heroImage": hero_map[0] if hero_map else "",
    "logo": logo_map[0] if logo_map else "",
    "crystal": crystal_map[0] if crystal_map else "",
    "pages": pages,
    "errors": errors,
    "assetFailures": fails,
    "assetCount": ok,
}
out_path = os.path.join(ROOT, "src/data/site-content.json")
with open(out_path, "w") as f:
    json.dump(out, f, ensure_ascii=False)
print("WROTE", out_path, "bytes", os.path.getsize(out_path))
print("assets ok", ok, "fail", fail)
print("page keys", len(pages))
# list missing
for e in errors:
    print(" MISSING", e["key"], e["error"])
