import { StreamDispatcher } from "discord.js";

export class Music
{
    dispatcher: StreamDispatcher | undefined;

    hasDispatcher()
    {
        return this.dispatcher ? true : false;
    }

    Dispatcher(_dispatcher: StreamDispatcher)
    {
        this.dispatcher = _dispatcher;
    }
}