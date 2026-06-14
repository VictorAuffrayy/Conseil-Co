const CACHE_KEY = 'ca_rss_cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24h
const API = 'http://localhost:3001'

// Proxies CORS en cascade — si le premier échoue on essaie le suivant
const CORS_PROXIES = [
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
]

export const TOPIC_SOURCES = {
  't01': [
    { url: 'https://www.lemonde.fr/intelligence-artificielle/rss_full.xml', name: 'Le Monde IA' },
    { url: 'https://www.actuia.com/feed/', name: 'Actu IA' },
    { url: 'https://www.lebigdata.fr/feed', name: 'Le Big Data' },
  ],
  't02': [
    { url: 'https://feeds.feedburner.com/TheHackersNews', name: 'The Hacker News' },
    { url: 'https://www.cert.ssi.gouv.fr/feed/', name: 'CERT-FR' },
    { url: 'https://www.silicon.fr/feed', name: 'Silicon.fr' },
  ],
  't03': [
    { url: 'https://www.journaldunet.com/rss/', name: 'Journal du Net' },
    { url: 'https://www.silicon.fr/feed', name: 'Silicon.fr' },
  ],
  't04': [
    { url: 'https://www.focusrh.com/feed/', name: 'Focus RH' },
    { url: 'https://www.rh-info.fr/feed/', name: 'RH Info' },
  ],
  't05': [
    { url: 'https://www.lesechos.fr/rss/rss_finance_marches.xml', name: 'Les Echos Finance' },
  ],
  't06': [
    { url: 'https://www.village-justice.com/articles/rss.php', name: 'Village de la Justice' },
  ],
  't07': [
    { url: 'https://www.novethic.fr/rss.xml', name: 'Novethic' },
  ],
  't08': [
    { url: 'https://www.voxlog.fr/rss.xml', name: 'Voxlog' },
  ],
  't09': [
    { url: 'https://www.blogdumoderateur.com/feed/', name: 'Blog du Modérateur' },
    { url: 'https://www.journalducm.com/feed/', name: 'Journal du CM' },
  ],
  't10': [
    { url: 'https://www.hbrfrance.fr/feed/', name: 'HBR France' },
  ],
  't11': [
    { url: 'https://www.maddyness.com/feed/', name: 'Maddyness' },
  ],
  't12': [
    { url: 'https://www.businessimmo.com/rss', name: 'Business Immo' },
  ],
  't13': [
    { url: 'https://www.whatsupdoc-lemag.fr/rss.xml', name: "What's Up Doc" },
  ],
  't14': [
    { url: 'https://www.connaissancedesenergies.org/feed', name: 'Connaissance des Énergies' },
    { url: 'https://www.revolution-energetique.com/feed/', name: 'Révolution Énergétique' },
  ],
  't15': [
    { url: 'https://www.cnil.fr/fr/rss.xml', name: 'CNIL' },
  ],
  't16': [
    { url: 'https://www.lebigdata.fr/feed', name: 'Le Big Data' },
    { url: 'https://www.actuia.com/feed/', name: 'Actu IA' },
  ],
  't17': [
    { url: 'https://www.journaldunet.com/ebusiness/commerce/rss/', name: 'JDN E-commerce' },
  ],
  't18': [
    { url: 'https://www.lesechos.fr/rss/rss_monde.xml', name: 'Les Echos Monde' },
  ],
  't19': [
    { url: 'https://www.blogdumoderateur.com/feed/', name: 'Blog du Modérateur' },
  ],
  't20': [
    { url: 'https://www.usinenouvelle.com/rss/all', name: "L'Usine Nouvelle" },
  ],
}

// --- CACHE ---
function getFullCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch { return {} }
}

function saveFullCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch {}
}

function getCachedTopic(topicId) {
  const cache = getFullCache()
  const entry = cache[topicId]
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_DURATION) return null
  return entry.articles
}

function setCachedTopic(topicId, articles) {
  const cache = getFullCache()
  cache[topicId] = { articles, timestamp: Date.now() }
  saveFullCache(cache)
}

export function invalidateTopicCache(topicId) {
  const cache = getFullCache()
  delete cache[topicId]
  saveFullCache(cache)
}

export function clearAllCache() {
  localStorage.removeItem(CACHE_KEY)
}

// --- PARSE RSS XML ---
function parseRSS(xmlText, sourceName) {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, 'application/xml')
    const items = Array.from(doc.querySelectorAll('item'))

    return items.map(item => {
      const title = item.querySelector('title')?.textContent?.trim() || 'Sans titre'
      const link = item.querySelector('link')?.textContent?.trim() ||
        item.querySelector('guid')?.textContent?.trim() || '#'
      const description = item.querySelector('description')?.textContent?.trim() || ''
      const pubDateRaw = item.querySelector('pubDate')?.textContent?.trim() ||
        item.querySelector('dc\\:date')?.textContent?.trim() ||
        item.querySelector('date')?.textContent?.trim() || ''
      const category = item.querySelector('category')?.textContent?.trim() || ''
      const author = item.querySelector('author')?.textContent?.trim() ||
        item.querySelector('dc\\:creator')?.textContent?.trim() || ''

      const cleanDesc = description
        .replace(/<!\[CDATA\[/g, '')
        .replace(/\]\]>/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim()

      const pubDate = pubDateRaw ? new Date(pubDateRaw) : null

      return {
        title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
        link,
        description: cleanDesc.slice(0, 300) + (cleanDesc.length > 300 ? '...' : ''),
        fullDescription: cleanDesc.slice(0, 800),
        pubDate,
        pubDateFormatted: pubDate
          ? pubDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
          : 'Date inconnue',
        pubTimeFormatted: pubDate
          ? pubDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : '',
        source: sourceName,
        category,
        author,
      }
    })
  } catch {
    return []
  }
}

// --- FILTER : 48 dernières heures ---
function filterLast48h(articles) {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000
  return articles.filter(a => a.pubDate && a.pubDate.getTime() > cutoff)
}

// --- SCORE DE PERTINENCE ---
function scoreArticle(article, topicId) {
  let score = 70
  const keywords = {
    't01': ['ia', 'intelligence artificielle', 'llm', 'gpt', 'mistral', 'claude', 'machine learning', 'deepseek', 'openai', 'anthropic', 'agent'],
    't02': ['cybersécurité', 'ransomware', 'piratage', 'vulnérabilité', 'sécurité informatique', 'cyberattaque', 'phishing', 'malware', 'zero trust', 'nis2', 'dora'],
    't03': ['cloud', 'transformation digitale', 'dsi', 'erp', 'saas', 'microsoft', 'google', 'numérique', 'logiciel'],
    't04': ['rh', 'recrutement', 'télétravail', 'emploi', 'formation', 'talents', 'management', 'salariés', 'travail'],
    't05': ['bourse', 'marché', 'financement', 'levée', 'capital', 'investissement', 'fonds', 'action', 'cac 40'],
    't06': ['droit', 'juridique', 'loi', 'tribunal', 'contrat', 'réglementation', 'avocat', 'justice'],
    't07': ['esg', 'rse', 'durabilité', 'carbone', 'développement durable', 'csrd', 'green', 'environnement'],
    't08': ['logistique', 'supply chain', 'transport', 'entrepôt', 'livraison', 'stock', 'chaîne'],
    't09': ['marketing', 'publicité', 'seo', 'growth', 'acquisition', 'brand', 'digital', 'campagne'],
    't10': ['management', 'leadership', 'dirigeant', 'équipe', 'organisation', 'culture', 'gouvernance'],
    't11': ['startup', 'innovation', 'levée de fonds', 'french tech', 'licorne', 'incubateur', 'entrepreneur'],
    't12': ['immobilier', 'logement', 'bureau', 'bâtiment', 'loyer', 'construction', 'foncier'],
    't13': ['santé', 'médecine', 'biotech', 'médical', 'hôpital', 'patient', 'thérapie', 'médicament'],
    't14': ['énergie', 'électricité', 'nucléaire', 'solaire', 'éolien', 'hydrogène', 'transition énergétique'],
    't15': ['rgpd', 'compliance', 'conformité', 'réglementation', 'cnil', 'audit', 'dora', 'ai act'],
    't16': ['data', 'données', 'analytics', 'bi', 'intelligence', 'machine learning', 'big data'],
    't17': ['e-commerce', 'retail', 'marketplace', 'vente en ligne', 'commerce', 'amazon', 'fnac'],
    't18': ['géopolitique', 'économie mondiale', 'international', 'europe', 'guerre', 'diplomatie', 'sanctions'],
    't19': ['ux', 'design', 'utilisateur', 'interface', 'expérience', 'prototype', 'figma'],
    't20': ['industrie', 'usine', 'manufacturing', 'robot', 'automatisation', 'lean', 'production'],
  }

  const words = keywords[topicId] || []
  const text = (article.title + ' ' + article.description).toLowerCase()
  words.forEach(kw => {
    if (text.includes(kw)) score += 5
  })

  // Plus récent = score plus élevé
  if (article.pubDate) {
    const ageHours = (Date.now() - article.pubDate.getTime()) / (1000 * 60 * 60)
    if (ageHours < 6) score += 15
    else if (ageHours < 12) score += 10
    else if (ageHours < 24) score += 5
  }

  return Math.min(score, 99)
}

// --- FETCH PRINCIPAL ---
async function fetchRSSSource(sourceUrl, sourceName) {
  let lastErr
  for (const buildUrl of CORS_PROXIES) {
    try {
      const res = await fetch(buildUrl(sourceUrl), { signal: AbortSignal.timeout(10000) })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const text = await res.text()
      if (text.trim().startsWith('<') || text.trim().startsWith('{')) {
        return parseRSS(text, sourceName)
      }
      throw new Error('Réponse invalide')
    } catch(e) {
      lastErr = e
    }
  }
  throw lastErr
}

export async function fetchArticlesForTopic(topicId) {
  // 1. Cache valide ?
  const cached = getCachedTopic(topicId)
  if (cached) return cached

  // 2. Fetch RSS live
  const sources = TOPIC_SOURCES[topicId] || []
  const allArticles = []

  await Promise.allSettled(
    sources.map(async ({ url, name }) => {
      try {
        const articles = await fetchRSSSource(url, name)
        allArticles.push(...articles)
      } catch {
        // source indisponible
      }
    })
  )

  // 3. Filtrer 48h + dédupliquer + scorer
  const recent = filterLast48h(allArticles)

  const seen = new Set()
  const unique = recent.filter(a => {
    const key = a.link || a.title
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const scored = unique.map(a => ({
    ...a,
    relevanceScore: scoreArticle(a, topicId),
    id: `${topicId}-${btoa(encodeURIComponent(a.link || a.title)).slice(0, 16)}`,
    topicId,
  })).sort((a, b) => b.relevanceScore - a.relevanceScore)

  // 4. Si RSS a donné des résultats → cache + retour
  if (scored.length > 0) {
    setCachedTopic(topicId, scored)
    return scored
  }

  // 5. Sinon fallback db.json (articles statiques)
  try {
    const res = await fetch(`http://localhost:3001/articles?topicId=${topicId}&_sort=relevanceScore&_order=desc&_limit=6`)
    const dbArticles = await res.json()
    // Convertir les articles db pour correspondre au format
    const formatted = dbArticles.map(a => ({
      ...a,
      pubDate: null,
      pubDateFormatted: a.pubDate || 'Article de référence',
      pubTimeFormatted: '',
      fullDescription: a.description,
      author: '',
    }))
    setCachedTopic(topicId, formatted)
    return formatted
  } catch {
    return []
  }
}