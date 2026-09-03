export const ROUTES = {
  AUTH: {
    SELECT_MODE: "/select-mode",
    LOGIN: "/login",
    PASSENGER_SOON: "/passenger-soon",
  },
  APP: {
    HOME: "/home",
    BALANCE: "/balance",
    HISTORIAL: "/historial",
    PERFIL: "/perfil",
    WITHDRAWAL: "/withdrawal",
    // Ruta dinámica: navegar con router.push({ pathname, params: { id } })
    ORDER_DETAIL: "/orders/[id]",
  },
} as const;
