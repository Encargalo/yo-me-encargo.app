/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#fc6b2b",
        status: {
          pending: "#f59e0b",
          enroute: "#3b82f6",
          completed: "#22c55e",
          error: "#ef4444",
        },
        // Paleta neutra del sistema visual de riders (docs/wireframes/).
        // Debe mantenerse en sync con `Neutrals` en constants/theme.ts.
        ink: "#2a2a2a", // texto principal, botón primario, marcador rider
        body: "#6b685f", // cuerpo, notas
        muted: "#8d8a81", // subtítulos, direcciones
        label: "#9b988f", // eyebrows mono
        placeholder: "#a9a69d", // placeholder / ítem inactivo
        line: "#cbc8c0", // borde de inputs y pastillas
        hair: "#d8d5cd", // borde de tarjetas/paneles
        card: "#fbfbf9", // superficie de tarjeta / marco
        block: "#f2f0ea", // cajas destacadas neutras
        canvas: "#faf9f5", // fondo de pantalla (papel cálido)
      },
      fontFamily: {
        mono: ["monospace"],
      },
    },
  },
  plugins: [],
};
