import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../AuthContext'
import Navbar from '../components/Navbar'
import { fetchArticlesForTopic, invalidateTopicCache } from '../services/rssService'

const API = 'http://localhost:3001'

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
function ArticleModal({ article, topic, onClose, isFav, onToggleFav }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const colors = CATEGORY_COLORS[topic?.category] || CATEGORY_COLORS['Tech']

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-meta">
            <span className="modal-badge" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
              {topic?.label}
            </span>
            <span className="modal-source">{article.source}</span>
            {article.relevanceScore && (
              <span className="modal-score">{article.relevanceScore}% pertinent</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {onToggleFav && (
              <button
                className={`modal-fav-btn${isFav ? ' active' : ''}`}
                onClick={() => onToggleFav(article)}
                title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                {isFav ? '★' : '☆'}
              </button>
            )}
            <button className="modal-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="modal-body">
          <h2 className="modal-title">{article.title}</h2>

          <div className="modal-info-row">
            {article.pubDateFormatted && (
              <div className="modal-info-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{article.pubDateFormatted}{article.pubTimeFormatted ? ` à ${article.pubTimeFormatted}` : ''}</span>
              </div>
            )}
            {article.author && (
              <div className="modal-info-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <span>{article.author}</span>
              </div>
            )}
          </div>

          <div className="modal-divider" />

          <div className="modal-description">
            {article.fullDescription || article.description || 'Aucun résumé disponible pour cet article.'}
          </div>

          {article.category && (
            <div className="modal-tags">
              <span className="modal-tag">{article.category}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn-secondary" onClick={onClose}>Fermer</button>
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="modal-btn-primary"
          >
            Lire l'article complet
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 1.5rem;
          animation: overlayIn 0.2s ease;
        }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-card {
          background: var(--color-surface);
          border-radius: 16px;
          width: 100%; max-width: 620px;
          max-height: 85vh;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 60px rgba(0,0,0,0.25);
          animation: cardIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 1.4rem 1.4rem 0;
          gap: 1rem;
        }
        .modal-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
        .modal-badge { font-size: 0.7rem; font-weight: 600; padding: 3px 10px; border-radius: 12px; }
        .modal-source { font-size: 0.75rem; font-weight: 600; color: var(--color-accent-light); text-transform: uppercase; letter-spacing: 0.04em; }
        .modal-score { font-size: 0.72rem; font-weight: 700; background: var(--color-accent); color: white; padding: 2px 8px; border-radius: 10px; }
        .modal-close {
          background: var(--color-bg); border: 1px solid var(--color-border);
          border-radius: 8px; padding: 6px; cursor: pointer;
          color: var(--color-text-muted); transition: all 0.15s;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .modal-close:hover { background: #FEF2F2; border-color: #FECACA; color: #DC2626; }
        .modal-fav-btn { background: none; border: 1px solid var(--color-border); border-radius: 8px; padding: 6px 10px; cursor: pointer; font-size: 1.1rem; color: #D1D5DB; transition: all 0.15s; }
        .modal-fav-btn:hover { border-color: #F59E0B; color: #F59E0B; }
        .modal-fav-btn.active { border-color: #F59E0B; color: #F59E0B; background: #FFFBEB; }

        .modal-body { padding: 1.2rem 1.4rem; overflow-y: auto; flex: 1; }

        .modal-title {
          font-family: var(--font-display);
          font-size: 1.35rem; font-weight: 400;
          color: var(--color-text);
          line-height: 1.3; margin-bottom: 1rem;
        }

        .modal-info-row { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
        .modal-info-item { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: var(--color-text-muted); }
        .modal-info-item svg { color: var(--color-accent-light); flex-shrink: 0; }

        .modal-divider { height: 1px; background: var(--color-border); margin-bottom: 1rem; }

        .modal-description {
          font-size: 0.92rem; line-height: 1.7;
          color: var(--color-text);
          white-space: pre-line;
        }

        .modal-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 1rem; }
        .modal-tag {
          background: var(--color-accent-muted);
          color: var(--color-accent);
          font-size: 0.72rem; font-weight: 500;
          padding: 3px 10px; border-radius: 12px;
          border: 1px solid #C6DBC8;
        }

        .modal-footer {
          padding: 1rem 1.4rem 1.4rem;
          display: flex; justify-content: flex-end; gap: 10px;
          border-top: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .modal-btn-secondary {
          background: none; border: 1px solid var(--color-border);
          color: var(--color-text-muted); border-radius: 8px;
          padding: 9px 18px; font-size: 0.88rem; font-weight: 500;
          cursor: pointer; font-family: var(--font-body);
          transition: all 0.15s;
        }
        .modal-btn-secondary:hover { border-color: var(--color-accent); color: var(--color-accent); }
        .modal-btn-primary {
          display: flex; align-items: center; gap: 7px;
          background: var(--color-accent); color: white;
          border: none; border-radius: 8px;
          padding: 9px 18px; font-size: 0.88rem; font-weight: 500;
          text-decoration: none; cursor: pointer;
          transition: background 0.15s;
        }
        .modal-btn-primary:hover { background: var(--color-accent-light); }

        @media (max-width: 640px) {
          .modal-card { max-height: 92vh; border-radius: 12px; }
          .modal-title { font-size: 1.1rem; }
        }
      `}</style>
    </div>
  )
}

// --- MODAL VEILLE TOPIC ---
function TopicModal({ topic, articles, isLoading, onClose, onRefresh, onOpenArticle, isFavorite, onToggleFav }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const colors = CATEGORY_COLORS[topic?.category] || CATEGORY_COLORS['Tech']

  return (
    <div className="tmodal-overlay" onClick={onClose}>
      <div className="tmodal-card" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="tmodal-header">
          <div className="tmodal-header-left">
            <span className="tmodal-badge" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
              {topic.category}
            </span>
            <h2 className="tmodal-title">{topic.label}</h2>
            <p className="tmodal-desc">{topic.description}</p>
          </div>
          <button className="tmodal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Subheader */}
        <div className="tmodal-subheader">
          <span className="tmodal-count">
            {isLoading ? 'Chargement...' : articles.length > 0
              ? `${articles.length} article${articles.length > 1 ? 's' : ''} · 48 dernières heures`
              : 'Aucun article récent'}
          </span>
          <button className="tmodal-refresh-btn" onClick={onRefresh} disabled={isLoading}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Actualiser
          </button>
        </div>

        {/* Body */}
        <div className="tmodal-body">
          {isLoading ? (
            <div className="tmodal-loading">
              <div className="tmodal-spinner" />
              <span>Scraping des flux RSS en cours...</span>
            </div>
          ) : articles.length === 0 ? (
            <div className="tmodal-empty">
              <span>📭</span>
              <p>Aucun article publié dans les 48 dernières heures pour ce topic.</p>
              <button className="tmodal-refresh-btn" style={{ marginTop: '12px' }} onClick={onRefresh}>
                Forcer la recherche
              </button>
            </div>
          ) : (
            <div className="tmodal-list">
              {articles.map((article, i) => (
                <div
                  key={article.id || i}
                  className="tmodal-article"
                  onClick={(e) => onOpenArticle(article, topic, e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && onOpenArticle(article, topic, e)}
                >
                  <div className="tmodal-article-top">
                    <span className="tmodal-article-rank">#{i + 1}</span>
                    <span className="tmodal-article-source">{article.source}</span>
                    <span className="tmodal-article-score">{article.relevanceScore}%</span>
                    <button
                      className={`tmodal-fav-btn${isFavorite && isFavorite(article) ? ' active' : ''}`}
                      onClick={e => { e.stopPropagation(); onToggleFav && onToggleFav(article) }}
                      title={isFavorite && isFavorite(article) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      {isFavorite && isFavorite(article) ? '★' : '☆'}
                    </button>
                  </div>
                  <p className="tmodal-article-title">{article.title}</p>
                  <div className="tmodal-article-bottom">
                    <DateBadge pubDate={article.pubDate} pubDateFormatted={article.pubDateFormatted} />
                    <span className="tmodal-article-cta">Voir le détail →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <style>{`
        .tmodal-overlay {
          position: fixed; inset: 0; z-index: 900;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 1.5rem;
          animation: overlayIn 0.2s ease;
        }
        .tmodal-card {
          background: var(--color-surface);
          border-radius: 16px;
          width: 100%; max-width: 680px;
          max-height: 88vh;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 60px rgba(0,0,0,0.22);
          animation: cardIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.93) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .tmodal-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 1.4rem 1.4rem 1rem; gap: 1rem;
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .tmodal-header-left { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .tmodal-badge { font-size: 0.7rem; font-weight: 600; padding: 3px 10px; border-radius: 12px; align-self: flex-start; }
        .tmodal-title { font-family: var(--font-display); font-size: 1.4rem; font-weight: 400; color: var(--color-text); line-height: 1.2; }
        .tmodal-desc { font-size: 0.83rem; color: var(--color-text-muted); line-height: 1.5; max-width: 520px; }
        .tmodal-close {
          background: var(--color-bg); border: 1px solid var(--color-border);
          border-radius: 8px; padding: 6px; cursor: pointer;
          color: var(--color-text-muted); transition: all 0.15s;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .tmodal-close:hover { background: #FEF2F2; border-color: #FECACA; color: #DC2626; }

        .tmodal-subheader {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.75rem 1.4rem;
          background: var(--color-bg);
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .tmodal-count { font-size: 0.75rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .tmodal-refresh-btn {
          display: flex; align-items: center; gap: 5px;
          background: none; border: 1px solid var(--color-border);
          border-radius: 5px; padding: 4px 10px;
          font-size: 0.75rem; color: var(--color-text-muted);
          cursor: pointer; font-family: var(--font-body); transition: all 0.15s;
        }
        .tmodal-refresh-btn:hover { border-color: var(--color-accent-light); color: var(--color-accent); }
        .tmodal-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .tmodal-body { overflow-y: auto; flex: 1; padding: 1rem 1.4rem 1.4rem; }

        .tmodal-loading { display: flex; align-items: center; gap: 10px; color: var(--color-text-muted); font-size: 0.88rem; padding: 2rem 0; }
        .tmodal-spinner { width: 18px; height: 18px; border: 2px solid var(--color-border); border-top-color: var(--color-accent-light); border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .tmodal-empty { display: flex; flex-direction: column; align-items: center; padding: 2.5rem 1rem; text-align: center; gap: 8px; }
        .tmodal-empty span { font-size: 2.2rem; }
        .tmodal-empty p { font-size: 0.85rem; color: var(--color-text-muted); max-width: 280px; line-height: 1.5; }

        .tmodal-list { display: flex; flex-direction: column; gap: 8px; }

        .tmodal-article {
          background: var(--color-bg); border: 1px solid var(--color-border);
          border-radius: 10px; padding: 12px 14px;
          cursor: pointer; transition: border-color 0.15s, background 0.15s, transform 0.1s;
        }
        .tmodal-article:hover { border-color: var(--color-accent-light); background: var(--color-accent-muted); transform: translateY(-1px); }
        .tmodal-article:active { transform: translateY(0); }

        .tmodal-article-top { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
        .tmodal-article-rank { font-size: 0.72rem; font-weight: 700; color: var(--color-text-muted); width: 20px; flex-shrink: 0; }
        .tmodal-article-source { font-size: 0.72rem; font-weight: 600; color: var(--color-accent-light); text-transform: uppercase; letter-spacing: 0.04em; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tmodal-article-score { font-size: 0.7rem; font-weight: 700; background: var(--color-accent); color: white; padding: 2px 8px; border-radius: 10px; flex-shrink: 0; }
        .tmodal-fav-btn { background: none; border: none; cursor: pointer; font-size: 1rem; color: #D1D5DB; transition: color 0.15s, transform 0.15s; padding: 0 2px; line-height: 1; flex-shrink: 0; }
        .tmodal-fav-btn:hover { color: #F59E0B; transform: scale(1.2); }
        .tmodal-fav-btn.active { color: #F59E0B; }
        .tmodal-article-title { font-size: 0.88rem; font-weight: 500; color: var(--color-text); line-height: 1.4; margin-bottom: 8px; }
        .tmodal-article-bottom { display: flex; justify-content: space-between; align-items: center; }
        .tmodal-article-cta { font-size: 0.74rem; color: var(--color-accent-light); font-weight: 600; }

        @media (max-width: 640px) {
          .tmodal-card { max-height: 92vh; border-radius: 12px; }
          .tmodal-title { font-size: 1.15rem; }
        }
      `}</style>
    </div>
  )
}

// --- BADGE DATE ---
function DateBadge({ pubDate, pubDateFormatted }) {
  if (!pubDate) return <span className="art-date">Article de référence</span>
  const ageH = (Date.now() - new Date(pubDate).getTime()) / (1000 * 60 * 60)
  const isNew = ageH < 6
  const isToday = ageH < 24
  return (
    <span className={`art-date ${isNew ? 'art-date-new' : isToday ? 'art-date-today' : ''}`}>
      {isNew && '🔴 '}{isToday && !isNew && '🟡 '}{pubDateFormatted}
    </span>
  )
}

// --- PAGE CATALOGUE ---
export default function Catalogue() {
  const { user, login } = useAuth()
  const [topics, setTopics] = useState([])
  const [subscriptions, setSubscriptions] = useState(user?.subscriptions || [])
  const [favorites, setFavorites] = useState([])
  const [articles, setArticles] = useState({})
  const [loadingArticles, setLoadingArticles] = useState({})
  const [filterCategory, setFilterCategory] = useState('Tous')
  const [search, setSearch] = useState('')
  const [toastMsg, setToastMsg] = useState('')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [topicModal, setTopicModal] = useState(null)

  useEffect(() => {
    fetch(`${API}/topics`).then(r => r.json()).then(setTopics).catch(() => {})
  }, [])

  // Charger les favoris depuis la base
  useEffect(() => {
    if (!user?.id) return
    fetch(`${API}/users/${user.id}`)
      .then(r => r.json())
      .then(data => setFavorites(Array.isArray(data.favorites) ? data.favorites : []))
      .catch(() => setFavorites(Array.isArray(user?.favorites) ? user.favorites : []))
  }, [user?.id])

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2800)
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
    } catch {
      setFavorites(favorites)
    }
  }

  const isFavorite = (article) => {
    const artKey = getArticleKey(article)
    return favorites.some(f => getArticleKey(f) === artKey)
  }

  const toggleSubscription = async (topicId, e) => {
    e.stopPropagation()
    const isSub = subscriptions.includes(topicId)
    const next = isSub
      ? subscriptions.filter(id => id !== topicId)
      : [...subscriptions, topicId]
    setSubscriptions(next)
    try {
      await fetch(`${API}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptions: next })
      })
      login({ ...user, subscriptions: next })
      showToast(isSub ? '✓ Désabonnement effectué' : '✓ Abonnement activé !')
    } catch {
      setSubscriptions(subscriptions)
    }
  }

  const loadArticles = useCallback(async (topicId) => {
    setLoadingArticles(prev => ({ ...prev, [topicId]: true }))
    const fetched = await fetchArticlesForTopic(topicId)
    setArticles(prev => ({ ...prev, [topicId]: fetched }))
    setLoadingArticles(prev => ({ ...prev, [topicId]: false }))
  }, [])

  const openTopic = useCallback(async (topic) => {
    setTopicModal(topic)
    if (!articles[topic.id]) await loadArticles(topic.id)
  }, [articles, loadArticles])

  const refreshTopic = async (topicId) => {
    invalidateTopicCache(topicId)
    setArticles(prev => ({ ...prev, [topicId]: undefined }))
    await loadArticles(topicId)
    showToast('🔄 Veille actualisée !')
  }

  const openArticleModal = (article, topic, e) => {
    e.preventDefault()
    setSelectedArticle(article)
    setSelectedTopic(topic)
  }

  const categories = ['Tous', ...new Set(topics.map(t => t.category))]

  const filtered = topics.filter(t => {
    const matchCat = filterCategory === 'Tous' || t.category === filterCategory
    const matchSearch = t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="cat-page">
      <Navbar />

      <div className="cat-container">
        <div className="cat-header">
          <div>
            <h1>Catalogue de veille</h1>
            <p>Articles des 48 dernières heures, classés par pertinence. Abonnez-vous pour recevoir le digest hebdomadaire.</p>
          </div>
          <div className="cat-header-right">
            <div className="cat-sub-counter">
              <strong>{subscriptions.length}</strong>
              <span>abonnement{subscriptions.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="cat-refresh-info">
              <span className="cat-refresh-dot" />
              <span>Veille des 48 dernières heures · Cache 24h</span>
            </div>
          </div>
        </div>

        <div className="cat-filters">
          <input
            className="cat-search"
            type="text"
            placeholder="🔍  Rechercher un topic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="cat-categories">
            {categories.map(cat => (
              <button
                key={cat}
                className={`cat-cat-btn${filterCategory === cat ? ' active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="cat-grid">
          {filtered.map(topic => {
            const isSub = subscriptions.includes(topic.id)
            const colors = CATEGORY_COLORS[topic.category] || CATEGORY_COLORS['Tech']

            return (
              <div key={topic.id} className={`cat-card${isSub ? ' subscribed' : ''}`}>
                <div className="cat-card-meta">
                  <span className="cat-badge" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                    {topic.category}
                  </span>
                  {isSub && <span className="cat-badge-sub">✓ Abonné</span>}
                </div>

                <h3 className="cat-card-title">{topic.label}</h3>
                <p className="cat-card-desc">{topic.description}</p>

                <div className="cat-card-actions">
                  <button className="cat-articles-btn" onClick={() => openTopic(topic)}>
                    Voir la veille
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </button>
                  <button className={`cat-sub-btn${isSub ? ' unsub' : ''}`} onClick={(e) => toggleSubscription(topic.id, e)}>
                    {isSub ? 'Se désabonner' : "S'abonner"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {topicModal && (
        <TopicModal
          topic={topicModal}
          articles={articles[topicModal.id] || []}
          isLoading={!!loadingArticles[topicModal.id]}
          onClose={() => setTopicModal(null)}
          onRefresh={() => refreshTopic(topicModal.id)}
          isFavorite={isFavorite}
          onToggleFav={toggleFavorite}
          onOpenArticle={(article, topic, e) => {
            e.preventDefault()
            setSelectedArticle(article)
            setSelectedTopic(topic)
          }}
        />
      )}

      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          topic={selectedTopic}
          isFav={isFavorite(selectedArticle)}
          onToggleFav={toggleFavorite}
          onClose={() => { setSelectedArticle(null); setSelectedTopic(null) }}
        />
      )}

      {toastMsg && <div className="cat-toast">{toastMsg}</div>}

      <style>{`
        .cat-page { min-height: 100vh; background: var(--color-bg); }
        .cat-container { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem; }

        .cat-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; gap: 1rem; }
        .cat-header h1 { font-family: var(--font-display); font-size: 2rem; font-weight: 400; color: var(--color-text); margin-bottom: 0.4rem; }
        .cat-header p { font-size: 0.88rem; color: var(--color-text-muted); max-width: 480px; line-height: 1.6; }
        .cat-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }

        .cat-sub-counter { text-align: center; background: var(--color-accent-muted); border: 1px solid #C6DBC8; border-radius: 10px; padding: 12px 20px; }
        .cat-sub-counter strong { display: block; font-family: var(--font-display); font-size: 2rem; color: var(--color-accent); line-height: 1; }
        .cat-sub-counter span { font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

        .cat-refresh-info { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--color-text-muted); }
        .cat-refresh-dot { width: 7px; height: 7px; background: #22C55E; border-radius: 50%; animation: pulse 2s infinite; flex-shrink: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .cat-filters { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem; align-items: center; }
        .cat-search { background: var(--color-surface); border: 1.5px solid var(--color-border); border-radius: 8px; padding: 9px 14px; font-size: 0.88rem; font-family: var(--font-body); color: var(--color-text); outline: none; width: 250px; transition: border-color 0.2s; }
        .cat-search:focus { border-color: var(--color-accent-light); }
        .cat-categories { display: flex; flex-wrap: wrap; gap: 6px; }
        .cat-cat-btn { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 20px; padding: 5px 14px; font-size: 0.8rem; font-weight: 500; font-family: var(--font-body); color: var(--color-text-muted); cursor: pointer; transition: all 0.15s; }
        .cat-cat-btn:hover { border-color: var(--color-accent-light); color: var(--color-accent); }
        .cat-cat-btn.active { background: var(--color-accent); border-color: var(--color-accent); color: white; }

        .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.2rem; }

        .cat-card { background: var(--color-surface); border: 1.5px solid var(--color-border); border-radius: 12px; padding: 1.4rem; display: flex; flex-direction: column; gap: 0.8rem; transition: border-color 0.2s, box-shadow 0.2s; }
        .cat-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .cat-card.subscribed { border-color: var(--color-accent-light); background: #FAFFFC; }
        .cat-card.open { border-color: var(--color-accent); }

        .cat-card-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .cat-badge { font-size: 0.7rem; font-weight: 600; padding: 3px 9px; border-radius: 12px; }
        .cat-badge-sub { background: var(--color-accent); color: white; font-size: 0.7rem; font-weight: 600; padding: 3px 9px; border-radius: 12px; }
        .cat-badge-count { background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text-muted); font-size: 0.7rem; font-weight: 500; padding: 3px 9px; border-radius: 12px; }

        .cat-card-title { font-family: var(--font-display); font-size: 1.08rem; font-weight: 400; color: var(--color-text); }
        .cat-card-desc { font-size: 0.83rem; color: var(--color-text-muted); line-height: 1.55; flex: 1; }

        .cat-card-actions { display: flex; gap: 8px; }
        .cat-articles-btn { display: flex; align-items: center; gap: 5px; justify-content: center; background: none; border: 1px solid var(--color-border); border-radius: 7px; padding: 7px 12px; font-size: 0.81rem; font-weight: 500; font-family: var(--font-body); color: var(--color-text-muted); cursor: pointer; transition: all 0.15s; flex: 1; }
        .cat-articles-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
        .cat-sub-btn { background: var(--color-accent); color: white; border: none; border-radius: 7px; padding: 7px 16px; font-size: 0.81rem; font-weight: 500; font-family: var(--font-body); cursor: pointer; transition: background 0.15s; white-space: nowrap; }
        .cat-sub-btn:hover { background: var(--color-accent-light); }
        .cat-sub-btn.unsub { background: transparent; color: #DC2626; border: 1px solid #FECACA; }
        .cat-sub-btn.unsub:hover { background: #FEF2F2; }

        .cat-articles { border-top: 1px solid var(--color-border); padding-top: 1rem; }
        .cat-articles-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .cat-articles-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); font-weight: 600; }
        .cat-refresh-btn { display: flex; align-items: center; gap: 5px; background: none; border: 1px solid var(--color-border); border-radius: 5px; padding: 3px 8px; font-size: 0.72rem; color: var(--color-text-muted); cursor: pointer; font-family: var(--font-body); transition: all 0.15s; }
        .cat-refresh-btn:hover { border-color: var(--color-accent-light); color: var(--color-accent); }
        .cat-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .cat-loading { display: flex; align-items: center; gap: 10px; color: var(--color-text-muted); font-size: 0.85rem; padding: 0.8rem 0; }
        .cat-spinner { width: 16px; height: 16px; border: 2px solid var(--color-border); border-top-color: var(--color-accent-light); border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .cat-empty { display: flex; flex-direction: column; align-items: center; padding: 1.2rem; text-align: center; gap: 6px; }
        .cat-empty span { font-size: 1.8rem; }
        .cat-empty p { font-size: 0.82rem; color: var(--color-text-muted); max-width: 260px; line-height: 1.5; }

        .cat-articles-list { display: flex; flex-direction: column; gap: 7px; }

        .cat-article-item {
          background: var(--color-bg); border: 1px solid var(--color-border);
          border-radius: 8px; padding: 10px 12px;
          cursor: pointer; transition: border-color 0.15s, background 0.15s, transform 0.1s;
        }
        .cat-article-item:hover { border-color: var(--color-accent-light); background: var(--color-accent-muted); transform: translateY(-1px); }
        .cat-article-item:active { transform: translateY(0); }

        .cat-article-top { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
        .cat-article-rank { font-size: 0.7rem; font-weight: 700; color: var(--color-text-muted); width: 18px; flex-shrink: 0; }
        .cat-article-source { font-size: 0.7rem; font-weight: 600; color: var(--color-accent-light); text-transform: uppercase; letter-spacing: 0.04em; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cat-article-score { font-size: 0.7rem; font-weight: 700; background: var(--color-accent); color: white; padding: 2px 7px; border-radius: 10px; flex-shrink: 0; }
        .cat-article-title { font-size: 0.84rem; font-weight: 500; color: var(--color-text); line-height: 1.4; margin-bottom: 6px; }
        .cat-article-bottom { display: flex; justify-content: space-between; align-items: center; }

        .art-date { font-size: 0.72rem; color: var(--color-text-muted); }
        .art-date-new { color: #DC2626; font-weight: 600; }
        .art-date-today { color: #D97706; font-weight: 500; }

        .cat-article-cta { font-size: 0.72rem; color: var(--color-accent-light); font-weight: 600; }

        .cat-toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background: var(--color-accent); color: white; padding: 12px 24px; border-radius: 30px; font-size: 0.88rem; font-weight: 500; z-index: 9999; animation: fadeUp 0.3s ease; white-space: nowrap; }
        @keyframes fadeUp { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

        @media (max-width: 768px) { .cat-grid { grid-template-columns: 1fr; } .cat-header { flex-direction: column; } .cat-header-right { align-items: flex-start; } }
      `}</style>
    </div>
  )
}