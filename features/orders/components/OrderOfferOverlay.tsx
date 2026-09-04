import { useOrderOffers } from "../hooks/useOrderOffers";
import { OrderOfferModal } from "./OrderOfferModal";

/**
 * Contenedor conectado del overlay de ofertas. Monta el hook una sola vez a
 * nivel global (shell autenticado) y muestra el modal presentacional cuando hay
 * una oferta visible. Sin oferta (o en suspensión) no renderiza nada.
 */
export function OrderOfferOverlay() {
  const { offer, secondsLeft, distanceKm, accept, reject } = useOrderOffers();

  if (!offer) return null;

  return (
    <OrderOfferModal
      offer={offer}
      secondsLeft={secondsLeft}
      distanceKm={distanceKm}
      onAccept={accept}
      onReject={reject}
    />
  );
}
