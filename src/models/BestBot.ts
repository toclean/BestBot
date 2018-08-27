import { Bot } from "./Bot";
import { Client, VoiceChannel, VoiceConnection } from "discord.js";
import { Music } from "./Music";
import { Config } from "./Config";
import { Logger } from "./Logger";

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

        this.client.on("ready", () => 
        {
            console.log(`Connected as ${this.client.user.tag}!`);
        });
    }

    private CatchMessages()
    {
        this.client.on("message", (msg) => 
        {
            console.log(msg.content);
        });
    }

    Start()
    {
        // Load the bot configuration file
        this.LoadConfig();

        // Connect to the guild
        this.Connect();

        this.CatchMessages();
    }
}