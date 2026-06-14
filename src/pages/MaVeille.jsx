import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../AuthContext'
import Navbar from '../components/Navbar'
import { matchCategories, suggestKeywords, suggestSources } from '../services/sourceLibrary'

const API = 'http://localhost:3001'
const RSS_PROXY = import.meta.env.VITE_PROXY_URL
  ? `${import.meta.env.VITE_PROXY_URL}/proxy-rss`
  : null

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
  let lastErr
  // 1. Proxy serveur Render (prioritaire en prod)
  if (RSS_PROXY) {
    try {
      const res = await fetch(`${RSS_PROXY}?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(15000) })
      if (res.ok) {
        const xml = await res.text()
        if (xml.trim().startsWith('<')) return parseRSS(xml, name)
      }
    } catch(e) { lastErr = e }
  }
  // 2. allorigins.win (fallback)
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(12000) })
    if (res.ok) {
      const json = await res.json()
      if (json.contents && json.contents.trim().startsWith('<')) return parseRSS(json.contents, name)
    }
  } catch(e) { lastErr = e }
  // 3. rss2json (dernier recours)
  try {
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(12000) })
    if (res.ok) {
      const json = await res.json()
      if (json.status === 'ok' && Array.isArray(json.items)) {
        return json.items.map(item => ({
          id: `art-${btoa(encodeURIComponent(item.link || item.title)).slice(0, 16)}`,
          title: item.title || 'Sans titre',
          link: item.link || '#',
          description: (item.description || '').replace(/<[^>]*>/g, '').slice(0, 300),
          fullDescription: (item.description || '').replace(/<[^>]*>/g, '').slice(0, 800),
          pubDate: item.pubDate ? new Date(item.pubDate) : null,
          pubDateFormatted: item.pubDate ? new Date(item.pubDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Date inconnue',
          pubTimeFormatted: item.pubDate ? new Date(item.pubDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
          source: name, author: item.author || '',
        }))
      }
    }
  } catch(e) { lastErr = e }
  throw lastErr || new Error('Tous les proxies ont echoue')
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

// Clé unique fiable pour identifier un article, en évitant les collisions
// sur '#' (lien manquant) ou des IDs accidentellement identiques.
function getArticleKey(article) {
  if (article.link && article.link !== '#') return article.link
  if (article.id) return article.id
  return `${article.title || ''}__${article.source || ''}`
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
  const [step, setStep] = useState(1) // 1=questionnaire 2=preview
  const [form, setForm] = useState({
    name: '',
    description: '',
    keywords: '',
    color: WATCH_COLORS[0],
  })
  const [error, setError] = useState('')
  const [matchedCategories, setMatchedCategories] = useState([])
  const [selectedSources, setSelectedSources] = useState([]) // sources cochées
  const [extraSources, setExtraSources] = useState('') // sources manuelles ajoutées
  const [finalKeywords, setFinalKeywords] = useState([])
  const [previewArticles, setPreviewArticles] = useState([])
  const [loadingPreview, setLoadingPreview] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  // ── Étape 1 → 2 : analyse automatique de la thématique ──
  const analyze = () => {
    if (!form.name.trim()) {
      setError('Donne un nom à ta veille.')
      return
    }
    if (!form.description.trim() && !form.keywords.trim()) {
      setError('Décris ta thématique ou donne au moins quelques mots-clés.')
      return
    }
    setError('')

    const userKw = form.keywords.split(',').map(k => k.trim()).filter(Boolean)
    const matched = matchCategories(form.description, userKw)
    const sources = suggestSources(matched, 10)
    const keywords = suggestKeywords(matched, userKw)

    setMatchedCategories(matched)
    setSelectedSources(sources)
    setFinalKeywords(keywords)
    setStep(2)

    if (sources.length > 0) {
      fetchPreview(sources, keywords)
    }
  }

  const toggleSource = (source) => {
    setSelectedSources(prev => {
      const exists = prev.some(s => s.url === source.url)
      const next = exists ? prev.filter(s => s.url !== source.url) : [...prev, source]
      fetchPreview(next, finalKeywords)
      return next
    })
  }

  const fetchPreview = async (sources, keywords) => {
    if (sources.length === 0) {
      setPreviewArticles([])
      return
    }
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

  // Sources additionnelles saisies manuellement (format Nom|URL, une par ligne)
  const getExtraSources = () => extraSources.split('\n').map(line => {
    const [name, ...rest] = line.split('|')
    return { name: name?.trim(), url: rest.join('|')?.trim() }
  }).filter(s => s.name && s.url)

  const applyExtraSources = () => {
    const extras = getExtraSources()
    if (extras.length === 0) return
    const next = [...selectedSources, ...extras.filter(e => !selectedSources.some(s => s.url === e.url))]
    setSelectedSources(next)
    setExtraSources('')
    fetchPreview(next, finalKeywords)
  }

  const removeSource = (url) => {
    const next = selectedSources.filter(s => s.url !== url)
    setSelectedSources(next)
    fetchPreview(next, finalKeywords)
  }

  const save = () => {
    if (selectedSources.length === 0) {
      setError('Sélectionne au moins une source.')
      return
    }
    onCreate({
      name: form.name,
      description: form.description,
      color: form.color,
      keywords: finalKeywords,
      sources: selectedSources,
    })
  }

  // Toutes les sources disponibles dans les catégories matchées (pour cocher/décocher)
  const availableSources = (() => {
    const all = matchedCategories.flatMap(c => c.sources.map(s => ({ ...s, category: c.category })))
    const seen = new Set()
    return all.filter(s => {
      if (seen.has(s.url)) return false
      seen.add(s.url); return true
    })
  })()

  // ── STEP 1 : QUESTIONNAIRE ──
  if (step === 1) return (
    <div className="mvi-wizard">
      <div className="mvi-wizard-header">
        <h2 className="mvi-wizard-title">Créer une nouvelle veille</h2>
        <p className="mvi-wizard-sub">Décris ta thématique — le système trouve automatiquement des sources RSS pertinentes et des mots-clés de scoring.</p>
      </div>

      <div className="mvi-wizard-form">
        <div className="mvi-field">
          <label>Nom de la veille <span className="mvi-required">*</span></label>
          <input name="name" value={form.name} onChange={handle} placeholder="ex : Judo — Compétitions & Actualités" />
        </div>

        <div className="mvi-field">
          <label>Décris ta thématique <span className="mvi-optional">(recommandé)</span></label>
          <textarea
            name="description"
            value={form.description}
            onChange={handle}
            rows={4}
            placeholder="ex : Je veux suivre l'actualité du judo, les résultats de compétitions, les classements IJF et les actualités de la Fédération Française de Judo."
          />
          <span className="mvi-field-hint">Plus c'est précis, meilleures seront les sources trouvées.</span>
        </div>

        <div className="mvi-field">
          <label>Mots-clés supplémentaires <span className="mvi-optional">(optionnel)</span></label>
          <input name="keywords" value={form.keywords} onChange={handle} placeholder="ex : judo, ijf, tatami, ippon, grand slam" />
          <span className="mvi-field-hint">Séparés par des virgules. Aide à affiner la recherche de sources et le scoring.</span>
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

        {error && <p className="mvi-error">{error}</p>}

        <div className="mvi-wizard-actions">
          <button className="mvi-btn-ghost" onClick={onCancel}>Annuler</button>
          <button className="mvi-btn-generate" onClick={analyze}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Trouver mes sources
          </button>
        </div>
      </div>
    </div>
  )

  // ── STEP 2 : PREVIEW & SÉLECTION DES SOURCES ──
  return (
    <div className="mvi-wizard mvi-wizard-preview">
      <div className="mvi-preview-header">
        <div className="mvi-preview-title-row">
          <span className="mvi-preview-color-dot" style={{ background: form.color }} />
          <h2 className="mvi-preview-title">{form.name}</h2>
        </div>
        {matchedCategories.length > 0 ? (
          <p className="mvi-preview-summary">
            Thématiques détectées : {matchedCategories.slice(0, 3).map(c => c.category).join(', ')}
          </p>
        ) : (
          <p className="mvi-preview-summary mvi-preview-summary-warn">
            Aucune thématique reconnue automatiquement — ajoute tes propres sources RSS ci-dessous.
          </p>
        )}
      </div>

      <div className="mvi-preview-config">
        <div className="mvi-preview-section">
          <h4 className="mvi-preview-section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            {finalKeywords.length} mots-clés de scoring
          </h4>
          <div className="mvi-keyword-list">
            {finalKeywords.map(k => (
              <span key={k} className="mvi-keyword-pill">{k}</span>
            ))}
          </div>
        </div>

        <div className="mvi-preview-section">
          <h4 className="mvi-preview-section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
            {selectedSources.length} source{selectedSources.length !== 1 ? 's' : ''} sélectionnée{selectedSources.length !== 1 ? 's' : ''}
          </h4>

          {availableSources.length > 0 ? (
            <div className="mvi-source-checklist">
              {availableSources.map(s => {
                const checked = selectedSources.some(sel => sel.url === s.url)
                return (
                  <label key={s.url} className="mvi-source-check-item">
                    <input type="checkbox" checked={checked} onChange={() => toggleSource(s)} />
                    <div>
                      <strong>{s.name}</strong>
                      <span>{s.category}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          ) : (
            <p className="mvi-field-hint">Aucune source trouvée automatiquement.</p>
          )}

          {/* Sources sélectionnées hors bibliothèque (ajoutées manuellement) */}
          {selectedSources.filter(s => !availableSources.some(a => a.url === s.url)).map(s => (
            <div key={s.url} className="mvi-source-item mvi-source-item-manual">
              <span className="mvi-source-dot" style={{ background: form.color }} />
              <div>
                <strong>{s.name}</strong>
                <span>{s.url}</span>
              </div>
              <button className="mvi-source-remove" onClick={() => removeSource(s.url)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}

          <div className="mvi-add-source-row">
            <textarea
              value={extraSources}
              onChange={e => setExtraSources(e.target.value)}
              rows={2}
              placeholder="Ajouter une source manuelle : Nom|https://url/du/flux/rss"
              style={{ fontFamily: 'monospace', fontSize: '0.76rem' }}
            />
            <button className="mvi-btn-ghost" onClick={applyExtraSources}>Ajouter</button>
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
            <p>Aucun article récent trouvé — sélectionne au moins une source ci-dessus.</p>
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

      {error && <p className="mvi-error" style={{ margin: '0 1.4rem 1rem' }}>{error}</p>}

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

  const isFav = a => favorites.some(f => getArticleKey(f) === getArticleKey(a))

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
  const { user } = useAuth()
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
    const artKey = getArticleKey(article)
    const isFav = favorites.some(f => getArticleKey(f) === artKey)
    const next = isFav
      ? favorites.filter(f => getArticleKey(f) !== artKey)
      : [...favorites, { ...article, savedAt: new Date().toISOString() }]
    setFavorites(next)
    showToast(isFav ? '✓ Retiré des favoris' : '★ Ajouté aux favoris !')
    try {
      await fetch(`${API}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: next })
      })
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

  /* Checklist sources */
  .mvi-source-checklist { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; max-height: 220px; overflow-y: auto; }
  .mvi-source-check-item { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 7px; cursor: pointer; transition: background 0.12s; }
  .mvi-source-check-item:hover { background: var(--color-accent-muted); }
  .mvi-source-check-item input { width: 16px; height: 16px; accent-color: var(--color-accent); cursor: pointer; flex-shrink: 0; }
  .mvi-source-check-item strong { font-size: 0.82rem; font-weight: 600; color: var(--color-text); display: block; }
  .mvi-source-check-item span { font-size: 0.7rem; color: var(--color-text-muted); }
  .mvi-source-item-manual { padding: 8px; background: var(--color-bg); border-radius: 8px; margin-bottom: 6px; align-items: center; }
  .mvi-source-remove { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 4px; border-radius: 6px; flex-shrink: 0; transition: all 0.15s; }
  .mvi-source-remove:hover { background: #FEF2F2; color: #DC2626; }
  .mvi-add-source-row { display: flex; gap: 8px; align-items: flex-start; margin-top: 8px; }
  .mvi-add-source-row textarea { flex: 1; }
  .mvi-preview-summary-warn { color: #B45309; }

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