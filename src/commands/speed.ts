import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { QueueManager } from '../audio/QueueManager';
import { playTrack } from '../audio/player';

export const speedCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ytmusic-speed')
        .setDescription('Adjusts the playback speed (0.5 to 2.0)')
        .addNumberOption(option =>
            option.setName('multiplier')
                .setDescription('Speed multiplier (0.5 - 2.0)')
                .setRequired(true)
                .setMinValue(0.5)
                .setMaxValue(2.0)),

    async execute(interaction: ChatInputCommandInteraction) {
        const speed = interaction.options.getNumber('multiplier', true);
        const queue = QueueManager.getInstance().get(interaction.guildId!);

        if (!queue || !queue.currentTrack) {
            await interaction.reply({ content: 'There is nothing currently playing.', ephemeral: true });
            return;
        }

        queue.speed = speed;

        // We use ffmpeg filters for speed, so we must recreate the stream.
        if (queue.currentResource) {
            queue.playbackDuration += queue.currentResource.playbackDuration;
        }

        playTrack(queue, queue.playbackDuration);
        await interaction.reply(`Playback speed set to **${speed}x**.`);
    }
};
