import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="unauth-page">
      <div className="unauth-box">
        <div className="unauth-icon">
          <span className="material-symbols-outlined" style={{ fontSize: 32 }}>lock</span>
        </div>

        <h1 className="unauth-title">Acceso denegado</h1>
        <p className="unauth-sub">
          No tienes los permisos necesarios para acceder a esta sección.
          Contacta al administrador si crees que esto es un error.
        </p>

        <button
          className="btn-primary"
          onClick={() => navigate('/dashboard')}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
}
