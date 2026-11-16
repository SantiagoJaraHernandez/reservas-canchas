import { api } from "@/core/api/api";

export const reservaService = {
  getAll: () => api.get("/reservas"),

  getById: (id) => api.get(`/reservas/${id}`),

  create: (payload) => api.post("/reservas", payload),

  update: (id, payload) => api.put(`/reservas/${id}`, payload),

  delete: (id) => api.delete(`/reservas/${id}`),
};