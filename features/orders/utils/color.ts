// Mezcla un color hex (#rrggbb) hacia blanco. Se usa para la ruta secundaria
// entre 2 órdenes simultáneas: mantiene la identidad de color (sigue siendo
// reconocible como ámbar/azul) pero visualmente subordinada — evita depender
// de canales alfa en `Polyline`, que a diferencia de `Marker` no expone un
// prop `opacity` dedicado (ver design.md de `home-map-zoom-multi-order`).
export function lightenColor(hex: string, ratio: number): string {
  const clampedRatio = Math.min(1, Math.max(0, ratio));
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return hex;

  const num = parseInt(match[1], 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;

  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * clampedRatio);

  const toHex = (channel: number) => channel.toString(16).padStart(2, "0");

  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}
