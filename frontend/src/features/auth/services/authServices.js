import { api } from "@/core/api/api";

export const authService = {
  login: (credentials) =>
    api.postAuth("/auth/login", credentials),

  register: (payload) =>
    api.postAuth("/auth/register", payload),
};