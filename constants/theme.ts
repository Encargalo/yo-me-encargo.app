import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Primary = "#fc6b2b";

// Paleta neutra del sistema visual de los wireframes de riders
// (docs/wireframes/). Grises cálidos sobre papel; el color se reserva para el
// estado de la orden (OrderStatusColors). Reutilizar en todas las pantallas.
export const Neutrals = {
  ink: "#2a2a2a", // texto principal, botón primario, marcador rider
  textMedium: "#6b685f", // cuerpo, notas
  textMuted: "#8d8a81", // subtítulos, direcciones
  labelGray: "#9b988f", // eyebrows mono
  placeholder: "#a9a69d", // texto de placeholder / ítem inactivo
  borderInput: "#cbc8c0", // bordes de campos y pastillas
  borderCard: "#d8d5cd", // bordes de tarjetas/paneles
  cardBg: "#fbfbf9", // superficie de tarjeta / marco
  block: "#f2f0ea", // cajas destacadas neutras
  canvas: "#faf9f5", // fondo de pantalla (papel cálido)
  white: "#ffffff",
} as const;

// Equivalen a status.pending/enroute/completed/error en tailwind.config.js
// (para usos que no pueden usar className, ej. iconos de mapa más adelante)
export const OrderStatusColors = {
  pending: "#f59e0b",
  enroute: "#3b82f6",
  completed: "#22c55e",
  error: "#ef4444",
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
