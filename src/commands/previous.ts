import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { QueueManager } from '../audio/QueueManager';
import { playTrack } from '../audio/player';

export const previousCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ytmusic-previous')
        .setDescription('Stops the current track and replays the last played track from history'),

    async execute(interaction: ChatInputCommandInteraction) {
        const queue = QueueManager.getInstance().get(interaction.guildId!);

        if (!queue || queue.history.length === 0) {
            await interaction.reply({ content: 'There is no playback history to replay.', ephemeral: true });
            return;
        }

        const lastTrack = queue.history.pop()!;
        
        if (queue.currentTrack) {
            queue.tracks.unshift(queue.currentTrack); // Put current track back next in queue
        }

        queue.currentTrack = lastTrack;
        queue.playbackDuration = 0;

        playTrack(queue);
        await interaction.reply(`Replaying previous track: **${lastTrack.title}**.`);
    }
};
