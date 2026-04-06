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
        await interaction.deferReply();
        const voiceChannel = (interaction.member as any)?.voice?.channel;

        if (!voiceChannel) {
            await interaction.editReply({ content: 'You need to be in a voice channel to join!' });
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
                selfDeaf: true,
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
            await interaction.editReply(`✅ **Successfully joined ${voiceChannel.name}!** Default volume is set to **${queue.volume}%**`);
        } catch (error) {
            Logger.error(`Failed to connect to voice channel: ${error}`);
            await interaction.reply('Failed to join the voice channel.');
        }
    }
};
