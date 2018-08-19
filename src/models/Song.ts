import { User } from "discord.js";

export class Song
{
    title: string;
    url: string;
    length: string;
    author: User;

    constructor(_title: string, _url: string, _length: string, _author: User)
    {
        this.title = _title;
        this.url = _url;
        this.length = _length;
        this.author = _author;
    }
}