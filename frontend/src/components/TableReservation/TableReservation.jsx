import { useNavigate } from "react-router-dom";
import useAuthStore from "@/app/store/authStore";
import { useMemo } from "react";
import { useCanchas } from "@/features/canchas/hooks/useCanchas";

function formatearFecha(fecha) {
  if (!fecha) return "—";
  const [year, month, day] = fecha.split("-");
  const fechaLocal = new Date(Number(year), Number(month) - 1, Number(day));
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short", month: "short", day: "numeric",
  }).format(fechaLocal);
}

function formatearHora(hora) {
  return hora?.slice(0, 5) || "--:--";
}

function formatearUsuario(idUsuario, authUser) {
  if (!idUsuario) return "—";
  if (authUser?.id && idUsuario === authUser.id) return "Mi reserva";
  if (idUsuario.length > 12) return `${idUsuario.slice(0, 6)}…${idUsuario.slice(-4)}`;
  return idUsuario;
}

function StatusBadge({ status }) {
  const map = {
    PAGADO:    { label: 'Pagado',    cls: 'badge-paid' },
    Pagado:    { label: 'Pagado',    cls: 'badge-paid' },
    PENDIENTE: { label: 'Pendiente', cls: 'badge-pending' },
    Pendiente: { label: 'Pendiente', cls: 'badge-pending' },
    CANCELADO: { label: 'Cancelado', cls: 'badge-cancelled' },
    Cancelado: { label: 'Cancelado', cls: 'badge-cancelled' },
  };
  const cfg = map[status] || { label: status, cls: 'badge-pending' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div className="skeleton" style={{ height: 16, borderRadius: 6, width: '60%' }} />
        </td>
      ))}
    </tr>
  );
}

function TablaReservas({ reservas = [], loading, error, authUser }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  const { canchas } = useCanchas({ soloActivas: false });

  const canchasPorId = useMemo(() => {
    return canchas.reduce((acc, cancha) => {
      acc[String(cancha.id)] = cancha;
      return acc;
    }, {});
  }, [canchas]);

  const headers = isAdmin
    ? ["#", "Usuario", "Cancha", "Fecha", "Horario", "Estado", "Acciones"]
    : ["#", "Cancha", "Fecha", "Horario", "Estado", "Acciones"];

  return (
    <div className="table-card">
      {/* Toolbar */}
      <div className="table-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--color-text-3)' }}>
            table_rows
          </span>
          <span className="table-title">
            {isAdmin ? 'Todas las reservas' : 'Mis reservas'}
          </span>
        </div>
        {!loading && !error && (
          <span className="table-count">{reservas.length} registros</span>
        )}
      </div>

      <div className="table-scroll">
        <table className="reservas">
          <thead>
            <tr>
              {headers.map((h) => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} cols={headers.length} />
            ))}

            {!loading && error && (
              <tr>
                <td colSpan={headers.length}>
                  <div className="error-state">
                    <div className="error-state-icon" style={{ color: 'var(--color-cancelled)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 28 }}>error_outline</span>
                    </div>
                    <p className="error-state-title">Error al cargar</p>
                    <p className="error-state-sub">{error}</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && reservas.length === 0 && (
              <tr>
                <td colSpan={headers.length}>
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--color-text-3)' }}>
                        event_busy
                      </span>
                    </div>
                    <p className="empty-state-title">Sin reservas</p>
                    <p className="empty-state-sub">No hay reservas registradas aún.</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error && reservas.map((reserva) => {
              const canEdit = user?.role === "ADMIN" || user?.id === reserva.idUsuario;
              const userInitials = typeof reserva.idUsuario === 'string'
                ? reserva.idUsuario.slice(0, 2).toUpperCase()
                : '?';
              const cancha = canchasPorId[String(reserva.idCancha)];

              return (
                <tr key={reserva.id}>
                  {/* ID */}
                  <td>
                    <span className="reserva-id">#{reserva.id}</span>
                  </td>

                  {/* Usuario (admin only) */}
                  {isAdmin && (
                    <td>
                      <div className="user-pill">
                        <div className="user-pill-avatar">{userInitials}</div>
                        {formatearUsuario(reserva.idUsuario, user)}
                      </div>
                    </td>
                  )}

                  {/* Cancha */}
                  <td>
                    <p className="cancha-name">{cancha?.nombre || `Cancha ${reserva.idCancha}`}</p>
                    <p className="cancha-sub">
                      {cancha ? `${cancha.tipo} · ID ${cancha.id}` : `ID ${reserva.idCancha}`}
                    </p>
                  </td>

                  {/* Fecha */}
                  <td style={{ color: 'var(--color-text-2)', fontSize: 13 }}>
                    {formatearFecha(reserva.fecha)}
                  </td>

                  {/* Horario */}
                  <td>
                    <span className="horario">
                      {formatearHora(reserva.horaInicio)} – {formatearHora(reserva.horaFin)}
                    </span>
                  </td>

                  {/* Estado */}
                  <td>
                    <StatusBadge status={reserva.estado} />
                  </td>

                  {/* Acciones */}
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-start' }}>
                      {canEdit && (
                        <>
                          <button
                            className="action-btn"
                            onClick={() => navigate(`/dashboard/reservas/${reserva.id}/editar`)}
                            title="Editar"
                            aria-label="Editar reserva"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                          </button>
                          {isAdmin && (
                            <button
                              className="action-btn danger"
                              onClick={() => navigate(`/dashboard/reservas/${reserva.id}/eliminar`)}
                              title="Eliminar"
                              aria-label="Eliminar reserva"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TablaReservas;
