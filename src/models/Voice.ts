import { VoiceChannel, VoiceConnection } from "discord.js";

export class Voice
{
    channel: VoiceChannel | undefined;
    connection: VoiceConnection | undefined;

    hasChannel()
    {
        return this.channel ? true : false;
    }

    hasConnection()
    {
        return this.connection ? true : false;
    }

    Channel(_channel: VoiceChannel)
    {
        this.channel = _channel;
    }

    Connection(_connection: VoiceConnection)
    {
        this.connection = _connection;
    }
}