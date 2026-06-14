import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import Navbar from '../components/Navbar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Parametres() {
  const { user, login } = useAuth()
  const [emailAlerts, setEmailAlerts] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [subscribedTopics, setSubscribedTopics] = useState([])
  const [customWatches, setCustomWatches] = useState([])

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      fetch(`${API}/users/${user.id}`).then(r => r.json()),
      fetch(`${API}/topics`).then(r => r.json()),
      fetch(`${API}/customWatches?userId=${user.id}`).then(r => r.json()),
    ]).then(([userData, topics, watches]) => {
      setEmailAlerts(!!userData.emailAlerts)
      const subs = (userData.subscriptions || [])
        .map(id => topics.find(t => t.id === id))
        .filter(Boolean)
      setSubscribedTopics(subs)
      setCustomWatches(Array.isArray(watches) ? watches : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.id])

  const showToast = msg => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 2800) }

  const toggleAlerts = async () => {
    const next = !emailAlerts
    setEmailAlerts(next)
    setSaving(true)
    try {
      await fetch(`${API}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailAlerts: next })
      })
      login({ ...user, emailAlerts: next })
      showToast(next ? '✓ Alertes email activées' : '✓ Alertes email désactivées')
    } catch {
      setEmailAlerts(!next)
      showToast('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const totalWatches = subscribedTopics.length + customWatches.length

  if (loading) return (
    <div className="param-page">
      <Navbar />
      <div className="param-loading"><div className="param-spinner" /></div>
      <style>{css}</style>
    </div>
  )

  return (
    <div className="param-page">
      <Navbar />
      <div className="param-container">
        <h1 className="param-title">Paramètres</h1>
        <p className="param-subtitle">Gère tes préférences de notification.</p>

        <div className="param-card">
          <div className="param-card-header">
            <div className="param-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div className="param-card-text">
              <h2>Alertes email</h2>
              <p>Reçois un email dès que de nouveaux articles correspondent à tes veilles (topics du catalogue et veilles personnalisées).</p>
            </div>
            <button
              className={`param-toggle${emailAlerts ? ' active' : ''}`}
              onClick={toggleAlerts}
              disabled={saving}
              role="switch"
              aria-checked={emailAlerts}
            >
              <span className="param-toggle-knob" />
            </button>
          </div>

          {emailAlerts && (
            <div className="param-card-body">
              <p className="param-info-line">
                Les emails seront envoyés à <strong>{user?.email}</strong>.
              </p>
              {totalWatches === 0 ? (
                <p className="param-empty-line">
                  Tu n'es abonné(e) à aucun topic ni veille personnalisée pour l'instant — aucune alerte ne sera envoyée.
                  Abonne-toi depuis le <a href="/catalogue">Catalogue</a> ou crée une veille dans <a href="/ma-veille">Ma veille</a>.
                </p>
              ) : (
                <>
                  <p className="param-info-line">
                    Tu recevras des alertes pour {totalWatches} veille{totalWatches > 1 ? 's' : ''} :
                  </p>
                  <div className="param-watch-list">
                    {subscribedTopics.map(t => (
                      <span key={t.id} className="param-watch-pill">{t.label}</span>
                    ))}
                    {customWatches.map(w => (
                      <span key={w.id} className="param-watch-pill" style={{ borderColor: w.color + '55', color: w.color }}>
                        {w.name}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <p className="param-note">
          Les alertes sont vérifiées automatiquement à intervalle régulier. Si tu viens d'activer cette option, le premier email peut prendre un peu de temps.
        </p>
      </div>

      {toastMsg && <div className="param-toast">{toastMsg}</div>}
      <style>{css}</style>
    </div>
  )
}

const css = `
  .param-page { min-height: 100vh; background: var(--color-bg); }
  .param-container { max-width: 680px; margin: 0 auto; padding: 2.5rem 2rem; }
  .param-loading { display: flex; align-items: center; justify-content: center; height: 60vh; }
  .param-spinner { width: 28px; height: 28px; border: 3px solid var(--color-border); border-top-color: var(--color-accent-light); border-radius: 50%; animation: param-spin 0.7s linear infinite; }

  .param-title { font-family: var(--font-display); font-size: 2rem; font-weight: 400; color: var(--color-text); margin-bottom: 6px; }
  .param-subtitle { font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 1.8rem; }

  .param-card { background: var(--color-surface); border: 1.5px solid var(--color-border); border-radius: 14px; overflow: hidden; }
  .param-card-header { display: flex; align-items: flex-start; gap: 14px; padding: 1.4rem; }
  .param-card-icon { background: var(--color-accent-muted); color: var(--color-accent); border-radius: 10px; padding: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .param-card-text { flex: 1; }
  .param-card-text h2 { font-family: var(--font-display); font-size: 1.15rem; font-weight: 400; color: var(--color-text); margin-bottom: 4px; }
  .param-card-text p { font-size: 0.85rem; color: var(--color-text-muted); line-height: 1.55; }

  .param-toggle { width: 46px; height: 26px; border-radius: 14px; background: var(--color-border); border: none; cursor: pointer; flex-shrink: 0; position: relative; transition: background 0.2s; padding: 0; margin-top: 2px; }
  .param-toggle.active { background: var(--color-accent); }
  .param-toggle:disabled { opacity: 0.6; cursor: not-allowed; }
  .param-toggle-knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: white; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
  .param-toggle.active .param-toggle-knob { transform: translateX(20px); }

  .param-card-body { padding: 0 1.4rem 1.4rem; border-top: 1px solid var(--color-border); margin-top: 0; }
  .param-info-line { font-size: 0.85rem; color: var(--color-text); margin-top: 14px; }
  .param-info-line a { color: var(--color-accent-light); font-weight: 500; text-decoration: none; }
  .param-info-line a:hover { text-decoration: underline; }
  .param-empty-line { font-size: 0.85rem; color: var(--color-text-muted); margin-top: 14px; line-height: 1.6; }
  .param-empty-line a { color: var(--color-accent-light); font-weight: 500; text-decoration: none; }
  .param-empty-line a:hover { text-decoration: underline; }
  .param-watch-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .param-watch-pill { background: var(--color-accent-muted); color: var(--color-accent); border: 1px solid #C6DBC8; font-size: 0.75rem; font-weight: 500; padding: 4px 11px; border-radius: 12px; background-color: white; }

  .param-note { font-size: 0.78rem; color: var(--color-text-muted); margin-top: 1.2rem; line-height: 1.6; }

  .param-toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: var(--color-accent); color: white; padding: 12px 24px; border-radius: 30px; font-size: 0.88rem; font-weight: 500; z-index: 9999; animation: param-fadeUp 0.3s ease; white-space: nowrap; pointer-events: none; }

  @keyframes param-spin { to { transform: rotate(360deg); } }
  @keyframes param-fadeUp { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
`