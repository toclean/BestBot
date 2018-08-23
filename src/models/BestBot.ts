import { Bot } from "./Bot";
import { Config } from "./Config";
import { Voice } from "./Voice";
import { Music } from "./Music";
import { Client, Message, VoiceChannel, VoiceConnection, MessageEmbed } from "discord.js";
import { Command, CommandList } from "./Command";
import { Logger } from "./Logger";
import ytdl from 'ytdl-core';
import ytsearch, { YouTubeSearchResults } from 'youtube-search';
import { Song } from "./Song";
import { PlaylistData } from "./PlaylistItem";

let ytplaylist = require("youtube-playlist");

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
    choices: Song[] | undefined;

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

            this.HandleCommand(msg);
        });
    }

    async Help(msg: Message)
    {
        let fields: { name: string | undefined, value: string | undefined }[] = [];

        this.commands.forEach(x => 
        {
            fields.push({ name: x.name, value: x.summary });
        });

        await msg.author.send({embed: {
                color: 3447003,
                author: {
                    name: this.client.user.username,
                    icon_url: "https://images.vexels.com/media/users/3/138647/isolated/preview/19bad593ff295a81e61c4a2a1a14cc06-3d-sacred-geometry-by-vexels.png"//this.client.user.avatarURL
                },
                title: "__**Available Commands**__",
                fields: fields
            }
        });
    }

    Ping(msg: Message)
    {
        msg.reply({embed: {
            color: 3447003,
            description: `🏓 ${Date.now() - msg.createdTimestamp}ms`
        }});
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

        if (this.music && this.music.queue)
        {
            this.music.queue.songs = [];
            this.music.queue.playing = false;
        }
    }

    private async PlayPlayList(msg: Message, search: string)
    {
        let playlist: PlaylistData;

        await ytplaylist(search, 'url').then((res: PlaylistData) => {
            playlist = res;
        });

        let playlistInfo: ytdl.videoInfo[] = [];
        for (let i = 0; i < playlist!.data.playlist.length; i++)
        {
            await ytdl.getInfo(playlist!.data.playlist[i], (error, info) =>
            {
                console.log(info);
                playlistInfo.push(info);
            });
        }

        console.log(playlistInfo);

    }

    private async PlayLink(msg: Message, search: string)
    {
        // await ytdl.getInfo(search, { 
        //     quality: 'highestaudio'
        // }).then((value) => {
        //     console.log(value.title);
        //     this.music!.queue.push(new Song(value.title, value.video_url, value.length_seconds, msg.author));
        // })

        if (this.hasVoice() && this.voiceConnection && this.music)
        {
            let stream = await ytdl(search, { quality: 'highestaudio' });

            this.music.dispatcher = this.voiceConnection.playStream(stream);

            this.music.queue.playing = true;
        }
    }

    private async PlayResult(msg: Message, search: string)
    {
        let choice = Number.parseInt(search) - 1;
        let selection = this.choices![choice];

        if (this.music && this.music.queue.playing)
        {
            this.music.queue.songs.push(new Song(selection.title, selection.url, "0", msg.author));
        }
        else
        {
            await this.PlayLink(msg, this.choices![choice].url);
        }

    }

    private async GetResults(msg: Message, search: string)
    {
        await ytsearch(search, { 
            maxResults: 3,
            key: this.config!.youtubeKey,
            type: "video"
        }, (error, results) =>
        {
            this.choices = [];
            let fields: { name: string, value: string }[] = [];
            let i = 1;
            results!.forEach(result => 
            {
                this.choices!.push(new Song(result.title, result.link, '0', msg.author));
                fields.push( { name: `${i} - ${result.title}`, value: result.link } );
                i++;
            });

            msg.channel.send({embed: {
                color: 3447003,
                author: {
                    name: this.client.user.username,
                    icon_url: "https://images.vexels.com/media/users/3/138647/isolated/preview/19bad593ff295a81e61c4a2a1a14cc06-3d-sacred-geometry-by-vexels.png"//this.client.user.avatarURL
                },
                title: "__**Results**__",
                fields: fields
            }});
        });
    }

    async Play(msg: Message)
    {
        if (!this.voiceChannel)
        {
            this.voiceChannel = msg.member.voiceChannel;
        }

        if (!this.voiceConnection)
        {
            this.voiceConnection = await this.voiceChannel.join();
        }

        if (!this.hasMusic())
        {
            this.music = new Music();
        }

        if (!msg.content.includes(' '))
        {
            if (this.music && this.music.dispatcher && this.music.dispatcher.paused)
            {
                this.music.dispatcher.resume();
            }
            return;
        }

        const search = msg.content.substring(msg.content.indexOf(' ') + 1);

        if (search.includes("list="))
        {
            //var playlistId = search.split("list=")[1];

            //console.log(playlistId);
            this.PlayPlayList(msg, search);
        }
        else if (search.includes("http"))
        {
            this.PlayLink(msg, search);
        }
        else if (search.match("[0-9]+") && !search.match("[a-z|A-Z]+"))
        {
            this.PlayResult(msg, search);
        }
        else
        {
            this.GetResults(msg, search);
        }

        if (this.voiceConnection.dispatcher)
        {
            this.voiceConnection.dispatcher.on('end', (reason) => 
            {
                this.music!.queue.playing = false;
                this.music!.queue.songs.slice();
                if (this.music!.queue.songs.length > 0)
                {
                    this.PlayLink(msg, this.music!.queue.songs[0].url);
                }
                else
                {
                    this.Leave(msg);
                }
            });
        }
    }

    async Pause(msg: Message)
    {
        if (this.music && this.music.dispatcher && !this.music.dispatcher.paused)
        {
            this.music.dispatcher.pause();
        }
    }

    async Skip(msg: Message)
    {
        if (this.music && this.music.dispatcher)
        {
            this.Pause(msg);
            this.music.dispatcher.end();
        }
    }

    async HandleCommand(msg: Message)
    {
        switch(msg.content.toLowerCase().substring(this.prefix.length).split(' ')[0])
        {
            case "help":
                await this.Help(msg);
                break;
            case "ping":
                await this.Ping(msg);
                break;
            case "join":
                await this.Join(msg);
                break;
            case "leave":
                await this.Leave(msg);
                break;
            case "play":
                await this.Play(msg);
                break;
            case "pause":
                await this.Pause(msg);
                break;
            case "skip":
                await this.Skip(msg);
                break;
        }
    }
}