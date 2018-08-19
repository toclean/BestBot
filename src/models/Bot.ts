import { Client, VoiceChannel, VoiceConnection } from "discord.js";
import { Voice } from "./Voice";
import { Music } from "./Music";

export interface Bot
{
    client: Client | undefined;
    voiceChannel: VoiceChannel | undefined;
    voiceConnection: VoiceConnection | undefined;
    music: Music | undefined;

    hasClient(): boolean;

    hasVoice(): boolean;

    hasMusic(): boolean;
}