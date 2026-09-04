// Formateo de dinero del rider en bolívares (cifra principal) con el
// equivalente en USD como subtítulo referencial. Lógica portada de
// `encargalo-mobile-v2/utils/formatters.ts` (la app de clientes, que los
// riders también usan) — se copia, no se comparte como dependencia.

function groupThousands(intDigits: string): string {
  return intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Parte entera con separador de miles ".", parte decimal con `decimalSep`
// (máx 2 decimales, sin ceros sobrantes). El redondeo solo limita el ruido de
// punto flotante a 2 decimales — no redondea a entero.
function formatNumber(value: number, decimalSep: "." | ","): string {
  const rounded = Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  const [intPart, decPart] = String(rounded).split(".");
  const grouped = groupThousands(intPart);
  return decPart ? `${grouped}${decimalSep}${decPart}` : grouped;
}

// Monto en bolívares: "3.200Bs", "1.280,5Bs". Sufijo "Bs", decimales con ",".
export function formatBs(value: number): string {
  return `${formatNumber(value, ",")}Bs`;
}

// Antepone el signo tipográfico (`+`/`−`, no el guion ASCII) para movimientos
// ganados/descontados. Cero no lleva signo.
export function formatSignedBs(value: number): string {
  const sign = value < 0 ? "−" : value > 0 ? "+" : "";
  return `${sign}${formatBs(Math.abs(value))}`;
}

// Equivalente referencial en dólares para el subtítulo: "Ref. 80$".
export function formatRef(usd: number): string {
  return `Ref. ${formatNumber(usd, ".")}$`;
}
