import apiClient from "@/lib/axios";

import type { SignInRiderRequest } from "../types/auth.types";

export async function signInRider(
  payload: SignInRiderRequest,
): Promise<void> {
  await apiClient.post<string>("/auth/sign-in/riders", payload);
}
