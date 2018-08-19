export interface ILogger
{
    Warn(message: string): void;
    Error(message: string): void;
    Debug(message: string): void;
}