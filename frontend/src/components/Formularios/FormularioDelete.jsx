import { useState } from "react";
import { useNavigate } from "react-router-dom";

function FormularioDelete({ titulo, subTitulo, textoBoton, reserva, onDeleteReserva }) {
  const [loading, setLoading] = useState(false);
  const [errorApi, setErrorApi] = useState("");
  const navigate = useNavigate();

  async function handleDelete(e) {
    e.preventDefault();
    setLoading(true);
    setErrorApi("");
    const result = await onDeleteReserva();
    if (!result.ok) setErrorApi(result.mensaje || "Error al eliminar");
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 540, margin: '0 auto' }}>
      <div className="delete-card">
        {/* Header */}
        <div className="delete-header">
          <div className="delete-icon-wrap">
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>delete_forever</span>
          </div>
          <h2 className="delete-title">{titulo}</h2>
          <p className="delete-sub">{subTitulo}</p>
        </div>

        {/* Body */}
        <div className="delete-body">
          <div style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
          }}>
            <div className="detail-row">
              <span className="detail-label">ID Reserva</span>
              <span className="detail-value">#{reserva?.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Cancha</span>
              <span className="detail-value">Cancha {reserva?.idCancha}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Fecha</span>
              <span className="detail-value">{reserva?.fecha}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Hora inicio</span>
              <span className="detail-value">{reserva?.horaInicio?.slice(0, 5)}</span>
            </div>
            <div className="detail-row" style={{ borderBottom: 'none' }}>
              <span className="detail-label">Hora fin</span>
              <span className="detail-value">{reserva?.horaFin?.slice(0, 5)}</span>
            </div>
          </div>

          {/* Warning box */}
          <div style={{
            background: '#FFF5F5',
            border: '1px solid #FED7D7',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            fontSize: 13,
            color: '#991B1B',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            marginBottom: '1.5rem',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
              warning
            </span>
            Esta acción es permanente e irreversible. La reserva será eliminada del sistema.
          </div>

          {errorApi && (
            <div style={{
              background: 'var(--color-cancelled-bg)',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              fontSize: 13,
              color: 'var(--color-cancelled)',
              marginBottom: '1rem',
            }}>
              {errorApi}
            </div>
          )}

          <form onSubmit={handleDelete}>
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-danger"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      progress_activity
                    </span>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      delete
                    </span>
                    {textoBoton}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FormularioDelete;
