export async function sendBotNotification(
  telegramId: string,
  text: string,
  buttonText?: string,
  buttonUrl?: string
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !telegramId) {
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const replyMarkup = buttonText && buttonUrl
    ? {
        inline_keyboard: [
          [
            {
              text: buttonText,
              url: buttonUrl
            }
          ]
        ]
      }
    : undefined;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramId,
        text,
        parse_mode: "HTML",
        reply_markup: replyMarkup
      })
    });
    return res.ok;
  } catch (error) {
    console.error("Failed to send bot notification", error);
    return false;
  }
}

export async function sendArbitrationAlert(
  dealId: string,
  dealTitle: string,
  eventsHistory: Array<{ event_type: string; metadata?: unknown; actor_id?: string; created_at: string }>
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const arbitrageChatId = process.env.ARBITRAGE_TELEGRAM_CHAT_ID;
  if (!token || !arbitrageChatId) {
    console.log("Arbitration Telegram configuration is not set. Webhook bypassed.");
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const logText = eventsHistory
    .map(
      (ev) => {
        const meta = (ev.metadata || {}) as Record<string, unknown>;
        return `• <b>${ev.event_type}</b>: ${
          (meta.progress_status as string | undefined) || (meta.reason as string | undefined) || ""
        } (actor: ${ev.actor_id || "system"}) at ${new Date(ev.created_at).toLocaleTimeString()}`;
      }
    )
    .join("\n");

  const messageText = `⚠️ <b>DISPUTE OPENED (ARBITRAGE REVIEW)</b>\n\n` +
    `Escrow Deal ID: <code>${dealId}</code>\n` +
    `Title: <b>${dealTitle}</b>\n\n` +
    `<b>Status & Progress Event Logs:</b>\n${logText || "No audit events registered."}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: arbitrageChatId,
        text: messageText,
        parse_mode: "HTML"
      })
    });
    return res.ok;
  } catch (error) {
    console.error("Failed to send arbitration alert to Telegram group", error);
    return false;
  }
}
