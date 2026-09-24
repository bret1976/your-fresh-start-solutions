import {
  CATCHUP_50,
  CATCHUP_60,
  COMP_CAP,
  DC_LIMIT,
  ELECTIVE_DEFERRAL,
  ESTATE_EXCLUSION,
  HSA_CATCHUP,
  HSA_FAMILY,
  HSA_SELF,
  IRA_CATCHUP,
  IRA_LIMIT,
  SECTION_179_BASE,
  SECTION_179_PHASEOUT,
  SIMPLE_LIMIT,
  STD,
  SS_WAGE_BASE,
  amortize,
  bondPrice,
  ficaEmployee,
  futureValue,
  incomeTax,
  moneyF,
  monthsToGoal,
  n,
  numF,
  paymentFor,
  pctF,
  pctStr,
  phaseout,
  pickF,
  plain,
  rmdFactor,
  selfEmploymentTax,
  signedF,
  ssClaimFactor,
  statusF,
  taxableSocialSecurity,
  usd,
  yearlySeries,
  yn,
  type Spec,
} from "./money";

export const specsC: Record<string, Spec> = {};
const put = (name: string | string[], spec: Spec) => {
  for (const key of Array.isArray(name) ? name : [name]) specsC[key] = spec;
};

put("lifeNeed", {
  fields: [
    moneyF("income", "Annual income to replace", 80000),
    pctF("replace", "Share of income to replace", 70),
    numF("years", "Years the income should last", 20, undefined, 1),
    pctF("discount", "Discount rate", 4),
    moneyF("debts", "Debts and final expenses to cover", 25000),
    moneyF("assets", "Savings and existing life insurance", 50000),
  ],
  run(v) {
    const annual = n(v, "income") * (n(v, "replace") / 100);
    const pv = paymentFor(1, 0, 1) && (() => {
      const r = n(v, "discount") / 100;
      const y = n(v, "years");
      if (r === 0) return annual * y;
      return (annual * (1 - Math.pow(1 + r, -y))) / r;
    })();
    const need = Math.max(0, pv + n(v, "debts") - n(v, "assets"));
    return {
      rows: [
        { label: "Present value of the income replacement", value: usd(pv) },
        { label: "Coverage gap", value: usd(need), strong: true },
      ],
      note: "This is a capital-needs sketch. It is not a life-insurance quote, and it ignores Social Security survivor benefits.",
    };
  },
});

put("lifeExpectancy", {
  fields: [
    numF("age", "Your age", 45, undefined, 0),
    numF("plan", "Age you want the plan to reach", 90, undefined, 1),
  ],
  run(v) {
    const years = Math.max(0, n(v, "plan") - n(v, "age"));
    return {
      rows: [
        { label: "Years the plan should cover", value: plain(years, 0), strong: true },
        { label: "Official longevity illustration", value: "ssa.gov/oact/population/longevity.html" },
      ],
      note: "This is not a life expectancy and it is not medical advice. Social Security’s calculator is the right place for an official illustration. Use the year count here as the horizon for the other planning tools.",
    };
  },
});

put("burial", {
  fields: [
    moneyF("funeral", "Funeral and burial", 12000),
    moneyF("medical", "Uninsured final medical costs", 3000),
    moneyF("debts", "Debts to clear", 5000),
    moneyF("have", "Savings and insurance already set aside", 8000),
  ],
  run(v) {
    const need = n(v, "funeral") + n(v, "medical") + n(v, "debts");
    return { rows: [{ label: "Gap", value: usd(Math.max(0, need - n(v, "have"))), strong: true }, { label: "Total final costs entered", value: usd(need) }] };
  },
});

put("disabilityNeed", {
  fields: [
    moneyF("need", "Monthly income the household needs", 5000),
    moneyF("other", "Other monthly income that would continue", 1500),
    moneyF("have", "Disability benefit you already own", 0),
  ],
  run(v) {
    const gap = Math.max(0, n(v, "need") - n(v, "other") - n(v, "have"));
    return {
      rows: [
        { label: "Monthly gap", value: usd(gap), strong: true },
        { label: "Annual gap", value: usd(gap * 12) },
      ],
      note: "Group and individual policies often replace only part of earnings, and they define disability differently. This is the income gap, not a policy quote.",
    };
  },
});

put("disabilityChance", {
  fields: [
    moneyF("income", "Annual earned income", 80000),
    numF("years", "Years until you would stop working", 25, undefined, 1),
    pctF("chance", "Chance you want to illustrate", 25, "Disability education often cites about 1 in 4 of today’s 20-year-olds. Change it. It is not your personal odds."),
  ],
  run(v) {
    const lost = n(v, "income") * n(v, "years");
    return {
      rows: [
        { label: "Earnings over that career if work stops for the whole period", value: usd(lost) },
        { label: "That figure times the chance you entered", value: usd(lost * (n(v, "chance") / 100)), strong: true },
      ],
      note: "Not a medical prediction and not the odds that you will become disabled. The Social Security Administration publishes disability facts separately from this illustration.",
    };
  },
});

put("ltc", {
  fields: [
    moneyF("daily", "Daily cost of care today", 300),
    pctF("infl", "Inflation of that cost", 4),
    numF("until", "Years until care might start", 20, undefined, 0),
    numF("stay", "Years of care to fund", 3, undefined, 1),
    moneyF("saved", "Savings already earmarked", 0),
  ],
  run(v) {
    const daily = n(v, "daily") * Math.pow(1 + n(v, "infl") / 100, n(v, "until"));
    const total = daily * 365 * n(v, "stay");
    return {
      rows: [
        { label: "Daily cost when care starts", value: usd(daily) },
        { label: "Cost over the stay", value: usd(total), strong: true },
        { label: "Gap after earmarked savings", value: usd(Math.max(0, total - n(v, "saved"))) },
      ],
      note: "Care costs vary by state and by home care versus a facility. This does not price a long-term-care policy.",
    };
  },
});

put("lifetimeEarn", {
  fields: [
    moneyF("income", "Current annual earnings", 75000),
    pctF("raise", "Average annual raise", 3),
    numF("years", "Years of work ahead", 30, undefined, 1),
  ],
  run(v) {
    const r = n(v, "raise") / 100;
    const y = n(v, "years");
    const total = r === 0 ? n(v, "income") * y : (n(v, "income") * (Math.pow(1 + r, y) - 1)) / r;
    return { rows: [{ label: "Earnings over that stretch", value: usd(total), strong: true }] };
  },
});

put("annuityTax", {
  fields: [
    moneyF("basis", "After-tax money already in the contract", 50000),
    moneyF("expected", "Total you expect the contract to pay out", 80000),
    moneyF("payment", "Annual payment", 6000),
  ],
  run(v) {
    const ratio = n(v, "expected") > 0 ? Math.min(1, n(v, "basis") / n(v, "expected")) : 0;
    const free = n(v, "payment") * ratio;
    return {
      rows: [
        { label: "Exclusion ratio", value: pctStr(ratio * 100), strong: true },
        { label: "Tax-free part of each annual payment", value: usd(free) },
        { label: "Taxable part, before it is all recovered", value: usd(n(v, "payment") - free) },
      ],
      note: "Once the basis is recovered, later payments are generally fully taxable. This is the exclusion-ratio idea, not a Form 1099-R.",
    };
  },
});

put("annuityFv", {
  fields: [
    moneyF("payment", "Payment each month", 300),
    pctF("rate", "Expected annual return", 5),
    numF("years", "Years", 20, undefined, 1),
  ],
  run(v) {
    const fv = futureValue(0, n(v, "rate"), Math.round(n(v, "years") * 12), n(v, "payment"));
    return { rows: [{ label: "Future value", value: usd(fv), strong: true }], series: yearlySeries(0, n(v, "rate"), n(v, "years"), n(v, "payment")) };
  },
});

put("hsa", {
  fields: [
    pickF("family", "Coverage", 0, [
      { value: 0, label: "Self-only" },
      { value: 1, label: "Family" },
    ]),
    yn("catchup", "Age 55 or older this year"),
    moneyF("contrib", "HSA contribution you would make", 4400),
    moneyF("premLow", "High-deductible plan: annual premium", 4800),
    moneyF("oopLow", "High-deductible plan: expected out-of-pocket care", 1500),
    moneyF("premHigh", "Lower-deductible plan: annual premium", 7800),
    moneyF("oopHigh", "Lower-deductible plan: expected out-of-pocket care", 500),
    pctF("tax", "Tax rate saved on the HSA contribution", 24),
  ],
  run(v) {
    const cap = (n(v, "family") ? HSA_FAMILY : HSA_SELF) + (n(v, "catchup") ? HSA_CATCHUP : 0);
    const used = Math.min(n(v, "contrib"), cap);
    const taxSave = used * (n(v, "tax") / 100);
    const hdhp = n(v, "premLow") + n(v, "oopLow") - taxSave;
    const rich = n(v, "premHigh") + n(v, "oopHigh");
    return {
      rows: [
        { label: "2026 HSA contribution cap for this coverage", value: usd(cap) },
        { label: "Contribution used in the comparison", value: usd(used) },
        { label: "Tax saved on that contribution", value: usd(taxSave) },
        { label: "High-deductible net cost this year", value: usd(hdhp), strong: true },
        { label: "Lower-deductible net cost this year", value: usd(rich) },
        { label: "Lower cost at these figures", value: hdhp <= rich ? "High-deductible plan plus the HSA tax savings" : "Lower-deductible plan" },
      ],
      note: "2026 HSA limits are $4,400 self-only and $8,750 family, plus $1,000 at age 55. A high-deductible plan only wins if the premium savings and the tax break cover the extra care you actually pay.",
    };
  },
});

put("allocation", {
  fields: [
    pctF("p1", "Cash percent", 10),
    pctF("r1", "Cash expected return", 3),
    pctF("p2", "Bonds percent", 30),
    pctF("r2", "Bond expected return", 4),
    pctF("p3", "Stocks percent", 60),
    pctF("r3", "Stock expected return", 8),
  ],
  run(v) {
    const sum = n(v, "p1") + n(v, "p2") + n(v, "p3");
    const weighted = sum === 0 ? 0 : (n(v, "p1") * n(v, "r1") + n(v, "p2") * n(v, "r2") + n(v, "p3") * n(v, "r3")) / sum;
    return {
      rows: [
        { label: "Percents add up to", value: pctStr(sum, 1) },
        { label: "Weighted expected return", value: pctStr(weighted), strong: true },
      ],
      note: sum === 100 ? "Expected returns are assumptions you typed, not forecasts." : "The weights were scaled so they add to 100% before the return was averaged.",
    };
  },
});

put("taxableVsFree", {
  fields: [
    pctF("taxable", "Taxable yield", 5),
    pctF("free", "Tax-free yield", 3.5),
    pctF("tax", "Ordinary tax rate", 24),
  ],
  run(v) {
    const after = n(v, "taxable") * (1 - n(v, "tax") / 100);
    return {
      rows: [
        { label: "Taxable yield after tax", value: pctStr(after), strong: true },
        { label: "Tax-free yield", value: pctStr(n(v, "free")) },
        { label: "Higher after tax", value: after >= n(v, "free") ? "The taxable investment" : "The tax-free investment" },
      ],
    };
  },
});

put("bond", {
  fields: [
    moneyF("face", "Face value", 1000),
    pctF("coupon", "Coupon rate", 4),
    pctF("yield", "Market yield for this maturity", 5),
    numF("years", "Years to maturity", 10, undefined, 1),
    numF("freq", "Payments per year", 2, undefined, 1),
  ],
  run(v) {
    const price = bondPrice(n(v, "face"), n(v, "coupon"), n(v, "yield"), n(v, "years"), Math.max(1, n(v, "freq")));
    const coupon = n(v, "face") * (n(v, "coupon") / 100);
    return {
      rows: [
        { label: "Present value", value: usd(price), strong: true },
        { label: "Annual coupon", value: usd(coupon) },
        { label: "Current yield at that price", value: price > 0 ? pctStr((coupon / price) * 100) : "—" },
      ],
      note: "Value falls when the market yield is above the coupon. This ignores accrued interest and call features.",
    };
  },
});

put("realEstate", {
  fields: [
    moneyF("value", "Property value", 450000),
    moneyF("rent", "Annual rent", 36000),
    pctF("vacancy", "Vacancy and credit loss", 5),
    moneyF("expenses", "Operating expenses, not the mortgage", 12000),
    moneyF("mortgage", "Annual mortgage payment", 18000),
    moneyF("cash", "Cash you have in the deal", 100000),
  ],
  run(v) {
    const noi = n(v, "rent") * (1 - n(v, "vacancy") / 100) - n(v, "expenses");
    const cash = noi - n(v, "mortgage");
    return {
      rows: [
        { label: "Net operating income", value: usd(noi) },
        { label: "Cap rate", value: n(v, "value") > 0 ? pctStr((noi / n(v, "value")) * 100) : "—", strong: true },
        { label: "Cash flow after the mortgage", value: usd(cash) },
        { label: "Cash-on-cash", value: n(v, "cash") > 0 ? pctStr((cash / n(v, "cash")) * 100) : "—" },
      ],
    };
  },
});

put(["compound", "growTo"], {
  fields: [
    moneyF("now", "Starting balance", 10000),
    moneyF("add", "Added each month", 200),
    pctF("rate", "Annual return", 7),
    numF("years", "Years", 20, undefined, 1),
  ],
  run(v) {
    const fv = futureValue(n(v, "now"), n(v, "rate"), Math.round(n(v, "years") * 12), n(v, "add"));
    const contributed = n(v, "now") + n(v, "add") * 12 * n(v, "years");
    return {
      rows: [
        { label: "Future value", value: usd(fv), strong: true },
        { label: "Of which growth is about", value: usd(fv - contributed) },
      ],
      series: yearlySeries(n(v, "now"), n(v, "rate"), n(v, "years"), n(v, "add")),
    };
  },
});

put("option", {
  fields: [
    pickF("side", "Contract", 1, [
      { value: 1, label: "Call" },
      { value: 0, label: "Put" },
    ]),
    moneyF("premium", "Premium paid per share", 3),
    moneyF("strike", "Strike price", 50),
    moneyF("target", "Share price you want to test", 60),
    numF("contracts", "Number of contracts", 1, "Each contract is 100 shares.", 1),
  ],
  run(v) {
    const intrinsic = n(v, "side") ? Math.max(0, n(v, "target") - n(v, "strike")) : Math.max(0, n(v, "strike") - n(v, "target"));
    const shares = n(v, "contracts") * 100;
    const profit = (intrinsic - n(v, "premium")) * shares;
    return {
      rows: [
        { label: "Value per share at that price", value: usd(intrinsic) },
        { label: "Profit or loss if you sell at that price", value: usd(profit), strong: true },
      ],
      note: "A simple expiration payoff. It ignores time value before expiration, commissions, early exercise, and taxes. Not a recommendation to trade options.",
    };
  },
});

put("threeWayGrowth", {
  fields: [
    moneyF("now", "Starting balance", 20000),
    moneyF("annual", "Added each year", 6000),
    pctF("rate", "Pre-tax annual return", 7),
    pctF("ordinary", "Ordinary tax rate", 24),
    pctF("gains", "Tax rate on annual taxable earnings", 15),
    numF("years", "Years", 20, undefined, 1),
  ],
  run(v) {
    const years = Math.round(n(v, "years"));
    let taxable = n(v, "now");
    let deferred = n(v, "now");
    let free = n(v, "now");
    const drag = n(v, "rate") * (1 - n(v, "gains") / 100);
    for (let i = 0; i < years; i += 1) {
      taxable = taxable * (1 + drag / 100) + n(v, "annual");
      deferred = deferred * (1 + n(v, "rate") / 100) + n(v, "annual");
      free = free * (1 + n(v, "rate") / 100) + n(v, "annual");
    }
    const basis = n(v, "now") + n(v, "annual") * years;
    const deferredNet = basis + (deferred - basis) * (1 - n(v, "ordinary") / 100);
    return {
      rows: [
        { label: "Taxable account", value: usd(taxable) },
        { label: "Tax-deferred account after tax on the earnings", value: usd(deferredNet) },
        { label: "Tax-free account", value: usd(free), strong: true },
      ],
      note: "The taxable account is taxed on earnings each year at the gains rate you entered. The deferred account is taxed on earnings at the end. Contributions are treated as after-tax in all three so the comparison is the wrapper, not the deduction.",
    };
  },
});

put("risk", {
  fields: [
    pickF("need", "When you need this money", 2, [
      { value: 1, label: "Within 3 years" },
      { value: 2, label: "In 3 to 10 years" },
      { value: 3, label: "More than 10 years away" },
    ]),
    pickF("drop", "If the account fell 20%", 2, [
      { value: 1, label: "I would sell" },
      { value: 2, label: "I would hold" },
      { value: 3, label: "I would buy more" },
    ]),
    pickF("goal", "What matters more", 2, [
      { value: 1, label: "Not losing money" },
      { value: 2, label: "A balance of the two" },
      { value: 3, label: "Growing it" },
    ]),
    moneyF("portfolio", "Portfolio you want to stress", 100000),
    pctF("shock", "Drop to illustrate", 20),
  ],
  run(v) {
    const score = n(v, "need") + n(v, "drop") + n(v, "goal");
    const label = score <= 4 ? "Conservative" : score <= 7 ? "Moderate" : "Growth-oriented";
    const loss = n(v, "portfolio") * (n(v, "shock") / 100);
    const recover = n(v, "shock") >= 100 ? Infinity : (1 / (1 - n(v, "shock") / 100) - 1) * 100;
    return {
      rows: [
        { label: "Answers point toward", value: label, strong: true },
        { label: "Dollars in a drop of that size", value: usd(loss) },
        { label: "Gain needed to get back to even", value: pctStr(recover) },
      ],
      note: "Three questions are a conversation starter, not a full risk profile and not investment advice.",
    };
  },
});

put(["returnImpact", "fundExpense"], {
  fields: [
    moneyF("now", "Starting balance", 50000),
    moneyF("add", "Added each month", 300),
    pctF("gross", "Return before the drag", 8),
    pctF("drag", "Fee or return you might give up", 1),
    numF("years", "Years", 25, undefined, 1),
  ],
  run(v) {
    const months = Math.round(n(v, "years") * 12);
    const full = futureValue(n(v, "now"), n(v, "gross"), months, n(v, "add"));
    const net = futureValue(n(v, "now"), n(v, "gross") - n(v, "drag"), months, n(v, "add"));
    return {
      rows: [
        { label: "Ending balance at the higher return", value: usd(full) },
        { label: "Ending balance after the drag", value: usd(net), strong: true },
        { label: "Difference", value: usd(full - net) },
      ],
    };
  },
});

put("cd", {
  fields: [
    moneyF("principal", "Amount deposited", 10000),
    pctF("apy", "Annual percentage yield", 4.2),
    numF("months", "Term in months", 12, undefined, 1),
  ],
  run(v) {
    const interest = n(v, "principal") * (Math.pow(1 + n(v, "apy") / 100, n(v, "months") / 12) - 1);
    return { rows: [{ label: "Interest", value: usd(interest), strong: true }, { label: "Value at maturity", value: usd(n(v, "principal") + interest) }] };
  },
});

put("cdLadder", {
  fields: [
    moneyF("a1", "Rung 1 amount", 5000),
    pctF("y1", "Rung 1 APY", 4),
    moneyF("a2", "Rung 2 amount", 5000),
    pctF("y2", "Rung 2 APY", 4.1),
    moneyF("a3", "Rung 3 amount", 5000),
    pctF("y3", "Rung 3 APY", 4.2),
    moneyF("a4", "Rung 4 amount", 5000),
    pctF("y4", "Rung 4 APY", 4.3),
    moneyF("a5", "Rung 5 amount", 5000),
    pctF("y5", "Rung 5 APY", 4.4),
  ],
  run(v) {
    let total = 0;
    let interest = 0;
    for (let i = 1; i <= 5; i += 1) {
      total += n(v, `a${i}`);
      interest += n(v, `a${i}`) * (n(v, `y${i}`) / 100);
    }
    return {
      rows: [
        { label: "Total on the ladder", value: usd(total) },
        { label: "Interest in a year if each rung earns its APY for the year", value: usd(interest), strong: true },
        { label: "Weighted APY", value: total > 0 ? pctStr((interest / total) * 100) : "—" },
      ],
      note: "A ladder staggers maturities so one rung comes due on a schedule you choose. This year of interest assumes each deposit earns its APY for a full year.",
    };
  },
});

put("dividend", {
  fields: [
    moneyF("price", "Share price", 40),
    numF("shares", "Shares", 100, undefined, 0),
    moneyF("div", "Annual dividend per share", 1.2),
    pctF("grow", "Dividend growth per year", 3),
    numF("years", "Years", 10, undefined, 1),
    yn("reinvest", "Reinvest the dividends"),
  ],
  run(v) {
    let shares = n(v, "shares");
    let price = n(v, "price");
    let div = n(v, "div");
    let cash = 0;
    for (let y = 0; y < Math.round(n(v, "years")); y += 1) {
      const paid = shares * div;
      if (n(v, "reinvest") && price > 0) shares += paid / price;
      else cash += paid;
      div *= 1 + n(v, "grow") / 100;
      price *= 1 + n(v, "grow") / 100;
    }
    const value = shares * price + cash;
    const start = n(v, "shares") * n(v, "price");
    return {
      rows: [
        { label: "Starting yield", value: n(v, "price") > 0 ? pctStr((n(v, "div") / n(v, "price")) * 100) : "—" },
        { label: "Ending value of shares plus cash dividends", value: usd(value), strong: true },
        { label: "Gain over the starting price", value: usd(value - start) },
      ],
      note: "The share price is assumed to rise with the dividend. That is a teaching assumption, not a forecast.",
    };
  },
});

put("bonus", {
  fields: [
    moneyF("bonus", "Bonus", 10000),
    statusF(),
    moneyF("ytd", "Wages already paid this year", 60000),
    pctF("state", "State income-tax rate", 5),
    pctF("defer", "Percent deferred to a retirement plan", 0),
  ],
  run(v) {
    const deferred = n(v, "bonus") * (n(v, "defer") / 100);
    const taxable = Math.max(0, n(v, "bonus") - deferred);
    const federal = taxable <= 1_000_000 ? taxable * 0.22 : 1_000_000 * 0.22 + (taxable - 1_000_000) * 0.37;
    const fica = ficaEmployee(taxable, n(v, "ytd"));
    const state = taxable * (n(v, "state") / 100);
    const net = n(v, "bonus") - deferred - federal - fica - state;
    return {
      rows: [
        { label: "Deferred", value: usd(deferred) },
        { label: "Federal withholding at the flat supplemental rate", value: usd(federal) },
        { label: "Social Security and Medicare", value: usd(fica) },
        { label: "State tax at the rate you entered", value: usd(state) },
        { label: "Approximate take-home", value: usd(net), strong: true },
      ],
      note: "Supplemental wages are generally withheld at 22% federally (37% above $1 million). Your actual tax can be higher or lower when you file. The 2026 Social Security wage base used here is $184,500.",
    };
  },
});

put("paycheck", {
  fields: [
    moneyF("gross", "Gross pay this period", 3000),
    moneyF("newGross", "Gross pay after the change", 3200),
    moneyF("pretax", "Pre-tax deductions this period", 200),
    moneyF("newPretax", "Pre-tax deductions after the change", 300),
    pctF("federal", "Federal withholding rate", 12),
    pctF("state", "State withholding rate", 5),
  ],
  run(v) {
    const take = (gross: number, pre: number) => {
      const taxable = Math.max(0, gross - pre);
      const tax = taxable * ((n(v, "federal") + n(v, "state")) / 100) + ficaEmployee(gross, 0);
      return gross - pre - tax;
    };
    const before = take(n(v, "gross"), n(v, "pretax"));
    const after = take(n(v, "newGross"), n(v, "newPretax"));
    return {
      rows: [
        { label: "Take-home now", value: usd(before) },
        { label: "Take-home after the change", value: usd(after), strong: true },
        { label: "Difference per paycheck", value: usd(after - before) },
      ],
      note: "Federal tax is the flat rate you enter, not a full Form W-4. Pre-tax deductions reduce the income tax but not, in this sketch, Social Security.",
    };
  },
});

put("hourly", {
  fields: [
    moneyF("salary", "Annual salary", 75000),
    numF("hours", "Hours per week", 40, undefined, 1),
    numF("weeks", "Weeks per year", 52, undefined, 1),
  ],
  run(v) {
    const hours = n(v, "hours") * n(v, "weeks");
    return { rows: [{ label: "Equivalent hourly rate", value: hours > 0 ? usd(n(v, "salary") / hours) : "—", strong: true }, { label: "Hours per year", value: plain(hours, 0) }] };
  },
});

put("salary", {
  fields: [
    moneyF("wage", "Hourly wage", 28),
    numF("hours", "Hours per week", 40, undefined, 0),
    numF("ot", "Overtime hours per week", 0, undefined, 0),
    numF("weeks", "Weeks per year", 52, undefined, 1),
  ],
  run(v) {
    const annual = (n(v, "hours") * n(v, "wage") + n(v, "ot") * n(v, "wage") * 1.5) * n(v, "weeks");
    return { rows: [{ label: "Equivalent annual pay", value: usd(annual), strong: true }, { label: "Monthly", value: usd(annual / 12) }] };
  },
});

put("optionsFv", {
  fields: [
    numF("shares", "Shares", 500, undefined, 0),
    moneyF("strike", "Strike price", 10),
    moneyF("price", "Share price today", 18),
    pctF("growth", "Share-price growth per year", 5),
    numF("years", "Years", 5, undefined, 0),
  ],
  run(v) {
    const future = n(v, "price") * Math.pow(1 + n(v, "growth") / 100, n(v, "years"));
    const spread = Math.max(0, future - n(v, "strike")) * n(v, "shares");
    return {
      rows: [
        { label: "Illustrated share price", value: usd(future) },
        { label: "Spread value before tax", value: usd(spread), strong: true },
      ],
      note: "Employee options can expire, and the tax depends on whether they are incentive or nonqualified options. This is the pre-tax spread only.",
    };
  },
});

put("optionsExercise", {
  fields: [
    numF("shares", "Shares you could exercise", 500, undefined, 0),
    moneyF("strike", "Strike", 10),
    moneyF("market", "Market price", 18),
    pctF("tax", "Ordinary tax rate on the bargain", 24),
  ],
  run(v) {
    const bargain = Math.max(0, n(v, "market") - n(v, "strike")) * n(v, "shares");
    const tax = bargain * (n(v, "tax") / 100);
    return {
      rows: [
        { label: "Bargain element", value: usd(bargain), strong: true },
        { label: "Tax at the rate you entered", value: usd(tax) },
        { label: "Bargain after that tax", value: usd(bargain - tax) },
      ],
      note: "Nonqualified options are generally taxed as wages on the bargain at exercise. Incentive stock options can create alternative minimum tax, which this tool does not compute.",
    };
  },
});

put("planWorth", {
  fields: [
    moneyF("balance", "Balance now", 40000),
    moneyF("pay", "Annual pay", 80000),
    pctF("you", "Percent of pay you contribute", 6),
    pctF("match", "Employer matches this percent of your contribution", 50),
    pctF("cap", "Match stops at this percent of pay", 6),
    pctF("rate", "Expected return", 7),
    numF("years", "Years", 25, undefined, 1),
  ],
  run(v) {
    const employee = Math.min(n(v, "pay") * (n(v, "you") / 100), ELECTIVE_DEFERRAL + CATCHUP_60);
    const match = Math.min(employee * (n(v, "match") / 100), n(v, "pay") * (n(v, "cap") / 100));
    const fv = futureValue(n(v, "balance"), n(v, "rate"), Math.round(n(v, "years") * 12), (employee + match) / 12);
    return {
      rows: [
        { label: "Your contribution this year", value: usd(employee) },
        { label: "Employer money this year", value: usd(match) },
        { label: "Illustrated balance", value: usd(fv), strong: true },
      ],
      note: `The 2026 employee deferral used as a ceiling is $${ELECTIVE_DEFERRAL.toLocaleString()} before the age-50 catch-up, or $${(ELECTIVE_DEFERRAL + CATCHUP_60).toLocaleString()} at ages 60–63. This run uses the higher ceiling only as a cap, not as an assumption that you are that age.`,
    };
  },
});

put("contributionImpact", {
  fields: [
    moneyF("balance", "Balance now", 40000),
    moneyF("now", "Monthly contribution now", 200),
    moneyF("higher", "Monthly contribution you are considering", 400),
    pctF("rate", "Expected return", 7),
    numF("years", "Years", 20, undefined, 1),
  ],
  run(v) {
    const months = Math.round(n(v, "years") * 12);
    const a = futureValue(n(v, "balance"), n(v, "rate"), months, n(v, "now"));
    const b = futureValue(n(v, "balance"), n(v, "rate"), months, n(v, "higher"));
    return { rows: [{ label: "Balance if you stay at the current contribution", value: usd(a) }, { label: "Balance at the higher contribution", value: usd(b), strong: true }, { label: "Difference", value: usd(b - a) }] };
  },
});

put(["pension", "lumpSum"], {
  fields: [
    moneyF("monthly", "Monthly pension", 1800),
    numF("years", "Years you want to assume you receive it", 25, undefined, 1),
    pctF("discount", "Discount rate", 5),
    moneyF("lump", "Lump sum offered instead", 280000),
    pctF("tax", "Tax rate if you cash the lump sum out", 24),
    yn("penalty", "Add a 10% early-distribution tax"),
  ],
  run(v) {
    const pv = (() => {
      const r = n(v, "discount") / 100 / 12;
      const m = Math.round(n(v, "years") * 12);
      if (r === 0) return n(v, "monthly") * m;
      return (n(v, "monthly") * (1 - Math.pow(1 + r, -m))) / r;
    })();
    const tax = n(v, "lump") * ((n(v, "tax") + (n(v, "penalty") ? 10 : 0)) / 100);
    return {
      rows: [
        { label: "Present value of the pension", value: usd(pv), strong: true },
        { label: "Lump sum before tax", value: usd(n(v, "lump")) },
        { label: "Lump sum after the tax you entered", value: usd(n(v, "lump") - tax) },
        { label: "Larger pre-tax value", value: pv >= n(v, "lump") ? "The pension, at this discount rate and lifespan" : "The lump sum" },
      ],
      note: "A pension also carries survivor options and the risk of the sponsor. A rolled lump sum is not taxed until you take it. Cashing it out can add the 10% additional tax before age 59½.",
    };
  },
});

put("iraLimit", {
  fields: [
    statusF(),
    moneyF("magi", "Modified adjusted gross income", 90000),
    numF("age", "Age at year-end", 40, undefined, 0),
    yn("covered", "You are covered by a workplace plan"),
    yn("spouseCovered", "Spouse is covered and you are not"),
  ],
  run(v) {
    const full = IRA_LIMIT + (n(v, "age") >= 50 ? IRA_CATCHUP : 0);
    const status = n(v, "status") || 1;
    let start = 0;
    let end = 0;
    let traditional = full;
    if (n(v, "covered")) {
      if (status === 2) [start, end] = [129000, 149000];
      else if (status === 4) [start, end] = [0, 10000];
      else [start, end] = [81000, 91000];
      traditional = phaseout(n(v, "magi"), start, end, full);
    } else if (n(v, "spouseCovered") && status === 2) {
      traditional = phaseout(n(v, "magi"), 242000, 252000, full);
    }
    const roth =
      status === 2
        ? phaseout(n(v, "magi"), 242000, 252000, full)
        : status === 4
          ? phaseout(n(v, "magi"), 0, 10000, full)
          : phaseout(n(v, "magi"), 153000, 168000, full);
    return {
      rows: [
        { label: "2026 IRA dollar limit", value: usd(full) },
        { label: "Traditional IRA that may be deductible", value: usd(traditional), strong: true },
        { label: "Roth IRA contribution allowed", value: usd(roth) },
      ],
      note: "2026 phaseouts: workplace-plan single $81,000–$91,000; joint $129,000–$149,000; spouse-covered joint $242,000–$252,000. Roth single or head of household $153,000–$168,000; joint $242,000–$252,000. Married filing separately stays $0–$10,000. If nobody is covered by a workplace plan, the traditional deduction is not phased out.",
    };
  },
});

put("rothConvert", {
  fields: [
    moneyF("amount", "Amount to convert", 20000),
    pctF("now", "Tax rate this year", 22),
    pctF("later", "Tax rate you expect in retirement", 22),
    pctF("rate", "Expected annual return", 6),
    numF("years", "Years until you spend it", 15, undefined, 1),
  ],
  run(v) {
    const taxNow = n(v, "amount") * (n(v, "now") / 100);
    const roth = futureValue(n(v, "amount"), n(v, "rate"), Math.round(n(v, "years") * 12), 0);
    const trad = futureValue(n(v, "amount"), n(v, "rate"), Math.round(n(v, "years") * 12), 0);
    const tradNet = trad * (1 - n(v, "later") / 100);
    const rothNet = roth - taxNow * Math.pow(1 + n(v, "rate") / 100, n(v, "years"));
    return {
      rows: [
        { label: "Tax due on the conversion this year", value: usd(taxNow) },
        { label: "Roth left to spend, after the lost growth on the tax", value: usd(rothNet) },
        { label: "Traditional left after retirement tax", value: usd(tradNet), strong: true },
        { label: "Larger spendable amount", value: rothNet >= tradNet ? "Converting, at these two tax rates" : "Leaving it traditional, at these two tax rates" },
      ],
      note: "The conversion tax is assumed to be paid from other money, and that other money would otherwise have been invested. A conversion is more attractive when the retirement rate is higher than today’s rate.",
    };
  },
});

put("planAtRetirement", {
  fields: [
    moneyF("balance", "Qualified-plan balance", 150000),
    moneyF("annual", "Added each year, including the match", 10000),
    pctF("rate", "Expected return", 7),
    numF("years", "Years to retirement", 20, undefined, 1),
  ],
  run(v) {
    const fv = futureValue(n(v, "balance"), n(v, "rate"), Math.round(n(v, "years") * 12), n(v, "annual") / 12);
    return { rows: [{ label: "Illustrated balance at retirement", value: usd(fv), strong: true }], series: yearlySeries(n(v, "balance"), n(v, "rate"), n(v, "years"), n(v, "annual") / 12) };
  },
});

put("rmd", {
  fields: [
    numF("age", "Age this year", 75, undefined, 0),
    moneyF("balance", "Prior year-end balance", 400000),
  ],
  run(v) {
    const factor = rmdFactor(n(v, "age"));
    if (n(v, "age") < 73) {
      return {
        rows: [{ label: "Required distribution", value: "None at this age", strong: true }],
        note: "Under current rules, required minimum distributions start at 73, or at 75 if you were born in 1960 or later. The factor table below is the IRS Uniform Lifetime Table from Publication 590-B.",
      };
    }
    if (!factor) {
      return { rows: [{ label: "Required distribution", value: "Enter an age of 72 or older" }] };
    }
    return {
      rows: [
        { label: "Uniform Lifetime factor", value: plain(factor, 1) },
        { label: "Required minimum distribution", value: usd(n(v, "balance") / factor), strong: true },
      ],
      note: "This is the Uniform Lifetime Table. A spouse more than 10 years younger who is the sole beneficiary uses a different table.",
    };
  },
});

put("rmdProjected", {
  fields: [
    numF("age", "Age now", 68, undefined, 0),
    moneyF("balance", "Balance now", 300000),
    pctF("rate", "Expected return until the first RMD", 6),
    numF("start", "Age you expect RMDs to start", 73, undefined, 73),
  ],
  run(v) {
    const years = Math.max(0, n(v, "start") - n(v, "age"));
    const future = futureValue(n(v, "balance"), n(v, "rate"), Math.round(years * 12), 0);
    const factor = rmdFactor(n(v, "start"));
    return {
      rows: [
        { label: "Balance at the starting age", value: usd(future) },
        { label: "Factor at that age", value: factor ? plain(factor, 1) : "—" },
        { label: "Illustrated first required distribution", value: factor ? usd(future / factor) : "—", strong: true },
      ],
      note: "SECURE 2.0 set the starting age at 73, and at 75 for people born in 1960 or later. Confirm which age applies before you rely on a projection.",
    };
  },
});

put("matchMax", {
  fields: [
    moneyF("pay", "Annual pay", 80000),
    pctF("match", "Employer match rate", 50, "50 means the employer adds $0.50 per $1 you contribute."),
    pctF("upTo", "Match applies on contributions up to this percent of pay", 6),
    numF("age", "Age", 40, undefined, 0),
  ],
  run(v) {
    const cap = ELECTIVE_DEFERRAL + (n(v, "age") >= 60 && n(v, "age") <= 63 ? CATCHUP_60 : n(v, "age") >= 50 ? CATCHUP_50 : 0);
    const needed = n(v, "pay") * (n(v, "upTo") / 100);
    const you = Math.min(needed, cap);
    const match = you * (n(v, "match") / 100);
    return {
      rows: [
        { label: "Contribute at least", value: usd(you), strong: true },
        { label: "Employer money that captures", value: usd(match) },
        { label: "Your 2026 deferral ceiling at this age", value: usd(cap) },
      ],
      note: "Leaving the match unclaimed is a pay cut. The 2026 deferral is $24,500, the age-50 catch-up is $8,000, and the age 60–63 catch-up is $11,250.",
    };
  },
});

put("borrow401k", {
  fields: [
    moneyF("loan", "Amount borrowed from the plan", 10000),
    pctF("rate", "Interest rate the loan charges", 6),
    numF("years", "Years to repay", 5, undefined, 1),
    pctF("lost", "Return the money would have earned if it stayed invested", 7),
  ],
  run(v) {
    const months = Math.round(n(v, "years") * 12);
    const pay = paymentFor(n(v, "loan"), n(v, "rate"), months);
    const stayed = futureValue(n(v, "loan"), n(v, "lost"), months, 0);
    const interestBack = pay * months - n(v, "loan");
    return {
      rows: [
        { label: "Payment back to your plan", value: usd(pay), strong: true },
        { label: "Interest that goes back into your account", value: usd(interestBack) },
        { label: "What the borrowed money might have grown to", value: usd(stayed) },
      ],
      note: "Loan interest is paid with after-tax dollars into a pre-tax account. If you leave the job, the loan often comes due. The legal maximum is generally the lesser of $50,000 or half of the vested balance.",
    };
  },
});

put("earlyWithdrawal", {
  fields: [
    moneyF("amount", "Amount withdrawn", 10000),
    pctF("tax", "Ordinary tax rate", 22),
    yn("penalty", "Under 59½ and no exception applies"),
  ],
  run(v) {
    const penalty = n(v, "penalty") ? n(v, "amount") * 0.1 : 0;
    const tax = n(v, "amount") * (n(v, "tax") / 100);
    return {
      rows: [
        { label: "Ordinary tax", value: usd(tax) },
        { label: "Additional 10% tax", value: usd(penalty) },
        { label: "Left in hand", value: usd(n(v, "amount") - tax - penalty), strong: true },
      ],
      note: "Exceptions exist for certain medical costs, births, disasters, and other listed cases. This tool applies 10% only when you say no exception applies.",
    };
  },
});

put("sePlanMax", {
  fields: [
    moneyF("profit", "Net self-employment profit", 120000),
    statusF(),
    pickF("plan", "Plan", 1, [
      { value: 1, label: "SEP-IRA" },
      { value: 2, label: "SIMPLE IRA" },
      { value: 3, label: "Solo 401(k) employee deferral plus employer" },
    ]),
    numF("age", "Age", 45, undefined, 0),
  ],
  run(v) {
    const se = selfEmploymentTax(n(v, "profit"), n(v, "status") || 1);
    const net = Math.max(0, n(v, "profit") - se.deductible);
    const comp = Math.min(net, COMP_CAP);
    const sep = Math.min(DC_LIMIT, comp * 0.25);
    const simple = SIMPLE_LIMIT + (n(v, "age") >= 50 ? 4000 : 0);
    const deferral = ELECTIVE_DEFERRAL + (n(v, "age") >= 60 && n(v, "age") <= 63 ? CATCHUP_60 : n(v, "age") >= 50 ? CATCHUP_50 : 0);
    const solo = Math.min(DC_LIMIT, deferral + comp * 0.25);
    const chosen = n(v, "plan") === 2 ? simple : n(v, "plan") === 3 ? solo : sep;
    return {
      rows: [
        { label: "Deductible half of self-employment tax", value: usd(se.deductible) },
        { label: "Compensation used, capped", value: usd(comp) },
        { label: "Illustrated maximum contribution", value: usd(chosen), strong: true },
      ],
      note: `SEP and the employer piece use 25% of compensation after the self-employment-tax deduction, capped by the 2026 defined-contribution limit of $${DC_LIMIT.toLocaleString()} and compensation of $${COMP_CAP.toLocaleString()}. SIMPLE elective deferral used here is $${SIMPLE_LIMIT.toLocaleString()} plus a $4,000 catch-up at 50. Some SIMPLE plans have a higher limit. This is not a plan-document reading.`,
    };
  },
});

put("nua", {
  fields: [
    moneyF("total", "Value of employer stock in the plan", 100000),
    moneyF("basis", "Cost basis of that stock", 20000),
    pctF("ordinary", "Ordinary tax rate", 24),
    pctF("ltcg", "Long-term capital-gain rate", 15),
  ],
  run(v) {
    const nua = Math.max(0, n(v, "total") - n(v, "basis"));
    const nuaTax = n(v, "basis") * (n(v, "ordinary") / 100) + nua * (n(v, "ltcg") / 100);
    const rolloverTax = n(v, "total") * (n(v, "ordinary") / 100);
    return {
      rows: [
        { label: "Tax if NUA is used and the stock is sold at this value", value: usd(nuaTax), strong: true },
        { label: "Tax if the whole amount is later taxed as ordinary income", value: usd(rolloverTax) },
        { label: "Tax difference at these rates", value: usd(rolloverTax - nuaTax) },
      ],
      note: "Net unrealized appreciation can tax the basis as ordinary income now and the gain as long-term capital gain when you sell. A rollover to an IRA defers tax and later treats distributions as ordinary. The 10% additional tax can apply to the basis if you are under 59½. This is a comparison, not an election.",
    };
  },
});

put("stretchIra", {
  fields: [
    moneyF("balance", "Inherited IRA balance", 200000),
    pctF("rate", "Expected return", 5),
    numF("years", "Years to empty the account", 10, "Most non-spouse beneficiaries now have 10 years.", 1),
  ],
  run(v) {
    const years = Math.max(1, Math.round(n(v, "years")));
    let bal = n(v, "balance");
    let paid = 0;
    const each = n(v, "balance") / years;
    for (let i = 0; i < years; i += 1) {
      bal *= 1 + n(v, "rate") / 100;
      const take = Math.min(bal, each);
      bal -= take;
      paid += take;
    }
    paid += Math.max(0, bal);
    return {
      rows: [
        { label: "Level amount before growth", value: usd(each) },
        { label: "Total distributed, including growth", value: usd(paid), strong: true },
      ],
      note: "The SECURE Act generally requires a non-eligible designated beneficiary to empty the account by December 31 of the tenth year. Eligible beneficiaries can sometimes use life expectancy. Annual required amounts inside the 10 years depend on whether the owner had started RMDs. This spreads the starting balance evenly and is not those rules.",
    };
  },
});

put("rothVsTraditional", {
  fields: [
    moneyF("annual", "Annual contribution", 8000),
    pctF("now", "Tax rate now", 24),
    pctF("later", "Tax rate in retirement", 22),
    pctF("rate", "Expected return", 7),
    numF("years", "Years", 25, undefined, 1),
  ],
  run(v) {
    const months = Math.round(n(v, "years") * 12);
    const trad = futureValue(0, n(v, "rate"), months, n(v, "annual") / 12) * (1 - n(v, "later") / 100);
    const rothContribution = n(v, "annual") * (1 - n(v, "now") / 100);
    const roth = futureValue(0, n(v, "rate"), months, rothContribution / 12);
    return {
      rows: [
        { label: "Traditional, after retirement tax", value: usd(trad) },
        { label: "Roth, funded with the after-tax equivalent", value: usd(roth), strong: true },
        { label: "Larger spendable balance", value: trad >= roth ? "Traditional, because the retirement rate is lower" : "Roth, because today’s rate is lower or equal" },
      ],
      note: "The traditional contribution is pre-tax, so the same paycheck funds a larger traditional deposit. The Roth deposit is what is left after paying tax now.",
    };
  },
});

put(["millionaire", "saveAmount"], {
  fields: [
    moneyF("goal", "Goal", 1000000),
    moneyF("now", "Saved so far", 25000),
    pctF("rate", "Expected return", 7),
    numF("years", "Years", 25, undefined, 1),
  ],
  run(v) {
    const grown = futureValue(n(v, "now"), n(v, "rate"), Math.round(n(v, "years") * 12), 0);
    const gap = Math.max(0, n(v, "goal") - grown);
    const r = n(v, "rate") / 100 / 12;
    const m = Math.round(n(v, "years") * 12);
    const monthly = m <= 0 ? gap : r === 0 ? gap / Math.max(1, m) : gap / ((Math.pow(1 + r, m) - 1) / r);
    return { rows: [{ label: "Current savings grow to", value: usd(grown) }, { label: "Still to fund", value: usd(gap) }, { label: "Save each month", value: usd(monthly), strong: true }] };
  },
});

put(["double", "timeToGoal"], {
  fields: [
    moneyF("now", "Saved so far", 20000),
    moneyF("monthly", "Added each month", 200),
    pctF("rate", "Expected return", 7),
    moneyF("goal", "Goal (for the doubling tool, twice today’s balance is filled in if you leave this at 0)", 0),
  ],
  run(v) {
    const goal = n(v, "goal") > 0 ? n(v, "goal") : n(v, "now") * 2;
    const months = monthsToGoal(n(v, "now"), n(v, "rate"), n(v, "monthly"), goal);
    const rule = n(v, "rate") > 0 ? 72 / n(v, "rate") : Infinity;
    return {
      rows: [
        { label: "Goal used", value: usd(goal) },
        { label: "Time to reach it with the monthly addition", value: Number.isFinite(months) ? `${Math.floor(months / 12)} years, ${Math.round(months % 12)} months` : "Not reached at this rate", strong: true },
        { label: "Rule of 72, with no new savings", value: Number.isFinite(rule) ? `${plain(rule, 1)} years to double` : "—" },
      ],
    };
  },
});

put("saveNowLater", {
  fields: [
    moneyF("monthly", "Monthly savings", 300),
    pctF("rate", "Expected return", 7),
    numF("years", "Years if you start now", 30, undefined, 1),
    numF("wait", "Years you might wait", 5, undefined, 0),
  ],
  run(v) {
    const now = futureValue(0, n(v, "rate"), Math.round(n(v, "years") * 12), n(v, "monthly"));
    const later = futureValue(0, n(v, "rate"), Math.round(Math.max(0, n(v, "years") - n(v, "wait")) * 12), n(v, "monthly"));
    return { rows: [{ label: "If you start now", value: usd(now), strong: true }, { label: "If you wait", value: usd(later) }, { label: "Cost of waiting", value: usd(now - later) }] };
  },
});

put("cagr", {
  fields: [
    moneyF("start", "Starting value", 10000),
    moneyF("end", "Ending value", 18000),
    numF("years", "Years", 7, undefined, 1),
  ],
  run(v) {
    const rate = n(v, "start") > 0 && n(v, "years") > 0 ? (Math.pow(n(v, "end") / n(v, "start"), 1 / n(v, "years")) - 1) * 100 : NaN;
    return { rows: [{ label: "Annualized return", value: pctStr(rate), strong: true }] };
  },
});

put("realReturn", {
  fields: [
    pctF("nominal", "Nominal return", 8),
    pctF("infl", "Inflation", 3),
    pctF("tax", "Tax rate on the return", 15),
  ],
  run(v) {
    const afterTax = n(v, "nominal") * (1 - n(v, "tax") / 100);
    const real = ((1 + afterTax / 100) / (1 + n(v, "infl") / 100) - 1) * 100;
    return { rows: [{ label: "After-tax return", value: pctStr(afterTax) }, { label: "After tax and inflation", value: pctStr(real), strong: true }] };
  },
});

put("effectiveYield", {
  fields: [
    pctF("rate", "Stated annual rate", 4),
    numF("n", "Times it compounds per year", 12, undefined, 1),
  ],
  run(v) {
    const k = Math.max(1, n(v, "n"));
    const apy = (Math.pow(1 + n(v, "rate") / 100 / k, k) - 1) * 100;
    return { rows: [{ label: "Effective annual yield", value: pctStr(apy), strong: true }] };
  },
});

put("estateTax", {
  fields: [
    moneyF("gross", "Gross estate", 8000000),
    moneyF("debts", "Debts, costs, and transfers that reduce the estate", 200000),
    moneyF("exclusion", "Basic exclusion to use", ESTATE_EXCLUSION, "2026 basic exclusion is $15,000,000. Change it if the law or a portable amount is different."),
    yn("portability", "Add a second basic exclusion for portability"),
  ],
  run(v) {
    const exclusion = n(v, "exclusion") + (n(v, "portability") ? n(v, "exclusion") : 0);
    const taxable = Math.max(0, n(v, "gross") - n(v, "debts") - exclusion);
    return {
      rows: [
        { label: "Exclusion used", value: usd(exclusion) },
        { label: "Taxable estate", value: usd(taxable) },
        { label: "Federal estate tax at 40%", value: usd(taxable * 0.4), strong: true },
      ],
      note: "The 2026 basic exclusion amount used as the default is $15,000,000. Portability requires an estate-tax return for the first spouse. State estate tax is not included. New Jersey does not currently have an estate tax; it does have an inheritance tax for some heirs.",
    };
  },
});

put(["federalTax", "refund", "withholding", "itemize"], {
  fields: [
    statusF(),
    moneyF("income", "Adjusted gross income", 95000),
    moneyF("itemized", "Itemized deductions", 0, "Leave 0 to use the 2026 standard deduction."),
    moneyF("extra", "Extra deduction for age, blindness, or the senior deduction", 0),
    moneyF("withheld", "Federal income tax already withheld", 8000),
    moneyF("estimates", "Estimated tax payments", 0),
  ],
  run(v) {
    const status = n(v, "status") || 1;
    const std = (STD[status] || STD[1]) + Math.max(0, n(v, "extra"));
    const deduction = Math.max(std, n(v, "itemized") + Math.max(0, n(v, "extra")));
    const taxable = Math.max(0, n(v, "income") - deduction);
    const tax = incomeTax(taxable, status);
    const payments = n(v, "withheld") + n(v, "estimates");
    const due = tax.tax - payments;
    return {
      rows: [
        { label: "Deduction used", value: usd(deduction) },
        { label: "2026 standard deduction before any extra", value: usd(STD[status] || STD[1]) },
        { label: "Taxable income", value: usd(taxable) },
        { label: "Federal income tax", value: usd(tax.tax), strong: true },
        { label: "Marginal rate", value: pctStr(tax.marginal * 100, 0) },
        { label: "Effective rate on AGI", value: n(v, "income") > 0 ? pctStr((tax.tax / n(v, "income")) * 100) : "—" },
        { label: due >= 0 ? "Still due" : "Refund if these were the only items", value: usd(Math.abs(due)) },
      ],
      note: "Ordinary 2026 brackets and the standard deduction only. Credits, self-employment tax, the net investment income tax, and the alternative minimum tax are not included. Itemizing wins only when itemized deductions are higher than the standard deduction.",
    };
  },
});

put("investInterest", {
  fields: [
    moneyF("interest", "Investment interest paid", 3000),
    moneyF("income", "Net investment income", 2000),
    pctF("rate", "Ordinary tax rate", 24),
  ],
  run(v) {
    const allowed = Math.min(n(v, "interest"), n(v, "income"));
    return {
      rows: [
        { label: "Deductible this year", value: usd(allowed), strong: true },
        { label: "Carried forward", value: usd(Math.max(0, n(v, "interest") - n(v, "income"))) },
        { label: "Tax saved if you itemize", value: usd(allowed * (n(v, "rate") / 100)) },
      ],
      note: "Investment interest is generally deductible only up to net investment income, and only if you itemize. This is not Form 4952.",
    };
  },
});

put("seTax", {
  fields: [
    statusF(),
    moneyF("profit", "Net profit from the business", 80000),
    moneyF("wages", "W-2 wages already taxed for Social Security", 0),
  ],
  run(v) {
    const se = selfEmploymentTax(n(v, "profit"), n(v, "status") || 1, n(v, "wages"));
    return {
      rows: [
        { label: "Self-employment tax", value: usd(se.total), strong: true },
        { label: "Social Security portion", value: usd(se.socialSecurity) },
        { label: "Medicare, including the additional tax", value: usd(se.medicare) },
        { label: "Deductible half", value: usd(se.deductible) },
      ],
      note: `Net earnings are 92.35% of profit. Social Security stops at the 2026 wage base of $${SS_WAGE_BASE.toLocaleString()}, counting W-2 wages. The additional Medicare tax is 0.9% over the statutory threshold.`,
    };
  },
});

put("capGains", {
  fields: [
    signedF("gain", "Long-term gain or loss", 15000),
    pctF("rate", "Long-term capital-gain rate", 15, "Use 0, 15, or 20 for the rate that applies to you. This tool does not look up the threshold."),
    yn("niit", "Add the 3.8% net investment income tax"),
  ],
  run(v) {
    const gain = n(v, "gain");
    const tax = gain > 0 ? gain * (n(v, "rate") / 100) + (n(v, "niit") ? gain * 0.038 : 0) : 0;
    return {
      rows: [
        { label: gain >= 0 ? "Tax on the gain" : "Loss (tax benefit depends on other gains)", value: gain >= 0 ? usd(tax) : usd(gain), strong: true },
      ],
      note: "The 0/15/20% long-term brackets depend on taxable income. Enter the rate that applies rather than having this tool guess it. Net losses offset gains, and a limited amount of net loss can offset ordinary income.",
    };
  },
});

put("ssTaxable", {
  fields: [
    statusF(),
    moneyF("benefits", "Social Security benefits for the year", 24000),
    moneyF("other", "Other income (AGI before Social Security)", 30000),
    moneyF("exempt", "Tax-exempt interest", 0),
  ],
  run(v) {
    const taxable = taxableSocialSecurity(n(v, "benefits"), n(v, "other"), n(v, "exempt"), n(v, "status") || 1);
    return {
      rows: [
        { label: "Benefits that are taxable", value: usd(taxable), strong: true },
        { label: "Share of the benefit", value: n(v, "benefits") > 0 ? pctStr((taxable / n(v, "benefits")) * 100) : "—" },
      ],
      note: "Combined income is other income, plus tax-exempt interest, plus half of Social Security. The $25,000/$34,000 and $32,000/$44,000 thresholds are statutory. Married filing separately is treated here as up to 85% taxable, which is the result when you lived with your spouse.",
    };
  },
});

put("interestTax", {
  fields: [
    moneyF("balance", "Debt balance", 20000),
    pctF("rate", "Interest rate", 7),
    pctF("tax", "Tax rate if the interest is deductible", 24),
    yn("deduct", "The interest is deductible"),
  ],
  run(v) {
    const interest = n(v, "balance") * (n(v, "rate") / 100);
    const after = n(v, "deduct") ? interest * (1 - n(v, "tax") / 100) : interest;
    return {
      rows: [
        { label: "Interest for a year", value: usd(interest) },
        { label: "After-tax cost", value: usd(after), strong: true },
      ],
      note: "Personal credit-card interest is not deductible. Mortgage and business interest can be, subject to limits. The tax benefit exists only if you itemize or the interest is a business expense.",
    };
  },
});

put("taxEquivalent", {
  fields: [
    pctF("muni", "Tax-free yield", 3.2),
    pctF("tax", "Ordinary tax rate", 24),
  ],
  run(v) {
    const denom = 1 - n(v, "tax") / 100;
    const eq = denom <= 0 ? Infinity : n(v, "muni") / denom;
    return {
      rows: [{ label: "A taxable bond must yield at least", value: pctStr(eq), strong: true }],
      note: "State tax on an out-of-state municipal bond is not included. A New Jersey resident may still owe New Jersey tax on municipal bonds from other states.",
    };
  },
});

put("freedomDay", {
  fields: [
    moneyF("income", "Income for the year", 100000),
    moneyF("tax", "All taxes you want to count", 22000),
  ],
  run(v) {
    const share = n(v, "income") > 0 ? n(v, "tax") / n(v, "income") : 0;
    const day = Math.min(365, Math.max(0, Math.round(share * 365)));
    const date = new Date(Date.UTC(2026, 0, 1 + day));
    const label = date.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
    return { rows: [{ label: "Share of income", value: pctStr(share * 100) }, { label: "Day of the year taxes cover", value: label, strong: true }] };
  },
});

put("leaseVsBuy", {
  fields: [
    moneyF("leasePay", "Lease payment", 389),
    numF("leaseMonths", "Lease months", 36, undefined, 1),
    moneyF("driveOff", "Due at signing", 2000),
    moneyF("price", "Purchase price", 32000),
    moneyF("down", "Down payment if you buy", 3000),
    pctF("rate", "Loan rate if you buy", 6),
    numF("term", "Loan years", 5, undefined, 1),
    moneyF("value", "Expected value of the car at the end of the lease", 18000),
  ],
  run(v) {
    const leaseCost = n(v, "driveOff") + n(v, "leasePay") * n(v, "leaseMonths");
    const months = Math.round(n(v, "term") * 12);
    const loan = Math.max(0, n(v, "price") - n(v, "down"));
    const pay = paymentFor(loan, n(v, "rate"), months);
    let bal = loan;
    const r = n(v, "rate") / 100 / 12;
    const hold = Math.round(n(v, "leaseMonths"));
    for (let i = 0; i < hold; i += 1) bal = Math.max(0, bal * (1 + r) - pay);
    const buyNet = n(v, "down") + pay * hold + bal - n(v, "value");
    return {
      rows: [
        { label: "Cash to lease, and you do not keep the car", value: usd(leaseCost) },
        { label: "Net cost to buy over the same months, after the remaining loan and the car's value", value: usd(buyNet), strong: true },
        { label: "Lower net cost at these figures", value: leaseCost < buyNet ? "Leasing" : "Buying" },
      ],
      note: "Mileage charges, wear, sales tax, and insurance differences are not included.",
    };
  },
});

put("zeroVsRebate", {
  fields: [
    moneyF("price", "Vehicle price", 30000),
    moneyF("rebate", "Cash rebate if you take the market-rate loan", 2000),
    pctF("rate", "Market loan rate", 6),
    numF("years", "Years", 4, undefined, 1),
    moneyF("down", "Down payment", 2000),
  ],
  run(v) {
    const months = Math.round(n(v, "years") * 12);
    const rebateLoan = Math.max(0, n(v, "price") - n(v, "rebate") - n(v, "down"));
    const zeroLoan = Math.max(0, n(v, "price") - n(v, "down"));
    const rebatePay = paymentFor(rebateLoan, n(v, "rate"), months);
    const zeroPay = paymentFor(zeroLoan, 0, months);
    return {
      rows: [
        { label: "Payment with the rebate and the market rate", value: usd(rebatePay) },
        { label: "Payment at 0% with no rebate", value: usd(zeroPay), strong: true },
        { label: "Total of the rebate loan", value: usd(rebatePay * months) },
        { label: "Total of the 0% loan", value: usd(zeroPay * months) },
        { label: "Lower total", value: rebatePay * months < zeroPay * months ? "Rebate plus the market-rate loan" : "0% financing" },
      ],
    };
  },
});

put("fuel", {
  fields: [
    numF("miles", "Miles you drive per year", 12000, undefined, 0),
    numF("mpgNow", "Current miles per gallon", 22, undefined, 1),
    numF("mpgNew", "New vehicle miles per gallon", 35, undefined, 1),
    moneyF("price", "Fuel price per gallon", 3.4),
    moneyF("extra", "Extra you would pay for the efficient vehicle", 4000),
  ],
  run(v) {
    const now = (n(v, "miles") / Math.max(1, n(v, "mpgNow"))) * n(v, "price");
    const next = (n(v, "miles") / Math.max(1, n(v, "mpgNew"))) * n(v, "price");
    const save = now - next;
    return {
      rows: [
        { label: "Annual fuel, current vehicle", value: usd(now) },
        { label: "Annual fuel, new vehicle", value: usd(next) },
        { label: "Annual savings", value: usd(save), strong: true },
        { label: "Years of fuel savings to cover the extra price", value: save > 0 ? plain(n(v, "extra") / save, 1) : "—" },
      ],
    };
  },
});

put("autoAfford", {
  fields: [
    moneyF("budget", "Monthly payment you can make", 450),
    pctF("rate", "Loan rate", 6.5),
    numF("years", "Years", 5, undefined, 1),
    moneyF("down", "Down payment and trade equity", 3000),
  ],
  run(v) {
    const loan = pvOf(n(v, "rate"), Math.round(n(v, "years") * 12), n(v, "budget"));
    return { rows: [{ label: "Loan amount", value: usd(loan) }, { label: "Vehicle price", value: usd(loan + n(v, "down")), strong: true }] };
  },
});

function pvOf(rate: number, months: number, payment: number) {
  const r = rate / 100 / 12;
  if (months <= 0) return 0;
  if (Math.abs(r) < 1e-12) return payment * months;
  return (payment * (1 - Math.pow(1 + r, -months))) / r;
}

put("refinance", {
  fields: [
    moneyF("balance", "Balance", 18000),
    pctF("old", "Current rate", 8),
    moneyF("oldPay", "Current payment", 420),
    pctF("neu", "New rate", 5.5),
    numF("years", "New term in years", 4, undefined, 1),
    moneyF("fees", "Fees", 400),
  ],
  run(v) {
    const months = Math.round(n(v, "years") * 12);
    const pay = paymentFor(n(v, "balance") + n(v, "fees"), n(v, "neu"), months);
    const save = n(v, "oldPay") - pay;
    return {
      rows: [
        { label: "New payment, with fees added to the loan", value: usd(pay), strong: true },
        { label: "Monthly change", value: usd(save) },
        { label: "Months to recover the fees from the payment drop", value: save > 0 ? plain(n(v, "fees") / save, 1) : "Payment does not drop" },
      ],
    };
  },
});

put("cafeteria", {
  fields: [
    moneyF("election", "Pre-tax election for the year", 3000),
    pctF("income", "Income-tax rate", 22),
    pctF("fica", "Employee Social Security and Medicare rate", 7.65),
  ],
  run(v) {
    const save = n(v, "election") * ((n(v, "income") + n(v, "fica")) / 100);
    return {
      rows: [
        { label: "Tax not paid on the election", value: usd(save), strong: true },
        { label: "Out-of-pocket cost of a $1 benefit", value: usd(1 - (n(v, "income") + n(v, "fica")) / 100) },
      ],
      note: "Health FSA, dependent care, and pre-tax premiums work this way when the plan allows it. The 2026 health FSA salary-reduction limit is $3,400. Social Security wages also drop, which can slightly reduce a future benefit.",
    };
  },
});

put("startup", {
  fields: [
    moneyF("legal", "Legal and formation", 1500),
    moneyF("equipment", "Equipment", 8000),
    moneyF("deposit", "Deposits and inventory", 4000),
    moneyF("other", "Other startup costs", 2000),
    moneyF("burn", "Monthly costs before you break even", 6000),
    moneyF("cash", "Cash available", 40000),
  ],
  run(v) {
    const startup = n(v, "legal") + n(v, "equipment") + n(v, "deposit") + n(v, "other");
    const left = n(v, "cash") - startup;
    const runway = n(v, "burn") > 0 ? left / n(v, "burn") : Infinity;
    return {
      rows: [
        { label: "Startup costs", value: usd(startup), strong: true },
        { label: "Cash left", value: usd(left) },
        { label: "Months of runway", value: Number.isFinite(runway) ? plain(Math.max(0, runway), 1) : "—" },
      ],
    };
  },
});

put("billingFrequency", {
  fields: [
    moneyF("revenue", "Annual billings", 240000),
    numF("days", "Average days until you are paid", 30, undefined, 0),
  ],
  run(v) {
    const tied = n(v, "revenue") * (n(v, "days") / 365);
    return {
      rows: [
        { label: "Cash sitting in unpaid bills", value: usd(tied), strong: true },
        { label: "Monthly billings", value: usd(n(v, "revenue") / 12) },
      ],
      note: "Billing annually in advance lowers the cash tied up in receivables. This is the working-capital effect, not a sales-tax or contract-law analysis.",
    };
  },
});

put("bizValue", {
  fields: [
    moneyF("profit", "Annual seller's discretionary earnings or profit", 150000),
    numF("multiple", "Multiple a buyer might pay", 2.5, undefined, 0),
    moneyF("debt", "Debt a buyer would subtract", 0),
  ],
  run(v) {
    const value = n(v, "profit") * n(v, "multiple") - n(v, "debt");
    return {
      rows: [{ label: "Illustrated value", value: usd(value), strong: true }],
      note: "A multiple of earnings is a starting conversation. A real valuation looks at customers, owner effort, assets, and comparable sales.",
    };
  },
});

put("breakeven", {
  fields: [
    moneyF("fixed", "Fixed costs for the period", 80000),
    moneyF("price", "Price per unit", 40),
    moneyF("variable", "Variable cost per unit", 18),
  ],
  run(v) {
    const margin = n(v, "price") - n(v, "variable");
    const units = margin > 0 ? n(v, "fixed") / margin : Infinity;
    return {
      rows: [
        { label: "Contribution per unit", value: usd(margin) },
        { label: "Units to break even", value: Number.isFinite(units) ? plain(Math.ceil(units), 0) : "Price does not cover the variable cost", strong: true },
        { label: "Sales dollars to break even", value: Number.isFinite(units) ? usd(Math.ceil(units) * n(v, "price")) : "—" },
      ],
    };
  },
});

put("equipLease", {
  fields: [
    moneyF("price", "Purchase price", 25000),
    pctF("rate", "Interest rate if you borrow to buy", 8),
    numF("years", "Years", 5, undefined, 1),
    moneyF("lease", "Lease payment per month", 480),
    moneyF("residual", "Value if you own it at the end", 4000),
  ],
  run(v) {
    const months = Math.round(n(v, "years") * 12);
    const buyPay = paymentFor(n(v, "price"), n(v, "rate"), months);
    const buy = buyPay * months - n(v, "residual");
    const lease = n(v, "lease") * months;
    return {
      rows: [
        { label: "Loan payment", value: usd(buyPay) },
        { label: "Net cost to buy, after the ending value", value: usd(buy) },
        { label: "Cost to lease", value: usd(lease), strong: true },
        { label: "Lower cost", value: lease < buy ? "Leasing" : "Buying" },
      ],
      note: "Tax depreciation, including Section 179, can favor buying. The lease may include service the purchase does not.",
    };
  },
});

put("ratios", {
  fields: [
    moneyF("currentA", "Current assets", 80000),
    moneyF("inventory", "Inventory included in current assets", 20000),
    moneyF("currentL", "Current liabilities", 40000),
    moneyF("debt", "Total debt", 60000),
    moneyF("equity", "Equity", 100000),
    moneyF("revenue", "Revenue", 400000),
    signedF("profit", "Net profit", 40000),
  ],
  run(v) {
    return {
      rows: [
        { label: "Current ratio", value: n(v, "currentL") ? plain(n(v, "currentA") / n(v, "currentL"), 2) : "—", strong: true },
        { label: "Quick ratio", value: n(v, "currentL") ? plain((n(v, "currentA") - n(v, "inventory")) / n(v, "currentL"), 2) : "—" },
        { label: "Debt to equity", value: n(v, "equity") ? plain(n(v, "debt") / n(v, "equity"), 2) : "—" },
        { label: "Profit margin", value: n(v, "revenue") ? pctStr((n(v, "profit") / n(v, "revenue")) * 100) : "—" },
      ],
    };
  },
});

put("compensation", {
  fields: [
    moneyF("salary", "Salary", 70000),
    moneyF("bonus", "Bonus", 5000),
    moneyF("health", "Employer health-insurance cost", 8000),
    moneyF("retire", "Employer retirement contribution", 3000),
    moneyF("other", "Other benefits", 1000),
    pctF("fica", "Employer payroll-tax rate on wages", 7.65),
  ],
  run(v) {
    const wages = n(v, "salary") + n(v, "bonus");
    const tax = wages * (n(v, "fica") / 100);
    const total = wages + n(v, "health") + n(v, "retire") + n(v, "other") + tax;
    return {
      rows: [
        { label: "Employer payroll tax", value: usd(tax) },
        { label: "Total cost of the employee", value: usd(total), strong: true },
        { label: "Benefits and tax as a share of wages", value: wages > 0 ? pctStr(((total - wages) / wages) * 100) : "—" },
      ],
    };
  },
});

put("section179", {
  fields: [
    moneyF("cost", "Cost of qualifying property", 40000),
    moneyF("income", "Taxable income from the business before Section 179", 90000),
    pctF("rate", "Marginal tax rate", 24),
    moneyF("limit", "Section 179 dollar limit", SECTION_179_BASE, "The OBBBA base is $2,500,000, reduced after $4,000,000 of property. 2026 may be inflation-indexed. Replace these if the IRS figure is different."),
    moneyF("phase", "Phaseout starts at", SECTION_179_PHASEOUT),
  ],
  run(v) {
    const reduced = Math.max(0, n(v, "limit") - Math.max(0, n(v, "cost") - n(v, "phase")));
    const deduction = Math.max(0, Math.min(n(v, "cost"), reduced, n(v, "income")));
    return {
      rows: [
        { label: "Section 179 deduction", value: usd(deduction), strong: true },
        { label: "Left to depreciate another way", value: usd(Math.max(0, n(v, "cost") - deduction)) },
        { label: "Tax saved at the rate you entered", value: usd(deduction * (n(v, "rate") / 100)) },
      ],
      note: "The deduction cannot exceed taxable business income, and it is limited by the dollar cap. The default cap is the statutory base from the One, Big, Beautiful Bill before a later inflation adjustment. Bonus depreciation and listed-property rules are not applied.",
    };
  },
});

void ssClaimFactor;
void IRA_LIMIT;
void IRA_CATCHUP;
void SS_WAGE_BASE;
