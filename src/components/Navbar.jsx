import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'


export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const links = [
    { to: '/catalogue', label: 'Catalogue' },
    { to: '/ma-veille', label: 'Ma veille' },
    { to: '/favoris', label: 'Favoris' },
  ]
  if (user?.role === 'admin') links.push({ to: '/admin', label: '⚙ Admin' })

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/catalogue" className="navbar-brand">
          <span className="navbar-dot" />
          <span className="navbar-name">Conseil<em>&amp;</em>Co</span>
        </Link>

        <div className="navbar-links">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`navbar-link${location.pathname === l.to ? ' active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="navbar-user">
          <span className="navbar-username">{user?.name?.split(' ')[0]}</span>
          <Link
            to="/parametres"
            className={`navbar-icon-link${location.pathname === '/parametres' ? ' active' : ''}`}
            title="Paramètres"
            aria-label="Paramètres"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
          </Link>
          <button className="navbar-logout" onClick={handleLogout}>Déconnexion</button>
        </div>
      </div>

      <style>{`
        .navbar { background: var(--color-surface); border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 100; }
        .navbar-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; height: 60px; display: flex; align-items: center; gap: 2rem; }
        .navbar-brand { display: flex; align-items: center; gap: 8px; text-decoration: none; flex-shrink: 0; }
        .navbar-dot { width: 8px; height: 8px; background: var(--color-accent-light); border-radius: 50%; }
        .navbar-name { font-family: var(--font-display); font-size: 1.1rem; color: var(--color-accent); }
        .navbar-name em { font-style: italic; color: var(--color-accent-light); }
        .navbar-links { display: flex; gap: 0.2rem; flex: 1; }
        .navbar-link { text-decoration: none; color: var(--color-text-muted); font-size: 0.88rem; font-weight: 500; padding: 6px 12px; border-radius: 6px; transition: color 0.15s, background 0.15s; }
        .navbar-link:hover { color: var(--color-text); background: var(--color-accent-muted); }
        .navbar-link.active { color: var(--color-accent); background: var(--color-accent-muted); font-weight: 600; }
        .navbar-user { display: flex; align-items: center; gap: 1rem; flex-shrink: 0; }
        .navbar-username { font-size: 0.88rem; font-weight: 500; color: var(--color-text); }
        .navbar-icon-link { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 8px; color: var(--color-text-muted); text-decoration: none; transition: color 0.15s, background 0.15s; }
        .navbar-icon-link:hover { color: var(--color-text); background: var(--color-accent-muted); }
        .navbar-icon-link.active { color: var(--color-accent); background: var(--color-accent-muted); }
        .navbar-logout { background: none; border: 1px solid var(--color-border); color: var(--color-text-muted); font-size: 0.82rem; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-family: var(--font-body); transition: border-color 0.15s, color 0.15s; }
        .navbar-logout:hover { border-color: var(--color-accent); color: var(--color-accent); }
      `}</style>
    </nav>
  )
}