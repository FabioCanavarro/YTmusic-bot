import {
  AudioPlayer,
  VoiceConnection,
  createAudioPlayer,
  NoSubscriberBehavior,
  AudioResource,
} from "@discordjs/voice";
import { User } from "discord.js";

export interface Track {
  title: string;
  url: string; // The original youtube URL or search query
  streamUrl?: string; // The extracted bestaudio url by yt-dlp
  duration: number;
  thumbnail: string;
  requester: User;
}

export class ServerQueue {
  public textChannelId: string;
  public voiceChannelId: string | null = null;
  public connection: VoiceConnection | null = null;
  public player: AudioPlayer;
  public currentTrack: Track | null = null;
  public tracks: Track[] = [];
  public playlistTracks: Track[] = [];
  public activePlaylists: { name: string; url: string; addedBy: User }[] = [];
  public history: Track[] = [];
  public volume: number = 5; // default volume
  public speed: number = 1.0; // default speed 1.0x
  public currentResource: AudioResource | null = null;
  public playbackDuration: number = 0; // ms tracking where we are for resuming when changing speed

  constructor(textChannelId: string) {
    this.textChannelId = textChannelId;
    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });
  }

  public stop() {
    try {
      if (this.connection && this.connection.state.status !== "destroyed") {
        this.connection.destroy();
      }
    } catch (e) {}

    this.player.stop(true);
    this.tracks = [];
    this.playlistTracks = [];
    this.activePlaylists = [];
    this.history = [];
    this.currentTrack = null;
  }
}
