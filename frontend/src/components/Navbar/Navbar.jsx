import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import useAuthStore from '@/app/store/authStore';

function normalizeRole(value) {
  return String(value || '').trim().toUpperCase();
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const role = normalizeRole(user?.role);
  const isAdmin = role === 'ADMIN' || role.includes('ADMIN');
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  const navLinks = [
    { label: 'Reservas', path: '/dashboard' },
    { label: 'Pagos', path: '/dashboard/pagos' },
    ...(isAdmin
      ? [
          { label: 'Canchas', path: '/dashboard/canchas' },
          { label: 'Usuarios', path: '/dashboard/usuarios' },
        ]
      : []),
  ];

  const isActive = (path) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  return (
    <header className="nav-root">
      <div className="nav-inner">
        <button
          className="nav-brand"
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div className="nav-brand-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>sports_soccer</span>
          </div>
          <span className="nav-brand-name">Soccer<span>Field</span></span>
        </button>

        <nav className={`nav-links ${mobileOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <button
              key={link.label}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => {
                navigate(link.path);
                setMobileOpen(false);
              }}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="nav-end">
          {user?.role && (
            <span className={`role-badge ${isAdmin ? 'admin' : 'user'}`}>
              {isAdmin ? 'Admin' : 'Usuario'}
            </span>
          )}

          <div className="dropdown" ref={dropdownRef}>
            <button
              className="avatar-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Menú de usuario"
            >
              {initials}
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <p className="dropdown-email">{user?.email}</p>
                  <p className="dropdown-role">{isAdmin ? 'Administrador' : 'Usuario'}</p>
                </div>

                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/dashboard');
                    setDropdownOpen(false);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>grid_view</span>
                  Dashboard
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate('/dashboard/pagos');
                    setDropdownOpen(false);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>payments</span>
                  Pagos
                </button>

                {isAdmin && (
                  <>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/dashboard/canchas');
                        setDropdownOpen(false);
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>stadium</span>
                      Canchas
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/dashboard/usuarios');
                        setDropdownOpen(false);
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>group</span>
                      Usuarios
                    </button>
                  </>
                )}

                <button
                  className="dropdown-item danger"
                  onClick={() => {
                    handleLogout();
                    setDropdownOpen(false);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menú"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
