import { Navigate } from "react-router-dom";
import { getAuthUser } from "../utils/auth";

function AdminRoute({ children }) {
  const user = getAuthUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default AdminRoute;