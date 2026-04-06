import { Client, REST, Routes } from 'discord.js';
import * as commands from '../commands';
import { Logger } from '../utils/logger';

export async function registerEvents(client: Client) {
    const commandsArray = Object.values(commands).map(cmd => cmd.data.toJSON());

    client.once('ready', async () => {
        Logger.info(`Logged in as ${client.user?.tag}!`);
        
        // Default Activity when sitting empty
        client.user?.setActivity('for commands /ytmusic', { type: 3 }); // ActivityType.Watching = 3

        const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

        try {
            Logger.debug('Started refreshing application (/) commands.');

            // Wipe global commands to remove duplicates
            await rest.put(
                Routes.applicationCommands(client.user!.id),
                { body: [] },
            );

            // Registering commands to all guilds the bot is in guarantees instant sync!
            for (const guild of client.guilds.cache.values()) {
                await rest.put(
                    Routes.applicationGuildCommands(client.user!.id, guild.id),
                    { body: commandsArray },
                );
            }

            Logger.info('Successfully reloaded application (/) commands.');
        } catch (error) {
            Logger.error(`Error reloading application commands: ${error}`);
        }
    });

    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;

        const commandName = interaction.commandName;
        // Find the command object
        const commandFile = Object.values(commands).find(c => c.data.name === commandName);

        if (!commandFile) {
            Logger.warning(`No command matching ${commandName} was found.`);
            return;
        }

        try {
            Logger.debug(`Executing command ${commandName} requested by ${interaction.user.tag}`);
            await commandFile.execute(interaction);
        } catch (error) {
            Logger.error(`Error executing ${commandName}: ${error}`);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    });
    
    // Voice state updates handle cleanup
    client.on('voiceStateUpdate', (oldState, newState) => {
        // If the bot gets disconnected from a voice channel by a user
        if (oldState.member?.id === client.user?.id && oldState.channelId && !newState.channelId) {
            const { QueueManager } = require('../audio/QueueManager');
            QueueManager.getInstance().delete(oldState.guild.id);
            Logger.info(`Bot was disconnected from channel, cleaning up queue for guild ${oldState.guild.id}`);
        }
    });
}
