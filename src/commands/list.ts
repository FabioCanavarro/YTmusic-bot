import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../types/Command';
import { QueueManager } from '../audio/QueueManager';

export const listCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('ytmusic-list')
        .setDescription('Displays the active queues (Now Playing and My Playlist)'),

    async execute(interaction: ChatInputCommandInteraction) {
        const queue = QueueManager.getInstance().get(interaction.guildId!);

        if (!queue) {
            await interaction.reply({ content: 'There is no active queue right now.', ephemeral: true });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#1DB954')
            .setTitle('🎶 Current Queue');

        let description = '';

        if (queue.currentTrack) {
            description += `**▶️ Now Playing:**\n[${queue.currentTrack.title}](${queue.currentTrack.url})\n\n`;
        }

        description += `**📋 Now Playing Queue:**\n`;
        if (queue.tracks.length > 0) {
            const upNext = queue.tracks.slice(0, 10).map((t, i) => `\`${i + 1}.\` [${t.title}](${t.url})`).join('\n');
            description += upNext;
            if (queue.tracks.length > 10) {
                description += `\n*...and ${queue.tracks.length - 10} more*`;
            }
        } else {
            description += `*Empty*`;
        }

        description += `\n\n**📚 My Playlist Queue:**\n`;
        if (queue.activePlaylists.length > 0) {
            const playlists = queue.activePlaylists.map((p, i) => `\`${i + 1}.\` [${p.name}](${p.url})`).join('\n');
            description += playlists;
        } else {
            description += `*No playlists queued*`;
        }
        
        embed.setDescription(description);
        embed.setFooter({ text: `${queue.tracks.length + queue.playlistTracks.length} total tracks queued` });

        await interaction.reply({ embeds: [embed] });
    }
};
