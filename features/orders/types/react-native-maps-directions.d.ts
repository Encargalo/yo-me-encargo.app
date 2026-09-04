// `react-native-maps-directions` reenvía cualquier prop extra que no
// consuma internamente al `Polyline` que renderiza (spread `...props` en
// `MapViewDirections.render()`), pero sus tipos no declaran `testID` — se
// amplía acá para poder direccionar la ruta en tests sin usar `any`.
declare module "react-native-maps-directions" {
  export interface MapViewDirectionsProps {
    testID?: string;
  }
}
