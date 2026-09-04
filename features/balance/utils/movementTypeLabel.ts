// El backend manda `movement_type` como slug interno (confirmado en staging:
// "ride_bank" para la comisión de una carrera entregada) — nunca se muestra
// crudo al rider. Mapeo conocido + fallback "humanizado" (snake_case → frase
// en minúsculas con la primera letra en mayúscula) para tipos aún no vistos.
const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  ride_bank: "Carrera",
};

function humanize(raw: string): string {
  const words = raw.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function getMovementTypeLabel(movementType: string): string {
  return MOVEMENT_TYPE_LABELS[movementType] ?? humanize(movementType);
}
