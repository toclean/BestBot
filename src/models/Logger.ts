import { ILogger } from "./ILogger";
import * as chalk from 'chalk';

export class Logger implements ILogger {

    Warn(message: string): void {
        console.log(chalk.default.bgYellow("[WARNING]: " + message));
    }

    Error(message: string): void {
        console.log(chalk.default.bgRed("[ERROR]: " + message));
    }

    Debug(message: string): void {
        console.log(chalk.default.cyan("[DEBUG]: " + message));
    }
}