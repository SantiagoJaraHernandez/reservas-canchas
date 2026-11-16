import { api } from "@/core/api/api";

export const pagoService = {
  getAll: () => api.get("/pagos"),
  getById: (id) => api.get(`/pagos/${id}`),
  getByReserva: (idReserva) => api.get(`/pagos/reserva/${idReserva}`),
  simular: (payload) => api.post("/pagos/simular", payload),
  updateEstado: (id, estado) => api.patch(`/pagos/${id}/estado?estado=${encodeURIComponent(estado)}`),
};
