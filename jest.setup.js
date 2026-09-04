// Jest no inyecta variables EXPO_PUBLIC_* desde .env (eso lo hace el bundler
// de Expo en runtime real). Los tests que ejercitan `MapViewDirections`
// (ver `OrdersMap.test.tsx`) necesitan un `apikey` truthy para no cortar
// antes de intentar el fetch — se rellena solo si no hay un valor real ya
// presente (ej. inyectado por CI).
process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??= "test-google-maps-api-key";
