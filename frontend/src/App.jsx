import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import ProtectedRoute from "@/core/guards/ProtectedRoute";
import RoleGuard from "@/core/guards/RoleGuard";

import MainLayout from "@/components/Main/MainLayout";
import PageAuth from "@/pages/PageAuth";
import Reservations from "@/pages/Reservations";
import ReservationCrud from "@/pages/ReservationCrud";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import AdminCanchas from "@/pages/AdminCanchas";
import AdminUsuarios from "@/pages/AdminUsuarios";
import Pagos from "@/pages/Pagos";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton duration={4000} />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<PageAuth modo="login" />} />
        <Route path="/register" element={<PageAuth modo="register" />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<MainLayout />}>
            <Route index element={<Reservations />} />

            <Route path="reservas/nueva" element={<RoleGuard allowedRoles={["ADMIN", "USER"]}><ReservationCrud modo="crear" /></RoleGuard>} />
            <Route path="reservas/:id/editar" element={<RoleGuard allowedRoles={["ADMIN"]}><ReservationCrud modo="actualizar" /></RoleGuard>} />
            <Route path="reservas/:id/eliminar" element={<RoleGuard allowedRoles={["ADMIN"]}><ReservationCrud modo="eliminar" /></RoleGuard>} />

            <Route path="pagos" element={<RoleGuard allowedRoles={["ADMIN", "USER"]}><Pagos /></RoleGuard>} />
            <Route path="canchas" element={<RoleGuard allowedRoles={["ADMIN"]}><AdminCanchas /></RoleGuard>} />
            <Route path="usuarios" element={<RoleGuard allowedRoles={["ADMIN"]}><AdminUsuarios /></RoleGuard>} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
