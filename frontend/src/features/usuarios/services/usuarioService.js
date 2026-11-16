import { api } from "@/core/api/api";

export const usuarioService = {
  getAll: () => api.get("/usuarios"),
  getById: (id) => api.get(`/usuarios/${id}`),
  updateRole: (id, rol) => api.put(`/usuarios/${id}/rol`, { rol }),
};
