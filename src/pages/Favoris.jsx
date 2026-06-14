import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import Navbar from '../components/Navbar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const CATEGORY_COLORS = {
  'Tech':       { bg: '#EEF2FF', text: '#3730A3', border: '#C7D2FE' },
  'RH':         { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
  'Finance':    { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  'Juridique':  { bg: '#FDF4FF', text: '#6B21A8', border: '#E9D5FF' },
  'Stratégie':  { bg: '#F0F9FF', text: '#0C4A6E', border: '#BAE6FD' },
  'Opérations': { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA' },
  'Marketing':  { bg: '#FFF1F2', text: '#9F1239', border: '#FECDD3' },
  'Secteur':    { bg: '#F0FDFA', text: '#134E4A', border: '#99F6E4' },
}

// Clé unique fiable pour identifier un article, en évitant les collisions
// sur '#' (lien manquant) ou des IDs accidentellement identiques.
function getArticleKey(article) {
  if (article.link && article.link !== '#') return article.link
  if (article.id) return article.id
  return `${article.title || ''}__${article.source || ''}`
}

// --- MODAL ARTICLE ---
function ArticleModal({ article, onClose, onRemove, allTopics }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const topic = allTopics.find(t => t.id === article.topicId)
  const colors = CATEGORY_COLORS[topic?.category] || CATEGORY_COLORS['Tech']

  return (
    <div className="fav-overlay" onClick={onClose}>
      <div className="fav-modal" onClick={e => e.stopPropagation()}>
        <div className="fav-modal-header">
          <div className="fav-modal-meta">
            {topic && (
              <span className="fav-modal-badge" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                {topic.label}
              </span>
            )}
            <span className="fav-modal-source">{article.source}</span>
            {article.relevanceScore && (
              <span className="fav-modal-score">{article.relevanceScore}% pertinent</span>
            )}
          </div>
          <button className="fav-modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="fav-modal-body">
          <h2 className="fav-modal-title">{article.title}</h2>

          <div className="fav-modal-info-row">
            {article.pubDateFormatted && (
              <div className="fav-modal-info-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{article.pubDateFormatted}{article.pubTimeFormatted ? ` à ${article.pubTimeFormatted}` : ''}</span>
              </div>
            )}
            {article.savedAt && (
              <div className="fav-modal-info-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>Sauvegardé le {new Date(article.savedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            )}
            {article.author && (
              <div className="fav-modal-info-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <span>{article.author}</span>
              </div>
            )}
          </div>

          <div className="fav-modal-divider" />

          <p className="fav-modal-description">
            {article.fullDescription || article.description || 'Aucun résumé disponible.'}
          </p>
        </div>

        <div className="fav-modal-footer">
          <button className="fav-modal-btn-remove" onClick={() => { onRemove(article); onClose() }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Retirer des favoris
          </button>
          <a href={article.link} target="_blank" rel="noopener noreferrer" className="fav-modal-btn-primary">
            Lire l'article
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}

// --- PAGE FAVORIS ---
export default function Favoris() {
  const { user } = useAuth()

  const [favorites, setFavorites] = useState([])
  const [allTopics, setAllTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [search, setSearch] = useState('')
  const [filterTopic, setFilterTopic] = useState('tous')
  const [sortBy, setSortBy] = useState('saved') // 'saved' | 'score' | 'date'
  const [toastMsg, setToastMsg] = useState('')

  // Charger les topics
  useEffect(() => {
    fetch(`${API}/topics`).then(r => r.json()).then(setAllTopics).catch(() => {})
  }, [])

  // Charger les favoris depuis la base
  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    fetch(`${API}/users/${user.id}`)
      .then(r => r.json())
      .then(data => {
        setFavorites(data.favorites || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user?.id])

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2800)
  }

  // Retirer un favori — persisté en base
  const removeFavorite = async (article) => {
    const artKey = getArticleKey(article)
    const next = favorites.filter(f => getArticleKey(f) !== artKey)
    setFavorites(next)
    try {
      await fetch(`${API}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: next })
      })
      showToast('✓ Article retiré des favoris')
    } catch {
      setFavorites(favorites)
      showToast('Erreur — réessaie')
    }
  }

  // Topics représentés dans les favoris
  const topicsInFavs = allTopics.filter(t =>
    favorites.some(f => f.topicId === t.id)
  )

  // Articles filtrés + triés
  const displayed = (() => {
    let pool = [...favorites]

    if (filterTopic !== 'tous') {
      pool = pool.filter(f => f.topicId === filterTopic)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      pool = pool.filter(f =>
        f.title?.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.source?.toLowerCase().includes(q)
      )
    }

    if (sortBy === 'saved') {
      pool = [...pool].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
    } else if (sortBy === 'score') {
      pool = [...pool].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    } else if (sortBy === 'date') {
      pool = [...pool].sort((a, b) => {
        if (!a.pubDate && !b.pubDate) return 0
        if (!a.pubDate) return 1
        if (!b.pubDate) return -1
        return new Date(b.pubDate) - new Date(a.pubDate)
      })
    }

    return pool
  })()

  // Stats par topic pour le sidebar
  const countByTopic = favorites.reduce((acc, f) => {
    acc[f.topicId] = (acc[f.topicId] || 0) + 1
    return acc
  }, {})

  return (
    <div className="fav-page">
      <Navbar />

      <div className="fav-container">

        {/* Header */}
        <div className="fav-header">
          <div>
            <h1 className="fav-title">Mes <em>favoris</em></h1>
            <p className="fav-subtitle">
              {favorites.length} article{favorites.length > 1 ? 's' : ''} sauvegardé{favorites.length > 1 ? 's' : ''}
              {favorites.length > 0 && ' · conservés jusqu\'à suppression'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="fav-loading">
            <div className="fav-spinner" />
            <span>Chargement de vos favoris...</span>
          </div>
        ) : favorites.length === 0 ? (

          /* --- ÉTAT VIDE --- */
          <div className="fav-empty">
            <div className="fav-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h2 className="fav-empty-title">Aucun favori pour l'instant</h2>
            <p className="fav-empty-text">
              Cliquez sur l'étoile ★ d'un article dans <strong>Ma Veille</strong><br />
              pour le sauvegarder ici définitivement.
            </p>
            <a href="/ma-veille" className="fav-empty-cta">
              Aller à ma veille
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          </div>

        ) : (
          <div className="fav-layout">

            {/* Sidebar filtres topics */}
            <aside className="fav-sidebar">
              <p className="fav-sidebar-label">Par topic</p>
              <button
                className={`fav-sidebar-btn${filterTopic === 'tous' ? ' active' : ''}`}
                onClick={() => setFilterTopic('tous')}
              >
                <span>Tous les favoris</span>
                <span className="fav-sidebar-count">{favorites.length}</span>
              </button>
              {topicsInFavs.map(topic => {
                const colors = CATEGORY_COLORS[topic.category] || CATEGORY_COLORS['Tech']
                return (
                  <button
                    key={topic.id}
                    className={`fav-sidebar-btn${filterTopic === topic.id ? ' active' : ''}`}
                    onClick={() => setFilterTopic(topic.id)}
                  >
                    <div className="fav-sidebar-topic-info">
                      <span
                        className="fav-sidebar-dot"
                        style={{ background: colors.text }}
                      />
                      <span>{topic.label}</span>
                    </div>
                    <span className="fav-sidebar-count">{countByTopic[topic.id] || 0}</span>
                  </button>
                )
              })}
            </aside>

            {/* Contenu principal */}
            <main className="fav-main">

              {/* Controls */}
              <div className="fav-controls">
                <input
                  className="fav-search"
                  placeholder="Rechercher dans mes favoris..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <div className="fav-sort-group">
                  <button className={`fav-sort-btn${sortBy === 'saved' ? ' active' : ''}`} onClick={() => setSortBy('saved')}>
                    Récemment sauvegardés
                  </button>
                  <button className={`fav-sort-btn${sortBy === 'score' ? ' active' : ''}`} onClick={() => setSortBy('score')}>
                    Pertinence
                  </button>
                  <button className={`fav-sort-btn${sortBy === 'date' ? ' active' : ''}`} onClick={() => setSortBy('date')}>
                    Date de publication
                  </button>
                </div>
              </div>

              {/* Résultat de recherche vide */}
              {displayed.length === 0 ? (
                <div className="fav-no-results">
                  <span>🔍</span>
                  <p>Aucun favori ne correspond à « {search} »</p>
                </div>
              ) : (
                <div className="fav-list">
                  {displayed.map((article, i) => {
                    const topic = allTopics.find(t => t.id === article.topicId)
                    const colors = CATEGORY_COLORS[topic?.category] || CATEGORY_COLORS['Tech']
                    const savedDate = article.savedAt
                      ? new Date(article.savedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                      : null

                    return (
                      <article
                        key={article.id || article.link || i}
                        className="fav-card"
                        onClick={() => setSelectedArticle(article)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && setSelectedArticle(article)}
                      >
                        {/* Numéro */}
                        <span className="fav-card-num">#{i + 1}</span>

                        {/* Corps */}
                        <div className="fav-card-body">
                          <div className="fav-card-top">
                            {topic && (
                              <span
                                className="fav-card-topic"
                                style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                              >
                                {topic.label}
                              </span>
                            )}
                            {article.relevanceScore && (
                              <span className="fav-card-score">{article.relevanceScore}%</span>
                            )}
                          </div>

                          <h3 className="fav-card-title">{article.title}</h3>

                          {article.description && (
                            <p className="fav-card-desc">
                              {article.description.slice(0, 160)}{article.description.length > 160 ? '…' : ''}
                            </p>
                          )}

                          <div className="fav-card-footer">
                            <div className="fav-card-meta-left">
                              <span className="fav-card-source">{article.source}</span>
                              {article.pubDateFormatted && (
                                <span className="fav-card-pubdate">· {article.pubDateFormatted}</span>
                              )}
                            </div>
                            {savedDate && (
                              <span className="fav-card-saved">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                                {savedDate}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bouton retirer */}
                        <button
                          className="fav-card-remove"
                          onClick={e => { e.stopPropagation(); removeFavorite(article) }}
                          title="Retirer des favoris"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </article>
                    )
                  })}
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          allTopics={allTopics}
          onClose={() => setSelectedArticle(null)}
          onRemove={(article) => {
            removeFavorite(article)
            setSelectedArticle(null)
          }}
        />
      )}

      {toastMsg && <div className="fav-toast">{toastMsg}</div>}

      <style>{`
        .fav-page { min-height: 100vh; background: var(--color-bg); }
        .fav-container { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem; }

        /* Header */
        .fav-header { margin-bottom: 2rem; }
        .fav-title { font-family: var(--font-display); font-size: 2.2rem; font-weight: 400; color: var(--color-text); }
        .fav-title em { font-style: italic; color: #B45309; }
        .fav-subtitle { font-size: 0.88rem; color: var(--color-text-muted); margin-top: 4px; }

        /* Loading */
        .fav-loading { display: flex; align-items: center; gap: 10px; color: var(--color-text-muted); font-size: 0.88rem; padding: 4rem; }
        .fav-spinner { width: 20px; height: 20px; border: 2px solid var(--color-border); border-top-color: var(--color-accent-light); border-radius: 50%; animation: fav-spin 0.7s linear infinite; }

        /* Empty */
        .fav-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 55vh; text-align: center; gap: 1rem; }
        .fav-empty-icon { color: #D1D5DB; }
        .fav-empty-title { font-family: var(--font-display); font-size: 1.7rem; font-weight: 400; color: var(--color-text); }
        .fav-empty-text { font-size: 0.9rem; color: var(--color-text-muted); line-height: 1.65; }
        .fav-empty-cta { display: flex; align-items: center; gap: 8px; background: var(--color-accent); color: white; text-decoration: none; border-radius: 10px; padding: 12px 24px; font-size: 0.9rem; font-weight: 500; font-family: var(--font-body); margin-top: 8px; transition: background 0.15s; }
        .fav-empty-cta:hover { background: var(--color-accent-light); }

        /* Layout */
        .fav-layout { display: flex; gap: 2rem; align-items: flex-start; }

        /* Sidebar */
        .fav-sidebar { width: 220px; flex-shrink: 0; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 1rem; position: sticky; top: 1.5rem; }
        .fav-sidebar-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--color-text-muted); margin-bottom: 8px; padding: 0 4px; }
        .fav-sidebar-btn { display: flex; align-items: center; justify-content: space-between; width: 100%; background: none; border: none; border-radius: 8px; padding: 8px 10px; font-size: 0.82rem; font-weight: 500; font-family: var(--font-body); color: var(--color-text-muted); cursor: pointer; transition: all 0.15s; text-align: left; gap: 8px; }
        .fav-sidebar-btn:hover { background: var(--color-accent-muted); color: var(--color-accent); }
        .fav-sidebar-btn.active { background: var(--color-accent-muted); color: var(--color-accent); font-weight: 600; }
        .fav-sidebar-topic-info { display: flex; align-items: center; gap: 7px; flex: 1; min-width: 0; }
        .fav-sidebar-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .fav-sidebar-topic-info span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fav-sidebar-count { background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text-muted); font-size: 0.7rem; font-weight: 700; padding: 1px 7px; border-radius: 10px; flex-shrink: 0; }

        /* Main */
        .fav-main { flex: 1; min-width: 0; }

        /* Controls */
        .fav-controls { display: flex; gap: 10px; margin-bottom: 1.2rem; flex-wrap: wrap; align-items: center; }
        .fav-search { background: var(--color-surface); border: 1.5px solid var(--color-border); border-radius: 8px; padding: 9px 14px; font-size: 0.88rem; font-family: var(--font-body); color: var(--color-text); outline: none; width: 280px; transition: border-color 0.2s; }
        .fav-search:focus { border-color: var(--color-accent-light); }
        .fav-sort-group { display: flex; border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; background: var(--color-surface); }
        .fav-sort-btn { background: none; border: none; border-right: 1px solid var(--color-border); padding: 8px 14px; font-size: 0.78rem; font-weight: 500; font-family: var(--font-body); color: var(--color-text-muted); cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .fav-sort-btn:last-child { border-right: none; }
        .fav-sort-btn:hover { background: var(--color-accent-muted); color: var(--color-accent); }
        .fav-sort-btn.active { background: var(--color-accent); color: white; }

        /* List */
        .fav-list { display: flex; flex-direction: column; gap: 10px; }

        .fav-card {
          display: flex; align-items: flex-start; gap: 14px;
          background: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: 12px;
          padding: 1.1rem 1rem 1.1rem 1.2rem;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
          position: relative;
        }
        .fav-card:hover { border-color: #F59E0B; box-shadow: 0 3px 14px rgba(245,158,11,0.1); transform: translateY(-1px); }
        .fav-card:active { transform: translateY(0); }

        .fav-card-num { font-size: 0.72rem; font-weight: 700; color: var(--color-text-muted); padding-top: 3px; width: 20px; flex-shrink: 0; }
        .fav-card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
        .fav-card-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .fav-card-topic { font-size: 0.7rem; font-weight: 600; padding: 3px 9px; border-radius: 12px; }
        .fav-card-score { font-size: 0.7rem; font-weight: 700; background: var(--color-accent); color: white; padding: 2px 7px; border-radius: 10px; }
        .fav-card-title { font-size: 0.92rem; font-weight: 600; color: var(--color-text); line-height: 1.4; }
        .fav-card-desc { font-size: 0.8rem; color: var(--color-text-muted); line-height: 1.5; }
        .fav-card-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; padding-top: 6px; border-top: 1px solid var(--color-border); margin-top: 2px; }
        .fav-card-meta-left { display: flex; align-items: center; gap: 6px; }
        .fav-card-source { font-size: 0.72rem; font-weight: 600; color: var(--color-accent-light); text-transform: uppercase; letter-spacing: 0.04em; }
        .fav-card-pubdate { font-size: 0.72rem; color: var(--color-text-muted); }
        .fav-card-saved { display: flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #B45309; font-weight: 500; }

        .fav-card-remove {
          position: absolute; top: 10px; right: 10px;
          background: none; border: none;
          color: #D1D5DB; cursor: pointer;
          padding: 4px; border-radius: 6px;
          transition: all 0.15s;
          display: flex; align-items: center; justify-content: center;
        }
        .fav-card-remove:hover { background: #FEF2F2; color: #DC2626; }

        /* No results */
        .fav-no-results { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 3rem 1rem; text-align: center; }
        .fav-no-results span { font-size: 2.4rem; }
        .fav-no-results p { font-size: 0.88rem; color: var(--color-text-muted); }

        /* Toast */
        .fav-toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: var(--color-accent); color: white; padding: 12px 24px; border-radius: 30px; font-size: 0.88rem; font-weight: 500; z-index: 9999; animation: fav-fadeUp 0.3s ease; white-space: nowrap; }

        /* Modal */
        .fav-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1.5rem; animation: fav-overlayIn 0.2s ease; }
        .fav-modal { background: var(--color-surface); border-radius: 16px; width: 100%; max-width: 620px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.25); animation: fav-cardIn 0.25s cubic-bezier(0.34,1.56,0.64,1); }
        .fav-modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.4rem 1.4rem 0; gap: 1rem; }
        .fav-modal-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; flex: 1; }
        .fav-modal-badge { font-size: 0.7rem; font-weight: 600; padding: 3px 10px; border-radius: 12px; }
        .fav-modal-source { font-size: 0.75rem; font-weight: 600; color: var(--color-accent-light); text-transform: uppercase; letter-spacing: 0.04em; }
        .fav-modal-score { font-size: 0.72rem; font-weight: 700; background: var(--color-accent); color: white; padding: 2px 8px; border-radius: 10px; }
        .fav-modal-close { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px; padding: 6px; cursor: pointer; color: var(--color-text-muted); transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
        .fav-modal-close:hover { background: #FEF2F2; border-color: #FECACA; color: #DC2626; }
        .fav-modal-body { padding: 1.2rem 1.4rem; overflow-y: auto; flex: 1; }
        .fav-modal-title { font-family: var(--font-display); font-size: 1.35rem; font-weight: 400; color: var(--color-text); line-height: 1.3; margin-bottom: 1rem; }
        .fav-modal-info-row { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
        .fav-modal-info-item { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: var(--color-text-muted); }
        .fav-modal-info-item svg { color: var(--color-accent-light); flex-shrink: 0; }
        .fav-modal-divider { height: 1px; background: var(--color-border); margin-bottom: 1rem; }
        .fav-modal-description { font-size: 0.92rem; line-height: 1.7; color: var(--color-text); white-space: pre-line; }
        .fav-modal-footer { padding: 1rem 1.4rem 1.4rem; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--color-border); flex-shrink: 0; }
        .fav-modal-btn-remove { display: flex; align-items: center; gap: 6px; background: none; border: 1px solid #FECACA; color: #DC2626; border-radius: 8px; padding: 9px 16px; font-size: 0.85rem; font-weight: 500; cursor: pointer; font-family: var(--font-body); transition: all 0.15s; }
        .fav-modal-btn-remove:hover { background: #FEF2F2; }
        .fav-modal-btn-primary { display: flex; align-items: center; gap: 7px; background: var(--color-accent); color: white; border: none; border-radius: 8px; padding: 9px 18px; font-size: 0.88rem; font-weight: 500; text-decoration: none; cursor: pointer; transition: background 0.15s; }
        .fav-modal-btn-primary:hover { background: var(--color-accent-light); }

        /* Keyframes */
        @keyframes fav-spin { to { transform: rotate(360deg); } }
        @keyframes fav-fadeUp { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes fav-overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fav-cardIn { from { opacity: 0; transform: scale(0.92) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

        @media (max-width: 900px) {
          .fav-layout { flex-direction: column; }
          .fav-sidebar { width: 100%; position: static; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 0.8rem; }
          .fav-sidebar-label { width: 100%; margin-bottom: 2px; }
          .fav-sidebar-btn { width: auto; flex-shrink: 0; }
        }
        @media (max-width: 640px) {
          .fav-search { width: 100%; }
          .fav-sort-group { width: 100%; }
          .fav-sort-btn { flex: 1; text-align: center; padding: 8px 6px; }
        }
      `}</style>
    </div>
  )
}