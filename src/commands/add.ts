import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember } from 'discord.js';
import { Command } from '../types/Command';
import { QueueManager } from '../audio/QueueManager';
import { ServerQueue } from '../audio/ServerQueue';
import { fetchTrackInfo } from '../audio/fetcher';
import { playTrack, setupPlayerEvents } from '../audio/player';
import { joinVoiceChannel, entersState, VoiceConnectionStatus } from '@discordjs/voice';
import { Logger } from '../utils/logger';

export const addCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ytmusic-add')
        .setDescription('Adds a YouTube link to the playing queue')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('The YouTube URL to add')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const url = interaction.options.getString('url', true);
        const member = interaction.member as GuildMember;
        const voiceChannel = member?.voice?.channel;

        if (!voiceChannel) {
            await interaction.editReply({ content: 'You need to be in a voice channel to play music!' });
            return;
        }

        let queue = QueueManager.getInstance().get(interaction.guildId!);
        
        if (!queue) {
            queue = new ServerQueue(interaction.channelId!);
            queue.voiceChannelId = voiceChannel.id;
            
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
                    Logger.debug(`Voice Debug [Add]: ${msg}`);
                });

                // await entersState(connection, VoiceConnectionStatus.Ready, 20_000); // disabled strict waiting due to timeout issues
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

        const trackInfo = await fetchTrackInfo(url);
        if (!trackInfo) {
            await interaction.followUp('Failed to fetch track information. Ensure it is a valid YouTube URL and yt-dlp is working.');
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
