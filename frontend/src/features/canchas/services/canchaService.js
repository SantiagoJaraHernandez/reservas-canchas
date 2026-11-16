import { api } from "@/core/api/api";

export const canchaService = {
  getAll: () => api.get("/canchas"),
  getActivas: () => api.get("/canchas/activas"),
  getById: (id) => api.get(`/canchas/${id}`),

  create: (payload) => api.post("/canchas", payload),
  update: (id, payload) => api.put(`/canchas/${id}`, payload),
  remove: (id) => api.delete(`/canchas/${id}`),
};
