import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface Command {
    data: SlashCommandBuilder | ReturnType<SlashCommandBuilder["addStringOption"]>;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
