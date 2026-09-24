import { CalculatorApp } from "@/components/CalculatorApp";
import { getCalc } from "@/lib/tools/engine";

export function CalcLoader({ search }: { search: string }) {
  const calcId = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("calc") || "";
  const calc = getCalc(calcId);
  if (!calc) {
    return (
      <main className="calc-shell">
        <p>This calculator link is missing or out of date.</p>
        <p>
          <a href="/calc-section.php">Back to the calculators</a>
        </p>
      </main>
    );
  }
  return <CalculatorApp calc={calc} />;
}
