import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/users?email=${encodeURIComponent(form.email)}`)
      const users = await res.json()
      const found = users.find(u => u.email === form.email && u.password === form.password)
      if (!found) {
        setError('Email ou mot de passe incorrect.')
        setLoading(false)
        return
      }
      const { password: _, ...safeUser } = found
      login(safeUser)
      navigate(found.role === 'admin' ? '/admin' : '/catalogue')
    } catch {
      setError('Erreur de connexion au serveur. Vérifie que json-server tourne.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-logo-dot" />
          <span className="auth-brand-name">Conseil<em>&amp;</em>Co</span>
        </div>
        <div className="auth-tagline">
          <h1>Bienvenue<br /><em>de retour.</em></h1>
          <p>Retrouvez vos veilles, vos favoris et vos alertes personnalisées en un clic.</p>
        </div>
        <div className="auth-stats">
          <div className="auth-stat">
            <strong>20</strong>
            <span>topics de veille</span>
          </div>
          <div className="auth-stat">
            <strong>Hebdo</strong>
            <span>digest par email</span>
          </div>
          <div className="auth-stat">
            <strong>IA</strong>
            <span>scoring & résumés</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2>Se connecter</h2>
            <p>Pas encore de compte ? <Link to="/register">S'inscrire</Link></p>
          </div>

          <form onSubmit={submit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Adresse email</label>
              <input id="email" name="email" type="email" placeholder="marie@cabinet.fr" value={form.email} onChange={handle} required />
            </div>
            <div className="auth-field">
              <label htmlFor="password">Mot de passe</label>
              <input id="password" name="password" type="password" placeholder="Votre mot de passe" value={form.password} onChange={handle} required />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <Link to="/register" className="auth-btn-register">
            Créer un compte
          </Link>

          <div className="auth-hint">
            <p>Compte admin de démo :</p>
            <code>admin@conseilandco.fr / admin123</code>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page { min-height: 100vh; display: flex; }
        .auth-left {
          width: 45%;
          background-color: var(--color-accent);
          padding: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
        }
        .auth-brand { display: flex; align-items: center; gap: 10px; }
        .auth-logo-dot { width: 10px; height: 10px; background: #6EE7B7; border-radius: 50%; display: inline-block; }
        .auth-brand-name { font-family: var(--font-display); font-size: 1.3rem; letter-spacing: -0.01em; }
        .auth-brand-name em { font-style: italic; color: #6EE7B7; }
        .auth-tagline h1 { font-family: var(--font-display); font-size: 2.6rem; line-height: 1.15; font-weight: 400; margin-bottom: 1.2rem; }
        .auth-tagline h1 em { font-style: italic; color: #A7F3D0; }
        .auth-tagline p { font-size: 0.95rem; line-height: 1.65; color: rgba(255,255,255,0.7); max-width: 320px; }
        .auth-stats { display: flex; gap: 2rem; }
        .auth-stat { display: flex; flex-direction: column; gap: 3px; }
        .auth-stat strong { font-family: var(--font-display); font-size: 1.6rem; font-weight: 400; color: #A7F3D0; }
        .auth-stat span { font-size: 0.78rem; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 0.05em; }
        .auth-right { flex: 1; background: var(--color-bg); display: flex; align-items: center; justify-content: center; padding: 2rem; }
        .auth-form-card { width: 100%; max-width: 420px; }
        .auth-form-header { margin-bottom: 2rem; }
        .auth-form-header h2 { font-family: var(--font-display); font-size: 1.9rem; font-weight: 400; color: var(--color-text); margin-bottom: 0.4rem; }
        .auth-form-header p { font-size: 0.88rem; color: var(--color-text-muted); }
        .auth-form-header a { color: var(--color-accent-light); text-decoration: none; font-weight: 500; }
        .auth-form-header a:hover { text-decoration: underline; }
        .auth-form { display: flex; flex-direction: column; gap: 1.1rem; }
        .auth-field { display: flex; flex-direction: column; gap: 5px; }
        .auth-field label { font-size: 0.82rem; font-weight: 500; color: var(--color-text); letter-spacing: 0.02em; text-transform: uppercase; }
        .auth-field input { background: var(--color-surface); border: 1.5px solid var(--color-border); border-radius: 8px; padding: 11px 14px; font-size: 0.95rem; color: var(--color-text); transition: border-color 0.2s; outline: none; }
        .auth-field input:focus { border-color: var(--color-accent-light); }
        .auth-field input::placeholder { color: #B0AAA0; }
        .auth-error { background: #FEF2F2; border: 1px solid #FECACA; color: var(--color-error); padding: 10px 14px; border-radius: 7px; font-size: 0.85rem; }
        .auth-btn { background: var(--color-accent); color: white; border: none; border-radius: 8px; padding: 13px; font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: background 0.2s, transform 0.1s; margin-top: 0.4rem; width: 100%; }
        .auth-btn:hover { background: var(--color-accent-light); }
        .auth-btn:active { transform: scale(0.99); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-divider { display: flex; align-items: center; gap: 12px; margin: 1.2rem 0; color: var(--color-text-muted); font-size: 0.82rem; }
        .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--color-border); }
        .auth-btn-register { display: block; text-align: center; width: 100%; background: transparent; color: var(--color-accent); border: 1.5px solid var(--color-accent); border-radius: 8px; padding: 12px; font-size: 0.95rem; font-weight: 500; cursor: pointer; text-decoration: none; transition: background 0.2s, color 0.2s; box-sizing: border-box; }
        .auth-btn-register:hover { background: var(--color-accent-muted); }
        .auth-hint { margin-top: 1.5rem; padding: 12px 14px; background: var(--color-accent-muted); border-radius: 8px; border-left: 3px solid var(--color-accent-light); }
        .auth-hint p { font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
        .auth-hint code { font-size: 0.83rem; color: var(--color-accent); font-family: monospace; }
        @media (max-width: 768px) { .auth-left { display: none; } .auth-right { padding: 1.5rem; } }
      `}</style>
    </div>
  )
}