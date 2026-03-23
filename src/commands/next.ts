import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { QueueManager } from '../audio/QueueManager';
import { playTrack } from '../audio/player';

export const nextCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ytmusic-next')
        .setDescription('Skips the current track and plays the next in the queue'),

    async execute(interaction: ChatInputCommandInteraction) {
        const queue = QueueManager.getInstance().get(interaction.guildId!);

        if (!queue || !queue.currentTrack) {
            await interaction.reply({ content: 'There is nothing currently playing to skip.', ephemeral: true });
            return;
        }

        // Just stop the player! The 'Idle' event in player.ts will automatically handle shifting the track or stopping cleanly!
        queue.player.stop(true);
        await interaction.reply('Skipped to the next track! ⏭️');
    }
};
