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
  monthPhrase,
  monthsToGoal,
  n,
  numF,
  paymentFor,
  pctF,
  pctStr,
  phaseout,
  pickF,
  plain,
  pvOfPayments,
  rmdFactor,
  selfEmploymentTax,
  signedF,
  solveApr,
  ssClaimFactor,
  statusF,
  taxableSocialSecurity,
  usd,
  yearlySeries,
  yn,
  type Result,
  type Spec,
  type Values,
} from "./money";

const R = (rows: Result["rows"], note?: string, series?: Result["series"]): Result => ({ rows, note, series });

export const specsB: Record<string, Spec> = {};

function put(name: string | string[], spec: Spec) {
  for (const key of Array.isArray(name) ? name : [name]) specsB[key] = spec;
}

put(["cardPayoff", "loanPayoff"], {
  fields: [
    moneyF("balance", "Balance", 6000),
    pctF("rate", "Interest rate (APR)", 18),
    moneyF("payment", "Monthly payment", 250),
  ],
  run(v) {
    const result = amortize(n(v, "balance"), n(v, "rate"), n(v, "payment"));
    return R(
      [
        { label: "Time to pay off", value: monthPhrase(result.months), strong: true },
        { label: "Interest", value: usd(result.interest) },
        { label: "Total paid", value: Number.isFinite(result.months) ? usd(n(v, "payment") * result.months) : "—" },
      ],
      Number.isFinite(result.months) ? undefined : "That payment does not cover monthly interest, so the balance would grow.",
    );
  },
});

put("loanPayment", {
  fields: [
    moneyF("amount", "Amount borrowed", 200000),
    pctF("rate", "Interest rate", 6.5),
    numF("years", "Years", 30, undefined, 1),
    moneyF("escrow", "Monthly taxes, insurance, or other add-on", 0, "Use 0 for an auto or personal loan."),
  ],
  run(v) {
    const months = Math.round(n(v, "years") * 12);
    const pi = paymentFor(n(v, "amount"), n(v, "rate"), months);
    const done = amortize(n(v, "amount"), n(v, "rate"), pi);
    return R([
      { label: "Principal and interest", value: usd(pi) },
      { label: "Full monthly payment", value: usd(pi + n(v, "escrow")), strong: true },
      { label: "Total interest", value: usd(done.interest) },
    ]);
  },
});

put("loanBalance", {
  fields: [
    moneyF("payment", "Monthly payment", 450),
    pctF("rate", "Interest rate", 6),
    numF("years", "Years remaining", 4, undefined, 0),
  ],
  run(v) {
    return R([{ label: "Approximate remaining balance", value: usd(pvOfPayments(n(v, "rate"), Math.round(n(v, "years") * 12), n(v, "payment"))), strong: true }]);
  },
});

put("tooMuchDebt", {
  fields: [
    moneyF("gross", "Gross monthly income", 7000),
    moneyF("housing", "Monthly housing payment", 1800),
    moneyF("other", "Other monthly debt payments", 650),
  ],
  run(v) {
    const gross = n(v, "gross");
    const housing = gross > 0 ? (n(v, "housing") / gross) * 100 : 0;
    const back = gross > 0 ? ((n(v, "housing") + n(v, "other")) / gross) * 100 : 0;
    return R(
      [
        { label: "Housing ratio", value: pctStr(housing), strong: true },
        { label: "All-debts ratio", value: pctStr(back) },
      ],
      "Many lenders look for housing near 28% of gross and all debts near 36%. Those are guidelines, not a decision about what you can live with.",
    );
  },
});

put("consolidate", {
  fields: [
    moneyF("b1", "First balance", 8000),
    pctF("r1", "First rate", 19),
    moneyF("p1", "First payment", 250),
    moneyF("b2", "Second balance", 6000),
    pctF("r2", "Second rate", 12),
    moneyF("p2", "Second payment", 180),
    pctF("newRate", "New loan rate", 8),
    numF("years", "New loan years", 5, undefined, 1),
  ],
  run(v) {
    const oldPay = n(v, "p1") + n(v, "p2");
    const balance = n(v, "b1") + n(v, "b2");
    const months = Math.round(n(v, "years") * 12);
    const neu = paymentFor(balance, n(v, "newRate"), months);
    const old1 = amortize(n(v, "b1"), n(v, "r1"), n(v, "p1"));
    const old2 = amortize(n(v, "b2"), n(v, "r2"), n(v, "p2"));
    const next = amortize(balance, n(v, "newRate"), neu);
    const oldInterest = (Number.isFinite(old1.interest) ? old1.interest : 0) + (Number.isFinite(old2.interest) ? old2.interest : 0);
    return R([
      { label: "Payments you make now", value: usd(oldPay) },
      { label: "New loan payment", value: usd(neu), strong: true },
      { label: "Monthly difference", value: usd(oldPay - neu) },
      { label: "Interest on the new loan", value: usd(next.interest) },
      { label: "Interest left on the old debts if those payments continue", value: Number.isFinite(old1.interest) && Number.isFinite(old2.interest) ? usd(oldInterest) : "One of the old payments does not cover interest" },
    ]);
  },
});

put("debtRestructure", {
  fields: [
    moneyF("balance", "Balance", 180000),
    pctF("oldRate", "Current rate", 7),
    moneyF("oldPay", "Current monthly payment", 1400),
    pctF("newRate", "New rate", 6),
    numF("years", "New term in years", 25, undefined, 1),
    moneyF("fees", "Refinance costs", 3000),
  ],
  run(v) {
    const months = Math.round(n(v, "years") * 12);
    const neu = paymentFor(n(v, "balance"), n(v, "newRate"), months);
    const save = n(v, "oldPay") - neu;
    const old = amortize(n(v, "balance"), n(v, "oldRate"), n(v, "oldPay"));
    const next = amortize(n(v, "balance"), n(v, "newRate"), neu);
    return R(
      [
        { label: "New payment", value: usd(neu), strong: true },
        { label: "Monthly change", value: usd(save) },
        { label: "Months of savings to cover the refinance costs", value: save > 0 ? monthPhrase(n(v, "fees") / save) : "Payment does not drop" },
        { label: "Interest if you keep the old payment", value: usd(old.interest) },
        { label: "Interest on the new loan", value: usd(next.interest) },
      ],
      "A lower payment can stretch the debt and raise total interest even when the rate drops. Compare both lines before you refinance.",
    );
  },
});

put("cashOrPayments", {
  fields: [
    moneyF("lump", "Lump sum you could take today", 20000),
    moneyF("payment", "Or this payment instead", 500),
    numF("count", "Number of payments", 48, undefined, 1),
    pctF("rate", "Return if you invest the money", 5),
  ],
  run(v) {
    const months = Math.round(n(v, "count"));
    const fvLump = futureValue(n(v, "lump"), n(v, "rate"), months, 0);
    const fvPays = futureValue(0, n(v, "rate"), months, n(v, "payment"));
    const nominal = n(v, "payment") * months;
    return R([
      { label: "Payments added up, with no investment", value: usd(nominal) },
      { label: "Lump sum invested until the last payment", value: usd(fvLump), strong: true },
      { label: "Payments invested as they arrive", value: usd(fvPays) },
      { label: "Larger ending balance", value: fvLump >= fvPays ? "Taking the lump sum and investing it" : "Taking the payments and investing each one" },
    ]);
  },
});

put("extraPayments", {
  fields: [
    moneyF("balance", "Balance", 22000),
    pctF("rate", "Interest rate", 6.5),
    moneyF("payment", "Required monthly payment", 420),
    moneyF("extra", "Extra principal each month", 100),
  ],
  run(v) {
    const base = amortize(n(v, "balance"), n(v, "rate"), n(v, "payment"));
    const fast = amortize(n(v, "balance"), n(v, "rate"), n(v, "payment") + n(v, "extra"));
    return R([
      { label: "Payoff with the required payment", value: monthPhrase(base.months) },
      { label: "Payoff with the extra", value: monthPhrase(fast.months), strong: true },
      { label: "Time saved", value: Number.isFinite(base.months) && Number.isFinite(fast.months) ? monthPhrase(base.months - fast.months) : "—" },
      { label: "Interest saved", value: Number.isFinite(base.interest) && Number.isFinite(fast.interest) ? usd(base.interest - fast.interest) : "—" },
    ]);
  },
});

put("balanceTransfer", {
  fields: [
    moneyF("balance", "Balance to move", 6000),
    pctF("current", "Current APR", 21),
    pctF("fee", "Transfer fee", 3),
    pctF("intro", "Introductory APR", 0),
    numF("introMonths", "Introductory months", 15, undefined, 0),
    pctF("after", "APR after the intro", 18),
    numF("horizon", "Months to compare", 24, undefined, 1),
  ],
  run(v) {
    const sim = (rateFor: (m: number) => number, start: number) => {
      let b = start;
      let interest = 0;
      const pay = Math.max(50, start / Math.max(1, n(v, "horizon")));
      for (let m = 1; m <= Math.round(n(v, "horizon")) && b > 0; m += 1) {
        const i = b * (rateFor(m) / 100 / 12);
        interest += i;
        b = Math.max(0, b + i - pay);
      }
      return { interest, left: b, pay };
    };
    const fee = n(v, "balance") * (n(v, "fee") / 100);
    const stay = sim(() => n(v, "current"), n(v, "balance"));
    const move = sim((m) => (m <= n(v, "introMonths") ? n(v, "intro") : n(v, "after")), n(v, "balance") + fee);
    return R(
      [
        { label: "Transfer fee added to the balance", value: usd(fee) },
        { label: "Interest if you stay, over the comparison", value: usd(stay.interest) },
        { label: "Interest if you transfer, over the comparison", value: usd(move.interest), strong: true },
        { label: "Interest difference before leftover balances", value: usd(stay.interest - move.interest) },
      ],
      "Both paths use the same monthly payment, sized to the starting balance and the months you chose. A later rate jump can erase an intro-period savings.",
    );
  },
});

put("homeAfford", {
  fields: [
    moneyF("income", "Gross annual income", 120000),
    moneyF("debts", "Other monthly debt payments", 400),
    moneyF("down", "Down payment available", 40000),
    pctF("rate", "Mortgage rate", 6.5),
    numF("years", "Loan years", 30, undefined, 1),
    moneyF("tax", "Monthly property tax", 500),
    moneyF("ins", "Monthly insurance", 150),
    pctF("housing", "Housing share of gross you will use", 28),
    pctF("total", "All-debts share of gross you will use", 36),
  ],
  run(v) {
    const monthlyIncome = n(v, "income") / 12;
    const housingBudget = monthlyIncome * (n(v, "housing") / 100);
    const totalBudget = monthlyIncome * (n(v, "total") / 100) - n(v, "debts");
    const piti = Math.min(housingBudget, totalBudget);
    const forLoan = piti - n(v, "tax") - n(v, "ins");
    const months = Math.round(n(v, "years") * 12);
    const loan = forLoan > 0 ? pvOfPayments(n(v, "rate"), months, forLoan) : 0;
    return R(
      [
        { label: "Monthly room for principal, interest, tax, and insurance", value: usd(Math.max(0, piti)) },
        { label: "Loan amount that payment supports", value: usd(loan) },
        { label: "Home price with your down payment", value: usd(loan + n(v, "down")), strong: true },
      ],
      forLoan > 0 ? "28% and 36% are common lender tests. A seller, tax bill, or association fee can change the real number." : "Taxes, insurance, and other debts use up the payment room at these figures.",
    );
  },
});

put("mortgageTerms", {
  fields: [
    moneyF("amount", "Loan amount", 300000),
    pctF("rate", "Interest rate", 6.5),
  ],
  run(v) {
    const line = (years: number) => {
      const pay = paymentFor(n(v, "amount"), n(v, "rate"), years * 12);
      const done = amortize(n(v, "amount"), n(v, "rate"), pay);
      return { years, pay, interest: done.interest };
    };
    const a = line(15);
    const b = line(20);
    const c = line(30);
    return R([
      { label: "15-year payment", value: usd(a.pay), strong: true },
      { label: "15-year interest", value: usd(a.interest) },
      { label: "20-year payment", value: usd(b.pay) },
      { label: "20-year interest", value: usd(b.interest) },
      { label: "30-year payment", value: usd(c.pay) },
      { label: "30-year interest", value: usd(c.interest) },
    ]);
  },
});

put(["points", "noCost"], {
  fields: [
    moneyF("amount", "Loan amount", 300000),
    pctF("high", "Rate if you pay no points", 6.75),
    pctF("low", "Rate if you pay points", 6.25),
    pctF("points", "Points charged for the lower rate", 1),
    numF("years", "Years you expect to keep the loan", 7, undefined, 1),
  ],
  run(v) {
    const months = Math.round(n(v, "years") * 12);
    const term = 30 * 12;
    const high = paymentFor(n(v, "amount"), n(v, "high"), term);
    const low = paymentFor(n(v, "amount"), n(v, "low"), term);
    const cost = n(v, "amount") * (n(v, "points") / 100);
    const save = high - low;
    return R(
      [
        { label: "Cost of the points", value: usd(cost) },
        { label: "Monthly payment at the higher rate", value: usd(high) },
        { label: "Monthly payment at the lower rate", value: usd(low), strong: true },
        { label: "Months to earn the points back", value: save > 0 ? monthPhrase(cost / save) : "—" },
        { label: "Net over the years you plan to stay", value: usd(save * months - cost) },
      ],
      "A no-cost loan is the higher rate with zero points. Paying points wins only if you keep the loan longer than the payback.",
    );
  },
});

put("rentOrBuy", {
  fields: [
    moneyF("price", "Home price", 350000),
    moneyF("down", "Down payment and buyer closing costs", 40000),
    pctF("rate", "Mortgage rate", 6.5),
    numF("term", "Loan years", 30, undefined, 1),
    moneyF("own", "Monthly tax, insurance, and maintenance", 700),
    moneyF("rent", "Monthly rent", 2200),
    pctF("rentGrow", "Annual rent increase", 3),
    pctF("app", "Home appreciation per year", 3),
    pctF("invest", "Return if the down payment stays invested", 6),
    numF("years", "Years you would stay", 7, undefined, 1),
    pctF("sell", "Selling cost at the end", 6),
  ],
  run(v) {
    const years = Math.max(1, Math.round(n(v, "years")));
    const loan0 = Math.max(0, n(v, "price") - n(v, "down"));
    const pi = paymentFor(loan0, n(v, "rate"), Math.round(n(v, "term") * 12));
    let rent = n(v, "rent");
    let rentTotal = 0;
    let loan = loan0;
    const r = n(v, "rate") / 100 / 12;
    for (let y = 0; y < years; y += 1) {
      rentTotal += rent * 12;
      rent *= 1 + n(v, "rentGrow") / 100;
      for (let m = 0; m < 12; m += 1) loan = Math.max(0, loan * (1 + r) - pi);
    }
    const value = n(v, "price") * Math.pow(1 + n(v, "app") / 100, years);
    const equity = value * (1 - n(v, "sell") / 100) - loan;
    const invested = futureValue(n(v, "down"), n(v, "invest"), years * 12, 0);
    const buyCash = n(v, "down") + (pi + n(v, "own")) * 12 * years;
    return R([
      { label: "Rent paid over the stay", value: usd(rentTotal) },
      { label: "Cash into the house, including the down payment", value: usd(buyCash) },
      { label: "Equity after selling costs", value: usd(equity), strong: true },
      { label: "Down payment if it had stayed invested", value: usd(invested) },
      { label: "House equity minus invested down payment", value: usd(equity - invested) },
    ], "This leaves out the tax deduction, repairs that exceed the monthly allowance, and the rent you no longer pay. Use it to see the size of the trade, then bring the contract to the firm.");
  },
});

put("biweekly", {
  fields: [
    moneyF("balance", "Loan balance", 280000),
    pctF("rate", "Interest rate", 6.5),
    numF("years", "Years remaining on the monthly schedule", 27, undefined, 1),
  ],
  run(v) {
    const months = Math.round(n(v, "years") * 12);
    const monthly = paymentFor(n(v, "balance"), n(v, "rate"), months);
    const standard = amortize(n(v, "balance"), n(v, "rate"), monthly);
    const half = monthly / 2;
    let b = n(v, "balance");
    let interest = 0;
    let periods = 0;
    const r = n(v, "rate") / 100 / 26;
    while (b > 0.5 && periods < 2000) {
      const i = b * r;
      interest += i;
      b = b + i - half;
      periods += 1;
    }
    return R(
      [
        { label: "Monthly payment", value: usd(monthly) },
        { label: "Biweekly half-payment", value: usd(half), strong: true },
        { label: "Payoff on monthly schedule", value: monthPhrase(standard.months) },
        { label: "Payoff with 26 half-payments a year", value: monthPhrase((periods / 26) * 12) },
        { label: "Interest on the monthly schedule", value: usd(standard.interest) },
        { label: "Interest on the biweekly schedule", value: usd(interest) },
      ],
      "Twenty-six half-payments equal thirteen full monthly payments a year. Some lenders charge a fee to set this up; you can often get the same result by adding one extra monthly payment yourself.",
    );
  },
});

put("fixedVsArm", {
  fields: [
    moneyF("amount", "Loan amount", 320000),
    pctF("fixed", "Fixed rate", 6.5),
    pctF("arm", "ARM starting rate", 5.75),
    numF("hold", "Years you expect to keep the loan", 7, undefined, 1),
    numF("term", "Amortization years", 30, undefined, 1),
  ],
  run(v) {
    const term = Math.round(n(v, "term") * 12);
    const hold = Math.round(n(v, "hold") * 12);
    const fixed = paymentFor(n(v, "amount"), n(v, "fixed"), term);
    const arm = paymentFor(n(v, "amount"), n(v, "arm"), term);
    return R(
      [
        { label: "Fixed payment", value: usd(fixed) },
        { label: "ARM starting payment", value: usd(arm), strong: true },
        { label: "Paid during the years you plan to stay, fixed", value: usd(fixed * hold) },
        { label: "Paid during those years, ARM at the starting rate", value: usd(arm * hold) },
      ],
      "The ARM figure holds the starting rate for the whole stay. If the rate resets higher, the ARM can cost more than the fixed loan.",
    );
  },
});

put("arm", {
  fields: [
    moneyF("amount", "Loan amount", 320000),
    pctF("start", "Starting rate", 5.75),
    numF("fixedYears", "Years before the first reset", 5, undefined, 1),
    pctF("later", "Rate you want to test after the reset", 7.5),
    numF("term", "Full term in years", 30, undefined, 1),
  ],
  run(v) {
    const term = Math.round(n(v, "term") * 12);
    const first = paymentFor(n(v, "amount"), n(v, "start"), term);
    let bal = n(v, "amount");
    const r = n(v, "start") / 100 / 12;
    const months = Math.round(n(v, "fixedYears") * 12);
    for (let i = 0; i < months; i += 1) bal = Math.max(0, bal * (1 + r) - first);
    const left = Math.max(1, term - months);
    const later = paymentFor(bal, n(v, "later"), left);
    return R([
      { label: "Payment before the reset", value: usd(first), strong: true },
      { label: "Balance at the reset", value: usd(bal) },
      { label: "Payment after the reset, on the remaining term", value: usd(later) },
    ], "The later rate is your assumption, not the lender's index. Caps on how far an ARM can move are in the note.");
  },
});

put("closingApr", {
  fields: [
    moneyF("amount", "Loan amount", 300000),
    pctF("rate", "Note rate", 6.5),
    numF("years", "Years", 30, undefined, 1),
    moneyF("fees", "Prepaid finance charges", 4500, "Points and lender fees that are part of the APR. Not every closing cost is a finance charge."),
  ],
  run(v) {
    const months = Math.round(n(v, "years") * 12);
    const pay = paymentFor(n(v, "amount"), n(v, "rate"), months);
    const apr = solveApr(Math.max(1, n(v, "amount") - n(v, "fees")), pay, months);
    return R([
      { label: "Monthly principal and interest", value: usd(pay) },
      { label: "APR if those fees come out of the proceeds", value: pctStr(apr), strong: true },
    ], "APR lets you compare loans when one has a lower rate and higher fees. It is not the rate used to compute the payment.");
  },
});

put("interestOnly", {
  fields: [
    moneyF("amount", "Loan amount", 300000),
    pctF("rate", "Interest rate", 6.5),
    numF("term", "Full term in years", 30, undefined, 1),
    numF("io", "Interest-only years", 10, undefined, 0),
  ],
  run(v) {
    const io = n(v, "amount") * (n(v, "rate") / 100) / 12;
    const traditional = paymentFor(n(v, "amount"), n(v, "rate"), Math.round(n(v, "term") * 12));
    const leftYears = Math.max(1, n(v, "term") - n(v, "io"));
    const later = paymentFor(n(v, "amount"), n(v, "rate"), Math.round(leftYears * 12));
    return R([
      { label: "Interest-only payment", value: usd(io), strong: true },
      { label: "Traditional payment from day one", value: usd(traditional) },
      { label: "Payment after the interest-only period", value: usd(later) },
      { label: "Balance is still", value: usd(n(v, "amount")) + " when principal payments start" },
    ]);
  },
});

put("heloc", {
  fields: [
    moneyF("value", "Home value", 400000),
    moneyF("first", "First mortgage balance", 220000),
    pctF("ltv", "Combined loan-to-value limit", 80),
    moneyF("draw", "Amount you would draw", 30000),
    pctF("rate", "HELOC rate", 8.5),
    numF("years", "Years to repay the draw", 10, undefined, 1),
  ],
  run(v) {
    const room = Math.max(0, n(v, "value") * (n(v, "ltv") / 100) - n(v, "first"));
    const draw = Math.min(n(v, "draw"), room);
    const io = draw * (n(v, "rate") / 100) / 12;
    const amort = paymentFor(draw, n(v, "rate"), Math.round(n(v, "years") * 12));
    return R([
      { label: "Estimated credit available", value: usd(room), strong: true },
      { label: "Draw used in the payment", value: usd(draw) },
      { label: "Interest-only payment on that draw", value: usd(io) },
      { label: "Payment if you repay it over the years entered", value: usd(amort) },
    ], "Lenders also look at credit and income. The available line is only the equity test you entered.");
  },
});

put("mortgageTax", {
  fields: [
    statusF(),
    moneyF("income", "Adjusted gross income", 140000),
    moneyF("interest", "Mortgage interest this year", 14000),
    moneyF("otherItem", "Other itemized deductions", 4000),
  ],
  run(v) {
    const status = n(v, "status") || 1;
    const std = STD[status] || STD[1];
    const item = n(v, "interest") + n(v, "otherItem");
    const deduction = Math.max(std, item);
    const without = Math.max(std, n(v, "otherItem"));
    const taxWith = incomeTax(Math.max(0, n(v, "income") - deduction), status).tax;
    const taxWithout = incomeTax(Math.max(0, n(v, "income") - without), status).tax;
    return R(
      [
        { label: "2026 standard deduction", value: usd(std) },
        { label: "Itemized deductions with the mortgage interest", value: usd(item) },
        { label: "Deduction actually used", value: usd(deduction), strong: true },
        { label: "Federal tax saved by the mortgage interest", value: usd(Math.max(0, taxWithout - taxWith)) },
      ],
      "Only the interest that pushes you above the standard deduction changes the federal tax. State tax and the mortgage-interest cap are not in this sketch.",
    );
  },
});

function nestEgg(v: Values) {
  const years = Math.max(0, n(v, "until"));
  const retired = Math.max(1, n(v, "span"));
  const need = n(v, "spend") * Math.pow(1 + n(v, "infl") / 100, years);
  const real = (1 + n(v, "during") / 100) / (1 + n(v, "infl") / 100) - 1;
  const r = real / 12;
  const months = Math.round(retired * 12);
  const nest = r === 0 ? need * retired : ((need / 12) * (1 - Math.pow(1 + r, -months))) / r;
  const have = futureValue(n(v, "saved"), n(v, "before"), Math.round(years * 12), 0);
  const gap = Math.max(0, nest - have);
  const monthly = years <= 0 ? gap : (() => {
    const rm = n(v, "before") / 100 / 12;
    const m = Math.round(years * 12);
    if (rm === 0) return gap / m;
    return gap / ((Math.pow(1 + rm, m) - 1) / rm);
  })();
  return { need, nest, have, gap, monthly };
}

const retireFields: Spec["fields"] = [
  moneyF("spend", "Annual spending you want in today's dollars", 70000),
  numF("until", "Years until retirement", 25, undefined, 0),
  numF("span", "Years of retirement to fund", 30, undefined, 1),
  pctF("infl", "Inflation", 3),
  moneyF("saved", "Saved so far", 80000),
  pctF("before", "Return before retirement", 7),
  pctF("during", "Return during retirement", 5),
];

put("retireNeed", {
  fields: retireFields,
  run(v) {
    const g = nestEgg(v);
    return R([
      { label: "Spending in the first year of retirement", value: usd(g.need) },
      { label: "Nest egg that supports that spending", value: usd(g.nest), strong: true },
      { label: "Current savings grow to", value: usd(g.have) },
      { label: "Gap", value: usd(g.gap) },
      { label: "Monthly savings that would close the gap", value: usd(g.monthly) },
    ], "Social Security, pensions, and taxes are not subtracted. Enter the spending you still need the portfolio to cover.");
  },
});

put("savingsSufficient", {
  fields: retireFields,
  run(v) {
    const g = nestEgg(v);
    return R([
      { label: "Nest egg needed", value: usd(g.nest) },
      { label: "Projected savings at retirement", value: usd(g.have), strong: true },
      { label: g.gap <= 0 ? "Surplus" : "Shortfall", value: usd(Math.abs(g.have - g.nest)) },
    ]);
  },
});

put("whenSave", {
  fields: [
    moneyF("goal", "Amount you want at retirement", 1000000),
    moneyF("saved", "Saved so far", 20000),
    pctF("rate", "Expected return", 7),
    numF("years", "Years if you start now", 30, undefined, 1),
    numF("wait", "Years you might wait", 5, undefined, 0),
  ],
  run(v) {
    const monthly = (years: number) => {
      const m = Math.round(Math.max(0, years) * 12);
      const grown = futureValue(n(v, "saved"), n(v, "rate"), m, 0);
      const gap = Math.max(0, n(v, "goal") - grown);
      const r = n(v, "rate") / 100 / 12;
      if (m <= 0) return gap;
      if (r === 0) return gap / m;
      return gap / ((Math.pow(1 + r, m) - 1) / r);
    };
    const now = monthly(n(v, "years"));
    const later = monthly(Math.max(0, n(v, "years") - n(v, "wait")));
    return R([
      { label: "Monthly savings if you start now", value: usd(now), strong: true },
      { label: "Monthly savings if you wait", value: usd(later) },
      { label: "Extra each month caused by waiting", value: usd(Math.max(0, later - now)) },
    ]);
  },
});

put(["retire401k", "iraIncome", "savingsIncome"], {
  fields: [
    moneyF("balance", "Balance", 500000),
    pctF("rate", "Expected return while withdrawing", 5),
    numF("years", "Years to take income", 25, undefined, 1),
  ],
  run(v) {
    const pay = paymentFor(n(v, "balance"), n(v, "rate"), Math.round(n(v, "years") * 12));
    return R([
      { label: "Monthly income that would exhaust the balance", value: usd(pay), strong: true },
      { label: "Annual income", value: usd(pay * 12) },
      { label: "First-year withdrawal rate", value: n(v, "balance") > 0 ? pctStr(((pay * 12) / n(v, "balance")) * 100) : "—" },
    ], "A higher withdrawal spends the account down on purpose. It is not a safe-withdrawal rule.");
  },
});

put("ssEstimate", {
  fields: [
    numF("age", "Your age", 45, undefined, 18),
    numF("claim", "Age you might claim", 67, "62 through 70. Full retirement age is treated as 67.", 62),
    moneyF("fra", "Monthly benefit at full retirement age", 0, "Use the amount on your Social Security statement. Leave 0 only for the rough sketch below."),
    moneyF("earnings", "Average annual earnings, if you do not know the statement amount", 60000),
  ],
  run(v) {
    const factor = ssClaimFactor(n(v, "claim"));
    const base = n(v, "fra") > 0 ? n(v, "fra") : n(v, "earnings") * 0.4 / 12;
    const benefit = base * factor;
    return R(
      [
        { label: "Share of the full-retirement-age benefit", value: pctStr(factor * 100) },
        { label: "Illustrated monthly benefit", value: usd(benefit), strong: true },
        { label: "Illustrated annual benefit", value: usd(benefit * 12) },
      ],
      n(v, "fra") > 0
        ? "The early and delayed percentages use the Social Security formula and a full retirement age of 67. Claiming age in whole years only. This is not a Social Security Administration award."
        : "No statement amount was entered, so this uses 40% of average earnings as a placeholder. It is not a Social Security benefit. Paste the number from your statement.",
    );
  },
});

put("retireExpenses", {
  fields: [
    moneyF("now", "Current annual living expenses", 72000),
    pctF("replace", "Share you still expect to spend in retirement", 80),
    numF("years", "Years until retirement", 20, undefined, 0),
    pctF("infl", "Inflation", 3),
  ],
  run(v) {
    const today = n(v, "now") * (n(v, "replace") / 100);
    const later = today * Math.pow(1 + n(v, "infl") / 100, n(v, "years"));
    return R([
      { label: "Retirement spending in today's dollars", value: usd(today) },
      { label: "That spending on the year you retire", value: usd(later), strong: true },
    ]);
  },
});

put("retireInflation", {
  fields: [
    moneyF("income", "Retirement income you need today", 60000),
    pctF("infl", "Inflation", 3),
    numF("years", "Years into retirement", 20, undefined, 0),
  ],
  run(v) {
    const later = n(v, "income") * Math.pow(1 + n(v, "infl") / 100, n(v, "years"));
    return R(
      [{ label: "Income needed then, in future dollars", value: usd(later), strong: true }],
      undefined,
      yearlySeries(n(v, "income"), n(v, "infl"), n(v, "years"), 0),
    );
  },
});

put(["savingsLast", "proceedsLast"], {
  fields: [
    moneyF("balance", "Amount", 350000),
    moneyF("spend", "Annual withdrawal", 28000),
    pctF("rate", "Expected return", 4),
    pctF("infl", "Raise the withdrawal each year by", 2),
  ],
  run(v) {
    let bal = n(v, "balance");
    let draw = n(v, "spend");
    let years = 0;
    while (bal > 0 && years < 80) {
      bal = bal * (1 + n(v, "rate") / 100) - draw;
      years += 1;
      draw *= 1 + n(v, "infl") / 100;
    }
    return R([{ label: "The money lasts about", value: years >= 80 ? "80 or more years" : `${years} years`, strong: true }]);
  },
});

put(["discretionary", "expenseTradeoff"], {
  fields: [
    moneyF("cut", "Discretionary spending per month you could save", 200),
    pctF("rate", "Return if it is saved", 7),
    numF("years", "Years", 15, undefined, 1),
  ],
  run(v) {
    const fv = futureValue(0, n(v, "rate"), Math.round(n(v, "years") * 12), n(v, "cut"));
    return R(
      [{ label: "Future value of redirecting that spending", value: usd(fv), strong: true }],
      undefined,
      yearlySeries(0, n(v, "rate"), n(v, "years"), n(v, "cut")),
    );
  },
});

export { R };
