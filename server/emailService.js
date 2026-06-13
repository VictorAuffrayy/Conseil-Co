// ════════════════════════════════════════════════════════════════════════════
// SERVICE D'ENVOI D'EMAILS — via Resend (https://resend.com)
// ════════════════════════════════════════════════════════════════════════════

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

if (!RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY non définie dans .env — les emails ne seront pas envoyés.')
}

/**
 * Envoie un email via l'API Resend.
 * @param {string} to - adresse email du destinataire
 * @param {string} subject - sujet de l'email
 * @param {string} html - contenu HTML de l'email
 */
export async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL SIMULÉ] À: ${to} | Sujet: ${subject}`)
    return { simulated: true }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Resend error ${res.status}: ${errText}`)
  }

  return res.json()
}

/**
 * Construit le HTML d'un email de digest "nouveaux articles".
 * @param {string} userName
 * @param {Array<{watchLabel: string, watchColor: string, articles: Array}>} groups
 */
export function buildDigestEmail(userName, groups) {
  const sectionsHtml = groups.map(group => {
    const articlesHtml = group.articles.slice(0, 8).map(a => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #E5E1D8;">
          <a href="${a.link}" style="color: #1A3A2A; font-weight: 600; font-size: 15px; text-decoration: none; line-height: 1.4;">
            ${escapeHtml(a.title)}
          </a>
          <div style="color: #6B7280; font-size: 13px; margin-top: 4px;">
            ${escapeHtml(a.source || '')}${a.pubDateFormatted ? ' · ' + escapeHtml(a.pubDateFormatted) : ''}
          </div>
        </td>
      </tr>
    `).join('')

    return `
      <div style="margin-bottom: 28px;">
        <div style="display: inline-block; background: ${group.watchColor}1A; color: ${group.watchColor}; border: 1px solid ${group.watchColor}55; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 12px; margin-bottom: 10px;">
          ${escapeHtml(group.watchLabel)}
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          ${articlesHtml}
        </table>
      </div>
    `
  }).join('')

  return `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F7F5F0; padding: 32px 24px;">
      <div style="background: #1A3A2A; color: white; padding: 24px 28px; border-radius: 12px 12px 0 0;">
        <div style="font-size: 20px; font-weight: 600; letter-spacing: -0.01em;">
          Conseil<em style="font-style: italic; color: #6EE7B7;">&amp;</em>Co
        </div>
        <div style="font-size: 14px; color: rgba(255,255,255,0.7); margin-top: 6px;">
          Votre digest de veille
        </div>
      </div>
      <div style="background: white; padding: 28px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 15px; color: #1C1C1C; margin-bottom: 20px;">
          Bonjour ${escapeHtml(userName)},<br/><br/>
          De nouveaux articles correspondent à vos veilles :
        </p>
        ${sectionsHtml}
        <p style="font-size: 12px; color: #6B7280; margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E1D8;">
          Vous recevez cet email car vous êtes abonné(e) aux alertes de ces veilles sur Conseil&amp;Co.
          Vous pouvez désactiver ces alertes à tout moment depuis votre compte.
        </p>
      </div>
    </div>
  `
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}