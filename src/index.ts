process.env.DEBUG = "*";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { registerEvents } from "./events";
import { Logger } from "./utils/logger";
import dotenv from "dotenv";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

if (!process.env.DISCORD_TOKEN) {
  Logger.error("DISCORD_TOKEN is missing in the environment variables!");
  process.exit(1);
}

import { generateDependencyReport } from "@discordjs/voice";

// Dump all voice dependencies to ensure encryption packages aren't silently failing
Logger.debug(
  `\n--- Voice Dependency Report ---\n${generateDependencyReport()}\n-------------------------------\n`,
);

client.on("debug", (info) => Logger.debug(`[Discord.js Core]: ${info}`));
client.on("warn", (info) => Logger.warning(`[Discord.js Warn]: ${info}`));
client.on("error", (error) =>
  Logger.error(`[Discord.js Error]: ${error.message}`),
);

registerEvents(client);

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  Logger.error(`Failed to login: ${err.message}`);
});
