import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember } from 'discord.js';
import { Command } from '../types/Command';
import { QueueManager } from '../audio/QueueManager';
import { ServerQueue } from '../audio/ServerQueue';
import { joinVoiceChannel, entersState, VoiceConnectionStatus } from '@discordjs/voice';
import { Logger } from '../utils/logger';
import { setupPlayerEvents } from '../audio/player';

export const joinCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ytmusic-join')
        .setDescription('Joins the voice channel you are currently in'),

    async execute(interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember;
        const voiceChannel = member?.voice?.channel;

        if (!voiceChannel) {
            await interaction.reply({ content: 'You must be in a voice channel to use this command.', ephemeral: true });
            return;
        }

        let queue = QueueManager.getInstance().get(interaction.guildId!);
        
        if (!queue) {
            queue = new ServerQueue(interaction.channelId!);
            queue.voiceChannelId = voiceChannel.id;
            QueueManager.getInstance().set(interaction.guildId!, queue);
        }

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId!,
                adapterCreator: interaction.guild!.voiceAdapterCreator as any,
            });
            
            connection.on('stateChange', (oldState, newState) => {
                Logger.debug(`Voice connection changed from ${oldState.status} to ${newState.status}`);
            });

            connection.on('debug', (msg) => {
                Logger.debug(`Voice Debug [Join]: ${msg}`);
            });

            // await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
            queue.connection = connection;
            queue.connection.subscribe(queue.player);
            setupPlayerEvents(queue);
            Logger.info(`Connected to voice channel ${voiceChannel.id} in guild ${interaction.guildId}`);
            await interaction.reply(`Joined ${voiceChannel.name}!`);
        } catch (error) {
            Logger.error(`Failed to connect to voice channel: ${error}`);
            await interaction.reply('Failed to join the voice channel.');
        }
    }
};
