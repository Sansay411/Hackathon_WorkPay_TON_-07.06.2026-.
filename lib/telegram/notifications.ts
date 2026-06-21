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
