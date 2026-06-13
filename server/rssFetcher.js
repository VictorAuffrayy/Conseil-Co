// ════════════════════════════════════════════════════════════════════════════
// RSS FETCHER — côté serveur (Node), sans DOMParser
// Utilise fast-xml-parser pour parser le XML des flux RSS.
// ════════════════════════════════════════════════════════════════════════════

import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
})

function cleanDescription(desc) {
  if (!desc) return ''
  let text = typeof desc === 'object' ? (desc['#text'] || '') : String(desc)
  return text
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

function extractText(field) {
  if (!field) return ''
  if (typeof field === 'string') return field.replace(/<!\[CDATA\[|\]\]>/g, '').trim()
  if (typeof field === 'object') return (field['#text'] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim()
  return String(field)
}

/**
 * Récupère et parse un flux RSS. Retourne un tableau d'articles normalisés.
 */
export async function fetchRSSSource(url, sourceName) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ConseilAndCoBot/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const xml = await res.text()

  const data = parser.parse(xml)
  const channel = data?.rss?.channel || data?.feed
  if (!channel) return []

  // RSS 2.0 : channel.item — Atom : feed.entry
  let items = channel.item || channel.entry || []
  if (!Array.isArray(items)) items = [items]

  return items.map(item => {
    const title = extractText(item.title)

    let link = '#'
    if (item.link) {
      if (typeof item.link === 'string') link = item.link
      else if (Array.isArray(item.link)) {
        const alt = item.link.find(l => l['@_rel'] === 'alternate') || item.link[0]
        link = alt?.['@_href'] || extractText(alt) || '#'
      } else if (typeof item.link === 'object') {
        link = item.link['@_href'] || extractText(item.link) || '#'
      }
    }
    if (link === '#' && item.guid) link = extractText(item.guid)

    const description = cleanDescription(item.description || item.summary || item.content)
    const pubDateRaw = extractText(item.pubDate || item.published || item.updated)
    const pubDate = pubDateRaw ? new Date(pubDateRaw) : null

    return {
      title: title || 'Sans titre',
      link,
      description: description.slice(0, 300),
      pubDate: pubDate && !isNaN(pubDate.getTime()) ? pubDate.toISOString() : null,
      source: sourceName,
    }
  }).filter(a => a.title && a.title !== 'Sans titre')
}

/**
 * Récupère les articles de plusieurs sources, dédupliqués et triés par date.
 */
export async function fetchAllSources(sources) {
  const all = []
  await Promise.allSettled(
    (sources || []).map(async ({ url, name }) => {
      try {
        const arts = await fetchRSSSource(url, name)
        all.push(...arts)
      } catch (err) {
        console.warn(`  ⚠️  Échec fetch ${name} (${url}):`, err.message)
      }
    })
  )

  const seen = new Set()
  const unique = all.filter(a => {
    const k = a.link !== '#' ? a.link : `${a.title}__${a.source}`
    if (seen.has(k)) return false
    seen.add(k); return true
  })

  return unique.sort((a, b) => {
    if (!a.pubDate && !b.pubDate) return 0
    if (!a.pubDate) return 1
    if (!b.pubDate) return -1
    return new Date(b.pubDate) - new Date(a.pubDate)
  })
}

/**
 * Clé unique pour un article (cohérente avec le front).
 */
export function getArticleKey(article) {
  if (article.link && article.link !== '#') return article.link
  return `${article.title || ''}__${article.source || ''}`
}