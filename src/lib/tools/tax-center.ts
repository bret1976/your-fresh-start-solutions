const STD = [
  ["Single", "$16,100"],
  ["Married filing jointly", "$32,200"],
  ["Head of household", "$24,150"],
  ["Married filing separately", "$16,100"],
];

const BRACKETS: [string, string, string, string, string][] = [
  ["10%", "$0 – $12,400", "$0 – $24,800", "$0 – $17,700", "$0 – $12,400"],
  ["12%", "$12,400 – $50,400", "$24,800 – $100,800", "$17,700 – $67,450", "$12,400 – $50,400"],
  ["22%", "$50,400 – $105,700", "$100,800 – $211,400", "$67,450 – $105,700", "$50,400 – $105,700"],
  ["24%", "$105,700 – $201,775", "$211,400 – $403,550", "$105,700 – $201,750", "$105,700 – $201,775"],
  ["32%", "$201,775 – $256,225", "$403,550 – $512,450", "$201,750 – $256,200", "$201,775 – $256,225"],
  ["35%", "$256,225 – $640,600", "$512,450 – $768,700", "$256,200 – $640,600", "$256,225 – $384,350"],
  ["37%", "Over $640,600", "Over $768,700", "Over $640,600", "Over $384,350"],
];

const PUBS: [string, string][] = [
  ["Publication 17, Your Federal Income Tax", "https://www.irs.gov/pub/irs-pdf/p17.pdf"],
  ["Form 1040", "https://www.irs.gov/pub/irs-pdf/f1040.pdf"],
  ["Form 1040-ES, Estimated Tax", "https://www.irs.gov/pub/irs-pdf/f1040es.pdf"],
  ["Form 4868, Extension", "https://www.irs.gov/pub/irs-pdf/f4868.pdf"],
  ["Form W-4", "https://www.irs.gov/pub/irs-pdf/fw4.pdf"],
  ["Schedule A, Itemized Deductions", "https://www.irs.gov/pub/irs-pdf/f1040sa.pdf"],
  ["Schedule B, Interest and Dividends", "https://www.irs.gov/pub/irs-pdf/f1040sb.pdf"],
  ["Schedule C, Business Profit or Loss", "https://www.irs.gov/pub/irs-pdf/f1040sc.pdf"],
  ["Schedule D, Capital Gains", "https://www.irs.gov/pub/irs-pdf/f1040sd.pdf"],
  ["Schedule E, Rental and Pass-through Income", "https://www.irs.gov/pub/irs-pdf/f1040se.pdf"],
  ["Schedule SE, Self-Employment Tax", "https://www.irs.gov/pub/irs-pdf/f1040sse.pdf"],
  ["Form 8949, Sales of Capital Assets", "https://www.irs.gov/pub/irs-pdf/f8949.pdf"],
  ["Publication 501, Dependents and Filing Status", "https://www.irs.gov/pub/irs-pdf/p501.pdf"],
  ["Publication 502, Medical Expenses", "https://www.irs.gov/pub/irs-pdf/p502.pdf"],
  ["Publication 505, Withholding and Estimated Tax", "https://www.irs.gov/pub/irs-pdf/p505.pdf"],
  ["Publication 523, Selling Your Home", "https://www.irs.gov/pub/irs-pdf/p523.pdf"],
  ["Publication 526, Charitable Contributions", "https://www.irs.gov/pub/irs-pdf/p526.pdf"],
  ["Publication 334, Small Business", "https://www.irs.gov/pub/irs-pdf/p334.pdf"],
  ["Publication 15, Employer’s Tax Guide", "https://www.irs.gov/pub/irs-pdf/p15.pdf"],
  ["Publication 544, Sales and Dispositions", "https://www.irs.gov/pub/irs-pdf/p544.pdf"],
  ["Publication 550, Investment Income", "https://www.irs.gov/pub/irs-pdf/p550.pdf"],
  ["Publication 583, Starting a Business and Keeping Records", "https://www.irs.gov/pub/irs-pdf/p583.pdf"],
  ["Publication 590-A, IRA Contributions", "https://www.irs.gov/pub/irs-pdf/p590a.pdf"],
  ["Publication 590-B, IRA Distributions", "https://www.irs.gov/pub/irs-pdf/p590b.pdf"],
  ["Publication 596, Earned Income Credit", "https://www.irs.gov/pub/irs-pdf/p596.pdf"],
  ["Publication 946, Depreciation", "https://www.irs.gov/pub/irs-pdf/p946.pdf"],
  ["Publication 970, Education Benefits", "https://www.irs.gov/pub/irs-pdf/p970.pdf"],
  ["Form 1065, Partnership", "https://www.irs.gov/pub/irs-pdf/f1065.pdf"],
  ["Form 1120, C Corporation", "https://www.irs.gov/pub/irs-pdf/f1120.pdf"],
  ["Form 1120-S, S Corporation", "https://www.irs.gov/pub/irs-pdf/f1120s.pdf"],
];

const STATES: [string, string, string][] = [
  ["Alabama", "https://www.revenue.alabama.gov/", "Income tax"],
  ["Alaska", "https://www.tax.alaska.gov/", "No personal income tax"],
  ["Arizona", "https://azdor.gov/", "Income tax"],
  ["Arkansas", "https://www.dfa.arkansas.gov/", "Income tax"],
  ["California", "https://www.ftb.ca.gov/", "Income tax"],
  ["Colorado", "https://tax.colorado.gov/", "Income tax"],
  ["Connecticut", "https://portal.ct.gov/drs", "Income tax"],
  ["Delaware", "https://revenue.delaware.gov/", "Income tax"],
  ["District of Columbia", "https://otr.cfo.dc.gov/", "Income tax"],
  ["Florida", "https://floridarevenue.com/", "No personal income tax"],
  ["Georgia", "https://dor.georgia.gov/", "Income tax"],
  ["Hawaii", "https://tax.hawaii.gov/", "Income tax"],
  ["Idaho", "https://tax.idaho.gov/", "Income tax"],
  ["Illinois", "https://tax.illinois.gov/", "Income tax"],
  ["Indiana", "https://www.in.gov/dor/", "Income tax"],
  ["Iowa", "https://revenue.iowa.gov/", "Income tax"],
  ["Kansas", "https://www.ksrevenue.gov/", "Income tax"],
  ["Kentucky", "https://revenue.ky.gov/", "Income tax"],
  ["Louisiana", "https://revenue.louisiana.gov/", "Income tax"],
  ["Maine", "https://www.maine.gov/revenue/", "Income tax"],
  ["Maryland", "https://www.marylandtaxes.gov/", "Income tax"],
  ["Massachusetts", "https://www.mass.gov/orgs/massachusetts-department-of-revenue", "Income tax"],
  ["Michigan", "https://www.michigan.gov/taxes", "Income tax"],
  ["Minnesota", "https://www.revenue.state.mn.us/", "Income tax"],
  ["Mississippi", "https://www.dor.ms.gov/", "Income tax"],
  ["Missouri", "https://dor.mo.gov/", "Income tax"],
  ["Montana", "https://mtrevenue.gov/", "Income tax"],
  ["Nebraska", "https://revenue.nebraska.gov/", "Income tax"],
  ["Nevada", "https://tax.nv.gov/", "No personal income tax"],
  ["New Hampshire", "https://www.revenue.nh.gov/", "No tax on wages"],
  ["New Jersey", "https://www.nj.gov/treasury/taxation/", "Income tax"],
  ["New Mexico", "https://www.tax.newmexico.gov/", "Income tax"],
  ["New York", "https://www.tax.ny.gov/", "Income tax"],
  ["North Carolina", "https://www.ncdor.gov/", "Income tax"],
  ["North Dakota", "https://www.tax.nd.gov/", "Income tax"],
  ["Ohio", "https://tax.ohio.gov/", "Income tax"],
  ["Oklahoma", "https://oklahoma.gov/tax.html", "Income tax"],
  ["Oregon", "https://www.oregon.gov/dor/", "Income tax"],
  ["Pennsylvania", "https://www.revenue.pa.gov/", "Income tax"],
  ["Rhode Island", "https://tax.ri.gov/", "Income tax"],
  ["South Carolina", "https://dor.sc.gov/", "Income tax"],
  ["South Dakota", "https://dor.sd.gov/", "No personal income tax"],
  ["Tennessee", "https://www.tn.gov/revenue.html", "No tax on wages"],
  ["Texas", "https://comptroller.texas.gov/", "No personal income tax"],
  ["Utah", "https://tax.utah.gov/", "Income tax"],
  ["Vermont", "https://tax.vermont.gov/", "Income tax"],
  ["Virginia", "https://www.tax.virginia.gov/", "Income tax"],
  ["Washington", "https://dor.wa.gov/", "No personal income tax"],
  ["West Virginia", "https://tax.wv.gov/", "Income tax"],
  ["Wisconsin", "https://www.revenue.wi.gov/", "Income tax"],
  ["Wyoming", "https://revenue.wyo.gov/", "No personal income tax"],
];

function table(headers: string[], rows: string[][]): string {
  const head = headers.map((cell) => `<th>${cell}</th>`).join("");
  const body = rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");
  return `<table class="tool-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function nextBusinessDay(year: number, month: number, day: number): Date {
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  if (weekday === 6) date.setUTCDate(date.getUTCDate() + 2);
  if (weekday === 0) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

const RULES: { month: number; day: number; text: string }[] = [
  { month: 1, day: 15, text: "Fourth-quarter estimated tax for individuals is generally due." },
  { month: 1, day: 31, text: "Furnish Forms W-2 and many Forms 1099. File fourth-quarter Form 941 and annual Form 940." },
  { month: 3, day: 15, text: "Calendar-year partnership (Form 1065) and S corporation (Form 1120-S) returns are generally due." },
  { month: 4, day: 15, text: "Individual Form 1040, C corporation Form 1120, first-quarter estimates, and prior-year IRA contributions are generally due." },
  { month: 4, day: 30, text: "First-quarter Form 941 is generally due." },
  { month: 6, day: 15, text: "Second-quarter estimated tax for individuals is generally due." },
  { month: 7, day: 31, text: "Second-quarter Form 941 is generally due." },
  { month: 9, day: 15, text: "Extended partnership and S corporation returns, and third-quarter individual estimates, are generally due." },
  { month: 10, day: 15, text: "Extended individual and C corporation returns are generally due." },
  { month: 10, day: 31, text: "Third-quarter Form 941 is generally due." },
];

function dueDatesHtml(): string {
  const start = new Date();
  const from = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const end = new Date(from);
  end.setUTCMonth(end.getUTCMonth() + 12);
  const groups = new Map<string, { label: string; items: string[] }>();
  for (let year = from.getUTCFullYear() - 1; year <= end.getUTCFullYear() + 1; year += 1) {
    for (const rule of RULES) {
      const date = nextBusinessDay(year, rule.month, rule.day);
      if (date < from || date > end) continue;
      const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
      const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
      const when = date.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
      const bucket = groups.get(key) ?? { label, items: [] };
      bucket.items.push(`<li><strong>${when}.</strong> ${rule.text}</li>`);
      groups.set(key, bucket);
    }
  }
  const blocks = [...groups.values()]
    .map((group) => `<h3>${group.label}</h3><ul>${group.items.join("")}</ul>`)
    .join("");
  return `<div class="tool-panel"><p>The next 12 months of common federal dates. A Saturday or Sunday moves to the next Monday. A federal holiday can move a date again. Confirm a filing date on IRS.gov before you rely on it. New Jersey dates can differ.</p>${blocks}<p><a href="https://www.irs.gov/businesses/small-businesses-self-employed/employment-tax-due-dates" target="_blank" rel="noopener noreferrer">IRS employment tax due dates</a> · <a href="https://www.nj.gov/treasury/taxation/" target="_blank" rel="noopener noreferrer">New Jersey Division of Taxation</a></p></div>`;
}

function ratesHtml(): string {
  return `<div class="tool-panel">
    <p>Tax year 2026 figures from IRS Rev. Proc. 2025-32, including the One, Big, Beautiful Bill adjustments. These are ordinary income brackets and the standard deduction. They are not a tax return.</p>
    <h3>Standard deduction</h3>
    ${table(["Filing status", "2026"], STD)}
    <h3>Ordinary income brackets</h3>
    ${table(["Rate", "Single", "Married filing jointly", "Head of household", "Married filing separately"], BRACKETS)}
    <h3>Other 2026 amounts used on this site</h3>
    ${table(
      ["Item", "Amount"],
      [
        ["Basic estate-tax exclusion", "$15,000,000"],
        ["401(k), 403(b), and 457 elective deferral", "$24,500"],
        ["Catch-up, age 50+", "$8,000"],
        ["Catch-up, ages 60–63", "$11,250"],
        ["IRA contribution", "$7,500, plus $1,100 at age 50+"],
        ["Defined contribution limit", "$72,000"],
        ["SIMPLE elective deferral", "$17,000"],
        ["Social Security wage base", "$184,500"],
        ["HSA contribution", "$4,400 self-only / $8,750 family, plus $1,000 at 55+"],
      ],
    )}
    <p>Head of household and married filing separately thresholds follow the same revenue procedure. Credits, the senior deduction, and the alternative minimum tax are not in the bracket table.</p>
  </div>`;
}

function pubsHtml(): string {
  const items = PUBS.map(
    ([label, href]) =>
      `<li><a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a></li>`,
  ).join("");
  return `<div class="tool-panel"><p>Official IRS forms and publications. The IRS replaces the PDF when a new revision is posted.</p><ul class="tool-links">${items}</ul></div>`;
}

function retentionHtml(): string {
  return `<div class="tool-panel">
    <p>General periods drawn from IRS recordkeeping guidance, including Publication 583. This is not a legal opinion for a particular document.</p>
    ${table(
      ["Record", "How long, in general"],
      [
        ["Filed tax returns and the records that support them", "At least 3 years after you file. Six years if income was understated by more than 25%. Seven years for a worthless-security or bad-debt claim."],
        ["Employment tax records", "At least 4 years after the tax becomes due or is paid, whichever is later."],
        ["Property, investments, and improvements", "Until the limitations period expires for the year you sell or dispose of the property."],
        ["Copies of the returns themselves", "Keeping a copy indefinitely is the practical choice. The IRS does not keep a complete archive for you."],
      ],
    )}
    <p><a href="https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records" target="_blank" rel="noopener noreferrer">IRS: How long should I keep records?</a></p>
  </div>`;
}

function statesHtml(): string {
  const rows = STATES.map(([name, href, note]) => [
    name,
    `<a href="${href}" target="_blank" rel="noopener noreferrer">Official tax agency</a>`,
    note,
  ]);
  return `<div class="tool-panel"><p>Each link goes to that state’s own tax agency. Forms change every year, so use the current file on that site. New Jersey is listed for clients who live or work here; the firm also prepares returns for other states.</p>${table(["State", "Forms and filing", "Note"], rows)}</div>`;
}

export function taxWidgetHtml(pathname: string): string | null {
  if (pathname === "/taxrates2.php") return ratesHtml();
  if (pathname === "/taxduedates.php") return dueDatesHtml();
  if (pathname === "/taxpublications.php") return pubsHtml();
  if (pathname === "/taxretention.php") return retentionHtml();
  if (pathname === "/statetaxforms.php") return statesHtml();
  return null;
}

export function taxWidgetSelector(pathname: string): string | null {
  if (pathname === "/taxrates2.php") return "#TaxRates";
  if (pathname === "/taxduedates.php") return "#DueDates";
  if (pathname === "/taxpublications.php") return "#Publications";
  if (pathname === "/taxretention.php") return "#RecordRetention";
  if (pathname === "/statetaxforms.php") return "#ImageMap";
  return null;
}
