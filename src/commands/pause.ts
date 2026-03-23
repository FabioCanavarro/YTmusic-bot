import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { QueueManager } from '../audio/QueueManager';

export const pauseCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ytmusic-pause')
        .setDescription('Pauses the current playing track'),

    async execute(interaction: ChatInputCommandInteraction) {
        const queue = QueueManager.getInstance().get(interaction.guildId!);

        if (!queue || !queue.currentTrack) {
            await interaction.reply({ content: 'There is nothing currently playing.', ephemeral: true });
            return;
        }

        queue.player.pause();
        await interaction.reply('Playback paused.');
    }
};
