import ytDlp from 'yt-dlp-exec';
import { Logger } from '../utils/logger';
import fs from 'node:fs';
import path from 'node:path';

export async function fetchTrackInfo(query: string): Promise<{ title: string, url: string, duration: number, thumbnail: string, streamUrl: string } | null> {
    try {
        Logger.debug(`Fetching track info for: ${query}`);
        // If it's not a URL, prepend ytsearch1:
        const isUrl = /^https?:\/\//.test(query);
        const searchArgs = isUrl ? query : `ytsearch1:${query}`;

        const ytDlpOptions: any = {
            dumpJson: true,
            format: 'bestaudio/best',
            noWarnings: true
        };

        if (fs.existsSync(path.join(process.cwd(), 'cookies.txt'))) {
            ytDlpOptions.cookies = path.join(process.cwd(), 'cookies.txt');
        }

        const data: any = await ytDlp(searchArgs, ytDlpOptions);

        if (!data) {
             Logger.error(`Failed to parse yt-dlp result for: ${query}`);
             return null;
        }

        // yt-dlp sometimes dumps searches as an array of 'entries'
        const trackData = data.entries ? data.entries[0] : data;

        return {
            title: trackData.title,
            url: trackData.webpage_url || trackData.original_url || query,
            duration: trackData.duration,
            thumbnail: trackData.thumbnail,
            streamUrl: trackData.url // The actual playable direct URL
        };
    } catch (error: any) {
        Logger.error(`Error fetching track info with yt-dlp: ${error.message}`);
        return null;
    }
}
