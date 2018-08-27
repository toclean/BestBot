import { Client, VoiceChannel, VoiceConnection } from "discord.js";
import { Voice } from "./Voice";
import { Music } from "./Music";

export interface Bot
{
    client: Client;
    music: Music;
    voiceChannel: VoiceChannel | undefined;
    voiceConnection: VoiceConnection | undefined;
}