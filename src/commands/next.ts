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

        queue.history.push(queue.currentTrack);
        queue.currentTrack = queue.tracks.shift() || null;
        queue.playbackDuration = 0;

        if (queue.currentTrack) {
            playTrack(queue);
            await interaction.reply(`Skipped. Now playing **${queue.currentTrack.title}**.`);
        } else {
            queue.player.stop(true);
            await interaction.reply('Skipped. The queue is now empty.');
        }
    }
};
