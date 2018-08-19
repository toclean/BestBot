export class Command
{
    name: string | undefined;
    cmd: string | undefined;
    summary: string | undefined;
}

export class CommandList
{
    commands: Command[] | undefined;
}