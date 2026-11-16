import { Navigate } from "react-router-dom";
import useAuthStore from "@/app/store/authStore";

function normalizeRole(value) {
  return String(value || "").trim().toUpperCase();
}

function RoleGuard({ allowedRoles, children }) {
  const user = useAuthStore((state) => state.user);
  const userRole = normalizeRole(user?.role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (!user || !normalizedAllowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default RoleGuard;
