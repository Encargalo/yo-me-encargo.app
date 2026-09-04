import { withAndroidManifest } from "@expo/config-plugins";
import type { ConfigContext, ExpoConfig } from "expo/config";

// Expo carga app.json y lo pasa como `config`; aquí lo extendemos para inyectar
// la API key de Google Maps en el AndroidManifest (requerida por react-native-maps
// para renderizar los tiles en Android). Mismo patrón que encargalo-mobile-v2.
const IS_DEV = process.env.APP_VARIANT === "development";

// applicationId distinto para development build: permite instalar el build de
// desarrollo junto al de producción en el mismo dispositivo. Solo Android: el
// bundleIdentifier de iOS no admite guiones bajos, así que iOS conserva el de
// app.json (`com.yomeencargo.app`).
const ANDROID_PACKAGE_ID = IS_DEV ? "com.yo_me_encargo.app.dev" : "com.yo_me_encargo.app";

export default ({ config }: ConfigContext): ExpoConfig => {
  const baseConfig: ExpoConfig = {
    ...config,
    name: IS_DEV ? `${config.name} (Dev)` : config.name,
    android: {
      ...config.android,
      package: ANDROID_PACKAGE_ID,
    },
  } as ExpoConfig;

  return withAndroidManifest(baseConfig, (cfg) => {
    const application = cfg.modResults.manifest.application?.[0];
    if (!application) return cfg;

    if (!application["meta-data"]) {
      application["meta-data"] = [];
    }

    // Eliminar entrada previa si existe para evitar duplicados
    application["meta-data"] = application["meta-data"].filter(
      (item) => item.$["android:name"] !== "com.google.android.geo.API_KEY",
    );

    application["meta-data"].push({
      $: {
        "android:name": "com.google.android.geo.API_KEY",
        "android:value": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      },
    });

    return cfg;
  });
};
