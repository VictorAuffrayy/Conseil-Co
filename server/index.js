// ════════════════════════════════════════════════════════════════════════════
// SERVEUR D'ALERTES EMAIL — ConseilAndCo
//
// Vérifie périodiquement (cron) les nouveaux articles pour chaque utilisateur
// abonné aux alertes email (topics du catalogue + veilles personnalisées),
// et envoie un email de digest via Resend.
//
// Lancement : npm run server   (en parallèle de json-server et vite)
// ════════════════════════════════════════════════════════════════════════════

import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

import { fetchAllSources, getArticleKey } from './rssFetcher.js'
import { sendEmail, buildDigestEmail } from './emailService.js'
import { TOPIC_SOURCES } from './topicSources.js'
import { TOPIC_KEYWORDS } from './topicKeywords.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, '..', 'db.json')

const PORT = process.env.ALERT_SERVER_PORT || 3002
const CRON_SCHEDULE = process.env.ALERT_CRON_SCHEDULE || '0 * * * *' // toutes les heures par défaut

const app = express()
app.use(cors())
app.use(express.json())

// ── HELPERS DB ────────────────────────────────────────────────────────────────
async function readDb() {
  const raw = await fs.readFile(DB_PATH, 'utf-8')
  return JSON.parse(raw)
}

async function writeDb(db) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
}

// Score simple d'un article par rapport à une liste de mots-clés
function scoreArticle(article, keywords = []) {
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

const COLORS_BY_CATEGORY = {
  'Tech': '#3730A3', 'RH': '#166534', 'Finance': '#92400E', 'Juridique': '#6B21A8',
  'Stratégie': '#0C4A6E', 'Opérations': '#9A3412', 'Marketing': '#9F1239', 'Secteur': '#134E4A',
}

// ── CŒUR : vérification des alertes pour un utilisateur ────────────────────────
async function checkUserAlerts(user, db) {
  if (!user.emailAlerts || !user.email) return { sent: false, newCount: 0 }

  const seenKeys = new Set(user.seenArticleKeys || [])
  const groups = []
  const newKeysToAdd = []

  // ── 1. Topics du catalogue (subscriptions) ──
  for (const topicId of (user.subscriptions || [])) {
    const topic = db.topics.find(t => t.id === topicId)
    if (!topic) continue
    const sources = TOPIC_SOURCES[topicId] || []
    if (sources.length === 0) continue

    const articles = await fetchAllSources(sources)
    const keywords = TOPIC_KEYWORDS[topicId] || []
    const cutoff = Date.now() - 48 * 60 * 60 * 1000
    const recent = articles.filter(a => !a.pubDate || new Date(a.pubDate).getTime() > cutoff)

    const newArticles = []
    for (const a of recent) {
      const key = getArticleKey(a)
      if (!seenKeys.has(key)) {
        newArticles.push({ ...a, relevanceScore: scoreArticle(a, keywords) })
        newKeysToAdd.push(key)
      }
    }

    if (newArticles.length > 0) {
      newArticles.sort((a, b) => b.relevanceScore - a.relevanceScore)
      groups.push({
        watchLabel: topic.label,
        watchColor: COLORS_BY_CATEGORY[topic.category] || '#1A3A2A',
        articles: newArticles,
      })
    }
  }

  // ── 2. Veilles personnalisées (customWatches) ──
  const userWatches = (db.customWatches || []).filter(w => w.userId === user.id)
  for (const watch of userWatches) {
    if (!watch.sources || watch.sources.length === 0) continue

    const articles = await fetchAllSources(watch.sources)
    const cutoff = Date.now() - 48 * 60 * 60 * 1000
    const recent = articles.filter(a => !a.pubDate || new Date(a.pubDate).getTime() > cutoff)

    const newArticles = []
    for (const a of recent) {
      const key = getArticleKey(a)
      if (!seenKeys.has(key)) {
        newArticles.push({ ...a, relevanceScore: scoreArticle(a, watch.keywords || []) })
        newKeysToAdd.push(key)
      }
    }

    if (newArticles.length > 0) {
      newArticles.sort((a, b) => b.relevanceScore - a.relevanceScore)
      groups.push({
        watchLabel: watch.name,
        watchColor: watch.color || '#1A3A2A',
        articles: newArticles,
      })
    }
  }

  // ── 3. Mettre à jour seenArticleKeys (toujours, même si pas d'email envoyé) ──
  if (newKeysToAdd.length > 0) {
    const allSeen = [...seenKeys, ...newKeysToAdd]
    // Garder seulement les 2000 derniers pour ne pas faire grossir db.json indéfiniment
    user.seenArticleKeys = allSeen.slice(-2000)
  }

  // ── 4. Envoyer l'email si nouveaux articles ──
  if (groups.length === 0) return { sent: false, newCount: 0 }

  const totalNew = groups.reduce((sum, g) => sum + g.articles.length, 0)
  const html = buildDigestEmail(user.name || 'là', groups)

  try {
    await sendEmail({
      to: user.email,
      subject: `${totalNew} nouvel${totalNew > 1 ? 'aux' : ''} article${totalNew > 1 ? 's' : ''} sur votre veille — ConseilAndCo`,
      html,
    })
    return { sent: true, newCount: totalNew }
  } catch (err) {
    console.error(`  ❌ Erreur envoi email à ${user.email}:`, err.message)
    return { sent: false, newCount: totalNew, error: err.message }
  }
}

// ── JOB PRINCIPAL : parcourt tous les utilisateurs ──────────────────────────────
async function runAlertCheck() {
  console.log(`\n[${new Date().toLocaleString('fr-FR')}] 🔍 Vérification des alertes...`)
  const db = await readDb()

  let usersChecked = 0
  let emailsSent = 0

  for (const user of db.users) {
    if (!user.emailAlerts) continue
    usersChecked++
    const result = await checkUserAlerts(user, db)
    if (result.sent) {
      emailsSent++
      console.log(`  ✅ Email envoyé à ${user.email} (${result.newCount} nouveaux articles)`)
    } else if (result.newCount > 0) {
      console.log(`  ⚠️  ${result.newCount} nouveaux articles pour ${user.email} mais email non envoyé (${result.error || 'erreur inconnue'})`)
    } else {
      console.log(`  · Rien de nouveau pour ${user.email}`)
    }
  }

  await writeDb(db)
  console.log(`[${new Date().toLocaleString('fr-FR')}] ✓ Terminé — ${usersChecked} utilisateur(s) vérifié(s), ${emailsSent} email(s) envoyé(s)\n`)

  return { usersChecked, emailsSent }
}

// ── ROUTES ────────────────────────────────────────────────────────────────────

// Vérification manuelle pour un utilisateur spécifique (utile pour tester)
app.post('/check-alerts/:userId', async (req, res) => {
  try {
    const db = await readDb()
    const user = db.users.find(u => u.id === req.params.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const result = await checkUserAlerts(user, db)
    await writeDb(db)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Vérification globale (tous les utilisateurs) — déclenchable manuellement
app.post('/check-alerts', async (req, res) => {
  try {
    const result = await runAlertCheck()
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Healthcheck
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ConseilAndCo Alert Server',
    cronSchedule: CRON_SCHEDULE,
    resendConfigured: !!process.env.RESEND_API_KEY,
  })
})

// ── DÉMARRAGE ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n📬 Serveur d'alertes ConseilAndCo démarré sur http://localhost:${PORT}`)
  console.log(`⏰ Vérification automatique programmée : ${CRON_SCHEDULE}`)
  if (!process.env.RESEND_API_KEY) {
    console.log(`⚠️  RESEND_API_KEY non configurée — les emails seront simulés (loggés dans la console).`)
  }
  console.log(`\nEndpoints disponibles :`)
  console.log(`  GET  /                        → statut du serveur`)
  console.log(`  POST /check-alerts            → vérifie tous les utilisateurs`)
  console.log(`  POST /check-alerts/:userId    → vérifie un utilisateur précis\n`)
})

// Cron job — vérification automatique périodique
cron.schedule(CRON_SCHEDULE, () => {
  runAlertCheck().catch(err => console.error('Erreur cron:', err))
})