import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const API = 'http://localhost:3001'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas.')
    if (form.password.length < 6) return setError('Le mot de passe doit faire au moins 6 caractères.')
    setLoading(true)
    try {
      const res = await fetch(`${API}/users?email=${encodeURIComponent(form.email)}`)
      const existing = await res.json()
      if (existing.length > 0) {
        setError('Un compte existe déjà avec cet email.')
        setLoading(false)
        return
      }
      const newUser = {
        id: `user-${Date.now()}`,
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'user',
        subscriptions: [],
        favorites: [],
        emailAlerts: false,
        seenArticleKeys: [],
        createdAt: new Date().toISOString()
      }
      const create = await fetch(`${API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })
      const created = await create.json()
      const { password: _, ...safeUser } = created
      login(safeUser)
      navigate('/catalogue')
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
          <h1>Votre veille,<br /><em>enfin intelligente.</em></h1>
          <p>Abonnez-vous aux topics qui comptent pour vous et recevez chaque semaine une synthèse classée par pertinence.</p>
        </div>
        <div className="auth-topics-preview">
          {['Intelligence artificielle', 'ESG / RSE', 'Cybersécurité', 'Finance & marchés', 'RH & Future of work'].map(t => (
            <span key={t} className="auth-topic-pill">{t}</span>
          ))}
          <span className="auth-topic-pill auth-topic-more">+15 topics</span>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2>Créer un compte</h2>
            <p>Déjà inscrit ? <Link to="/login">Se connecter</Link></p>
          </div>

          <form onSubmit={submit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="name">Nom complet</label>
              <input id="name" name="name" type="text" placeholder="Marie Dupont" value={form.name} onChange={handle} required />
            </div>
            <div className="auth-field">
              <label htmlFor="email">Adresse email</label>
              <input id="email" name="email" type="email" placeholder="marie@cabinet.fr" value={form.email} onChange={handle} required />
            </div>
            <div className="auth-field">
              <label htmlFor="password">Mot de passe</label>
              <input id="password" name="password" type="password" placeholder="6 caractères minimum" value={form.password} onChange={handle} required />
            </div>
            <div className="auth-field">
              <label htmlFor="confirm">Confirmer le mot de passe</label>
              <input id="confirm" name="confirm" type="password" placeholder="Répéter le mot de passe" value={form.confirm} onChange={handle} required />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
        }
        .auth-left {
          width: 45%;
          background-color: var(--color-accent);
          padding: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
        }
        .auth-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .auth-logo-dot {
          width: 10px;
          height: 10px;
          background: #6EE7B7;
          border-radius: 50%;
          display: inline-block;
        }
        .auth-brand-name {
          font-family: var(--font-display);
          font-size: 1.3rem;
          letter-spacing: -0.01em;
        }
        .auth-brand-name em {
          font-style: italic;
          color: #6EE7B7;
        }
        .auth-tagline h1 {
          font-family: var(--font-display);
          font-size: 2.6rem;
          line-height: 1.15;
          font-weight: 400;
          margin-bottom: 1.2rem;
        }
        .auth-tagline h1 em {
          font-style: italic;
          color: #A7F3D0;
        }
        .auth-tagline p {
          font-size: 0.95rem;
          line-height: 1.65;
          color: rgba(255,255,255,0.7);
          max-width: 340px;
        }
        .auth-topics-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .auth-topic-pill {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.85);
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.01em;
        }
        .auth-topic-more {
          background: rgba(110,231,183,0.2);
          border-color: rgba(110,231,183,0.4);
          color: #A7F3D0;
        }
        .auth-right {
          flex: 1;
          background: var(--color-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .auth-form-card {
          width: 100%;
          max-width: 420px;
        }
        .auth-form-header {
          margin-bottom: 2rem;
        }
        .auth-form-header h2 {
          font-family: var(--font-display);
          font-size: 1.9rem;
          font-weight: 400;
          color: var(--color-text);
          margin-bottom: 0.4rem;
        }
        .auth-form-header p {
          font-size: 0.88rem;
          color: var(--color-text-muted);
        }
        .auth-form-header a {
          color: var(--color-accent-light);
          text-decoration: none;
          font-weight: 500;
        }
        .auth-form-header a:hover { text-decoration: underline; }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }
        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .auth-field label {
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--color-text);
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .auth-field input {
          background: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: 8px;
          padding: 11px 14px;
          font-size: 0.95rem;
          color: var(--color-text);
          transition: border-color 0.2s;
          outline: none;
        }
        .auth-field input:focus {
          border-color: var(--color-accent-light);
        }
        .auth-field input::placeholder { color: #B0AAA0; }
        .auth-error {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: var(--color-error);
          padding: 10px 14px;
          border-radius: 7px;
          font-size: 0.85rem;
        }
        .auth-btn {
          background: var(--color-accent);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 13px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          margin-top: 0.4rem;
        }
        .auth-btn:hover { background: var(--color-accent-light); }
        .auth-btn:active { transform: scale(0.99); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 768px) {
          .auth-left { display: none; }
          .auth-right { padding: 1.5rem; }
        }
      `}</style>
    </div>
  )
}