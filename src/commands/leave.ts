import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { QueueManager } from '../audio/QueueManager';

export const leaveCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ytmusic-leave')
        .setDescription('Stops the music and leaves the voice channel'),

    async execute(interaction: ChatInputCommandInteraction) {
        const queue = QueueManager.getInstance().get(interaction.guildId!);

        if (!queue || !queue.connection) {
            await interaction.reply({ content: 'I am not currently in a voice channel!', ephemeral: true });
            return;
        }

        // Deleting the queue calls queue.stop() under the hood, which destroys the connection
        QueueManager.getInstance().delete(interaction.guildId!);

        await interaction.reply('Stopped music and left the voice channel! 👋');
    }
};
