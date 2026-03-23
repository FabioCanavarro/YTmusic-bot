import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { QueueManager } from '../audio/QueueManager';
import { createAudioResource, StreamType } from '@discordjs/voice';
import ffmpegStatic from 'ffmpeg-static';
import { spawn } from 'child_process';
import { Logger } from '../utils/logger';

export const command = {
    data: new SlashCommandBuilder()
        .setName('ytmusic-ping')
        .setDescription('Diagnostic command to broadcast a loud 2-second beep to test UDP audio flow.'),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const queue = QueueManager.getInstance().get(interaction.guildId!);
        
        if (!queue || !queue.connection) {
            await interaction.editReply({ content: 'I need to be in a voice channel first (use /ytmusic-join)!' });
            return;
        }

        const ffmpegPath = ffmpegStatic || 'ffmpeg';
        const ffmpegArgs = [
            '-f', 'lavfi',
            '-i', 'sine=frequency=880:duration=2', // 2 seconds of 880Hz loud beep
            '-loglevel', 'error',
            '-f', 'webm',
            '-acodec', 'libopus',
            '-ac', '2',
            '-ar', '48000',
            'pipe:1'
        ];

        const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);
        
        ffmpegProcess.stderr.on('data', (data) => {
             Logger.error(`Ping Beep FFmpeg Error: ${data.toString()}`);
        });

        const resource = createAudioResource(ffmpegProcess.stdout, {
            inputType: StreamType.WebmOpus,
            inlineVolume: false
        });

        queue.player.play(resource);
        await interaction.editReply('🔊 Broadcasting a 2-second loud test beep right now (raw sine wave)! If you hear nothing, UDP is 100% physically blocked on your PC.');
    }
};
