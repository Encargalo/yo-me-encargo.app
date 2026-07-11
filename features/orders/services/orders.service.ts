import apiClient from "@/lib/axios";

// Errores tipados como AxiosError: no se capturan acá, el hook orquestador
// (`useOrderDetail`) lee `error.response?.status` para mostrar el mensaje
// inline específico de cada código (400/404/409/422).
export async function confirmDelivery(id: string, code: string): Promise<void> {
  await apiClient.post<unknown>(`/orders/${id}/confirm-delivery`, { code });
}
