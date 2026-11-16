import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useReservas } from '@/features/reservations/hooks/useReservas';
import useAuthStore from '@/app/store/authStore';
import TablaReservas from "../components/TableReservation/TableReservation";

function StatCard({ icono, label, value, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={accent ? { background: accent + '20', color: accent } : {}}>
        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{icono}</span>
      </div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}

function Reservations() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { reservas, loading, error } = useReservas();
  const isAdmin = user?.role === 'ADMIN';

  const reservasOrdenadas = useMemo(() => {
    const base = isAdmin
      ? reservas
      : reservas.filter((r) => r.idUsuario === user?.id);
    return [...base].sort((a, b) => {
      const fa = new Date(`${a.fecha}T${a.horaInicio}`);
      const fb = new Date(`${b.fecha}T${b.horaInicio}`);
      return fa - fb;
    });
  }, [reservas, user, isAdmin]);

  const hoy = new Date();
  const hoyStr = hoy.toISOString().split("T")[0];

  const totalReservas = isAdmin ? reservas.length : reservasOrdenadas.length;
  const proximas = reservasOrdenadas.filter((item) => {
    const fh = new Date(`${item.fecha}T${item.horaInicio}`);
    return fh >= hoy;
  }).length;
  const pendientes = reservasOrdenadas.filter((item) => item.estado === "PENDIENTE").length;

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isAdmin ? 'Gestión de Reservas' : 'Mis Reservas'}
          </h1>
          <p className="page-subtitle">
            {isAdmin
              ? 'Administra y supervisa todas las reservaciones del complejo.'
              : 'Consulta y gestiona las reservas asociadas a tu cuenta.'}
          </p>
        </div>

        {/* Desktop CTA */}
        <button
          className="btn-primary"
          onClick={() => navigate("/dashboard/reservas/nueva")}
          style={{ flexShrink: 0 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Nueva Reserva
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          icono="event_note"
          label={isAdmin ? 'Total Reservas' : 'Mis Reservas'}
          value={String(totalReservas)}
        />
        <StatCard
          icono="upcoming"
          label="Próximas"
          value={String(proximas)}
          accent="var(--color-primary)"
        />
        <StatCard
          icono="pending_actions"
          label="Pendientes"
          value={String(pendientes)}
          accent="var(--color-pending)"
        />
      </div>

      {/* Table */}
      <TablaReservas
        reservas={reservasOrdenadas}
        loading={loading}
        error={error}
        authUser={user}
      />

      {/* FAB for mobile */}
      <button
        className="fab"
        onClick={() => navigate("/dashboard/reservas/nueva")}
        aria-label="Nueva reserva"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 26 }}>add</span>
      </button>
    </>
  );
}

export default Reservations;
