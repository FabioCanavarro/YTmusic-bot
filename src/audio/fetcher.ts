import ytDlp from 'yt-dlp-exec';
import { Logger } from '../utils/logger';

export async function fetchTrackInfo(query: string): Promise<{ title: string, url: string, duration: number, thumbnail: string, streamUrl: string } | null> {
    try {
        Logger.debug(`Fetching track info for: ${query}`);
        // If it's not a URL, prepend ytsearch1:
        const isUrl = /^https?:\/\//.test(query);
        const target = isUrl ? query : `ytsearch1:${query}`;

        const data: any = await ytDlp(target, {
            dumpJson: true,
            format: 'bestaudio/best',
            noWarnings: true
        });

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
