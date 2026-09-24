const FIRM = "https://www.yourfreshstartsolutions.com";

export function localizeHtml(html: string): string {
  let out = html;
  out = out.replace(/<\?(?:php|=)?[\s\S]*?\?>/g, "");
  out = out.replace(new RegExp(FIRM.replace(/[.]/g, "\\."), "gi"), "");
  out = out.replace(/https?:\/\/www\.yourfreshstartsolutions\.com/gi, "");
  out = out.replace(/<script\b[^>]*src=["'][^"']*(?:acctsite\.com|calcxml\.com|cpasitesolutions\.com)[^"']*["'][^>]*>\s*<\/script>/gi, "");
  out = out.replace(/action=["']https?:\/\/www\.cpaemailmarketing\.com[^"']*["']/gi, 'action="#" data-local-newsletter="1"');
  out = out.replace(/href=["']https?:\/\/www\.cpasitesolutions\.com\/content\/newsletter\/[^"']*["']/gi, 'href="#print" data-local-print="1"');
  out = out.replace(
    /Online information is stored on secure servers located in <a href="[^"]*">CPA Website Solutions<\/a> SOC 1 certified datacenters\./,
    "Messages from this website are prepared as an email to the firm. They are not stored on the site.",
  );
  out = out.replace(/href=["']https?:\/\/www\.cpasitesolutions\.com["']/gi, 'href="/clientportal.php"');
  out = out.replace(/<!--(?:(?!-->)[\s\S])*securimage(?:(?!-->)[\s\S])*-->/gi, "");
  out = out.replace(/<img\b[^>]*securimage[^>]*>/gi, "");
  out = out.replace(/<a\b[^>]*securimage[^>]*>[\s\S]*?<\/a>/gi, "");
  out = out.replace(/action=["']https?:\/\/www\.google\.com\/search["']/gi, 'action="/search.php"');
  out = out.replace(/onclick="clickclear\([^"]*\)"/gi, "");
  out = out.replace(/onblur="clickrecall\([^"]*\)"/gi, "");
  out = out.replace(/value=["']E-Mail["']/gi, 'placeholder="Email" value=""');
  out = out.replace(
    /href=["']https?:\/\/www\.acctsite\.com\/articles\/i-9\.pdf["']/gi,
    'href="https://www.uscis.gov/i-9"',
  );
  out = out.replace(
    /<a href=["']https?:\/\/www\.calcxml\.com\/calculators\/credit-score-calculator-new["'][^>]*>What Is My Credit Score\?<\/a>/gi,
    '<a href="/calc-section.php?id=12&category=Credit">Credit card and debt calculators</a>',
  );
  return out;
}
