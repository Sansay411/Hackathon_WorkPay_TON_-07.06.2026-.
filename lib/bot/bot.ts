import { Bot } from "grammy";
import { getBotConfig } from "@/lib/bot/config";
import { createDealMessage, dealsMessage, helpMessage, unknownMessage, walletMessage, welcomeMessage } from "@/lib/bot/messages";
import { createDealKeyboard, dealsKeyboard, openWorkPayKeyboard, startKeyboard, walletKeyboard } from "@/lib/bot/keyboard";
import { applySuccessfulStarsPayment, validateStarsCheckout } from "@/lib/telegram/stars";

export function createWorkPayBot() {
  const bot = new Bot(getBotConfig().token);

  bot.command("start", async (ctx) => {
    await ctx.reply(welcomeMessage, { reply_markup: startKeyboard() });
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(helpMessage, { reply_markup: openWorkPayKeyboard() });
  });

  bot.command("create", async (ctx) => {
    await ctx.reply(createDealMessage, { reply_markup: createDealKeyboard() });
  });

  bot.command("deals", async (ctx) => {
    await ctx.reply(dealsMessage, { reply_markup: dealsKeyboard() });
  });

  bot.command("wallet", async (ctx) => {
    await ctx.reply(walletMessage, { reply_markup: walletKeyboard() });
  });

  bot.on("pre_checkout_query", async (ctx) => {
    const query = ctx.preCheckoutQuery;
    const validation = validateStarsCheckout({
      telegramId: String(query.from.id),
      currency: query.currency,
      totalAmount: query.total_amount,
      invoicePayload: query.invoice_payload
    });
    await ctx.answerPreCheckoutQuery(validation.ok, validation.ok ? {} : { error_message: validation.reason });
  });

  bot.on("message:successful_payment", async (ctx) => {
    const payment = ctx.message.successful_payment;
    try {
      const result = await applySuccessfulStarsPayment({
        telegramId: String(ctx.from.id),
        currency: payment.currency,
        totalAmount: payment.total_amount,
        invoicePayload: payment.invoice_payload,
        telegramPaymentChargeId: payment.telegram_payment_charge_id
      });
      if (!result.duplicate) {
        await ctx.reply(`Payment confirmed. Your WorkPay balance is now ${result.connectsBalance} Connects.`, { reply_markup: openWorkPayKeyboard() });
      }
    } catch (error) {
      console.error("Stars payment credit failed", error instanceof Error ? error.message : "Unknown error");
      await ctx.reply("Payment was received, but automatic crediting needs support review. Your Telegram receipt is safe.");
    }
  });

  bot.on("message:text", async (ctx) => {
    await ctx.reply(unknownMessage, { reply_markup: openWorkPayKeyboard() });
  });

  bot.catch((error) => {
    console.error("WorkPay bot error", error.message);
  });

  return bot;
}
