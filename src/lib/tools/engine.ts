import { CALC_BY_ID, type CalcInfo } from "./catalog";
import { DISCLAIMER, type Field, type Result, type Values } from "./money";
import { specsA } from "./specs-a";
import { specsB } from "./specs-b";
import { specsC } from "./specs-c";

const SPECS = { ...specsA, ...specsB, ...specsC };

export function getCalc(id: string): CalcInfo | undefined {
  return CALC_BY_ID[id.toLowerCase()];
}

export function fieldsFor(kind: string): Field[] {
  return SPECS[kind]?.fields ?? [];
}

export function compute(kind: string, values: Values): Result {
  const spec = SPECS[kind];
  if (!spec) {
    return {
      rows: [{ label: "This calculator", value: "is not available yet" }],
      note: DISCLAIMER,
    };
  }
  const filled: Values = {};
  for (const field of spec.fields) filled[field.key] = values[field.key] ?? field.def;
  const result = spec.run(filled);
  return { ...result, note: [result.note, DISCLAIMER].filter(Boolean).join(" ") };
}

export function missingKinds(): string[] {
  const kinds = new Set(Object.values(CALC_BY_ID).map((calc) => calc.kind));
  return [...kinds].filter((kind) => !SPECS[kind]).sort();
}

export { DISCLAIMER };
