/**
 * Formatting. Kept separate from the engines so tests never depend on locale strings.
 */

const PESO = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const PLAIN = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 });

export function peso(amount: number): string {
  return PESO.format(Number.isFinite(amount) ? amount : 0);
}

export function num(value: number): string {
  return PLAIN.format(Number.isFinite(value) ? value : 0);
}

/** Millimetres to inches, decimal. */
export function inches(mm: number): string {
  return `${(mm / 25.4).toFixed(2)}"`;
}

/** Reduce a fraction of sixteenths to lowest terms. */
function reduce(sixteenths: number): { whole: number; n: number; d: number } {
  const whole = Math.floor(sixteenths / 16);
  let n = sixteenths % 16;
  let d = 16;
  while (n > 0 && n % 2 === 0) {
    n /= 2;
    d /= 2;
  }
  return { whole, n, d };
}

/** Millimetres to feet-and-inches, to the nearest 1/16. */
export function feetInches(mm: number): string {
  const totalInches = Math.round((mm / 25.4) * 16) / 16;
  const feet = Math.floor(totalInches / 12);
  const remainder = totalInches - feet * 12;
  const { whole, n, d } = reduce(Math.round(remainder * 16));
  const inchPart = n === 0 ? `${whole}"` : `${whole} ${n}/${d}"`;
  return `${feet}'-${inchPart}`;
}
