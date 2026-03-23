import { AudioPlayerStatus, createAudioResource, StreamType } from '@discordjs/voice';
import { spawn } from 'child_process';
import { ServerQueue } from './ServerQueue';
import { Logger } from '../utils/logger';
import ffmpegStatic from 'ffmpeg-static';

export function playTrack(queue: ServerQueue, seekTimeMs: number = 0) {
    if (!queue.currentTrack) return;
    
    const track = queue.currentTrack;
    Logger.info(`Playing track: ${track.title} with speed ${queue.speed}x and volume ${queue.volume}% starting at ${seekTimeMs}ms`);

    const ffmpegPath = ffmpegStatic || 'ffmpeg'; // Use ffmpeg-static if available
    
    const ffmpegArgs = [
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5',
    ];

    if (seekTimeMs > 0) {
        ffmpegArgs.push('-ss', (seekTimeMs / 1000).toString());
    }

    ffmpegArgs.push(
        '-i', track.streamUrl!,
        '-analyzeduration', '0',
        '-loglevel', 'error',
        '-f', 'webm', 
        '-acodec', 'libopus',
        '-ac', '2',
        '-ar', '48000',
        '-vn',
        '-filter:a', `atempo=${queue.speed},volume=${queue.volume / 100}`,
        'pipe:1'
    );

    const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);
    
    ffmpegProcess.on('error', (err) => {
         Logger.error(`FFmpeg process launch error: ${err.message}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
         const msg = data.toString();
         // Ignored errors when discord.js naturally closes the pipe (like skipping a track)
         if (!msg.includes('Error submitting a packet to the muxer') && 
             !msg.includes('Error writing trailer') &&
             !msg.includes('Invalid argument')) {
             Logger.error(`FFmpeg Error Log: ${msg}`);
         }
    });

    ffmpegProcess.on('close', (code) => {
        if (code !== 0 && code !== 255 && code !== 4294967274) { // 4294967274 = EPIPE on Windows
             Logger.error(`FFmpeg process exited with code ${code}`);
        }
    });

    // Create WebmOpus stream to avoid double transcoding AND drop issues entirely natively
    const resource = createAudioResource(ffmpegProcess.stdout, {
        inputType: StreamType.WebmOpus,
        inlineVolume: false // Volume is handled by ffmpeg pre-transcode
    });

    queue.currentResource = resource;
    queue.player.play(resource);
}

export function setupPlayerEvents(queue: ServerQueue) {
    queue.player.on(AudioPlayerStatus.Idle, () => {
        Logger.debug(`Player went Idle for guild: ${queue.textChannelId}`);
        // When track finishes, move to next
        if (queue.currentTrack) {
            queue.history.push(queue.currentTrack);
        }
        
        queue.currentTrack = queue.tracks.shift() || null;
        
        if (queue.currentTrack) {
            queue.playbackDuration = 0; // reset
            playTrack(queue);
        } else {
             Logger.info(`Queue finished for guild: ${queue.textChannelId}`);
             // Intentionally removed queue.stop() so it persistently stays in the channel!
        }
    });

    queue.player.on('error', error => {
        Logger.error(`Error from AudioPlayer: ${error.message}`);
        // Skip current song
        queue.currentTrack = queue.tracks.shift() || null;
        if (queue.currentTrack) {
            queue.playbackDuration = 0;
            playTrack(queue);
        }
    });
}
