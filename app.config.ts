import { withAndroidManifest } from "@expo/config-plugins";
import type { ConfigContext, ExpoConfig } from "expo/config";

// Expo carga app.json y lo pasa como `config`; aquí lo extendemos para inyectar
// la API key de Google Maps en el AndroidManifest (requerida por react-native-maps
// para renderizar los tiles en Android). Mismo patrón que encargalo-mobile-v2.
export default ({ config }: ConfigContext): ExpoConfig => {
  return withAndroidManifest({ ...config } as ExpoConfig, (cfg) => {
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
