export const DISCLAIMER =
  "Illustrative estimate from the numbers you enter. It is not tax, legal, accounting, or investment advice, and it is not an IRS or Social Security determination. Your Fresh Start Solutions can review the real return before you file or invest.";

export type Field = {
  key: string;
  label: string;
  kind: "money" | "pct" | "num" | "select";
  def: number;
  hint?: string;
  min?: number;
  options?: { value: number; label: string }[];
};

export type Row = { label: string; value: string; strong?: boolean };
export type Result = { rows: Row[]; note?: string; series?: { label: string; value: number }[] };
export type Values = Record<string, number>;
export type Spec = { fields: Field[]; run: (v: Values) => Result };

export const STATUS: { value: number; label: string }[] = [
  { value: 1, label: "Single" },
  { value: 2, label: "Married filing jointly" },
  { value: 3, label: "Head of household" },
  { value: 4, label: "Married filing separately" },
];

export const moneyF = (key: string, label: string, def: number, hint?: string): Field => ({
  key,
  label,
  kind: "money",
  def,
  hint,
  min: 0,
});
export const signedF = (key: string, label: string, def: number, hint?: string): Field => ({
  key,
  label,
  kind: "money",
  def,
  hint,
});
export const pctF = (key: string, label: string, def: number, hint?: string): Field => ({
  key,
  label,
  kind: "pct",
  def,
  hint,
});
export const numF = (key: string, label: string, def: number, hint?: string, min?: number): Field => ({
  key,
  label,
  kind: "num",
  def,
  hint,
  min,
});
export const pickF = (key: string, label: string, def: number, options: { value: number; label: string }[], hint?: string): Field => ({
  key,
  label,
  kind: "select",
  def,
  options,
  hint,
});
export const yn = (key: string, label: string, def = 0): Field =>
  pickF(key, label, def, [
    { value: 0, label: "No" },
    { value: 1, label: "Yes" },
  ]);

export const statusF = (key = "status", def = 1): Field => pickF(key, "Filing status", def, STATUS);

export function n(v: Values, key: string): number {
  const x = Number(v[key]);
  return Number.isFinite(x) ? x : 0;
}

export function usd(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function pctStr(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function monthPhrase(months: number): string {
  if (!Number.isFinite(months)) return "Does not pay off with this payment";
  const m = Math.max(0, Math.round(months));
  const y = Math.floor(m / 12);
  const r = m % 12;
  if (y <= 0) return `${r} month${r === 1 ? "" : "s"}`;
  if (r === 0) return `${y} year${y === 1 ? "" : "s"}`;
  return `${y} year${y === 1 ? "" : "s"}, ${r} month${r === 1 ? "" : "s"}`;
}

export function plain(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

const monthlyRate = (annualPct: number) => annualPct / 100 / 12;

export function paymentFor(principal: number, annualPct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = monthlyRate(annualPct);
  if (Math.abs(r) < 1e-12) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export function pvOfPayments(annualPct: number, months: number, payment: number): number {
  if (months <= 0 || payment === 0) return 0;
  const r = monthlyRate(annualPct);
  if (Math.abs(r) < 1e-12) return payment * months;
  return (payment * (1 - Math.pow(1 + r, -months))) / r;
}

export function futureValue(present: number, annualPct: number, months: number, monthly = 0): number {
  const r = monthlyRate(annualPct);
  if (months <= 0) return present;
  if (Math.abs(r) < 1e-12) return present + monthly * months;
  const g = Math.pow(1 + r, months);
  return present * g + (monthly * (g - 1)) / r;
}

export function monthsToGoal(present: number, annualPct: number, monthly: number, goal: number): number {
  if (goal <= present) return 0;
  const r = monthlyRate(annualPct);
  if (Math.abs(r) < 1e-12) return monthly > 0 ? Math.ceil((goal - present) / monthly) : Infinity;
  const num = goal + monthly / r;
  const den = present + monthly / r;
  if (den <= 0 || num / den <= 0) return Infinity;
  const months = Math.log(num / den) / Math.log(1 + r);
  if (!Number.isFinite(months) || months < 0) return Infinity;
  return Math.ceil(months);
}

export function payoff(balance: number, annualPct: number, payment: number): { months: number; interest: number } {
  if (balance <= 0) return { months: 0, interest: 0 };
  const r = monthlyRate(annualPct);
  if (payment <= balance * r + 0.004) return { months: Infinity, interest: Infinity };
  let b = balance;
  let interest = 0;
  for (let m = 1; m <= 1200; m += 1) {
    const i = b * r;
    interest += i;
    b = b + i - payment;
    if (b <= 0.01) return { months: m, interest };
  }
  return { months: Infinity, interest };
}

export function amortize(
  balance: number,
  annualPct: number,
  payment: number,
  extra = 0,
): { months: number; interest: number } {
  return payoff(balance, annualPct, payment + extra);
}

/** Tax year 2026 ordinary brackets. Tops are the end of each rate. Source: IRS Rev. Proc. 2025-32, including the One, Big, Beautiful Bill adjustments. */
const BRACKETS: Record<number, [number, number][]> = {
  1: [
    [0.1, 12400],
    [0.12, 50400],
    [0.22, 105700],
    [0.24, 201775],
    [0.32, 256225],
    [0.35, 640600],
    [0.37, Number.POSITIVE_INFINITY],
  ],
  2: [
    [0.1, 24800],
    [0.12, 100800],
    [0.22, 211400],
    [0.24, 403550],
    [0.32, 512450],
    [0.35, 768700],
    [0.37, Number.POSITIVE_INFINITY],
  ],
  3: [
    [0.1, 17700],
    [0.12, 67450],
    [0.22, 105700],
    [0.24, 201750],
    [0.32, 256200],
    [0.35, 640600],
    [0.37, Number.POSITIVE_INFINITY],
  ],
  4: [
    [0.1, 12400],
    [0.12, 50400],
    [0.22, 105700],
    [0.24, 201775],
    [0.32, 256225],
    [0.35, 384350],
    [0.37, Number.POSITIVE_INFINITY],
  ],
};

export const STD: Record<number, number> = { 1: 16100, 2: 32200, 3: 24150, 4: 16100 };
export const SS_WAGE_BASE = 184500;
export const ESTATE_EXCLUSION = 15_000_000;
export const ELECTIVE_DEFERRAL = 24500;
export const CATCHUP_50 = 8000;
export const CATCHUP_60 = 11250;
export const IRA_LIMIT = 7500;
export const IRA_CATCHUP = 1100;
export const DC_LIMIT = 72000;
export const COMP_CAP = 360000;
export const SIMPLE_LIMIT = 17000;
export const HSA_SELF = 4400;
export const HSA_FAMILY = 8750;
export const HSA_CATCHUP = 1000;
export const SECTION_179_BASE = 2_500_000;
export const SECTION_179_PHASEOUT = 4_000_000;

export function incomeTax(taxable: number, status: number): { tax: number; marginal: number } {
  const rows = BRACKETS[status] || BRACKETS[1];
  const income = Math.max(0, taxable);
  let tax = 0;
  let prev = 0;
  let marginal = rows[0][0];
  for (const [rate, top] of rows) {
    if (income <= prev) break;
    const slice = Math.min(income, top) - prev;
    tax += slice * rate;
    marginal = rate;
    prev = top;
  }
  return { tax, marginal };
}

export function selfEmploymentTax(netProfit: number, status: number, wages = 0) {
  const base = Math.max(0, netProfit) * 0.9235;
  const socialSecurity = Math.min(base, Math.max(0, SS_WAGE_BASE - Math.max(0, wages))) * 0.124;
  const medicare = base * 0.029;
  const threshold = status === 2 ? 250000 : status === 4 ? 125000 : 200000;
  const additional = Math.max(0, wages + base - threshold) * 0.009;
  const payroll = socialSecurity + medicare;
  return { total: payroll + additional, deductible: payroll / 2, socialSecurity, medicare: medicare + additional };
}

/** IRS Uniform Lifetime Table (Publication 590-B). Ages under 72 return null. */
const RMD: Record<number, number> = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2,
  81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9,
  90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8,
  100: 6.4, 101: 6.0, 102: 5.6, 103: 5.2, 104: 4.9, 105: 4.6, 106: 4.3, 107: 4.1, 108: 3.9,
  109: 3.7, 110: 3.5, 111: 3.4, 112: 3.3, 113: 3.1, 114: 3.0, 115: 2.9, 116: 2.8, 117: 2.7,
  118: 2.5, 119: 2.3, 120: 2.0,
};

export function rmdFactor(age: number): number | null {
  const a = Math.floor(age);
  if (a < 72) return null;
  if (a >= 120) return 2;
  return RMD[a] ?? null;
}

export function taxableSocialSecurity(benefits: number, otherIncome: number, taxExempt: number, status: number): number {
  const ss = Math.max(0, benefits);
  const combined = Math.max(0, otherIncome) + Math.max(0, taxExempt) + ss * 0.5;
  const base1 = status === 2 ? 32000 : status === 4 ? 0 : 25000;
  const base2 = status === 2 ? 44000 : status === 4 ? 0 : 34000;
  if (combined <= base1) return 0;
  if (combined <= base2) return Math.min(ss * 0.5, (combined - base1) * 0.5);
  return Math.min(ss * 0.85, (base2 - base1) * 0.5 + (combined - base2) * 0.85);
}

/** Benefit as a fraction of the full-retirement-age amount. Assumes full retirement age of 67. */
export function ssClaimFactor(claimAge: number): number {
  const age = Math.min(70, Math.max(62, claimAge));
  if (age >= 67) return 1 + Math.min(3, age - 67) * 0.08;
  const early = Math.round((67 - age) * 12);
  const first = Math.min(36, early);
  const rest = Math.max(0, early - 36);
  const reduction = (first * 5) / 900 + (rest * 5) / 1200;
  return 1 - reduction;
}

export function phaseout(magi: number, start: number, end: number, full: number): number {
  if (end <= start) return magi <= start ? full : 0;
  if (magi <= start) return full;
  if (magi >= end) return 0;
  return (full * (end - magi)) / (end - start);
}

export function bondPrice(face: number, couponPct: number, yieldPct: number, years: number, freq: number): number {
  const n = Math.max(1, Math.round(years * freq));
  const c = (face * (couponPct / 100)) / freq;
  const y = yieldPct / 100 / freq;
  let price = 0;
  for (let i = 1; i <= n; i += 1) price += c / Math.pow(1 + y, i);
  price += face / Math.pow(1 + y, n);
  return price;
}

export function solveApr(proceeds: number, payment: number, months: number): number {
  if (proceeds <= 0 || payment <= 0 || months <= 0) return 0;
  if (payment * months <= proceeds) return 0;
  let lo = 0;
  let hi = 0.5;
  for (let i = 0; i < 70; i += 1) {
    const mid = (lo + hi) / 2;
    const pv = mid === 0 ? payment * months : (payment * (1 - Math.pow(1 + mid, -months))) / mid;
    if (pv > proceeds) lo = mid;
    else hi = mid;
  }
  return ((lo + hi) / 2) * 12 * 100;
}

export function yearlySeries(present: number, annualPct: number, years: number, monthly: number): { label: string; value: number }[] {
  const y = Math.max(0, Math.min(40, Math.round(years)));
  const out: { label: string; value: number }[] = [];
  let bal = present;
  for (let i = 1; i <= y; i += 1) {
    bal = futureValue(bal, annualPct, 12, monthly);
    out.push({ label: `Year ${i}`, value: bal });
  }
  return out;
}

export function ficaEmployee(wages: number, ytd = 0): number {
  const ss = Math.min(Math.max(0, wages), Math.max(0, SS_WAGE_BASE - ytd)) * 0.062;
  const med = Math.max(0, wages) * 0.0145;
  const additional = Math.max(0, ytd + Math.max(0, wages) - 200000) * 0.009;
  return ss + med + additional;
}
