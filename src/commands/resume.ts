import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { QueueManager } from '../audio/QueueManager';

export const resumeCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ytmusic-resume')
        .setDescription('Resumes a paused track'),

    async execute(interaction: ChatInputCommandInteraction) {
        const queue = QueueManager.getInstance().get(interaction.guildId!);

        if (!queue || !queue.currentTrack) {
            await interaction.reply({ content: 'There is nothing to resume.', ephemeral: true });
            return;
        }

        queue.player.unpause();
        await interaction.reply('Playback resumed.');
    }
};
