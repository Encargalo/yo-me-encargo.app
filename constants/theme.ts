// Fuente única de verdad visual de la app, derivada del System Design de
// YoMeEncargo en Figma (fileKey B51r7Cg37bv7znMRiqk7vs, página Components).
//
// `tailwind.config.js` importa estos mismos valores para generar las clases de
// NativeWind, así que no hay que sincronizar nada a mano: aquí se cambia una vez
// y las utilidades quedan actualizadas.
//
// Los tokens se nombran por rol (marca, contraste, éxito…) y no por color. El
// propio Figma demuestra el problema del nombre literal: su swatch "Naranja
// Claro" contiene un azul y el rótulo "Principal F83D25" quedó desincronizado
// del fill azul real.

// Paleta cruda del System Design. Solo debería usarse a través de los tokens
// semánticos de abajo; se exporta para los casos que necesitan un tono concreto.
export const Palette = {
  azul: "#2563eb", // Colors/Primary
  azulIntenso: "#1d4ed8", // Colors/BlueDeep
  azulClaro: "#60a5fa", // Colors/LightBlue (rotulado "Naranja Claro" en Figma)
  ambar: "#f7aa28", // Colors/Contrans
  amarilloClaro: "#fef3c7", // Colors/LightYellow
  gris: "#bdbdbd", // Colors/Grey
  grisSuave: "#f4f4f5", // Colors/SoftGray
  blanco: "#fbfbfb", // Colors/White
  blancoPuro: "#ffffff", // Colors/PureWhite
  verde: "#09e55b", // Colors/GreenSuccess
  rojo: "#dc2626", // Colors/RedError
  piel: "#f5c2a0", // Colors/SkinTone
  negroSuave: "#1a1a1a", // Colors/SoftBlack
  grisMedio: "#707070", // rótulos de la sección Colores de Figma
} as const;

// Tokens semánticos: el rol que cumple cada color en la interfaz.
export const Colors = {
  marca: Palette.azul,
  marcaOscura: Palette.azulIntenso,
  marcaClara: Palette.azulClaro,
  contraste: Palette.ambar,
  contrasteSuave: Palette.amarilloClaro,
  exito: Palette.verde,
  error: Palette.rojo,
  texto: Palette.negroSuave,
  // Texto secundario. La paleta de swatches solo ofrece `gris` (#bdbdbd), que
  // sobre blanco da 2.2:1 de contraste y no es legible como texto; `grisMedio`
  // llega a 4.7:1 y cumple WCAG AA. `textoTenue` queda para placeholders e
  // iconos inactivos, donde el contraste reducido es intencional.
  textoSuave: Palette.grisMedio,
  textoTenue: Palette.gris,
  borde: Palette.gris,
  bordeSuave: Palette.grisSuave,
  superficie: Palette.blancoPuro,
  superficieTenue: Palette.blanco,
  fondo: Palette.grisSuave,
  piel: Palette.piel,
} as const;

// Colores de estado de una orden.
//
// `enroute` usa Azul Intenso y no el azul de marca a propósito: `app-navigation`
// exige que ningún color de estado aparezca en la tab bar, y con la marca en
// azul esa separación se perdería si ambos usaran el mismo tono.
export const OrderStatusColors = {
  pending: Palette.ambar,
  enroute: Palette.azulIntenso,
  completed: Palette.verde,
  error: Palette.rojo,
} as const;

// Acento decorativo, NO derivado del System Design: solo para el borde animado
// del botón "Registrarme como conductor". No usar como color de UI ni de estado.
export const NeonAccent = {
  coral: "#F83D25",
  violet: "#7C3AED",
} as const;

// Gradiente de marca. Figma lo define a 135.93°, que en los vectores que espera
// `LinearGradient` de expo-linear-gradient equivale a una diagonal de la esquina
// superior izquierda a la inferior derecha.
export const Gradient = {
  colors: [Palette.azulIntenso, Palette.azul, Palette.azulClaro],
  locations: [0.064, 0.438, 1],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
} as const;

// Nombres con los que `useFonts` registra cada archivo en app/_layout.tsx.
// Son idénticos en Android e iOS porque los define quien llama al hook.
export const FontFamilies = {
  heading: "PlusJakartaSans-Regular",
  headingSemiBold: "PlusJakartaSans-SemiBold",
  headingBold: "PlusJakartaSans-Bold",
  body: "Inter-Regular",
  subtitle: "Manrope-Medium",
} as const;

// Escala tipográfica del System Design.
export const Typography = {
  header1: { fontFamily: FontFamilies.headingBold, fontSize: 20 },
  header2: { fontFamily: FontFamilies.headingSemiBold, fontSize: 16 },
  h2: { fontFamily: FontFamilies.headingSemiBold, fontSize: 32 },
  h3: { fontFamily: FontFamilies.heading, fontSize: 32 },
  subtitle: { fontFamily: FontFamilies.subtitle, fontSize: 32 },
  textRegular: { fontFamily: FontFamilies.body, fontSize: 12 },
} as const;

export const Radius = {
  md: 12,
  lg: 20,
} as const;

export const Spacing = {
  sm: 10,
  md: 12,
} as const;
