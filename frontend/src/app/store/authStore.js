import { create } from "zustand";
import { parseJwt } from "@/core/utils/jwt";

function normalizeRole(value) {
  if (!value) return "USER";

  const raw = String(value).trim().toUpperCase();

  if (raw.includes("ADMIN")) return "ADMIN";
  if (raw.includes("USER")) return "USER";

  return raw;
}

function buildUserFromToken(token) {
  const payload = parseJwt(token) || {};

  const role =
    payload.role ||
    payload.rol ||
    payload.authority ||
    payload.authorities?.[0] ||
    payload.roles?.[0] ||
    "USER";

  return {
    id: payload.userId || payload.id || payload.sub || "",
    email: payload.email || payload.sub || "",
    role: normalizeRole(role),
  };
}

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (token) => {
    localStorage.setItem("token", token);

    const user = buildUserFromToken(token);

    localStorage.setItem("user", JSON.stringify(user));

    set({
      token,
      user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },

  hydrate: () => {
    const token = localStorage.getItem("token");

    if (!token) {
      localStorage.removeItem("user");
      return;
    }

    try {
      const user = buildUserFromToken(token);

      localStorage.setItem("user", JSON.stringify(user));

      set({
        token,
        user,
        isAuthenticated: true,
      });
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      set({
        token: null,
        user: null,
        isAuthenticated: false,
      });
    }
  },
}));

export default useAuthStore;
