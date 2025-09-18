import fs from 'fs'
import path from 'path'

/**
 * Reads the Genesys logo from the public directory and returns a data URI.  The
 * logo is distributed in this repository under the assumption that it is free
 * for non‑commercial use.  If you have your own licensed artwork, replace
 * `public/genesys-logo-png-transparent.png` with your image and adjust
 * the filename accordingly.
 */
function getLogoDataUri() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'genesys-logo-png-transparent.png')
    const data = fs.readFileSync(filePath).toString('base64')
    const ext = path.extname(filePath).slice(1)
    return `data:image/${ext};base64,${data}`
  } catch (err) {
    console.error('Failed to read logo for email template', err)
    return ''
  }
}

/**
 * Builds a basic HTML email for magic link login.  Pass the login URL and
 * recipient name (optional) and receive a full HTML document.  Inline styles
 * are used for compatibility with most email clients.
 */
export function magicLinkEmail({
  link,
  recipientName,
}: {
  link: string
  recipientName?: string
}) {
  const logoUri = getLogoDataUri()
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hello,'
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Sign in to Genesys RPG Manager</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #1a202c;">
            ${logoUri ? `<img src="${logoUri}" alt="Genesys logo" style="width: 120px; height: auto; margin-bottom: 10px;" />` : ''}
            <h1 style="color: #f6ad55; margin: 0; font-size: 24px;">Genesys RPG Manager</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; color: #2d3748;">
            <p style="margin-top: 0;">${greeting}</p>
            <p>Click the button below to sign in to your Genesys RPG Manager account.  This link is valid for a single use and will expire after a short time.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="background-color: #f6ad55; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Sign In</a>
            </p>
            <p>If you did not request this email, you can ignore it safely.</p>
            <p style="margin-bottom: 0;">Happy gaming!</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px; text-align: center; background-color: #edf2f7; color: #718096; font-size: 12px;">
            This email was sent by your self‑hosted Genesys RPG Manager.
          </td>
        </tr>
      </table>
    </body>
  </html>`
}

/**
 * Builds an invitation email.  Used when inviting a player to join a campaign.
 */
export function inviteEmail({
  inviteLink,
  campaignName,
  gmName,
  recipientName,
}: {
  inviteLink: string
  campaignName: string
  gmName: string
  recipientName?: string
}) {
  const logoUri = getLogoDataUri()
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hello,'
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Invitation to ${campaignName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #1a202c;">
            ${logoUri ? `<img src="${logoUri}" alt="Genesys logo" style="width: 120px; height: auto; margin-bottom: 10px;" />` : ''}
            <h1 style="color: #f6ad55; margin: 0; font-size: 24px;">Genesys RPG Manager</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; color: #2d3748;">
            <p style="margin-top: 0;">${greeting}</p>
            <p><strong>${gmName}</strong> has invited you to join the <strong>${campaignName}</strong> campaign on Genesys RPG Manager.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #f6ad55; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
            </p>
            <p>If you weren't expecting this invitation, please ignore this email.</p>
            <p style="margin-bottom: 0;">We look forward to gaming with you!</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px; text-align: center; background-color: #edf2f7; color: #718096; font-size: 12px;">
            This invitation was sent by your self‑hosted Genesys RPG Manager.
          </td>
        </tr>
      </table>
    </body>
  </html>`
}