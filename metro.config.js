const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Expo Router empaqueta todo `app/` vía `require.context` (solo excluye
// `+api`/`+html`/`+middleware`), sin importar si el archivo se usa o no. El
// blockList por defecto de Expo solo ignora carpetas `__tests__/`, pero este
// proyecto colocaliza los tests como `Componente.test.tsx` junto al archivo
// que prueban — sin esta línea, cualquier pantalla con un test al lado
// termina arrastrando `@testing-library/react-native` (y sus dependencias de
// Node) al bundle nativo y el build truena.
config.resolver.blockList = [...config.resolver.blockList, /\.test\.[jt]sx?$/];

module.exports = withNativeWind(config, { input: "./global.css" });
