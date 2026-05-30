// Telegram Bot notification module.
// Sends order & calculator notifications to a Telegram group/chat.

const TELEGRAM_BOT_TOKEN = (import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string) || ''
const TELEGRAM_CHAT_ID = (import.meta.env.VITE_TELEGRAM_CHAT_ID as string) || ''

export const isTelegramConfigured = Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID)

/**
 * Send a plain-text message to the configured Telegram chat.
 * Fails silently — we never want a Telegram error to block a CRM save.
 */
export async function sendTelegramNotification(message: string): Promise<void> {
  if (!isTelegramConfigured) {
    console.warn('Telegram not configured — skipping notification.')
    return
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          // parse_mode omitted — plain text is safest for user-generated content
        }),
      },
    )

    if (!response.ok) {
      const body = await response.text()
      console.error('Telegram API error:', response.status, body)
    }
  } catch (err) {
    console.error('Failed to send Telegram notification:', err)
  }
}
