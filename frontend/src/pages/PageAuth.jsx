import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { inputAuth } from '../utils/FormInputAut';

function PageAuth({ modo }) {
  const navigate = useNavigate();
  const { login, register, loading, error } = useAuth();

  const {
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    setValue: setRegisterValue,
  } = useForm({ defaultValues: { nombre: '', email: '', password: '' } });

  const {
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    setValue: setLoginValue,
  } = useForm({ defaultValues: { email: '', password: '' } });

  async function onRegister(data) {
    try { await register(data); navigate('/login'); } catch (err) { console.error(err); }
  }

  async function onLogin(data) {
    try { await login(data); navigate('/dashboard'); } catch (err) { console.error(err); }
  }

  const fields    = modo === 'register' ? inputAuth[0] : inputAuth[1];
  const errors    = modo === 'register' ? registerErrors : loginErrors;
  const onSubmit  = modo === 'register' ? handleRegisterSubmit(onRegister) : handleLoginSubmit(onLogin);
  const onChange  = (campo, valor) =>
    modo === 'register'
      ? setRegisterValue(campo, valor, { shouldValidate: true })
      : setLoginValue(campo, valor, { shouldValidate: true });

  return (
    <div className="auth-page">
      {/* Visual Side */}
      <div className="auth-visual">
        <div className="auth-visual-bg" />
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <span className="auth-visual-tag">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>sports_soccer</span>
            SoccerField Manager
          </span>
          <h1 className="auth-visual-headline">
            Gestiona tus canchas<br />con facilidad y eficiencia
          </h1>
          <p className="auth-visual-sub">
            Reservas, horarios y administración de canchas deportivas en un solo lugar.
            Diseñado para equipos y complejos deportivos modernos.
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-side">
        <div className="auth-form-box">
          {/* Logo */}
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>sports_soccer</span>
            </div>
            <span className="auth-logo-name">
              Soccer<span>Field</span>
            </span>
          </div>

          {/* Heading */}
          <h2 className="auth-heading">
            {modo === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
          </h2>
          <p className="auth-sub">
            {modo === 'login'
              ? 'Ingresa tus credenciales para continuar'
              : 'Completa el formulario para registrarte'}
          </p>

          {/* Form */}
          <form onSubmit={onSubmit}>
            {fields.map((input) => (
              <div className="form-group" key={input.name}>
                <label className="form-label" htmlFor={input.name}>{input.label}</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon" style={{ fontSize: 18 }}>
                    {input.icono}
                  </span>
                  <input
                    id={input.name}
                    type={input.type}
                    placeholder={input.placeholder}
                    className={`form-input ${errors[input.name] ? 'error' : ''}`}
                    onChange={(e) => onChange(input.name, e.target.value)}
                  />
                </div>
                {errors[input.name] && (
                  <p className="field-error">{errors[input.name]?.message || 'Campo requerido'}</p>
                )}
              </div>
            ))}

            {error && (
              <div style={{
                background: 'var(--color-cancelled-bg)',
                border: '1px solid #FCA5A5',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                fontSize: 13,
                color: 'var(--color-cancelled)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading && (
                <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>
                  progress_activity
                </span>
              )}
              {loading
                ? (modo === 'login' ? 'Ingresando...' : 'Registrando...')
                : (modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta')}
            </button>
          </form>

          {/* Footer link */}
          <p className="auth-divider" style={{ marginTop: '1.5rem' }}>
            {modo === 'login' ? (
              <>¿No tienes cuenta?{' '}
                <span className="auth-link" onClick={() => navigate('/register')}>
                  Regístrate gratis
                </span>
              </>
            ) : (
              <>¿Ya tienes cuenta?{' '}
                <span className="auth-link" onClick={() => navigate('/login')}>
                  Inicia sesión
                </span>
              </>
            )}
          </p>

          {modo === 'register' && (
            <p className="auth-terms">
              Al registrarte aceptas nuestros{' '}
              <span className="auth-link">Términos de Servicio</span> y la{' '}
              <span className="auth-link">Política de Privacidad</span>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PageAuth;
