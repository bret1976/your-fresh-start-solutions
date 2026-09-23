import { useEffect } from "react";

export function CalcLoader({ search }: { search: string }) {
  const calc = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("calc") || "";

  useEffect(() => {
    document.title = calc ? `Calculator ${calc}` : "Financial Calculator";
    const existing = document.getElementById("calcxml-loader");
    existing?.remove();
    if (!calc) return;
    const s = document.createElement("script");
    s.id = "calcxml-loader";
    s.src = `https://www.calcxml.com/scripts/loadCalc.js?calcTarget=${encodeURIComponent(calc)}&embed=2&skn=481`;
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
  }, [calc]);

  if (!calc) {
    return (
      <main className="calc-shell">
        <p>This calculator link is missing its id.</p>
      </main>
    );
  }

  return (
    <main className="calc-shell">
      <div id="calc" />
    </main>
  );
}
