export const ROUTES = {
  AUTH: {
    LOGIN: "/login",
  },
  APP: {
    HOME: "/home",
    BALANCE: "/balance",
    // Ruta dinámica: navegar con router.push({ pathname, params: { id } })
    ORDER_DETAIL: "/orders/[id]",
  },
} as const;
