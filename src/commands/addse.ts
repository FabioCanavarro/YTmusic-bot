import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember } from 'discord.js';
import { Command } from '../types/Command';
import { QueueManager } from '../audio/QueueManager';
import { fetchTrackInfo } from '../audio/fetcher';
import { playTrack, setupPlayerEvents } from '../audio/player';
import { ServerQueue } from '../audio/ServerQueue';
import { joinVoiceChannel, entersState, VoiceConnectionStatus } from '@discordjs/voice';
import { Logger } from '../utils/logger';

export const addseCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ytmusic-addse')
        .setDescription('Searches YouTube and adds the first result to the playing queue')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('The search query')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        const query = interaction.options.getString('query', true);
        const member = interaction.member as GuildMember;
        const voiceChannel = member?.voice?.channel;

        if (!voiceChannel) {
            await interaction.reply({ content: 'You must be in a voice channel to use this command.', ephemeral: true });
            return;
        }

        await interaction.deferReply();

        let queue = QueueManager.getInstance().get(interaction.guildId!);
        
        if (!queue) {
            queue = new ServerQueue(interaction.channelId!);
            queue.voiceChannelId = voiceChannel.id;
            
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
                    Logger.debug(`Voice Debug [AddSE]: ${msg}`);
                });

                // await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
                queue.connection = connection;
                queue.connection.subscribe(queue.player);
                setupPlayerEvents(queue);
                QueueManager.getInstance().set(interaction.guildId!, queue);
                Logger.info(`Connected to voice channel ${voiceChannel.id} in guild ${interaction.guildId}`);
            } catch (error) {
                Logger.error(`Failed to connect to voice channel: ${error}`);
                await interaction.followUp('Failed to join the voice channel.');
                return;
            }
        }

        const trackInfo = await fetchTrackInfo(query);
        if (!trackInfo) {
            await interaction.followUp('Failed to find any track for that query.');
            return;
        }

        const track = {
            ...trackInfo,
            requester: interaction.user,
        };

        if (!queue.currentTrack) {
            queue.currentTrack = track;
            playTrack(queue);
            await interaction.followUp(`Now playing **${track.title}**`);
        } else {
            queue.tracks.push(track);
            await interaction.followUp(`Added **${track.title}** to the queue`);
        }
    }
};
