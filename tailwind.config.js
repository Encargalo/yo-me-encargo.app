/** @type {import('tailwindcss').Config} */

// Los tokens viven en constants/theme.ts y se importan aquí, de modo que la
// paleta se define una sola vez y no hay que sincronizar dos archivos a mano.
// La extensión .ts es obligatoria: Node no la prueba al resolver un require.
const {
  Colors,
  OrderStatusColors,
  FontFamilies,
  Radius,
  Spacing,
} = require("./constants/theme.ts");

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Los tokens se exponen en kebab-case porque es la convención de las
      // clases de utilidad (`text-texto-suave`, no `text-textoSuave`).
      colors: {
        marca: Colors.marca,
        "marca-oscura": Colors.marcaOscura,
        "marca-clara": Colors.marcaClara,
        contraste: Colors.contraste,
        "contraste-suave": Colors.contrasteSuave,
        exito: Colors.exito,
        error: Colors.error,
        texto: Colors.texto,
        "texto-suave": Colors.textoSuave,
        "texto-tenue": Colors.textoTenue,
        borde: Colors.borde,
        "borde-suave": Colors.bordeSuave,
        superficie: Colors.superficie,
        "superficie-tenue": Colors.superficieTenue,
        fondo: Colors.fondo,
        piel: Colors.piel,
        status: OrderStatusColors,
      },
      fontFamily: {
        heading: [FontFamilies.heading],
        "heading-semibold": [FontFamilies.headingSemiBold],
        "heading-bold": [FontFamilies.headingBold],
        body: [FontFamilies.body],
        subtitle: [FontFamilies.subtitle],
        // El System Design no define una monoespaciada; se conserva la del
        // sistema para las etiquetas tipo "eyebrow" que ya la usaban.
        mono: ["monospace"],
      },
      borderRadius: {
        md: `${Radius.md}px`,
        lg: `${Radius.lg}px`,
      },
      spacing: {
        sm: `${Spacing.sm}px`,
        md: `${Spacing.md}px`,
      },
    },
  },
  plugins: [],
};
