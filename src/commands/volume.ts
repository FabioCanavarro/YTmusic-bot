import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { QueueManager } from '../audio/QueueManager';
import { playTrack } from '../audio/player';

export const volumeCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ytmusic-volume')
        .setDescription('Adjusts the playback volume (1-100)')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),

    async execute(interaction: ChatInputCommandInteraction) {
        const level = interaction.options.getInteger('level', true);
        const queue = QueueManager.getInstance().get(interaction.guildId!);

        if (!queue || !queue.currentTrack) {
            await interaction.reply({ content: 'There is nothing currently playing.', ephemeral: true });
            return;
        }

        queue.volume = level;

        // Since we are using ffmpeg filters for volume, we need to recreate the stream from the current position.
        // We'll calculate the playbackDuration from the resource
        if (queue.currentResource) {
            queue.playbackDuration += queue.currentResource.playbackDuration;
        }

        playTrack(queue, queue.playbackDuration);
        await interaction.reply(`Volume set to **${level}%**.`);
    }
};
