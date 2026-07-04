export const ROUTES = {
  AUTH: {
    LOGIN: "/login",
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
