import { loadEnvConfig } from "@next/env";
import { createWorkPayBot } from "../lib/bot/bot";
import { getBotConfig, getWebhookUrl, isHttpsUrl } from "../lib/bot/config";
import { configureBotMenu } from "../lib/bot/menu";

loadEnvConfig(process.cwd());

async function main() {
  const config = getBotConfig();
  if (!isHttpsUrl(config.appUrl)) {
    throw new Error("NEXT_PUBLIC_APP_URL must be a public HTTPS URL before running bot:setup");
  }

  const webhookUrl = getWebhookUrl(config);
  const bot = createWorkPayBot();

  await configureBotMenu(bot);
  await bot.api.setWebhook(webhookUrl, {
    secret_token: config.webhookSecret ?? undefined,
    allowed_updates: ["message", "callback_query", "pre_checkout_query"]
  });

  console.log(`Configured @${config.username}`);
  console.log(`Menu button: ${config.appUrl}`);
  console.log(`Webhook: ${webhookUrl}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Failed to configure WorkPay bot");
  process.exit(1);
});
