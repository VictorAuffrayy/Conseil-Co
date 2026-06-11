import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../AuthContext'
import Navbar from '../components/Navbar'

const API = 'http://localhost:3001'
const CORS_PROXY = 'https://corsproxy.io/?'

// ─── PARSE RSS ────────────────────────────────────────────────────────────────
function parseRSS(xmlText, sourceName) {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, 'application/xml')
    const items = Array.from(doc.querySelectorAll('item'))
    return items.map(item => {
      const title = item.querySelector('title')?.textContent?.trim() || 'Sans titre'
      const link = item.querySelector('link')?.textContent?.trim() || item.querySelector('guid')?.textContent?.trim() || '#'
      const description = (item.querySelector('description')?.textContent || '')
        .replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim()
      const pubDateRaw = item.querySelector('pubDate')?.textContent?.trim() || item.querySelector('dc\\:date')?.textContent?.trim() || ''
      const author = item.querySelector('author')?.textContent?.trim() || item.querySelector('dc\\:creator')?.textContent?.trim() || ''
      const pubDate = pubDateRaw ? new Date(pubDateRaw) : null
      return {
        id: `art-${btoa(encodeURIComponent(link)).slice(0, 16)}`,
        title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
        link,
        description: description.slice(0, 300) + (description.length > 300 ? '...' : ''),
        fullDescription: description.slice(0, 800),
        pubDate,
        pubDateFormatted: pubDate ? pubDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Date inconnue',
        pubTimeFormatted: pubDate ? pubDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
        source: sourceName,
        author,
      }
    })
  } catch { return [] }
}

async function fetchRSSSource(url, name) {
  const res = await fetch(CORS_PROXY + encodeURIComponent(url), { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return parseRSS(await res.text(), name)
}

function scoreArticle(article, keywords) {
  let score = 60
  const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase()
  keywords.forEach(kw => { if (text.includes(kw.toLowerCase())) score += 8 })
  if (article.pubDate) {
    const ageH = (Date.now() - new Date(article.pubDate).getTime()) / (1000 * 60 * 60)
    if (ageH < 6) score += 15
    else if (ageH < 12) score += 10
    else if (ageH < 24) score += 5
  }
  return Math.min(score, 99)
}

// ─── COMPOSANTS UI ────────────────────────────────────────────────────────────
function DateBadge({ pubDate }) {
  if (!pubDate) return <span className="mvi-date">Date inconnue</span>
  const ageH = (Date.now() - new Date(pubDate).getTime()) / (1000 * 60 * 60)
  const fmt = new Date(pubDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return (
    <span className={`mvi-date${ageH < 6 ? ' new' : ageH < 24 ? ' today' : ''}`}>
      {ageH < 6 ? '🔴 ' : ageH < 24 ? '🟡 ' : ''}{fmt}
    </span>
  )
}

// ─── MODAL ARTICLE ────────────────────────────────────────────────────────────
function ArticleModal({ article, watchColor, onClose, isFav, onToggleFav }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <div className="mvi-overlay" onClick={onClose}>
      <div className="mvi-modal" onClick={e => e.stopPropagation()}>
        <div className="mvi-modal-header">
          <div className="mvi-modal-meta">
            <span className="mvi-modal-source-dot" style={{ background: watchColor }} />
            <span className="mvi-modal-source">{article.source}</span>
            {article.relevanceScore && <span className="mvi-modal-score">{article.relevanceScore}%</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`mvi-fav-btn${isFav ? ' active' : ''}`} onClick={() => onToggleFav(article)}>
              {isFav ? '★' : '☆'}
            </button>
            <button className="mvi-close-btn" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div className="mvi-modal-body">
          <h2 className="mvi-modal-title">{article.title}</h2>
          <div className="mvi-modal-infos">
            {article.pubDateFormatted && (
              <span className="mvi-modal-info-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {article.pubDateFormatted}{article.pubTimeFormatted ? ` à ${article.pubTimeFormatted}` : ''}
              </span>
            )}
            {article.author && (
              <span className="mvi-modal-info-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {article.author}
              </span>
            )}
          </div>
          <div className="mvi-modal-divider" />
          <p className="mvi-modal-desc">{article.fullDescription || article.description || 'Aucun résumé disponible.'}</p>
        </div>
        <div className="mvi-modal-footer">
          <button className="mvi-btn-secondary" onClick={onClose}>Fermer</button>
          <a href={article.link} target="_blank" rel="noopener noreferrer" className="mvi-btn-primary">
            Lire l'article
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── WIZARD DE CRÉATION ───────────────────────────────────────────────────────
const WATCH_COLORS = ['#1A3A2A', '#2D6A4F', '#1E40AF', '#7C3AED', '#B45309', '#DC2626', '#0369A1', '#065F46']

function CreateWatchWizard({ onCancel, onCreate }) {
  const [step, setStep] = useState(1) // 1=form 2=generating 3=preview
  const [form, setForm] = useState({
    name: '',
    description: '',
    keywords: '',
    language: 'fr',
    color: WATCH_COLORS[0],
  })
  const [generated, setGenerated] = useState(null) // { sources, keywords }
  const [error, setError] = useState('')
  const [previewArticles, setPreviewArticles] = useState([])
  const [loadingPreview, setLoadingPreview] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  // Étape 2 : appel Claude pour générer sources RSS + mots-clés
  const generate = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      setError('Donne un nom et une description à ta veille.')
      return
    }
    setError('')
    setStep(2)

    const prompt = `Tu es un expert en veille informationnelle et en flux RSS.

L'utilisateur veut créer une veille sur le sujet suivant :
- Nom : "${form.name}"
- Description : "${form.description}"
- Mots-clés fournis : "${form.keywords || 'aucun'}"
- Langue préférée : ${form.language === 'fr' ? 'Français' : 'Anglais ou Français'}

Ta mission : générer une configuration de veille optimale.

Réponds UNIQUEMENT en JSON valide, sans texte avant ni après, sans backticks :
{
  "keywords": ["mot1", "mot2", "mot3", "mot4", "mot5", "mot6", "mot7", "mot8"],
  "sources": [
    { "url": "https://...", "name": "Nom de la source" },
    { "url": "https://...", "name": "Nom de la source" },
    { "url": "https://...", "name": "Nom de la source" }
  ],
  "summary": "Une phrase résumant la veille générée."
}

Règles :
- 6 à 10 mots-clés pertinents en minuscules
- 3 à 6 sources RSS réelles, accessibles, en rapport direct avec le sujet (préfère des médias français si langue=fr)
- Les URLs doivent être des flux RSS valides (se terminent souvent par /feed, /rss, /rss.xml, /feed.xml, .rss)
- Pas de sources inventées : utilise uniquement des médias connus et fiables`

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      const text = data.content?.find(b => b.type === 'text')?.text || ''
      const json = JSON.parse(text.replace(/```json|```/g, '').trim())
      setGenerated(json)
      setStep(3)
      // Lancer le preview des flux
      fetchPreview(json.sources, json.keywords)
    } catch (e) {
      setError('Erreur lors de la génération. Vérifie ta connexion et réessaie.')
      setStep(1)
    }
  }

  const fetchPreview = async (sources, keywords) => {
    setLoadingPreview(true)
    const all = []
    await Promise.allSettled(
      sources.map(async ({ url, name }) => {
        try {
          const arts = await fetchRSSSource(url, name)
          all.push(...arts)
        } catch {}
      })
    )
    // Dédupliquer + scorer + trier
    const seen = new Set()
    const unique = all.filter(a => {
      const k = a.link || a.title
      if (seen.has(k)) return false
      seen.add(k); return true
    })
    const cutoff = Date.now() - 72 * 60 * 60 * 1000
    const recent = unique.filter(a => !a.pubDate || new Date(a.pubDate).getTime() > cutoff)
    const scored = (recent.length > 0 ? recent : unique)
      .map(a => ({ ...a, relevanceScore: scoreArticle(a, keywords) }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20)
    setPreviewArticles(scored)
    setLoadingPreview(false)
  }

  const save = () => {
    onCreate({
      name: form.name,
      description: form.description,
      color: form.color,
      language: form.language,
      keywords: generated.keywords,
      sources: generated.sources,
      summary: generated.summary,
    })
  }

  // ── STEP 1 : FORMULAIRE ──
  if (step === 1) return (
    <div className="mvi-wizard">
      <div className="mvi-wizard-header">
        <h2 className="mvi-wizard-title">Créer une nouvelle veille</h2>
        <p className="mvi-wizard-sub">Décris ta thématique librement — Claude génère les sources RSS et les mots-clés pour toi.</p>
      </div>

      <div className="mvi-wizard-form">
        <div className="mvi-field">
          <label>Nom de la veille <span className="mvi-required">*</span></label>
          <input name="name" value={form.name} onChange={handle} placeholder="ex : Marché du luxe en Asie" />
        </div>

        <div className="mvi-field">
          <label>Décris ta thématique <span className="mvi-required">*</span></label>
          <textarea
            name="description"
            value={form.description}
            onChange={handle}
            rows={4}
            placeholder="ex : Je veux suivre l'évolution du secteur du luxe (LVMH, Hermès, Kering) sur les marchés asiatiques, notamment Chine et Japon. Focus sur les ventes, tendances consommateurs et stratégies des marques."
          />
          <span className="mvi-field-hint">Plus c'est précis, meilleure sera la veille générée.</span>
        </div>

        <div className="mvi-field">
          <label>Mots-clés supplémentaires <span className="mvi-optional">(optionnel)</span></label>
          <input name="keywords" value={form.keywords} onChange={handle} placeholder="ex : LVMH, Hermès, luxe, Chine, consommateurs" />
          <span className="mvi-field-hint">Séparés par des virgules.</span>
        </div>

        <div className="mvi-field-row">
          <div className="mvi-field">
            <label>Langue des sources</label>
            <select name="language" value={form.language} onChange={handle}>
              <option value="fr">Français en priorité</option>
              <option value="both">Français + Anglais</option>
            </select>
          </div>

          <div className="mvi-field">
            <label>Couleur de la veille</label>
            <div className="mvi-color-picker">
              {WATCH_COLORS.map(c => (
                <button
                  key={c}
                  className={`mvi-color-dot${form.color === c ? ' selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                />
              ))}
            </div>
          </div>
        </div>

        {error && <p className="mvi-error">{error}</p>}

        <div className="mvi-wizard-actions">
          <button className="mvi-btn-ghost" onClick={onCancel}>Annuler</button>
          <button className="mvi-btn-generate" onClick={generate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
            Générer ma veille avec Claude
          </button>
        </div>
      </div>
    </div>
  )

  // ── STEP 2 : GÉNÉRATION ──
  if (step === 2) return (
    <div className="mvi-wizard">
      <div className="mvi-generating">
        <div className="mvi-gen-animation">
          <div className="mvi-gen-ring" />
          <div className="mvi-gen-ring mvi-gen-ring-2" />
          <span className="mvi-gen-icon">✦</span>
        </div>
        <h3 className="mvi-gen-title">Claude analyse ta thématique…</h3>
        <p className="mvi-gen-sub">Sélection des meilleures sources RSS · Définition des mots-clés · Configuration du scoring</p>
        <div className="mvi-gen-steps">
          {['Analyse de la thématique', 'Recherche de sources RSS', 'Optimisation des mots-clés'].map((s, i) => (
            <div key={i} className="mvi-gen-step">
              <div className="mvi-gen-step-dot" style={{ animationDelay: `${i * 0.4}s` }} />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── STEP 3 : PREVIEW ──
  return (
    <div className="mvi-wizard mvi-wizard-preview">
      <div className="mvi-preview-header">
        <div className="mvi-preview-title-row">
          <span className="mvi-preview-color-dot" style={{ background: form.color }} />
          <h2 className="mvi-preview-title">{form.name}</h2>
        </div>
        <p className="mvi-preview-summary">{generated?.summary}</p>
      </div>

      <div className="mvi-preview-config">
        <div className="mvi-preview-section">
          <h4 className="mvi-preview-section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            {generated?.keywords?.length} mots-clés de scoring
          </h4>
          <div className="mvi-keyword-list">
            {generated?.keywords?.map(k => (
              <span key={k} className="mvi-keyword-pill">{k}</span>
            ))}
          </div>
        </div>

        <div className="mvi-preview-section">
          <h4 className="mvi-preview-section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
            {generated?.sources?.length} sources RSS
          </h4>
          <div className="mvi-source-list">
            {generated?.sources?.map(s => (
              <div key={s.url} className="mvi-source-item">
                <span className="mvi-source-dot" style={{ background: form.color }} />
                <div>
                  <strong>{s.name}</strong>
                  <span>{s.url}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mvi-preview-articles">
        <h4 className="mvi-preview-section-title" style={{ padding: '0 1.4rem', marginBottom: 12 }}>
          Aperçu des articles
          {loadingPreview && <span className="mvi-preview-loading-dot" />}
        </h4>
        {loadingPreview ? (
          <div className="mvi-preview-loading">
            <div className="mvi-spinner" />
            <span>Récupération des flux RSS…</span>
          </div>
        ) : previewArticles.length === 0 ? (
          <div className="mvi-preview-empty">
            <span>📭</span>
            <p>Aucun article récent trouvé — les flux seront rechargés une fois la veille créée.</p>
          </div>
        ) : (
          <div className="mvi-preview-art-list">
            {previewArticles.slice(0, 6).map((a, i) => (
              <div key={a.id || i} className="mvi-preview-art-item">
                <div className="mvi-preview-art-top">
                  <span className="mvi-preview-art-source">{a.source}</span>
                  <span className="mvi-preview-art-score" style={{ background: form.color }}>{a.relevanceScore}%</span>
                </div>
                <p className="mvi-preview-art-title">{a.title}</p>
                <DateBadge pubDate={a.pubDate} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mvi-preview-footer">
        <button className="mvi-btn-ghost" onClick={() => setStep(1)}>← Modifier</button>
        <button className="mvi-btn-primary" style={{ background: form.color }} onClick={save}>
          Créer cette veille
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      </div>
    </div>
  )
}

// ─── VUE VEILLE ───────────────────────────────────────────────────────────────
function WatchView({ watch, onEdit, onDelete, favorites, onToggleFav }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('score')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    load()
  }, [watch.id])

  const load = async () => {
    setLoading(true)
    const all = []
    await Promise.allSettled(
      (watch.sources || []).map(async ({ url, name }) => {
        try {
          const arts = await fetchRSSSource(url, name)
          all.push(...arts)
        } catch {}
      })
    )
    const seen = new Set()
    const unique = all.filter(a => {
      const k = a.link || a.title
      if (seen.has(k)) return false
      seen.add(k); return true
    })
    const cutoff = Date.now() - 72 * 60 * 60 * 1000
    const recent = unique.filter(a => !a.pubDate || new Date(a.pubDate).getTime() > cutoff)
    const pool = recent.length > 0 ? recent : unique
    const scored = pool
      .map(a => ({ ...a, relevanceScore: scoreArticle(a, watch.keywords || []), watchId: watch.id }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
    setArticles(scored)
    setLoading(false)
  }

  const refresh = () => { hasFetched.current = false; load() }

  const isFav = a => favorites.some(f => (f.id || f.link) === (a.id || a.link))

  const displayed = (() => {
    let pool = [...articles]
    if (search.trim()) {
      const q = search.toLowerCase()
      pool = pool.filter(a =>
        (a.title || '').toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q) ||
        (a.source || '').toLowerCase().includes(q)
      )
    }
    if (sortBy === 'date') {
      pool.sort((a, b) => {
        if (!a.pubDate && !b.pubDate) return 0
        if (!a.pubDate) return 1; if (!b.pubDate) return -1
        return new Date(b.pubDate) - new Date(a.pubDate)
      })
    }
    return pool
  })()

  return (
    <div className="mvi-watch-view">
      {/* Header veille */}
      <div className="mvi-watch-header" style={{ borderLeftColor: watch.color }}>
        <div className="mvi-watch-header-left">
          <div className="mvi-watch-title-row">
            <span className="mvi-watch-color-dot" style={{ background: watch.color }} />
            <h2 className="mvi-watch-title">{watch.name}</h2>
            {loading && <div className="mvi-spinner-sm" />}
          </div>
          <p className="mvi-watch-desc">{watch.description}</p>
          <div className="mvi-watch-meta">
            <span>{watch.sources?.length || 0} source{watch.sources?.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{articles.length} article{articles.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{watch.keywords?.length || 0} mots-clés</span>
          </div>
        </div>
        <div className="mvi-watch-header-actions">
          <button className="mvi-icon-btn" onClick={refresh} title="Actualiser">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
          <button className="mvi-icon-btn" onClick={() => onEdit(watch)} title="Modifier">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button className="mvi-icon-btn mvi-icon-btn-danger" onClick={() => onDelete(watch.id)} title="Supprimer">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>

      {/* Mots-clés */}
      <div className="mvi-keywords-row">
        {(watch.keywords || []).map(k => (
          <span key={k} className="mvi-kw-pill" style={{ borderColor: watch.color + '55', color: watch.color }}>{k}</span>
        ))}
      </div>

      {/* Controls */}
      <div className="mvi-watch-controls">
        <input className="mvi-search" placeholder="Rechercher dans cette veille…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="mvi-sort-group">
          <button className={`mvi-sort-btn${sortBy === 'score' ? ' active' : ''}`} style={sortBy === 'score' ? { background: watch.color, borderColor: watch.color } : {}} onClick={() => setSortBy('score')}>Pertinence</button>
          <button className={`mvi-sort-btn${sortBy === 'date' ? ' active' : ''}`} style={sortBy === 'date' ? { background: watch.color, borderColor: watch.color } : {}} onClick={() => setSortBy('date')}>Date</button>
        </div>
      </div>

      {/* Articles */}
      {loading ? (
        <div className="mvi-loading-state">
          <div className="mvi-spinner-lg" />
          <p>Récupération des flux RSS…</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="mvi-empty-state-sm">
          {search ? <><span>🔍</span><p>Aucun résultat pour « {search} »</p></> : <><span>📭</span><p>Aucun article récent trouvé.</p><button className="mvi-retry-btn" style={{ background: watch.color }} onClick={refresh}>Réessayer</button></>}
        </div>
      ) : (
        <div className="mvi-articles-grid">
          {displayed.map((article, i) => (
            <article
              key={article.id || i}
              className="mvi-card"
              style={{ '--watch-color': watch.color }}
              onClick={() => setSelectedArticle(article)}
              role="button" tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setSelectedArticle(article)}
            >
              <div className="mvi-card-top">
                <span className="mvi-card-source">{article.source}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="mvi-card-score" style={{ background: watch.color }}>{article.relevanceScore}%</span>
                  <button
                    className={`mvi-card-fav${isFav(article) ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); onToggleFav(article) }}
                  >{isFav(article) ? '★' : '☆'}</button>
                </div>
              </div>
              <h3 className="mvi-card-title">{article.title}</h3>
              {article.description && <p className="mvi-card-desc">{article.description.slice(0, 130)}…</p>}
              <div className="mvi-card-footer">
                <DateBadge pubDate={article.pubDate} />
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          watchColor={watch.color}
          isFav={isFav(selectedArticle)}
          onToggleFav={onToggleFav}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  )
}

// ─── MODAL ÉDITION ────────────────────────────────────────────────────────────
function EditModal({ watch, onSave, onClose }) {
  const [form, setForm] = useState({
    name: watch.name,
    description: watch.description,
    color: watch.color,
    keywords: (watch.keywords || []).join(', '),
    sources: (watch.sources || []).map(s => `${s.name}|${s.url}`).join('\n'),
  })

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = '' }
  }, [onClose])

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const save = () => {
    const keywords = form.keywords.split(',').map(k => k.trim()).filter(Boolean)
    const sources = form.sources.split('\n').map(line => {
      const [name, ...rest] = line.split('|')
      return { name: name?.trim(), url: rest.join('|')?.trim() }
    }).filter(s => s.name && s.url)
    onSave({ ...watch, name: form.name, description: form.description, color: form.color, keywords, sources })
  }

  return (
    <div className="mvi-overlay" onClick={onClose}>
      <div className="mvi-modal mvi-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="mvi-modal-header">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 400 }}>Modifier la veille</h3>
          <button className="mvi-close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="mvi-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="mvi-field">
            <label>Nom</label>
            <input name="name" value={form.name} onChange={handle} />
          </div>
          <div className="mvi-field">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handle} rows={3} />
          </div>
          <div className="mvi-field">
            <label>Mots-clés (séparés par des virgules)</label>
            <input name="keywords" value={form.keywords} onChange={handle} />
          </div>
          <div className="mvi-field">
            <label>Sources RSS — une par ligne, format : <code>Nom|https://url/feed</code></label>
            <textarea name="sources" value={form.sources} onChange={handle} rows={5} style={{ fontFamily: 'monospace', fontSize: '0.78rem' }} />
          </div>
          <div className="mvi-field">
            <label>Couleur</label>
            <div className="mvi-color-picker">
              {WATCH_COLORS.map(c => (
                <button key={c} className={`mvi-color-dot${form.color === c ? ' selected' : ''}`} style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
              ))}
            </div>
          </div>
        </div>
        <div className="mvi-modal-footer">
          <button className="mvi-btn-secondary" onClick={onClose}>Annuler</button>
          <button className="mvi-btn-primary" style={{ background: form.color }} onClick={save}>Enregistrer</button>
        </div>
      </div>
    </div>
  )
}

// ─── PAGE PRINCIPALE ───────────────────────────────────────────────────────────
export default function MaVeille() {
  const { user, login } = useAuth()
  const [watches, setWatches] = useState([])
  const [activeWatchId, setActiveWatchId] = useState(null)
  const [view, setView] = useState('list') // 'list' | 'create' | 'watch'
  const [favorites, setFavorites] = useState([])
  const [editingWatch, setEditingWatch] = useState(null)
  const [toastMsg, setToastMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      fetch(`${API}/customWatches?userId=${user.id}`).then(r => r.json()),
      fetch(`${API}/users/${user.id}`).then(r => r.json()),
    ]).then(([watches, userData]) => {
      setWatches(Array.isArray(watches) ? watches : [])
      setFavorites(Array.isArray(userData.favorites) ? userData.favorites : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.id])

  const showToast = msg => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 2800) }

  const createWatch = async (config) => {
    const newWatch = {
      id: `watch-${Date.now()}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
      ...config,
    }
    try {
      const res = await fetch(`${API}/customWatches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWatch)
      })
      const saved = await res.json()
      setWatches(prev => [...prev, saved])
      setActiveWatchId(saved.id)
      setView('watch')
      showToast('✓ Veille créée avec succès !')
    } catch {
      showToast('Erreur lors de la sauvegarde.')
    }
  }

  const saveWatch = async (updated) => {
    try {
      await fetch(`${API}/customWatches/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      })
      setWatches(prev => prev.map(w => w.id === updated.id ? updated : w))
      setEditingWatch(null)
      showToast('✓ Veille mise à jour')
    } catch {
      showToast('Erreur lors de la mise à jour.')
    }
  }

  const deleteWatch = async (id) => {
    try {
      await fetch(`${API}/customWatches/${id}`, { method: 'DELETE' })
      setWatches(prev => prev.filter(w => w.id !== id))
      if (activeWatchId === id) { setActiveWatchId(null); setView('list') }
      setConfirmDelete(null)
      showToast('✓ Veille supprimée')
    } catch {
      showToast('Erreur lors de la suppression.')
    }
  }

  const toggleFavorite = async (article) => {
    const artKey = article.id || article.link
    const isFav = favorites.some(f => (f.id || f.link) === artKey)
    const next = isFav
      ? favorites.filter(f => (f.id || f.link) !== artKey)
      : [...favorites, { ...article, savedAt: new Date().toISOString() }]
    setFavorites(next)
    showToast(isFav ? '✓ Retiré des favoris' : '★ Ajouté aux favoris !')
    try {
      await fetch(`${API}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: next })
      })
      login({ ...user, favorites: next })
    } catch { setFavorites(favorites) }
  }

  const activeWatch = watches.find(w => w.id === activeWatchId)

  if (loading) return (
    <div className="mvi-page"><Navbar />
      <div className="mvi-loading-page"><div className="mvi-spinner-lg" /><span>Chargement…</span></div>
      <style>{css}</style>
    </div>
  )

  return (
    <div className="mvi-page">
      <Navbar />
      <div className="mvi-layout">

        {/* ── SIDEBAR ── */}
        <aside className="mvi-sidebar">
          <div className="mvi-sidebar-top">
            <h2 className="mvi-sidebar-title">Mes veilles</h2>
            <button className="mvi-new-btn" onClick={() => setView('create')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nouvelle
            </button>
          </div>

          {watches.length === 0 ? (
            <div className="mvi-sidebar-empty">
              <p>Aucune veille pour l'instant.<br />Crée ta première veille personnalisée !</p>
            </div>
          ) : (
            <nav className="mvi-watch-list">
              {watches.map(w => (
                <button
                  key={w.id}
                  className={`mvi-watch-item${activeWatchId === w.id && view === 'watch' ? ' active' : ''}`}
                  onClick={() => { setActiveWatchId(w.id); setView('watch') }}
                >
                  <span className="mvi-watch-item-dot" style={{ background: w.color }} />
                  <span className="mvi-watch-item-name">{w.name}</span>
                </button>
              ))}
            </nav>
          )}
        </aside>

        {/* ── CONTENU PRINCIPAL ── */}
        <main className="mvi-main">
          {view === 'create' && (
            <CreateWatchWizard
              onCancel={() => setView(watches.length > 0 ? 'watch' : 'list')}
              onCreate={createWatch}
            />
          )}

          {view === 'watch' && activeWatch && (
            <WatchView
              watch={activeWatch}
              favorites={favorites}
              onToggleFav={toggleFavorite}
              onEdit={w => setEditingWatch(w)}
              onDelete={id => setConfirmDelete(id)}
            />
          )}

          {view === 'list' && watches.length === 0 && (
            <div className="mvi-welcome">
              <div className="mvi-welcome-icon">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>
                </svg>
              </div>
              <h2 className="mvi-welcome-title">Crée ta première veille</h2>
              <p className="mvi-welcome-text">
                Décris la thématique qui t'intéresse — Claude sélectionne automatiquement les meilleures sources RSS et les mots-clés de scoring pour toi.
              </p>
              <div className="mvi-welcome-features">
                {[
                  { icon: '✦', text: 'Sources RSS générées par IA selon ta thématique' },
                  { icon: '⭐', text: 'Scoring de pertinence automatique' },
                  { icon: '♻', text: 'Veilles éditables et actualisables à tout moment' },
                ].map(f => (
                  <div key={f.text} className="mvi-welcome-feature">
                    <span>{f.icon}</span>
                    <p>{f.text}</p>
                  </div>
                ))}
              </div>
              <button className="mvi-welcome-btn" onClick={() => setView('create')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Créer ma première veille
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ── MODAL ÉDITION ── */}
      {editingWatch && (
        <EditModal
          watch={editingWatch}
          onSave={saveWatch}
          onClose={() => setEditingWatch(null)}
        />
      )}

      {/* ── CONFIRM SUPPRESSION ── */}
      {confirmDelete && (
        <div className="mvi-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="mvi-confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Supprimer cette veille ?</h3>
            <p>Cette action est irréversible. Tous les articles de cette veille seront perdus.</p>
            <div className="mvi-confirm-actions">
              <button className="mvi-btn-secondary" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className="mvi-btn-danger" onClick={() => deleteWatch(confirmDelete)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <div className="mvi-toast">{toastMsg}</div>}
      <style>{css}</style>
    </div>
  )
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  .mvi-page { min-height: 100vh; background: var(--color-bg); }
  .mvi-layout { display: flex; height: calc(100vh - 60px); overflow: hidden; }
  .mvi-loading-page { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 70vh; gap: 14px; color: var(--color-text-muted); font-size: 0.9rem; }

  /* ── SIDEBAR ── */
  .mvi-sidebar { width: 240px; flex-shrink: 0; background: var(--color-surface); border-right: 1px solid var(--color-border); display: flex; flex-direction: column; overflow-y: auto; }
  .mvi-sidebar-top { display: flex; align-items: center; justify-content: space-between; padding: 1.2rem 1rem 0.8rem; border-bottom: 1px solid var(--color-border); }
  .mvi-sidebar-title { font-family: var(--font-display); font-size: 1rem; font-weight: 400; color: var(--color-text); }
  .mvi-new-btn { display: flex; align-items: center; gap: 5px; background: var(--color-accent); color: white; border: none; border-radius: 6px; padding: 5px 10px; font-size: 0.75rem; font-weight: 500; font-family: var(--font-body); cursor: pointer; transition: background 0.15s; white-space: nowrap; }
  .mvi-new-btn:hover { background: var(--color-accent-light); }
  .mvi-sidebar-empty { padding: 1.5rem 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.8rem; line-height: 1.6; }
  .mvi-watch-list { padding: 0.6rem 0.5rem; display: flex; flex-direction: column; gap: 2px; }
  .mvi-watch-item { display: flex; align-items: center; gap: 9px; background: none; border: none; border-radius: 8px; padding: 8px 10px; cursor: pointer; transition: background 0.12s; text-align: left; width: 100%; }
  .mvi-watch-item:hover { background: var(--color-accent-muted); }
  .mvi-watch-item.active { background: var(--color-accent-muted); }
  .mvi-watch-item-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
  .mvi-watch-item-name { font-size: 0.83rem; font-weight: 500; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* ── MAIN ── */
  .mvi-main { flex: 1; overflow-y: auto; }

  /* ── WELCOME ── */
  .mvi-welcome { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80%; padding: 3rem 2rem; text-align: center; gap: 1.2rem; }
  .mvi-welcome-icon { color: var(--color-accent-light); opacity: 0.5; }
  .mvi-welcome-title { font-family: var(--font-display); font-size: 1.9rem; font-weight: 400; color: var(--color-text); }
  .mvi-welcome-text { font-size: 0.9rem; color: var(--color-text-muted); line-height: 1.7; max-width: 420px; }
  .mvi-welcome-features { display: flex; flex-direction: column; gap: 10px; margin: 0.5rem 0; }
  .mvi-welcome-feature { display: flex; align-items: flex-start; gap: 10px; text-align: left; }
  .mvi-welcome-feature span { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
  .mvi-welcome-feature p { font-size: 0.85rem; color: var(--color-text-muted); margin: 0; line-height: 1.5; }
  .mvi-welcome-btn { display: flex; align-items: center; gap: 8px; background: var(--color-accent); color: white; border: none; border-radius: 10px; padding: 13px 26px; font-size: 0.95rem; font-weight: 500; font-family: var(--font-body); cursor: pointer; margin-top: 8px; transition: background 0.15s; }
  .mvi-welcome-btn:hover { background: var(--color-accent-light); }

  /* ── WIZARD ── */
  .mvi-wizard { max-width: 680px; margin: 0 auto; padding: 2.5rem 2rem; }
  .mvi-wizard-preview { max-width: 780px; padding: 0; }
  .mvi-wizard-header { margin-bottom: 2rem; }
  .mvi-wizard-title { font-family: var(--font-display); font-size: 1.8rem; font-weight: 400; color: var(--color-text); margin-bottom: 6px; }
  .mvi-wizard-sub { font-size: 0.88rem; color: var(--color-text-muted); line-height: 1.6; }
  .mvi-wizard-form { display: flex; flex-direction: column; gap: 1.2rem; }

  .mvi-field { display: flex; flex-direction: column; gap: 5px; }
  .mvi-field label { font-size: 0.8rem; font-weight: 600; color: var(--color-text); text-transform: uppercase; letter-spacing: 0.04em; }
  .mvi-field input, .mvi-field textarea, .mvi-field select { background: var(--color-surface); border: 1.5px solid var(--color-border); border-radius: 8px; padding: 10px 14px; font-size: 0.92rem; font-family: var(--font-body); color: var(--color-text); outline: none; transition: border-color 0.2s; resize: vertical; }
  .mvi-field input:focus, .mvi-field textarea:focus, .mvi-field select:focus { border-color: var(--color-accent-light); }
  .mvi-field-hint { font-size: 0.76rem; color: var(--color-text-muted); }
  .mvi-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .mvi-required { color: var(--color-error); }
  .mvi-optional { color: var(--color-text-muted); font-weight: 400; text-transform: none; letter-spacing: 0; }

  .mvi-color-picker { display: flex; gap: 8px; flex-wrap: wrap; padding: 4px 0; }
  .mvi-color-dot { width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid transparent; cursor: pointer; transition: transform 0.15s, border-color 0.15s; }
  .mvi-color-dot:hover { transform: scale(1.15); }
  .mvi-color-dot.selected { border-color: white; box-shadow: 0 0 0 2.5px currentColor, 0 0 0 4px var(--color-bg); transform: scale(1.1); }

  .mvi-error { background: #FEF2F2; border: 1px solid #FECACA; color: var(--color-error); padding: 10px 14px; border-radius: 7px; font-size: 0.85rem; }

  .mvi-wizard-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 0.5rem; }
  .mvi-btn-ghost { background: none; border: 1px solid var(--color-border); color: var(--color-text-muted); border-radius: 8px; padding: 10px 20px; font-size: 0.88rem; font-weight: 500; font-family: var(--font-body); cursor: pointer; transition: all 0.15s; }
  .mvi-btn-ghost:hover { border-color: var(--color-accent); color: var(--color-accent); }
  .mvi-btn-generate { display: flex; align-items: center; gap: 8px; background: var(--color-accent); color: white; border: none; border-radius: 8px; padding: 11px 22px; font-size: 0.92rem; font-weight: 500; font-family: var(--font-body); cursor: pointer; transition: background 0.15s; }
  .mvi-btn-generate:hover { background: var(--color-accent-light); }

  /* ── GENERATING ── */
  .mvi-generating { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1.5rem; text-align: center; }
  .mvi-gen-animation { position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; }
  .mvi-gen-ring { position: absolute; inset: 0; border-radius: 50%; border: 2.5px solid var(--color-accent); border-top-color: transparent; animation: mvi-spin 1.2s linear infinite; }
  .mvi-gen-ring-2 { inset: 10px; border-color: var(--color-accent-light); border-bottom-color: transparent; animation-direction: reverse; animation-duration: 0.8s; }
  .mvi-gen-icon { font-size: 1.5rem; color: var(--color-accent); }
  .mvi-gen-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 400; color: var(--color-text); }
  .mvi-gen-sub { font-size: 0.85rem; color: var(--color-text-muted); max-width: 380px; line-height: 1.6; }
  .mvi-gen-steps { display: flex; flex-direction: column; gap: 10px; margin-top: 0.5rem; }
  .mvi-gen-step { display: flex; align-items: center; gap: 10px; font-size: 0.82rem; color: var(--color-text-muted); }
  .mvi-gen-step-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-accent); animation: mvi-pulse 1.2s infinite; }

  /* ── PREVIEW ── */
  .mvi-preview-header { padding: 2rem 2rem 1.2rem; border-bottom: 1px solid var(--color-border); }
  .mvi-preview-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .mvi-preview-color-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  .mvi-preview-title { font-family: var(--font-display); font-size: 1.6rem; font-weight: 400; color: var(--color-text); }
  .mvi-preview-summary { font-size: 0.88rem; color: var(--color-text-muted); line-height: 1.6; }
  .mvi-preview-config { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-bottom: 1px solid var(--color-border); }
  .mvi-preview-section { padding: 1.2rem 1.6rem; }
  .mvi-preview-section:first-child { border-right: 1px solid var(--color-border); }
  .mvi-preview-section-title { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 10px; }
  .mvi-keyword-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .mvi-keyword-pill { background: var(--color-accent-muted); color: var(--color-accent); border: 1px solid #C6DBC8; font-size: 0.75rem; font-weight: 500; padding: 3px 10px; border-radius: 12px; }
  .mvi-source-list { display: flex; flex-direction: column; gap: 8px; }
  .mvi-source-item { display: flex; align-items: flex-start; gap: 8px; }
  .mvi-source-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
  .mvi-source-item strong { font-size: 0.82rem; font-weight: 600; color: var(--color-text); display: block; }
  .mvi-source-item span { font-size: 0.72rem; color: var(--color-text-muted); word-break: break-all; }
  .mvi-preview-articles { border-bottom: 1px solid var(--color-border); }
  .mvi-preview-loading { display: flex; align-items: center; gap: 10px; padding: 1.5rem 1.6rem; font-size: 0.85rem; color: var(--color-text-muted); }
  .mvi-preview-loading-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-accent); animation: mvi-pulse 1s infinite; display: inline-block; margin-left: 6px; }
  .mvi-preview-empty { display: flex; flex-direction: column; align-items: center; padding: 2rem; text-align: center; gap: 8px; color: var(--color-text-muted); font-size: 0.85rem; }
  .mvi-preview-empty span { font-size: 2rem; }
  .mvi-preview-art-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 1.6rem 1.2rem; }
  .mvi-preview-art-item { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px; padding: 10px 12px; }
  .mvi-preview-art-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 5px; }
  .mvi-preview-art-source { font-size: 0.7rem; font-weight: 600; color: var(--color-accent-light); text-transform: uppercase; letter-spacing: 0.04em; }
  .mvi-preview-art-score { font-size: 0.7rem; font-weight: 700; color: white; padding: 2px 7px; border-radius: 10px; }
  .mvi-preview-art-title { font-size: 0.82rem; font-weight: 500; color: var(--color-text); line-height: 1.4; margin-bottom: 5px; }
  .mvi-preview-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 1rem 1.6rem; }

  /* ── WATCH VIEW ── */
  .mvi-watch-view { padding: 2rem; }
  .mvi-watch-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; border-left: 3px solid; padding-left: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .mvi-watch-header-left { flex: 1; }
  .mvi-watch-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .mvi-watch-color-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .mvi-watch-title { font-family: var(--font-display); font-size: 1.7rem; font-weight: 400; color: var(--color-text); }
  .mvi-watch-desc { font-size: 0.85rem; color: var(--color-text-muted); line-height: 1.5; margin-bottom: 6px; }
  .mvi-watch-meta { display: flex; align-items: center; gap: 6px; font-size: 0.76rem; color: var(--color-text-muted); }
  .mvi-watch-header-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
  .mvi-icon-btn { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 7px; padding: 7px; cursor: pointer; color: var(--color-text-muted); transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
  .mvi-icon-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
  .mvi-icon-btn-danger:hover { border-color: #FECACA; color: #DC2626; background: #FEF2F2; }
  .mvi-keywords-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1.2rem; }
  .mvi-kw-pill { font-size: 0.72rem; font-weight: 500; padding: 3px 10px; border-radius: 12px; border: 1px solid; background: white; }

  .mvi-watch-controls { display: flex; gap: 10px; margin-bottom: 1.2rem; flex-wrap: wrap; align-items: center; }
  .mvi-search { background: var(--color-surface); border: 1.5px solid var(--color-border); border-radius: 8px; padding: 8px 14px; font-size: 0.88rem; font-family: var(--font-body); color: var(--color-text); outline: none; width: 260px; transition: border-color 0.2s; }
  .mvi-search:focus { border-color: var(--color-accent-light); }
  .mvi-sort-group { display: flex; border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; background: var(--color-surface); }
  .mvi-sort-btn { background: none; border: none; border-right: 1px solid var(--color-border); padding: 7px 14px; font-size: 0.78rem; font-weight: 500; font-family: var(--font-body); color: var(--color-text-muted); cursor: pointer; transition: all 0.15s; }
  .mvi-sort-btn:last-child { border-right: none; }
  .mvi-sort-btn.active { color: white; }

  .mvi-articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
  .mvi-card { background: var(--color-surface); border: 1.5px solid var(--color-border); border-radius: 12px; padding: 1.1rem; display: flex; flex-direction: column; gap: 0.6rem; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s; }
  .mvi-card:hover { border-color: var(--watch-color, var(--color-accent-light)); box-shadow: 0 4px 16px rgba(0,0,0,0.07); transform: translateY(-2px); }
  .mvi-card:active { transform: translateY(0); }
  .mvi-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .mvi-card-source { font-size: 0.7rem; font-weight: 600; color: var(--color-accent-light); text-transform: uppercase; letter-spacing: 0.04em; flex: 1; }
  .mvi-card-score { font-size: 0.7rem; font-weight: 700; color: white; padding: 2px 7px; border-radius: 10px; }
  .mvi-card-fav { background: none; border: none; cursor: pointer; font-size: 1.05rem; color: #D1D5DB; transition: color 0.15s, transform 0.15s; padding: 0 2px; line-height: 1; }
  .mvi-card-fav:hover { color: #F59E0B; transform: scale(1.2); }
  .mvi-card-fav.active { color: #F59E0B; }
  .mvi-card-title { font-size: 0.88rem; font-weight: 600; color: var(--color-text); line-height: 1.45; flex: 1; }
  .mvi-card-desc { font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.5; }
  .mvi-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px solid var(--color-border); margin-top: auto; }

  .mvi-date { font-size: 0.72rem; color: var(--color-text-muted); }
  .mvi-date.new { color: #DC2626; font-weight: 600; }
  .mvi-date.today { color: #D97706; font-weight: 500; }

  .mvi-loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 4rem 2rem; text-align: center; color: var(--color-text-muted); font-size: 0.88rem; }
  .mvi-empty-state-sm { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 3rem 2rem; text-align: center; }
  .mvi-empty-state-sm span { font-size: 2.4rem; }
  .mvi-empty-state-sm p { font-size: 0.88rem; color: var(--color-text-muted); }
  .mvi-retry-btn { color: white; border: none; border-radius: 8px; padding: 8px 18px; font-size: 0.85rem; font-weight: 500; font-family: var(--font-body); cursor: pointer; margin-top: 4px; }

  /* ── MODALS ── */
  .mvi-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1.5rem; animation: mvi-fadeIn 0.2s ease; }
  .mvi-modal { background: var(--color-surface); border-radius: 16px; width: 100%; max-width: 600px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.25); animation: mvi-slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1); }
  .mvi-edit-modal { max-width: 540px; }
  .mvi-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.2rem 1.4rem 0; gap: 1rem; flex-shrink: 0; }
  .mvi-modal-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; flex: 1; }
  .mvi-modal-source-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .mvi-modal-source { font-size: 0.75rem; font-weight: 600; color: var(--color-accent-light); text-transform: uppercase; letter-spacing: 0.04em; }
  .mvi-modal-score { font-size: 0.72rem; font-weight: 700; background: var(--color-accent); color: white; padding: 2px 8px; border-radius: 10px; }
  .mvi-fav-btn { background: none; border: 1px solid var(--color-border); border-radius: 8px; padding: 5px 10px; cursor: pointer; font-size: 1.1rem; color: #D1D5DB; transition: all 0.15s; }
  .mvi-fav-btn:hover { border-color: #F59E0B; color: #F59E0B; }
  .mvi-fav-btn.active { border-color: #F59E0B; color: #F59E0B; background: #FFFBEB; }
  .mvi-close-btn { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 7px; padding: 5px; cursor: pointer; color: var(--color-text-muted); transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
  .mvi-close-btn:hover { background: #FEF2F2; border-color: #FECACA; color: #DC2626; }
  .mvi-modal-body { padding: 1.1rem 1.4rem; overflow-y: auto; flex: 1; }
  .mvi-modal-title { font-family: var(--font-display); font-size: 1.3rem; font-weight: 400; color: var(--color-text); line-height: 1.3; margin-bottom: 0.8rem; }
  .mvi-modal-infos { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.8rem; }
  .mvi-modal-info-item { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: var(--color-text-muted); }
  .mvi-modal-divider { height: 1px; background: var(--color-border); margin-bottom: 0.8rem; }
  .mvi-modal-desc { font-size: 0.9rem; line-height: 1.7; color: var(--color-text); white-space: pre-line; }
  .mvi-modal-footer { padding: 0.9rem 1.4rem 1.2rem; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--color-border); flex-shrink: 0; }
  .mvi-btn-secondary { background: none; border: 1px solid var(--color-border); color: var(--color-text-muted); border-radius: 8px; padding: 8px 18px; font-size: 0.88rem; font-weight: 500; cursor: pointer; font-family: var(--font-body); transition: all 0.15s; }
  .mvi-btn-secondary:hover { border-color: var(--color-accent); color: var(--color-accent); }
  .mvi-btn-primary { display: flex; align-items: center; gap: 7px; color: white; border: none; border-radius: 8px; padding: 9px 18px; font-size: 0.88rem; font-weight: 500; text-decoration: none; cursor: pointer; transition: opacity 0.15s; font-family: var(--font-body); }
  .mvi-btn-primary:hover { opacity: 0.88; }

  .mvi-confirm-modal { background: var(--color-surface); border-radius: 14px; padding: 1.8rem; max-width: 380px; width: 100%; box-shadow: 0 24px 60px rgba(0,0,0,0.25); animation: mvi-slideUp 0.2s ease; }
  .mvi-confirm-modal h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 400; color: var(--color-text); margin-bottom: 8px; }
  .mvi-confirm-modal p { font-size: 0.85rem; color: var(--color-text-muted); line-height: 1.55; margin-bottom: 1.4rem; }
  .mvi-confirm-actions { display: flex; gap: 10px; justify-content: flex-end; }
  .mvi-btn-danger { background: #DC2626; color: white; border: none; border-radius: 8px; padding: 9px 18px; font-size: 0.88rem; font-weight: 500; cursor: pointer; font-family: var(--font-body); transition: background 0.15s; }
  .mvi-btn-danger:hover { background: #B91C1C; }

  /* ── SPINNER / TOAST ── */
  .mvi-spinner { width: 20px; height: 20px; border: 2px solid var(--color-border); border-top-color: var(--color-accent-light); border-radius: 50%; animation: mvi-spin 0.7s linear infinite; }
  .mvi-spinner-sm { width: 14px; height: 14px; border: 2px solid var(--color-border); border-top-color: var(--color-accent-light); border-radius: 50%; animation: mvi-spin 0.7s linear infinite; }
  .mvi-spinner-lg { width: 34px; height: 34px; border: 3px solid var(--color-border); border-top-color: var(--color-accent-light); border-radius: 50%; animation: mvi-spin 0.7s linear infinite; }
  .mvi-toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: var(--color-accent); color: white; padding: 12px 24px; border-radius: 30px; font-size: 0.88rem; font-weight: 500; z-index: 9999; animation: mvi-fadeUp 0.3s ease; white-space: nowrap; pointer-events: none; }

  @keyframes mvi-spin { to { transform: rotate(360deg); } }
  @keyframes mvi-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes mvi-fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes mvi-slideUp { from{opacity:0;transform:scale(0.93) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes mvi-fadeUp { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

  @media (max-width: 768px) {
    .mvi-layout { flex-direction: column; height: auto; }
    .mvi-sidebar { width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--color-border); }
    .mvi-watch-list { flex-direction: row; flex-wrap: wrap; padding: 0.4rem; }
    .mvi-watch-item { width: auto; }
    .mvi-articles-grid { grid-template-columns: 1fr; }
    .mvi-preview-config { grid-template-columns: 1fr; }
    .mvi-preview-art-list { grid-template-columns: 1fr; }
    .mvi-field-row { grid-template-columns: 1fr; }
    .mvi-search { width: 100%; }
  }
`