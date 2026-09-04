export function withAlpha(hex: string, alpha: number): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  const clampedAlpha = Math.min(1, Math.max(0, alpha));
  if (!match) return hex;

  const num = parseInt(match[1], 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;

  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
}
