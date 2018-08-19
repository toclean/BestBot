import { StreamDispatcher } from "discord.js";
import { Song } from "./Song";
import { Queue } from "./Queue";

export class Music
{
    dispatcher: StreamDispatcher | undefined;
    queue: Queue;

    constructor()
    {
        this.queue = new Queue();
    }

    hasDispatcher()
    {
        return this.dispatcher ? true : false;
    }

    Dispatcher(_dispatcher: StreamDispatcher)
    {
        this.dispatcher = _dispatcher;
    }
}