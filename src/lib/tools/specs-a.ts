import {
  futureValue,
  moneyF,
  monthPhrase,
  n,
  numF,
  paymentFor,
  pctF,
  pctStr,
  plain,
  usd,
  yearlySeries,
  amortize,
  type Spec,
} from "./money";

export const specsA: Record<string, Spec> = {
  inflation: {
    fields: [
      moneyF("spend", "Annual spending today", 60000),
      pctF("infl", "Inflation rate per year", 3),
      numF("years", "Years", 10, undefined, 0),
      moneyF("then", "Amount of money back then (optional)", 0, "For a purchasing-power comparison. Leave 0 to skip."),
    ],
    run(v) {
      const years = n(v, "years");
      const factor = Math.pow(1 + n(v, "infl") / 100, years);
      const future = n(v, "spend") * factor;
      const rows = [
        { label: "Same lifestyle would cost", value: usd(future), strong: true },
        { label: "Today's dollars buy this share of that lifestyle", value: pctStr(factor === 0 ? 0 : 100 / factor) },
      ];
      if (n(v, "then") > 0) {
        rows.push({ label: "That older amount is worth about this much today", value: usd(n(v, "then") * factor) });
      }
      return { rows, series: yearlySeries(n(v, "spend"), n(v, "infl"), years, 0).map((p, i) => ({ ...p, label: `Year ${i + 1} cost` })) };
    },
  },
  cashflow: {
    fields: [
      moneyF("wages", "Wages and salary (annual)", 85000),
      moneyF("otherIn", "Other income (annual)", 0),
      moneyF("housing", "Housing (annual)", 24000),
      moneyF("living", "Food, transport, utilities (annual)", 18000),
      moneyF("debt", "Debt payments (annual)", 6000),
      moneyF("otherOut", "Everything else (annual)", 8000),
    ],
    run(v) {
      const income = n(v, "wages") + n(v, "otherIn");
      const expenses = n(v, "housing") + n(v, "living") + n(v, "debt") + n(v, "otherOut");
      const net = income - expenses;
      return {
        rows: [
          { label: "Income", value: usd(income) },
          { label: "Expenses", value: usd(expenses) },
          { label: net >= 0 ? "Annual surplus" : "Annual shortfall", value: usd(net), strong: true },
          { label: "Monthly surplus or shortfall", value: usd(net / 12) },
          { label: "Share of income spent", value: income > 0 ? pctStr((expenses / income) * 100) : "—" },
        ],
      };
    },
  },
  spending: {
    fields: [
      moneyF("income", "Monthly take-home pay", 5500),
      moneyF("housing", "Housing", 1800),
      moneyF("food", "Food", 700),
      moneyF("transport", "Transportation", 450),
      moneyF("debt", "Debt payments", 400),
      moneyF("other", "Other spending", 600),
    ],
    run(v) {
      const spent = n(v, "housing") + n(v, "food") + n(v, "transport") + n(v, "debt") + n(v, "other");
      const left = n(v, "income") - spent;
      return {
        rows: [
          { label: "Monthly spending", value: usd(spent), strong: true },
          { label: "Left after spending", value: usd(left) },
          { label: "Spending as a share of take-home", value: n(v, "income") > 0 ? pctStr((spent / n(v, "income")) * 100) : "—" },
        ],
      };
    },
  },
  emergency: {
    fields: [
      moneyF("essential", "Essential monthly expenses", 4000),
      numF("months", "Months of reserves you want", 6, "Three to six months is the usual planning range.", 0),
      moneyF("saved", "Liquid savings already set aside", 5000),
      numF("fill", "Months you want to take to fill the gap", 12, undefined, 1),
    ],
    run(v) {
      const target = n(v, "essential") * n(v, "months");
      const gap = Math.max(0, target - n(v, "saved"));
      return {
        rows: [
          { label: "Reserve target", value: usd(target), strong: true },
          { label: "Still to save", value: usd(gap) },
          { label: "Monthly savings to fill the gap", value: usd(gap / Math.max(1, n(v, "fill"))) },
        ],
      };
    },
  },
  debtOrInvest: {
    fields: [
      moneyF("extra", "Extra money each month", 300),
      moneyF("balance", "Debt balance", 8000),
      pctF("debtRate", "Interest rate on the debt", 18),
      pctF("invest", "Expected annual return if invested", 7),
      pctF("tax", "Tax rate on investment earnings", 22),
      numF("years", "Years", 5, undefined, 1),
    ],
    run(v) {
      const afterTax = n(v, "invest") * (1 - n(v, "tax") / 100);
      const months = Math.round(n(v, "years") * 12);
      const invested = futureValue(0, afterTax, months, n(v, "extra"));
      const pay = paymentFor(n(v, "balance"), n(v, "debtRate"), months);
      const interestIfMin = amortize(n(v, "balance"), n(v, "debtRate"), Math.max(pay, n(v, "extra"))).interest;
      const faster = amortize(n(v, "balance"), n(v, "debtRate"), pay + n(v, "extra"));
      const interestSaved = Number.isFinite(interestIfMin) && Number.isFinite(faster.interest) ? Math.max(0, interestIfMin - faster.interest) : 0;
      const preferDebt = n(v, "debtRate") > afterTax;
      return {
        rows: [
          { label: "After-tax investment return", value: pctStr(afterTax) },
          { label: "If invested, that monthly amount grows to", value: usd(invested) },
          { label: "Lean toward", value: preferDebt ? "Paying the debt — its rate is higher than the after-tax return" : "Investing — the after-tax return is higher than the debt rate", strong: true },
          { label: "Interest the extra payment could avoid over the term (sketch)", value: usd(interestSaved) },
        ],
        note: "A higher debt rate usually wins over a taxable investment. This ignores employer matches, penalties, and whether the interest is deductible.",
      };
    },
  },
  withdrawals: {
    fields: [
      moneyF("balance", "Savings", 400000),
      moneyF("withdraw", "Withdrawal each year", 24000),
      pctF("rate", "Expected annual return", 5),
      pctF("infl", "Increase the withdrawal each year by", 2),
    ],
    run(v) {
      let bal = n(v, "balance");
      let draw = n(v, "withdraw");
      let years = 0;
      const series: { label: string; value: number }[] = [];
      while (bal > 0 && years < 80) {
        bal = bal * (1 + n(v, "rate") / 100) - draw;
        years += 1;
        draw *= 1 + n(v, "infl") / 100;
        if (years <= 40) series.push({ label: `Year ${years}`, value: Math.max(0, bal) });
        if (bal <= 0) break;
      }
      return {
        rows: [
          { label: "Savings last about", value: years >= 80 ? "80+ years" : `${years} years`, strong: true },
          { label: "First-year withdrawal rate", value: n(v, "balance") > 0 ? pctStr((n(v, "withdraw") / n(v, "balance")) * 100) : "—" },
        ],
        series,
      };
    },
  },
  spouseWork: {
    fields: [
      moneyF("gross", "Second salary (annual)", 45000),
      pctF("tax", "Tax and payroll rate on that salary", 25),
      moneyF("care", "Child care and extra household costs", 12000),
      moneyF("commute", "Commuting and work costs", 3000),
      moneyF("benefits", "Benefits you would otherwise pay for", 4000),
    ],
    run(v) {
      const tax = n(v, "gross") * (n(v, "tax") / 100);
      const net = n(v, "gross") - tax - n(v, "care") - n(v, "commute") + n(v, "benefits");
      return {
        rows: [
          { label: "Taxes and payroll at the rate you entered", value: usd(tax) },
          { label: "Net contribution to the household", value: usd(net), strong: true },
          { label: "Monthly net", value: usd(net / 12) },
        ],
        note: "Benefits entered as a savings (health insurance you no longer buy, for example) increase the net. A negative result means the costs outweigh the paycheck at these figures.",
      };
    },
  },
  networth: {
    fields: [
      moneyF("cash", "Cash and bank accounts", 12000),
      moneyF("invest", "Investments and retirement accounts", 80000),
      moneyF("home", "Home and other property", 250000),
      moneyF("otherA", "Other assets", 15000),
      moneyF("mortgage", "Mortgage", 180000),
      moneyF("loans", "Student, auto, and personal loans", 12000),
      moneyF("cards", "Credit cards", 3000),
      moneyF("otherL", "Other debts", 0),
    ],
    run(v) {
      const assets = n(v, "cash") + n(v, "invest") + n(v, "home") + n(v, "otherA");
      const debts = n(v, "mortgage") + n(v, "loans") + n(v, "cards") + n(v, "otherL");
      return {
        rows: [
          { label: "Assets", value: usd(assets) },
          { label: "Debts", value: usd(debts) },
          { label: "Net worth", value: usd(assets - debts), strong: true },
        ],
      };
    },
  },
  projectedNetworth: {
    fields: [
      moneyF("assets", "Assets today", 200000),
      pctF("assetGrow", "Expected growth on assets", 5),
      moneyF("debts", "Debts today", 150000),
      pctF("debtRate", "Average interest rate on debts", 6),
      moneyF("save", "New savings each year", 8000),
      moneyF("pay", "Extra debt principal paid each year", 3000),
      numF("years", "Years", 10, undefined, 0),
    ],
    run(v) {
      let assets = n(v, "assets");
      let debts = n(v, "debts");
      const years = Math.round(n(v, "years"));
      for (let i = 0; i < years; i += 1) {
        assets = assets * (1 + n(v, "assetGrow") / 100) + n(v, "save");
        debts = Math.max(0, debts * (1 + n(v, "debtRate") / 100) - n(v, "pay"));
      }
      return {
        rows: [
          { label: "Projected assets", value: usd(assets) },
          { label: "Projected debts", value: usd(debts) },
          { label: "Projected net worth", value: usd(assets - debts), strong: true },
        ],
      };
    },
  },
  expenseTradeoff: {
    fields: [
      moneyF("cut", "Monthly expense you could drop", 150),
      pctF("rate", "Return if that money is invested", 7),
      numF("years", "Years", 15, undefined, 1),
    ],
    run(v) {
      const fv = futureValue(0, n(v, "rate"), Math.round(n(v, "years") * 12), n(v, "cut"));
      return {
        rows: [
          { label: "Amount redirected each year", value: usd(n(v, "cut") * 12) },
          { label: "What it could grow to", value: usd(fv), strong: true },
        ],
        series: yearlySeries(0, n(v, "rate"), n(v, "years"), n(v, "cut")),
      };
    },
  },
  collegeSave: {
    fields: [
      moneyF("cost", "Annual college cost today", 28000),
      numF("collegeYears", "Years of college", 4, undefined, 1),
      numF("until", "Years until college starts", 10, undefined, 0),
      pctF("infl", "College cost inflation", 4),
      moneyF("saved", "Already saved", 10000),
      pctF("rate", "Expected return while saving", 6),
    ],
    run(v) {
      const until = n(v, "until");
      const years = Math.max(1, Math.round(n(v, "collegeYears")));
      let total = 0;
      for (let y = 0; y < years; y += 1) total += n(v, "cost") * Math.pow(1 + n(v, "infl") / 100, until + y);
      const grown = futureValue(n(v, "saved"), n(v, "rate"), Math.round(until * 12), 0);
      const gap = Math.max(0, total - grown);
      const monthly = until <= 0 ? gap : paymentFor(gap / Math.pow(1 + n(v, "rate") / 100 / 12, 0) , 0, 1);
      const needMonthly = until <= 0 ? gap : (() => {
        const r = n(v, "rate") / 100 / 12;
        const m = Math.round(until * 12);
        if (m <= 0) return gap;
        if (r === 0) return gap / m;
        const factor = (Math.pow(1 + r, m) - 1) / r;
        return gap / factor;
      })();
      return {
        rows: [
          { label: "Projected total college cost", value: usd(total), strong: true },
          { label: "Current savings grow to", value: usd(grown) },
          { label: "Gap to fill", value: usd(gap) },
          { label: "Monthly savings that would close the gap", value: usd(needMonthly) },
        ],
        note: monthly ? undefined : undefined,
      };
    },
  },
  collegeWhen: {
    fields: [
      moneyF("cost", "Annual college cost today", 28000),
      numF("collegeYears", "Years of college", 4, undefined, 1),
      numF("until", "Years until college if you start now", 12, undefined, 1),
      pctF("infl", "College cost inflation", 4),
      pctF("rate", "Expected return", 6),
    ],
    run(v) {
      const costAt = (delay: number) => {
        const until = Math.max(0, n(v, "until") - delay);
        const years = Math.max(1, Math.round(n(v, "collegeYears")));
        let total = 0;
        for (let y = 0; y < years; y += 1) total += n(v, "cost") * Math.pow(1 + n(v, "infl") / 100, until + y);
        const m = Math.round(until * 12);
        const r = n(v, "rate") / 100 / 12;
        const monthly = m <= 0 ? total : r === 0 ? total / m : total / ((Math.pow(1 + r, m) - 1) / r);
        return { total, monthly, until };
      };
      const now = costAt(0);
      const wait2 = costAt(Math.min(2, n(v, "until")));
      const wait5 = costAt(Math.min(5, n(v, "until")));
      return {
        rows: [
          { label: "Monthly savings if you start now", value: usd(now.monthly), strong: true },
          { label: "Monthly savings if you wait 2 years", value: usd(wait2.monthly) },
          { label: "Monthly savings if you wait 5 years", value: usd(wait5.monthly) },
          { label: "Projected cost if you start now", value: usd(now.total) },
        ],
        note: "Waiting shortens the saving window and, when college is closer, also uses a slightly lower inflated cost. The monthly amount still usually jumps.",
      };
    },
  },
  studentLoan: {
    fields: [
      moneyF("balance", "Student loan balance", 35000),
      pctF("rate", "Interest rate", 6.5),
      numF("years", "Repayment years", 10, undefined, 1),
      moneyF("income", "Expected gross monthly income after school", 4500),
    ],
    run(v) {
      const months = Math.round(n(v, "years") * 12);
      const pay = paymentFor(n(v, "balance"), n(v, "rate"), months);
      const done = amortize(n(v, "balance"), n(v, "rate"), pay);
      const share = n(v, "income") > 0 ? (pay / n(v, "income")) * 100 : 0;
      return {
        rows: [
          { label: "Monthly payment", value: usd(pay), strong: true },
          { label: "Total interest", value: usd(done.interest) },
          { label: "Payment as a share of gross monthly income", value: pctStr(share) },
          { label: "A common comfort check", value: share > 15 ? "Above 15% of gross — the payment may be tight" : "At or under 15% of gross at these figures" },
        ],
        note: "Federal income-driven plans can produce a different payment. This is a standard fixed payment.",
      };
    },
  },
  coverdell: {
    fields: [
      moneyF("annual", "Annual contribution", 2000, "The Coverdell annual contribution limit is $2,000 per student."),
      numF("years", "Years of contributions", 10, undefined, 1),
      pctF("rate", "Expected annual return", 6),
      pctF("tax", "Tax rate avoided on earnings", 22),
    ],
    run(v) {
      const annual = Math.min(n(v, "annual"), 2000);
      const fv = futureValue(0, n(v, "rate"), Math.round(n(v, "years") * 12), annual / 12);
      const contributed = annual * n(v, "years");
      const earnings = Math.max(0, fv - contributed);
      return {
        rows: [
          { label: "Contribution used (capped at $2,000)", value: usd(annual) },
          { label: "Future value if used for qualified education", value: usd(fv), strong: true },
          { label: "Earnings that can come out tax-free for qualified costs", value: usd(earnings) },
          { label: "Tax that rate would be on those earnings in a taxable account", value: usd(earnings * (n(v, "tax") / 100)) },
        ],
        note: "Qualified withdrawals are tax-free. Non-qualified earnings can be taxed and penalized. Income limits can block new Coverdell contributions.",
      };
    },
  },
  plan529: {
    fields: [
      moneyF("annual", "Annual contribution", 5000),
      moneyF("now", "Balance already in the 529", 4000),
      numF("years", "Years until you start withdrawals", 12, undefined, 1),
      pctF("rate", "Expected annual return", 6),
      pctF("state", "State tax rate saved on contributions (if your state allows it)", 0),
    ],
    run(v) {
      const fv = futureValue(n(v, "now"), n(v, "rate"), Math.round(n(v, "years") * 12), n(v, "annual") / 12);
      const contributed = n(v, "now") + n(v, "annual") * n(v, "years");
      return {
        rows: [
          { label: "Projected 529 balance", value: usd(fv), strong: true },
          { label: "Of which earnings are about", value: usd(Math.max(0, fv - contributed)) },
          { label: "State tax saved on this year's contribution, if deductible", value: usd(n(v, "annual") * (n(v, "state") / 100)) },
        ],
        note: "Federal tax-free treatment applies to qualified education withdrawals. State tax treatment of contributions depends on the state. New Jersey does not currently offer a deduction for contributions.",
      };
    },
  },
  collegeValue: {
    fields: [
      moneyF("cost", "Total out-of-pocket cost of the degree", 120000),
      moneyF("extra", "Extra annual earnings you expect because of the degree", 20000),
      numF("work", "Years you expect to work after graduation", 40, undefined, 1),
    ],
    run(v) {
      const extra = n(v, "extra") * n(v, "work");
      const payback = n(v, "extra") > 0 ? n(v, "cost") / n(v, "extra") : Infinity;
      return {
        rows: [
          { label: "Extra earnings over that career", value: usd(extra), strong: true },
          { label: "Extra earnings minus the cost", value: usd(extra - n(v, "cost")) },
          { label: "Years of extra earnings to cover the cost", value: Number.isFinite(payback) ? plain(payback, 1) : "—" },
        ],
        note: "This ignores taxes, the chance of not finishing, and raises. It is a payback sketch, not a guarantee of wages.",
      };
    },
  },
  plusLoan: {
    fields: [
      moneyF("amount", "Amount borrowed", 20000),
      pctF("rate", "Interest rate", 8),
      numF("defer", "Years before repayment starts", 4, "Interest usually accrues during school.", 0),
      numF("repay", "Repayment years", 10, undefined, 1),
    ],
    run(v) {
      const atStart = futureValue(n(v, "amount"), n(v, "rate"), Math.round(n(v, "defer") * 12), 0);
      const pay = paymentFor(atStart, n(v, "rate"), Math.round(n(v, "repay") * 12));
      const done = amortize(atStart, n(v, "rate"), pay);
      return {
        rows: [
          { label: "Balance when repayment starts", value: usd(atStart) },
          { label: "Monthly payment", value: usd(pay), strong: true },
          { label: "Interest during repayment", value: usd(done.interest) },
        ],
        note: "Enter the rate from the current federal PLUS disclosure. This assumes unpaid interest is capitalized when repayment starts.",
      };
    },
  },
  housingChoice: {
    fields: [
      moneyF("homeRoom", "Live at home — room and board you would pay", 3000),
      moneyF("homeTravel", "Live at home — commuting for the year", 1500),
      moneyF("campus", "On campus — room and board for the year", 14000),
      moneyF("offRent", "Off campus — rent and utilities for the year", 12000),
      moneyF("offOther", "Off campus — food, internet, renter insurance", 4000),
    ],
    run(v) {
      const home = n(v, "homeRoom") + n(v, "homeTravel");
      const campus = n(v, "campus");
      const off = n(v, "offRent") + n(v, "offOther");
      const best = Math.min(home, campus, off);
      const name = best === home ? "Living at home" : best === campus ? "On campus" : "Off campus";
      return {
        rows: [
          { label: "Live at home", value: usd(home) },
          { label: "On campus", value: usd(campus) },
          { label: "Off campus", value: usd(off) },
          { label: "Lowest cash cost at these figures", value: name, strong: true },
        ],
      };
    },
  },
};
