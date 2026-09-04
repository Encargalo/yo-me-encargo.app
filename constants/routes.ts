export const ROUTES = {
  AUTH: {
    SELECT_MODE: "/select-mode",
    LOGIN: "/login",
    LOGIN_PHONE: "/login/phone",
    PASSENGER_SOON: "/passenger-soon",
    REGISTER_RIDER_SOON: "/register-rider-soon",
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
