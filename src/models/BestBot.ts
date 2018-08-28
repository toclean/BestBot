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

        this.music.dispatcher = undefined;
    }

    private async GetSongInfo(msg: Message, search: string): Promise<ytdl.videoInfo>
    {
        return new Promise<ytdl.videoInfo>(async (resolve, reject) =>
        {
            await ytdl.getInfo(search, (error, info) =>
            {
                resolve(info);
            });
        });
    }

    // Plays a song
    private PlaySong(msg: Message, song: Song)
    {
        if (song.url == undefined || song.url == null) return this.logger.Warn("Song does not have a url");

        let stream = ytdl(song.url, { quality: "highestaudio" });
        
        this.music.dispatcher = this.voiceConnection!.playStream(stream);

        this.music.dispatcher.on("speaking", (speaking) => 
        {
            if (speaking)
            {
               msg.channel.send(`Now playing: ${song.title}-${song.length} requested by <@${msg.author.id}>`);
            }
        });

        this.music.dispatcher.on("end", (reason) =>
        {
            this.music.queue.songs.shift();
            let nextSong = this.music.queue.songs[0];
            if (nextSong == undefined)
            {
                this.Leave(msg);
            }
            else
            {
                this.PlaySong(msg, nextSong);
            }
        });
    }

    private TimeString(time: string)
    {
        let realTime = Number(time);
        let hours = Math.round(realTime / 3600);
        realTime = realTime % 3600;
        let minutes = Math.round(realTime / 60);
        let seconds = realTime % 60;

        return `${(hours != 0) ? `${(hours > 10) ? hours : "0" + hours}:` : "00:"}${(minutes !+ 0) ? `${(minutes > 10) ? minutes : "0" + minutes}:` : "00:"}${(seconds != 0) ? `${(seconds > 10) ? seconds : "0" + seconds}` : "00"}`;
    }

    private async Play(msg: Message)
    {
        if ((this.voiceChannel == undefined || this.voiceChannel == null) || (this.voiceConnection == undefined || this.voiceConnection == null))
        {
            await this.Join(msg);
        }

        let search = msg.content.substring(this.config!.prefix!.length).split(' ')[1];

        // TODO: Remove hard code
        this.GetSongInfo(msg, search).then((value) =>
        {
            this.music.queue.songs.push(new Song(value.title, search, this.TimeString(value.length_seconds), msg.author));

            
            this.PlaySong(msg, this.music.queue.songs[0]);
        }).catch(console.error);
    }

    private Pause(msg: Message)
    {
        if ((this.voiceChannel == undefined || this.voiceChannel == null) || (this.voiceConnection == undefined || this.voiceConnection == null)
        || (this.music.dispatcher == undefined || this.music.dispatcher == null))
        {
            msg.channel.send("Play a song first");
            return;
        }

        if (this.music.dispatcher.paused)
        {
            msg.channel.send("Song is already paused");
        }
        else
        {
            this.music.dispatcher.pause();
        }
    }

    private Resume(msg: Message)
    {
        if ((this.voiceChannel == undefined || this.voiceChannel == null) || (this.voiceConnection == undefined || this.voiceConnection == null)
        || (this.music.dispatcher == undefined || this.music.dispatcher == null))
        {
            msg.channel.send("Play a song first");
            return;
        }

        if (this.music.dispatcher.paused)
        {
            this.music.dispatcher.resume();
        }
        else
        {
            msg.channel.send("Song is already playing");
        }
    }

    private Skip(msg: Message)
    {
        if ((this.voiceChannel == undefined || this.voiceChannel == null) || (this.voiceConnection == undefined || this.voiceConnection == null)
        || (this.music.dispatcher == undefined || this.music.dispatcher == null))
        {
            msg.channel.send("Play a song first");
            return;
        }

        this.music.dispatcher.emit("end");
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
            case "pause":
                this.Pause(msg);
                break;
            case "resume":
                this.Resume(msg);
                break;
            case "skip":
                this.Skip(msg);
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