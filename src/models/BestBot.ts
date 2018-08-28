import { Bot } from "./Bot";
import { Client, VoiceChannel, VoiceConnection, Message } from "discord.js";
import { Music } from "./Music";
import { Config } from "./Config";
import { Logger } from "./Logger";
import { Song } from "./Song";
import ytdl from "ytdl-core";

export class BestBot implements Bot
{
    client: Client = new Client();
    music: Music = new Music();
    voiceChannel: VoiceChannel | undefined;
    voiceConnection: VoiceConnection | undefined;
    config: Config | undefined;
    logger: Logger = new Logger();
    prefix: string = "!";

    private LoadConfig()
    {
        try
        {
            this.config = require("../../config.json");
        }
        catch
        {
            return this.logger.Error("Config file could not be loaded");
        }

        if (this.config == undefined) return;

        this.prefix = this.config.prefix || "!";
    }

    private Connect()
    {
        if (this.config == undefined || this.config.botToken == undefined || !this.config.botToken) return this.logger.Error("Config file did not have a botToken");

        this.client.login(this.config.botToken);
        
        this.logger.Debug("Attempting to connect...");

        this.client.on("ready", () => 
        {
            console.log(`Connected as ${this.client.user.tag}!`);
        });
    }

    private async Join(msg: Message)
    {
        if (this.voiceChannel != undefined || this.voiceChannel != null) return;
        this.voiceChannel = msg.member.voiceChannel;

        if (this.voiceConnection == undefined || this.voiceConnection == null)
        {
            if (this.voiceChannel.joinable)
            {
                this.voiceConnection = await this.voiceChannel.join();
            }
            else
            {
                console.log("Could not join voiceChannel");
            }
        }
    }

    private Leave(msg: Message)
    {
        if (this.voiceConnection != undefined && this.voiceConnection != null)
        {
            this.voiceConnection.disconnect();
            this.voiceConnection = undefined;
        }

        if (this.voiceChannel != undefined && this.voiceChannel != null)
        {
            this.voiceChannel.leave();
            this.voiceChannel = undefined;
        }
    }

    // Plays a song
    private PlaySong(msg: Message, song: Song)
    {
        if (song.url == undefined || song.url == null) return this.logger.Warn("Song does not have a url");

        let stream = ytdl(song.url, { quality: "highestaudio" });
        
        this.music.dispatcher = this.voiceConnection!.playStream(stream);
    }

    private async Play(msg: Message)
    {
        if ((this.voiceChannel == undefined || this.voiceChannel == null) || (this.voiceConnection == undefined || this.voiceConnection == null))
        {
            await this.Join(msg);
        }

        let search = msg.content.substring(this.config!.prefix!.length).split(' ')[1];

        // TODO: Remove hard code
        this.PlaySong(msg, new Song("test", "https://www.youtube.com/watch?v=nSoioG1beY8", "100", msg.author));

        //if (this.music.dispatcher == undefined || this.music.dispatcher == null) return msg.channel.send("No song is currently playing");
    }

    private ProcessMessage(msg: Message)
    {
        switch (msg.content.substring(this.config!.prefix!.length).split(' ')[0] || msg.content.substring(this.config!.prefix!.length))
        {
            case "join":
                this.Join(msg);
                break;
            case "leave":
                this.Leave(msg);
                break;
            case "play":
                this.Play(msg);
                break;
        }
    }

    private CatchMessages()
    {
        this.client.on("message", (msg) => 
        {
            // Ignore messages by bots and messages without prefix
            if (msg.author.bot || !msg.content.startsWith(this.prefix)) return;
            this.ProcessMessage(msg);
        });
    }

    Start()
    {
        // Load the bot configuration file
        this.LoadConfig();

        // Connect
        this.Connect();

        // Catch and begin processing messages from the users
        this.CatchMessages();
    }
}