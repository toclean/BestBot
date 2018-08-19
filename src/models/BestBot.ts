import { Bot } from "./Bot";
import { Config } from "./Config";
import { Voice } from "./Voice";
import { Music } from "./Music";
import { Client, Message, VoiceChannel, VoiceConnection } from "discord.js";
import { Command, CommandList } from "./Command";
import { Logger } from "./Logger";
import { exists } from "fs";

export class BestBot implements Bot
{
    logger = new Logger();
    client: Client = new Client();
    voiceChannel: VoiceChannel | undefined;
    voiceConnection: VoiceConnection | undefined;
    music: Music | undefined;
    config: Config | undefined;
    prefix: string;
    commands = new Map<string | undefined, {name: string | undefined, summary: string | undefined}>();

    constructor()
    {
        // Load configuration
        try
        {
            this.config = require("../../config.json");
        }
        catch
        {
            this.logger.Error('Could not find configuration file!');
        }

        this.prefix = this.config && this.config.prefix ? this.config.prefix : "!";

        const rawCommandList: Command[] = require("../../commands.json").commands;
        for (let i = 0; i < rawCommandList.length; i++)
        {
            let cmd = rawCommandList[i];
            this.commands.set(cmd.cmd, {name: cmd.name, summary: cmd.summary});
        }
    }

    hasClient()
    {
        return this.client ? true : false;
    }

    hasVoice()
    {
        return this.voiceConnection ? true : false;
    }

    hasVoiceChannel()
    {
        return this.voiceChannel ? true : false;
    }

    hasMusic()
    {
        return this.music ? true : false;
    }

    Start()
    {
        if (!this.config) return;

        if (this.config && !this.config.botToken)
        {
            return this.logger.Error('botToken is null!');
        }

        this.logger.Debug('Attempting to connect...');

        this.client.login(this.config!.botToken);

        this.client.on('ready', () => 
        {
            console.log(`Logged in as ${this.client.user.tag}!`);
        });

        this.client.on('message', (msg) => 
        {
            if (msg.author.bot) return;
            if (!msg.content.startsWith(this.prefix)) return;

            // Checks if the message is a valid command before processing (uses a map so very efficient)
            let command = msg.content.substring(this.prefix.length).split(' ')[0];
            if (!this.commands.has(command)) return;

            console.log('valid');
            this.HandleCommand(msg);
        });
    }

    async Join(msg: Message)
    {
        if (this.hasVoice()) return;

        if (!this.hasVoiceChannel())
        {
            this.voiceChannel = msg.member.voiceChannel;
        }

        this.voiceConnection = await this.voiceChannel!.join();
    }

    Leave(msg: Message)
    {
        if (this.hasVoice())
        {
            this.voiceConnection!.disconnect();
            this.voiceConnection = undefined;
        }
    }

    async HandleCommand(msg: Message)
    {
        switch(msg.content.toLowerCase().substring(this.prefix.length).split(' ')[0])
        {
            case "join":
                await this.Join(msg);
                break;
            case "leave":
                this.Leave(msg);
                break;
        }
    }
}