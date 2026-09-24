import { useMemo, useState } from "react";
import { compute, fieldsFor } from "@/lib/tools/engine";
import type { CalcInfo } from "@/lib/tools/catalog";
import type { Field, Values } from "@/lib/tools/money";
import { EMAIL, PHONE, site } from "@/lib/site";

function defaults(fields: Field[]): Values {
  return Object.fromEntries(fields.map((field) => [field.key, field.def]));
}

export function CalculatorApp({ calc }: { calc: CalcInfo }) {
  const fields = fieldsFor(calc.kind);
  const [values, setValues] = useState<Values>(() => defaults(fields));
  const result = useMemo(() => compute(calc.kind, values), [calc.kind, values]);
  const max = Math.max(1, ...(result.series?.map((point) => point.value) ?? [1]));

  return (
    <div className="calc-app">
      <header className="calc-top">
        <a href="/">
          <img src={site.logo} alt="Your Fresh Start Solutions LLC" />
        </a>
        <p>
          <a href="/calc-section.php">All calculators</a>
          {" · "}
          <a href={calc.categoryHref}>{calc.category}</a>
        </p>
      </header>
      <main className="calc-main">
        <p className="calc-kicker">{calc.category}</p>
        <h1>{calc.title}</h1>
        <p className="calc-desc">{calc.description}</p>
        <form
          className="calc-form"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          {fields.map((field) => (
            <label key={field.key}>
              <span>{field.label}</span>
              {field.kind === "select" ? (
                <select
                  value={values[field.key] ?? field.def}
                  onChange={(event) => setValues((current) => ({ ...current, [field.key]: Number(event.target.value) }))}
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={field.min}
                  value={Number.isFinite(values[field.key]) ? values[field.key] : ""}
                  onChange={(event) => {
                    const next = event.target.value === "" ? 0 : Number(event.target.value);
                    setValues((current) => ({ ...current, [field.key]: Number.isFinite(next) ? next : 0 }));
                  }}
                />
              )}
              {field.hint ? <small>{field.hint}</small> : null}
            </label>
          ))}
          <button
            type="button"
            className="btn btn-navy"
            onClick={() => setValues(defaults(fields))}
          >
            Reset numbers
          </button>
        </form>
        <section className="calc-result" aria-live="polite">
          <h2>Result</h2>
          <dl>
            {result.rows.map((row) => (
              <div key={row.label} className={row.strong ? "is-strong" : undefined}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
          {result.series && result.series.length > 1 ? (
            <div className="calc-bars" aria-hidden="true">
              {result.series.map((point) => (
                <div key={point.label} title={`${point.label}: ${Math.round(point.value).toLocaleString("en-US")}`}>
                  <span style={{ height: `${Math.max(4, (point.value / max) * 100)}%` }} />
                </div>
              ))}
            </div>
          ) : null}
          {result.note ? <p className="calc-note">{result.note}</p> : null}
        </section>
      </main>
      <footer className="calc-foot">
        <p>
          Your Fresh Start Solutions LLC · 602 Benson Street, Camden, NJ 08109 · {PHONE} · {EMAIL}
        </p>
      </footer>
    </div>
  );
}
