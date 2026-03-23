import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember,
} from "discord.js";
import { Command } from "../types/Command";
import { QueueManager } from "../audio/QueueManager";
import { playTrack, setupPlayerEvents } from "../audio/player";
import { ServerQueue } from "../audio/ServerQueue";
import { joinVoiceChannel } from "@discordjs/voice";
import { Logger } from "../utils/logger";
import ytDlp from "yt-dlp-exec";

export const playlistCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ytmusic-playlist")
    .setDescription(
      "Personal command for the creator to instantly queue an entire YouTube playlist!",
    )
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("The YouTube Playlist URL")
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    // Strict Authorization Check!
    const username = interaction.user.username.toLowerCase();
    if (username !== "re_helios" && username !== "dive") {
      await interaction.editReply({
        content: "Access Denied",
      });
      return;
    }

    const url = interaction.options.getString("url", true);
    const member = interaction.member as GuildMember;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel) {
      await interaction.editReply({
        content: "You need to be in a voice channel to import a playlist!",
      });
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

        queue.connection = connection;
        queue.connection.subscribe(queue.player);
        setupPlayerEvents(queue);
        QueueManager.getInstance().set(interaction.guildId!, queue);
        Logger.info(
          `Connected to voice channel ${voiceChannel.id} in guild ${interaction.guildId} for playlist import.`,
        );
      } catch (error) {
        Logger.error(`Failed to connect to voice channel: ${error}`);
        await interaction.followUp("Failed to join the voice channel.");
        return;
      }
    }

    try {
      await interaction.editReply(
        `*Scraping playlist metadata for ${username}... This may take a few seconds!*`,
      );

      // Fetch the flat playlist metadata (instantaneous without downloading full streams!)
      const playlistData: any = await ytDlp(url, {
        dumpSingleJson: true,
        flatPlaylist: true,
        noWarnings: true,
      });

      if (
        !playlistData ||
        !playlistData.entries ||
        playlistData.entries.length === 0
      ) {
        await interaction.editReply(
          "Could not extract any songs from that playlist. Make sure it is public!",
        );
        return;
      }

      const entries = playlistData.entries;
      let addedCount = 0;

      for (const entry of entries) {
        if (!entry.id) continue;

        const track = {
          title: entry.title || "Unknown Track",
          url: `https://www.youtube.com/watch?v=${entry.id}`,
          duration: entry.duration || 0,
          thumbnail: entry.thumbnails?.[0]?.url || "",
          streamUrl: "", // This will be lazy-loaded automatically by player.ts!
          requester: interaction.user,
        };

        queue.tracks.push(track);
        addedCount++;
      }

      if (!queue.currentTrack && queue.tracks.length > 0) {
        queue.currentTrack = queue.tracks.shift() || null;
        playTrack(queue);
        await interaction.followUp(
          `Added ${addedCount} songs to the queue. Now playing: **${queue.currentTrack?.title}**`,
        );
      } else {
        await interaction.followUp(
          `Added ${addedCount} songs securely to the back of the queue!`,
        );
      }
    } catch (error) {
      Logger.error(`Playlist fetch error: ${error}`);
      await interaction.followUp(
        "There was a critical error attempting to read the playlist link.",
      );
    }
  },
};
