import { Tabs } from "expo-router";
import { History, Home, User, Wallet } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";

// Tab bar global de 4 secciones. Activo en azul de marca (Colors.marca),
// inactivos en gris. El color de estado (pending/enroute/…) sigue reservado a
// las órdenes: el azul de marca es distinto del azul de estado "en camino"
// (Colors.marcaOscura), justamente para que no se confundan.
// Iconos lucide (trazo): la sección activa usa un stroke más grueso.
export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.marca,
        tabBarInactiveTintColor: Colors.textoTenue,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom,
          borderTopColor: Colors.bordeSuave,
          borderTopWidth: 1,
          backgroundColor: Colors.superficie,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size, focused }) => (
            <Home color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="balance"
        options={{
          title: "Balance",
          tabBarIcon: ({ color, size, focused }) => (
            <Wallet color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: "Historial",
          tabBarIcon: ({ color, size, focused }) => (
            <History color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size, focused }) => (
            <User color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}
