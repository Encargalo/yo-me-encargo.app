// Formato de montos de Balance. Desde la migración a Bs del backend
// (`fd0bb7d`), la moneda principal que ve el rider es el bolívar y el USD
// queda como referencia secundaria — mismo criterio que la app de clientes
// (`utils/formatters.ts` de encargalo.app.mobile), de donde se porta el
// formato: miles con ".", decimales con "," y sin ceros sobrantes.

function groupThousands(intDigits: string): string {
  return intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// El Math.round solo acota el ruido de punto flotante a 2 decimales — no
// redondea a entero.
export function formatAmount(value: number, decimalSep: "." | ","): string {
  const rounded = Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  const [intPart, decPart] = String(rounded).split(".");
  const grouped = groupThousands(intPart);
  return decPart ? `${grouped}${decimalSep}${decPart}` : grouped;
}

// Moneda principal: "43.505,03Bs".
export function formatBs(value: number): string {
  return `${formatAmount(value, ",")}Bs`;
}

// Referencia secundaria en USD, debajo del monto en Bs: "Ref. 54.5$".
export function formatRef(usd: number): string {
  return `Ref. ${formatAmount(usd, ".")}$`;
}

// Antepone el signo tipográfico (`+`/`−`, no el guion ASCII) usado en el
// wireframe. Cero no lleva signo. Formatea siempre el valor absoluto: el
// backend ya manda `amount_bs` con signo, y volver a anteponerlo sobre un
// número negativo produciría un doble guion.
export function formatSignedBs(value: number): string {
  const sign = value < 0 ? "−" : value > 0 ? "+" : "";
  return `${sign}${formatBs(Math.abs(value))}`;
}
