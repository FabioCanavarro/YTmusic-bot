import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { QueueManager } from '../audio/QueueManager';
import { joinVoiceChannel } from '@discordjs/voice';

export const deafenCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ytmusic-deafen')
        .setDescription('Deafens the bot in the voice channel'),

    async execute(interaction: ChatInputCommandInteraction) {
        const queue = QueueManager.getInstance().get(interaction.guildId!);

        if (!queue || !queue.voiceChannelId) {
            await interaction.reply({ content: 'I am not currently in a voice channel!', ephemeral: true });
            return;
        }

        joinVoiceChannel({
            channelId: queue.voiceChannelId,
            guildId: interaction.guildId!,
            adapterCreator: interaction.guild!.voiceAdapterCreator as any,
            selfDeaf: true,
        });

        await interaction.reply('I am now deafened! 🙉');
    }
};
