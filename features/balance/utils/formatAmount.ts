// Formato de montos "sueltos" de Balance: símbolo al final, decimales solo si
// el valor no es un entero exacto (confirmado con el usuario: "0.54$" o "2$").
// Distinto de `formatUsd` de features/orders (símbolo adelante, siempre 2
// decimales) — ambos estilos conviven, no se unifican en este change.
export function formatAmount(value: number): string {
  const rounded = Number(value.toFixed(2));
  return `${rounded}$`;
}

// Antepone el signo tipográfico (`+`/`−`, no el guion ASCII) usado en el
// wireframe para movimientos ganados/descontados. Cero no lleva signo.
export function formatSignedAmount(value: number): string {
  const sign = value < 0 ? "−" : value > 0 ? "+" : "";
  return `${sign}${formatAmount(Math.abs(value))}`;
}
